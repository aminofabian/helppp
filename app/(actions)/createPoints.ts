import prisma from '@/app/lib/db';

export async function createPoints(
  userId: string,
  amount: number,
  paymentId: string
) {
  const pointsEarned = Math.floor(amount / 50);
  return prisma.points.create({
    data: {
      user: { connect: { id: userId } },
      amount: pointsEarned,
      payment: { connect: { id: paymentId } }
    }
  });
}