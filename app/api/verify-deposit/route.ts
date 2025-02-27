import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';

export async function POST(req: Request) {
  try {
    const { reference } = await req.json();

    if (!reference) {
      return NextResponse.json(
        { error: 'Reference is required' },
        { status: 400 }
      );
    }

    // Verify payment with Paystack
    const verifyUrl = `https://api.paystack.co/transaction/verify/${reference}`;
    const response = await fetch(verifyUrl, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      throw new Error(data.message || 'Failed to verify payment');
    }

    const amountInKES = data.data.amount / 100; // Convert from kobo to KES
    const email = data.data.customer.email.toLowerCase();

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Update or create deposit wallet
    const depositWallet = await prisma.depositWallet.upsert({
      where: { userId: user.id },
      update: {
        balance: { increment: amountInKES }
      },
      create: {
        userId: user.id,
        balance: amountInKES,
        name: "Donation Pool"
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified and deposit pool updated',
      newBalance: depositWallet.balance
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
} 