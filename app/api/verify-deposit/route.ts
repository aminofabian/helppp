import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

export async function POST(req: Request) {
  try {
    const { reference } = await req.json();
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.json({ success: false, error: 'User not authenticated' }, { status: 401 });
    }

    // Verify the payment with Paystack
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
      return NextResponse.json({ success: false, error: 'Payment verification failed' });
    }

    // Get both wallet balances
    const [wallet, depositWallet] = await Promise.all([
      prisma.wallet.findUnique({
        where: { userId: user.id }
      }),
      prisma.depositWallet.findUnique({
        where: { userId: user.id }
      })
    ]);

    return NextResponse.json({
      success: true,
      walletBalance: wallet?.balance || 0,
      depositWalletBalance: depositWallet?.balance || 0,
      transactionType: verifyData.data.metadata?.type || 'regular'
    });

  } catch (error) {
    console.error('Error verifying deposit:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify deposit' },
      { status: 500 }
    );
  }
} 