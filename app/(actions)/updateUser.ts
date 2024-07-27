import prisma from '@/app/lib/db';
import { calculateLevel } from '@/app/lib/levelCalculator';

export async function updateUser(
  userId: string,
  amount: number
) {
  const totalPoints = await prisma.points.aggregate({
    where: { userId: userId },
    _sum: { amount: true }
  });
  const userTotalPoints = totalPoints._sum.amount || 0;
  const newLevel = calculateLevel(userTotalPoints);

  return prisma.user.update({
    where: { id: userId },
    data: {
      level: newLevel,
      totalDonated: { increment: amount },
      donationCount: { increment: 1 }
    }
  });
}