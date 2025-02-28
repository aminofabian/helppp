import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/app/lib/db';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export async function POST(request: NextRequest) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const sig = request.headers.get('x-paystack-signature');
  console.log("its here: deposittttttttttttttttttttttttttttttttttttttttttttttttttt")

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

  console.log('Received deposit event:', event);

  if (event.event === 'charge.success') {
    console.log('Deposit payment successful:', event.data);

  console.log("its here: deposittttttttttttttttttttttttttttttttttttttttttttttttttt")

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

      // Update or create deposit wallet
      const depositWallet = await prisma.depositWallet.upsert({
        where: { userId: user.id },
        update: { balance: { increment: amount } },
        create: { 
          userId: user.id,
          balance: amount,
          name: "Donation Pool"
        }
      });

      // Create notification
      await prisma.notification.create({
        data: {
          recipient: { connect: { id: user.id } },
          issuer: { connect: { id: user.id } },
          type: 'PAYMENT_COMPLETED',
          title: 'Deposit Pool Funded',
          content: `Your donation pool has been credited with ${event.data.currency} ${amount}. Available balance: ${depositWallet.balance}`,
          read: false
        }
      });

      return NextResponse.json({ 
        status: 'success', 
        message: 'Deposit processed successfully' 
      });
    } catch (error) {
      console.error('Error processing deposit:', error);
      return NextResponse.json({ 
        status: 'error', 
        message: 'Error processing deposit',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  }

  return NextResponse.json({ status: 'success', message: 'Webhook received' });
} 