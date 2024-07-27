import prisma from '@/app/lib/db';

export async function updateCommunity(
  communityName: string,
  amount: number,
  isFunded: boolean
) {
  return prisma.community.update({
    where: { name: communityName },
    data: {
      totalDonations: { increment: amount },
      successfulRequests: { increment: isFunded ? 1 : 0 }
    }
  });
}