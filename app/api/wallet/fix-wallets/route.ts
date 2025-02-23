import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';

export async function POST(request: Request) {
  try {
    console.log('Starting wallet fix process...');

    // Get all users who have received donations
    const usersWithDonations = await prisma.donation.findMany({
      where: {
        Request: {
          User: {
            isNot: null
          }
        },
        status: 'COMPLETED'
      },
      select: {
        Request: {
          select: {
            userId: true
          }
        }
      },
      distinct: ['requestId']
    });

    console.log('Found users with donations:', usersWithDonations.length);

    // Get all users who have received transactions
    const usersWithTransactions = await prisma.transaction.findMany({
      select: {
        receiverId: true,
      },
      distinct: ['receiverId'],
    });

    console.log('Found users with transactions:', usersWithTransactions.length);

    // Combine unique user IDs from both sources
    const userIds = Array.from(new Set([
      ...usersWithTransactions.map(t => t.receiverId),
      ...usersWithDonations
        .map(d => d.Request?.userId)
        .filter((id): id is string => id !== null && id !== undefined)
    ]));

    console.log('Total unique users to process:', userIds.length);

    const results = [];

    // Process each user
    for (const userId of userIds) {
      console.log(`Processing user ${userId}...`);

      // Calculate received donations
      const receivedDonations = await prisma.donation.aggregate({
        where: {
          Request: {
            userId: userId
          },
          status: 'COMPLETED'
        },
        _sum: {
          amount: true
        }
      });

      // Calculate transactions
      const receivedTransactions = await prisma.transaction.aggregate({
        where: { receiverId: userId },
        _sum: { amount: true }
      });

      const givenTransactions = await prisma.transaction.aggregate({
        where: { giverId: userId },
        _sum: { amount: true }
      });

      const totalReceived = (receivedTransactions._sum.amount || 0) + (receivedDonations._sum.amount || 0);
      const totalGiven = givenTransactions._sum.amount || 0;
      const calculatedBalance = totalReceived - totalGiven;

      console.log(`User ${userId} calculations:`, {
        receivedFromDonations: receivedDonations._sum.amount || 0,
        receivedFromTransactions: receivedTransactions._sum.amount || 0,
        totalGiven,
        calculatedBalance
      });

      if (calculatedBalance > 0) {
        // Update or create wallet with correct balance
        const wallet = await prisma.wallet.upsert({
          where: { userId },
          create: {
            userId,
            balance: calculatedBalance
          },
          update: {
            balance: calculatedBalance
          }
        });

        results.push({
          userId,
          oldBalance: wallet.balance !== calculatedBalance ? wallet.balance : 'unchanged',
          newBalance: calculatedBalance,
          details: {
            receivedFromDonations: receivedDonations._sum.amount || 0,
            receivedFromTransactions: receivedTransactions._sum.amount || 0,
            totalGiven
          }
        });

        console.log(`Updated wallet for user ${userId}:`, wallet);
      } else {
        console.log(`Skipping wallet creation for user ${userId} - no positive balance`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Wallet balances updated',
      totalProcessed: userIds.length,
      walletsUpdated: results.length,
      results
    });
  } catch (error) {
    console.error('Error fixing wallets:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fix wallets',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 