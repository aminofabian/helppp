import { NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import prisma from '@/app/lib/db';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { amount, reference, paymentMethod } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Get or create wallet
    const wallet = await prisma.wallet.upsert({
      where: { userId: user.id },
      update: {
        balance: {
          increment: amount
        }
      },
      create: {
        userId: user.id,
        balance: amount
      }
    });

    // Create a payment record
    const payment = await prisma.payment.create({
      data: {
        amount: amount,
        userts: new Date(),
        paymentMethod: PaymentMethod.PAYSTACK,
        status: PaymentStatus.COMPLETED,
        merchantRequestId: reference,
        resultCode: "00",
        resultDesc: "Success",
        sender: { connect: { id: user.id } }
      }
    });

    // Create a transaction record
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

    // Trigger revalidation
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/revalidate-donation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: user.id }),
    });

    return NextResponse.json({
      success: true,
      newBalance: wallet.balance
    });
  } catch (error) {
    console.error('Error processing deposit:', error);
    return NextResponse.json(
      { error: 'Failed to process deposit' },
      { status: 500 }
    );
  }
} 