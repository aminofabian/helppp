import prisma from '@/app/lib/db';

export async function updateWallet(
  userId: string,
  amount: number
) {
  return prisma.wallet.upsert({
    where: { userId: userId },
    update: { balance: { increment: amount } },
    create: { userId: userId, balance: amount }
  });
}