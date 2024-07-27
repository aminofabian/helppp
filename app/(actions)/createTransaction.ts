import prisma from '@/app/lib/db';

export async function createTransaction(
  giverId: string,
  receiverId: string,
  amount: number
) {
  return prisma.transaction.create({
    data: {
      giver: { connect: { id: giverId } },
      receiver: { connect: { id: receiverId } },
      amount: amount
    }
  });
}