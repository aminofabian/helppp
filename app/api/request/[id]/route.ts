import prisma from '@/app/lib/db';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await prisma.request.findUnique({
      where: {
        id: params.id,
      },
      include: {
        User: {
          select: {
            userName: true,
            level: true,
          },
        },
        donations: {
          select: {
            amount: true,
          },
        },
        Community: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!data) {
      return new NextResponse('Request not found', { status: 404 });
    }

    // Calculate funded amount from donations
    const funded = data.donations.reduce((total, donation) => total + donation.amount, 0);

    return NextResponse.json({
      ...data,
      funded,
      communityName: data.Community?.name,
    });
  } catch (error) {
    console.error('Error fetching request data:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
