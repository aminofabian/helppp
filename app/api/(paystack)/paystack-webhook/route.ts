import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/app/lib/db';
import { calculateLevel } from '@/app/lib/levelCalculator';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

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
      // Extract requestId from reference (format: requestId_timestamp)
      const requestId = event.data.reference.split('_')[0];
      
      if (!requestId) {
        throw new Error('Could not extract requestId from reference');
      }

      // Get the request details
      const request = await prisma.request.findUnique({
        where: { id: requestId },
        include: {
          User: true,
          Community: true
        }
      });

      if (!request || !request.User) {
        throw new Error('Request or User not found');
      }

      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          userId: event.data.customer.id,
          amount: event.data.amount / 100,
          status: PaymentStatus.COMPLETED,
          paymentMethod: PaymentMethod.PAYSTACK,
          mpesaReceiptNumber: event.data.reference,
          currency: event.data.currency,
          requestId: requestId,
          userts: new Date(event.data.paid_at),
          merchantRequestId: event.data.id.toString(),
          checkoutRequestId: event.data.reference,
          resultCode: event.data.status,
          resultDesc: event.data.gateway_response,
        }
      });

      // Create or update donation record
      const donation = await prisma.donation.upsert({
        where: { invoice: event.data.reference },
        create: {
          userId: event.data.customer.id,
          requestId: requestId,
          amount: event.data.amount / 100,
          payment: { connect: { id: payment.id } },
          status: "COMPLETED",
          invoice: event.data.reference,
        },
        update: {
          status: "COMPLETED",
          payment: { connect: { id: payment.id } }
        }
      });

      // Calculate points based on donation amount (1 point per KES 50)
      const pointsEarned = Math.floor((event.data.amount / 100) / 50);

      await prisma.points.create({
        data: {
          userId: event.data.customer.id,
          amount: pointsEarned,
          paymentId: payment.id
        }
      });

      // Calculate total points from all donations
      const totalDonated = await prisma.donation.aggregate({
        where: {
          userId: event.data.customer.id,
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
        where: { id: event.data.customer.id },
        data: { level: newLevel }
      });

      // Update receiver's wallet
      const wallet = await prisma.wallet.findUnique({
        where: { userId: request.userId }
      });

      const newBalance = (wallet?.balance || 0) + (event.data.amount / 100);

      await prisma.wallet.upsert({
        where: { userId: request.userId },
        update: { balance: newBalance },
        create: {
          userId: request.userId,
          balance: newBalance
        }
      });

      // Create transaction record
      await prisma.transaction.create({
        data: {
          giverId: event.data.customer.id,
          receiverId: request.userId,
          amount: event.data.amount / 100
        }
      });

      // Create notification
      await prisma.notification.create({
        data: {
          recipientId: request.userId,
          title: 'Donation Received',
          content: `You have received a donation of KES ${event.data.amount / 100}.`,
          issuerId: event.data.customer.id,
          requestId: requestId,
          type: 'DONATION',
          read: false
        }
      });

      // Update request status if fully funded
      const updatedRequest = await prisma.request.findUnique({
        where: { id: requestId }
      });

      if (updatedRequest && updatedRequest.amount >= updatedRequest.pointsUsed) {
        await prisma.request.update({
          where: { id: requestId },
          data: { status: 'FUNDED' }
        });
      }

      // Update community stats if applicable
      if (request.communityName && request.Community) {
        await prisma.community.update({
          where: { name: request.communityName },
          data: {
            totalDonations: {
              increment: event.data.amount / 100
            },
            successfulRequests: {
              increment: updatedRequest && updatedRequest.amount >= updatedRequest.pointsUsed ? 1 : 0
            }
          }
        });

        // Update community member stats
        await prisma.communityMember.upsert({
          where: {
            userId_communityId: {
              userId: event.data.customer.id,
              communityId: request.Community.id
            }
          },
          update: {
            totalDonated: {
              increment: event.data.amount / 100
            }
          },
          create: {
            userId: event.data.customer.id,
            communityId: request.Community.id,
            totalDonated: event.data.amount / 100
          }
        });
      }

      // Create vote
      await prisma.vote.create({
        data: {
          userId: event.data.customer.id,
          requestId: requestId,
          voteType: 'LOVE'
        }
      });

      // Update user donation stats
      await prisma.user.update({
        where: { id: event.data.customer.id },
        data: {
          totalDonated: {
            increment: event.data.amount / 100
          },
          donationCount: {
            increment: 1
          }
        }
      });

      // Notify community admin if applicable
      if (request.communityName) {
        const communityAdmin = await prisma.user.findFirst({
          where: { createdCommunities: { some: { name: request.communityName } } }
        });

        if (communityAdmin) {
          await prisma.notification.create({
            data: {
              recipientId: communityAdmin.id,
              title: `New donation for ${request.title}`,
              content: `New donation received for ${request.title}`,
              issuerId: event.data.customer.id,
              requestId: requestId,
              type: 'DONATION',
              read: false
            }
          });
        }
      }

      // Trigger revalidation
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/revalidate-donation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: event.data.customer.id }),
      });

    } catch (error) {
      console.error('Error processing payment:', error);
      return NextResponse.json({ status: 'error', message: 'Error processing payment' }, { status: 500 });
    }
  } else if (event.event === 'charge.failed') {
    console.log('Payment failed:', event.data);
  } else if (event.event === 'charge.pending') {
    console.log('Payment is pending:', event.data);
  } else {
    console.log('Unhandled event:', event.event);
  }

  return NextResponse.json({ status: 'success', message: 'Event processed' });
}