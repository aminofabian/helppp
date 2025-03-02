import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // console.log('Fetching wallet data for user:', userId);

    // Get both wallets in parallel
    const [wallet, depositWallet] = await Promise.all([
      prisma.wallet.findUnique({
        where: { userId }
      }),
      prisma.depositWallet.findUnique({
        where: { userId }
      })
    ]);

    // console.log('Wallet data:', { wallet, depositWallet });

    return NextResponse.json({
      balance: wallet?.balance || 0,
      depositWallet: {
        balance: depositWallet?.balance || 0,
        name: depositWallet?.name || "Donation Pool"
      }
    });
  } catch (error) {
    console.error('Error fetching wallet data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallet data' },
      { status: 500 }
    );
  }
} 