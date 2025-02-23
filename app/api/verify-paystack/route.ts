import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';

export async function POST(req: Request) {
  try {
    const { reference } = await req.json();

    if (!reference) {
      return NextResponse.json(
        { error: 'Payment reference is required' },
        { status: 400 }
      );
    }

    // Verify payment with Paystack
    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const verifyData = await verifyResponse.json();

    if (!verifyData.status || verifyData.data.status !== 'success') {
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    const { data } = verifyData;
    const { metadata, amount, customer } = data;
    
    // Convert amount from kobo to KES
    const amountInKES = amount / 100;

    // Verify this is a wallet deposit
    if (metadata?.type !== 'wallet_deposit') {
      return NextResponse.json(
        { error: 'Invalid transaction type' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: customer.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Start a transaction to update wallet and create transaction record
    const result = await prisma.$transaction(async (tx) => {
      // Update or create wallet
      const wallet = await tx.wallet.upsert({
        where: { userId: user.id },
        update: {
          balance: {
            increment: amountInKES // Use converted amount
          }
        },
        create: {
          userId: user.id,
          balance: amountInKES // Use converted amount
        }
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          amount: amountInKES, // Use converted amount
          giver: { connect: { id: user.id } },
          receiver: { connect: { id: user.id } }
        }
      });

      return { wallet };
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified and wallet updated',
      newBalance: result.wallet.balance
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
} 