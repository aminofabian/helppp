import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/app/lib/db';
import { calculateLevel } from '@/app/lib/levelCalculator';


export async function POST(request: NextRequest) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const sig = request.headers.get('x-paystack-signature');

  if (!secretKey || !sig) {
    console.error('Missing secret key or signature');
    return NextResponse.json({ status: 'error', message: 'Missing secret key or signature' }, { status: 400 });
  }

  const rawBody = await request.text();

  const computedSignature = crypto
    .createHmac('sha512', secretKey)
    .update(rawBody)
    .digest('hex');

  if (sig !== computedSignature) {
    console.error('Invalid signature from paystack');
    return NextResponse.json({ status: 'error', message: 'Invalid signature' }, { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody) as { event: string; data: any };
  } catch (error) {
    console.error('Error parsing JSON:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ status: 'error', message: 'Invalid JSON' }, { status: 400 });
  }

  if (typeof event !== 'object' || event === null || !('event' in event) || !('data' in event)) {
    console.error('Invalid event structure');
    return NextResponse.json({ status: 'error', message: 'Invalid event structure' }, { status: 400 });
  }

  console.log('Received event:', event);
  if (event.event === 'charge.success') {
    console.log('Payment successful:', event.data);
    try {
      const donation = await prisma.donation.findFirst({
        where: { invoice: event.data.reference },
        include: {
          User: true,
          Request: {
            include: {
              User: true,
              Community: true
            }
          }
        }
      });

      if (!donation || !donation.Request || !donation.Request.User) {
        throw new Error('Donation or related data not found');
      }

      const payment = await prisma.payment.create({
        data: {
          merchantRequestId: event.data.id,
          checkoutRequestId: event.data.reference,
          resultCode: event.data.status,
          resultDesc: event.data.gateway_response,
          amount: event.data.amount / 100,
          userts: new Date(event.data.paid_at),
          paymentMethod: event.data.channel,
          sender: { connect: { id: donation.userId } },
          donation: { connect: { id: donation.id } },
          request: donation.requestId ? { connect: { id: donation.requestId } } : undefined
        }
      });

      // Calculate points based on donation amount (1 point per KES 50)
      const pointsEarned = Math.floor((event.data.amount / 100) / 50);

      await prisma.points.create({
        data: {
          user: { connect: { id: donation.userId } },
          amount: pointsEarned,
          payment: { connect: { id: payment.id } }
        }
      });

      // Calculate total points from all donations
      const totalDonated = await prisma.donation.aggregate({
        where: {
          userId: donation.userId,
          status: {
            in: ['Paid', 'PAID', 'paid', 'COMPLETED', 'Completed', 'completed', 'SUCCESS', 'success']
          }
        },
        _sum: {
          amount: true
        }
      });

      const totalPoints = Math.floor((totalDonated._sum.amount || 0) / 50);
      const newLevel = calculateLevel(totalPoints);

      await prisma.user.update({
        where: { id: donation.userId },
        data: { level: newLevel }
      });

      await prisma.donation.update({
        where: { id: donation.id },
        data: {
          status: 'Paid',
          payment: { connect: { id: payment.id } }
        }
      });

      const requestCreator = donation.Request.User;
      if (!requestCreator) {
        throw new Error('Request creator not found');
      }


      const wallet = await prisma.wallet.findUnique({
        where: { userId: requestCreator.id }
      });

      const newBalance = (wallet?.balance || 0) + (event.data.amount / 100);

      await prisma.wallet.upsert({
        where: { userId: requestCreator.id },
        update: { balance: newBalance },
        create: {
          userId: requestCreator.id,
          balance: newBalance
        }
      });


      await prisma.transaction.create({
        data: {
          giver: { connect: { id: donation.userId } },
          receiver: { connect: { id: requestCreator.id } },
          amount: event.data.amount / 100
        }
      });

      await prisma.notification.create({
        data: {
          recipient: { connect: { id: requestCreator.id } },
          title: 'Donation Received',
          content: `You have received a donation of KES ${event.data.amount / 100}.`,
          
          issuer: { connect: { id: donation.userId } },
          request: { connect: { id: donation.requestId } },
          type: 'DONATION',
          read: false,
          
        }
      });

      const updatedRequest = await prisma.request.findUnique({
        where: { id: donation.requestId }
      });

      if (updatedRequest && updatedRequest.amount >= updatedRequest.pointsUsed) {
        await prisma.request.update({
          where: { id: donation.requestId },
          data: { status: 'FUNDED' }
        });
      }

      if (donation.Request.communityName) {
        await prisma.community.update({
          where: { name: donation.Request.communityName },
          data: {
            totalDonations: {
              increment: event.data.amount / 100
            },
            successfulRequests: {
              increment: updatedRequest && updatedRequest.amount >= updatedRequest.pointsUsed ? 1 : 0
            }
          }
        });
      }

      if (donation.Request.communityName && donation.Request.Community) {
        await prisma.communityMember.upsert({
          where: {
            userId_communityId: {
              userId: donation.userId,
              communityId: donation.Request.Community.id
            }
          },
          update: {
            totalDonated: {
              increment: event.data.amount / 100
            }
          },
          create: {
            userId: donation.userId,
            communityId: donation.Request.Community.id,
            totalDonated: event.data.amount / 100
          }
        });
      }
      await prisma.vote.create({
        data: {
          User: { connect: { id: donation.userId } },
          Request: { connect: { id: donation.requestId } },
          voteType: 'LOVE'
        }
      });

      await prisma.user.update({
        where: { id: donation.userId },
        data: {
          totalDonated: {
            increment: event.data.amount / 100
          },
          donationCount: {
            increment: 1
          }
        }
      });

      if (donation.Request.communityName) {
        const communityAdmin = await prisma.user.findFirst({
          where: { createdCommunities: { some: { name: donation.Request.communityName } } }
        });

        if (communityAdmin) {
          await prisma.notification.create({
            data: {
              recipient: { connect: { id: communityAdmin.id } },
              title: `New donation from ${donation.Request.title}`,
              content: `New donation from ${donation.Request.title}`,
              issuer: { connect: { id: donation.userId } },
              request: { connect: { id: donation.requestId } },
              type: 'DONATION',
              read: false
            }
          });
        }
      }

      // Trigger revalidation with user ID
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/revalidate-donation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: donation.userId }),
      });

    } catch (error) {
      console.error('Error processing payment:', error);
      return NextResponse.json({ status: 'error', message: 'Error processing payment' }, { status: 500 });
    }
  } else if (event.event === 'charge.failed') {
    console.log('Payment failed:', event.data);
    // You might want to update the donation status to 'Failed' here
  } else if (event.event === 'charge.pending') {
    console.log('Payment is pending:', event.data);
    // You might want to update the donation status to 'Pending' here
  } else {
    console.log('Unhandled event:', event.event);
  }

  return NextResponse.json({ status: 'success', message: 'Event processed' });
}