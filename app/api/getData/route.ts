import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get('page')) || 1;

  try {
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
              email: true,
              id: true,
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

    const currentDate = new Date();
    const filteredData = data.filter(request => request.deadline > currentDate);

    return NextResponse.json({ data: filteredData, count });
  } catch (error) {
    console.error('Error in getData:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}