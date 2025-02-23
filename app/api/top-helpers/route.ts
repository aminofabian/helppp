import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';

export async function GET() {
  try {
    const topHelpers = await prisma.user.findMany({
      select: {
        id: true,
        userName: true,
        level: true,
        totalDonated: true,
        donationCount: true,
        imageUrl: true,
      },
      where: {
        totalDonated: {
          gt: 0
        }
      },
      orderBy: [
        { totalDonated: 'desc' },
        { donationCount: 'desc' }
      ],
      take: 10
    });

    return NextResponse.json(topHelpers);
  } catch (error) {
    console.error('Error fetching top helpers:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 