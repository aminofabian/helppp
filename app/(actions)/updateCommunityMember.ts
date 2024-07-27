import prisma from '@/app/lib/db';

export async function updateCommunityMember(
  userId: string,
  communityId: string,
  amount: number
) {
  return prisma.communityMember.upsert({
    where: {
      userId_communityId: { userId: userId, communityId: communityId }
    },
    update: { totalDonated: { increment: amount } },
    create: { userId: userId, communityId: communityId, totalDonated: amount }
  });
}