import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page")) || 1;

  try {
    const [count, data] = await prisma.$transaction([
      prisma.request.count(),
      prisma.request.findMany({
        take: 10,
        skip: (page - 1) * 10,
        select: {
          id: true,
          title: true,
          createdAt: true,
          updatedAt: true,
          textContent: true,
          deadline: true,
          imageString: true,
          pointsUsed: true,
          amount: true, // The total goal amount for the post
          communityName: true,
          Vote: true,
          Comment: {
            select: {
              id: true,
              text: true,
            },
          },
          User: {
            select: {
              userName: true,
              id: true,
            },
          },
          donations: {  
            select: {
              amount: true,
              userId: true, 
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    const currentDate = new Date();

    // Filter expired requests
    const filteredData = data.filter((request) => request.deadline > currentDate);

    // Calculate total funded amount & number of contributors
    const enrichedData = filteredData.map((request) => {
      const totalFunded = request.donations.reduce((sum, donation) => sum + donation.amount, 0);
      const contributors = new Set(request.donations.map((donation) => donation.userId)).size; // Unique donors count

      return {
        ...request,
        funded: totalFunded, // Total funded amount
        contributors, // Number of unique donors
      };
    });

    return NextResponse.json({ data: enrichedData, count });
  } catch (error) {
    console.error("Error fetching requests:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
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