import prisma from '@/app/lib/db';

export async function updateWallet(
  userId: string,
  amount: number
) {
  console.log(`Updating wallet for user ${userId} with amount ${amount}`);
  
  try {
    // First check existing wallet
    const existingWallet = await prisma.wallet.findUnique({
      where: { userId }
    });
    
    console.log('Existing wallet:', existingWallet);

    const wallet = await prisma.wallet.upsert({
      where: { userId },
      update: { balance: { increment: amount } },
      create: { userId, balance: amount }
    });

    console.log('Wallet after update:', wallet);
    
    return wallet;
  } catch (error) {
    console.error('Error updating wallet:', error);
    throw error;
  }
}