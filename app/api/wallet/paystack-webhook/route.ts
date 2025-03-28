import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/app/lib/db';
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
    event = JSON.parse(rawBody);
  } catch (error) {
    console.error('Error parsing JSON:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ status: 'error', message: 'Invalid JSON' }, { status: 400 });
  }

  console.log('Received event:', event);

  if (event.event === 'charge.success') {
    console.log('Payment successful:', event.data);
    try {
      const email = event.data.customer.email?.toLowerCase().trim();
      const amount = event.data.amount / 100; // Convert from kobo to KES
      const reference = event.data.reference;

      // Find user by email
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        console.error("User not found for email:", email);
        return NextResponse.json({ message: "User not found" }, { status: 404 });
      }

      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          amount: amount,
          userts: new Date(event.data.paid_at),
          paymentMethod: PaymentMethod.PAYSTACK,
          status: PaymentStatus.COMPLETED,
          merchantRequestId: event.data.id,
          checkoutRequestId: reference,
          resultCode: "00",
          resultDesc: "Success",
          sender: { connect: { id: user.id } },
          currency: event.data.currency
        }
      });

      // Update or create wallet
      const wallet = await prisma.wallet.upsert({
        where: { userId: user.id },
        update: { balance: { increment: amount } },
        create: { userId: user.id, balance: amount }
      });

      // Create transaction record
      await prisma.transaction.create({
        data: {
          amount: amount,
          giver: { connect: { id: user.id } },
          receiver: { connect: { id: user.id } }
        }
      });

      // Create points for the user
      const pointsEarned = Math.floor(amount / 50);
      await prisma.points.create({
        data: {
          user: { connect: { id: user.id } },
          amount: pointsEarned,
          payment: { connect: { id: payment.id } }
        }
      });

      // Create notification
      await prisma.notification.create({
        data: {
          recipient: { connect: { id: user.id } },
          issuer: { connect: { id: user.id } },
          type: 'PAYMENT_COMPLETED',
          title: 'Wallet Deposit Successful',
          content: `Your wallet has been credited with ${event.data.currency} ${amount}. New balance: ${wallet.balance}`,
          read: false
        }
      });

      // Trigger revalidation
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/revalidate-donation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      return NextResponse.json({ 
        status: 'success', 
        message: 'Wallet deposit processed successfully' 
      });
    } catch (error) {
      console.error('Error processing wallet deposit:', error);
      return NextResponse.json({ 
        status: 'error', 
        message: 'Error processing wallet deposit',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  }

  return NextResponse.json({ status: 'success', message: 'Webhook received' });
} 