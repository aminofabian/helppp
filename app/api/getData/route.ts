import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page")) || 1;

  try {
    const count = await prisma.request.count();

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
        Comment: [],
        Vote: [],
        User: {
          id: request.userId,
          userName: request.userName,
          level: request.level
        },
        funded,
        contributors,
        voteCount1: Number(request.voteCount1),
        voteCount2: Number(request.voteCount2),
        commentCount: Number(request.commentCount)
      };
    }));

    return NextResponse.json({ data: enrichedData, count });
  } catch (error) {
    console.error('Error in getData:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// import { NextResponse } from 'next/server';
// import prisma from '@/app/lib/db';

// export async function GET(request: Request) {
//   const { searchParams } = new URL(request.url);
//   const page = Number(searchParams.get("page")) || 1;

//   try {
//     const [count, data] = await prisma.$transaction([
//       prisma.request.count(),
//       prisma.request.findMany({
//         take: 10,
//         skip: (page - 1) * 10,
//         select: {
//           id: true,
//           title: true,
//           createdAt: true,
//           updatedAt: true,
//           textContent: true,
//           deadline: true,
//           imageString: true,
//           pointsUsed: true,
//           amount: true, // The total goal amount for the post
//           communityName: true,
//           Vote: true,
//           Comment: {
//             select: {
//               id: true,
//               text: true,
//             },
//           },
//           User: {
//             select: {
//               userName: true,
//               id: true,
//             },
//           },
//           donations: {
//             select: {
//               amount: true,
//             },
//           },
//         },
//         orderBy: {
//           createdAt: "desc",
//         },
//       }),
//     ]);

//     const currentDate = new Date();
    
//     // Filter out expired requests
//     const filteredData = data.filter((request) => request.deadline > currentDate);

//     // Calculate total funded amount for each request
//     const enrichedData = filteredData.map((request) => {
//       const totalFunded = request.donations.reduce((sum, donation) => sum + donation.amount, 0);
//       return {
//         ...request,
//         funded: totalFunded, // Add funded amount
//       };
//     });

//     return NextResponse.json({ data: enrichedData, count });
//   } catch (error) {
//     console.error("Error fetching requests:", error);
//     return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
//   }
// }

// import { NextResponse } from 'next/server';
// import prisma from '@/app/lib/db';

// export async function GET(request: Request) {
//   const { searchParams } = new URL(request.url);
//   const page = Number(searchParams.get('page')) || 1;

//   try {
//     const [count, data] = await prisma.$transaction([
//       prisma.request.count(),
//       prisma.request.findMany({
//         take: 10,
//         skip: (page - 1) * 10,
//         select: {
//           title: true,
//           createdAt: true,
//           updatedAt: true,
//           textContent: true,
//           deadline: true,
//           id: true,
//           imageString: true,
//           pointsUsed: true,
//           Vote: true,
//           Comment: {
//             select: {
//               id: true,
//               text: true,
//             },
//           },
//           User: {
//             select: {
//               userName: true,
//               id: true,
//             },
//           },
//           communityName: true,
//           amount: true,
//         },
//         orderBy: {
//           createdAt: 'desc',
//         },
//       }),
//     ]);

//     const currentDate = new Date();
//     const filteredData = data.filter(request => request.deadline > currentDate);

//     return NextResponse.json({ data: filteredData, count });
//   } catch (error) {
//     console.error('Error in getData:', error);
//     return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
//   }
// }