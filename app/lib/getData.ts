// lib/getData.ts
import prisma from "./db";

export async function getData(page: number) {
  try {
    console.log('getData called with page:', page);
    const [count, data] = await prisma.$transaction([
      prisma.request.count(),
      prisma.request.findMany({
        take: 10,
        skip: (page - 1) * 10,
        select: {
          title: true,
          createdAt: true,
          updatedAt: true,
          textContent: true,
          deadline: true,
          id: true,
          imageString: true,
          pointsUsed: true,
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
              level: true, // Add this line to include the user's level
            },
          },
          communityName: true,
          amount: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    console.log('Count:', count);
    console.log('Data length:', data.length);

    const currentDate = new Date();
    const filteredData = data.filter(request => request.deadline > currentDate);

    console.log('Filtered data length:', filteredData.length);

    return { data: filteredData, count };
  } catch (error) {
    console.error('Error in getData:', error);
    throw error;
  }
}