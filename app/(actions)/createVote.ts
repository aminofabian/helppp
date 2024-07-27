import prisma from '@/app/lib/db';

export async function createVote(
  userId: string,
  requestId: string
) {
  return prisma.vote.create({
    data: {
      User: { connect: { id: userId } },
      Request: { connect: { id: requestId } },
      voteType: 'LOVE'
    }
  });
}