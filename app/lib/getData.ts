// lib/getData.ts
import prisma from "./db";

interface RawRequest {
  id: string;
  title: string;
  textContent: any;
  imageString: string | null;
  deadline: Date;
  amount: number;
  pointsUsed: number;
  communityName: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  userName: string;
  level: number;
  commentCount: bigint;
  voteCount1: bigint;
  voteCount2: bigint;
}

export async function getData(page: number) {
  try {
    console.log('getData called with page:', page);
    
    // First get the total count
    const count = await prisma.request.count();

    // Then get the data with random ordering using raw SQL
    const data = await prisma.$queryRaw<RawRequest[]>`
      SELECT 
        r.*,
        u.id as "userId",
        u."userName",
        u.level,
        (SELECT COUNT(*) FROM "Comment" c WHERE c."requestId" = r.id) as "commentCount",
        (SELECT COUNT(*) FROM "votes" v WHERE v."requestId" = r.id AND v."voteType" = 'LOVE') as "voteCount1",
        (SELECT COUNT(*) FROM "votes" v WHERE v."requestId" = r.id AND v."voteType" = 'SUSPISION') as "voteCount2"
      FROM "Request" r
      LEFT JOIN "users" u ON r."userId" = u.id
      WHERE r.deadline > NOW()
      ORDER BY RANDOM()
      LIMIT 10
      OFFSET ${(page - 1) * 10}
    `;

    // Transform the data to match the expected format
    const enrichedData = await Promise.all(data.map(async (request) => {
      const donations = await prisma.donation.findMany({
        where: { requestId: request.id },
        select: { amount: true, userId: true }
      });

      const funded = donations.reduce((sum, donation) => sum + donation.amount, 0);
      const contributors = new Set(donations.map(donation => donation.userId)).size;

      return {
        ...request,
        User: {
          id: request.userId,
          userName: request.userName,
          level: request.level
        },
        Comment: [],
        Vote: [],
        funded,
        contributors,
        voteCount1: Number(request.voteCount1),
        voteCount2: Number(request.voteCount2),
        commentCount: Number(request.commentCount)
      };
    }));

    return { data: enrichedData, count };
  } catch (error) {
    console.error('Error in getData:', error);
    throw error;
  }
}