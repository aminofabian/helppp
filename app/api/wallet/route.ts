import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // First try to get the wallet record
    let wallet = await prisma.wallet.findUnique({
      where: { userId },
      select: { balance: true }
    });

    // If no wallet exists, calculate balance from transactions
    if (!wallet) {
      const receivedTransactions = await prisma.transaction.aggregate({
        where: { receiverId: userId },
        _sum: { amount: true }
      });

      const givenTransactions = await prisma.transaction.aggregate({
        where: { giverId: userId },
        _sum: { amount: true }
      });

      const totalReceived = receivedTransactions._sum.amount || 0;
      const totalGiven = givenTransactions._sum.amount || 0;
      const calculatedBalance = totalReceived - totalGiven;

      // Create wallet record with calculated balance
      if (calculatedBalance > 0) {
        wallet = await prisma.wallet.create({
          data: {
            userId,
            balance: calculatedBalance
          },
          select: { balance: true }
        });
        console.log(`Created wallet for user ${userId} with calculated balance: ${calculatedBalance}`);
      } else {
        wallet = { balance: 0 };
      }
    }

    return NextResponse.json(wallet);
  } catch (error) {
    console.error('Error fetching wallet data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallet data' },
      { status: 500 }
    );
  }
} 