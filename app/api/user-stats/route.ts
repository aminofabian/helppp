import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const kindeId = searchParams.get('userId');

    if (!kindeId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('API: Fetching stats for Kinde user:', kindeId);

    // Get base user stats using Kinde ID
    const stats = await prisma.user.findUnique({
      where: { id: kindeId },
      select: {
        id: true,
        level: true,
        totalDonated: true,
        donationCount: true,
        points: {
          select: {
            amount: true,
          }
        }
      }
    });

    if (!stats) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate actual totals from donations
    const donations = await prisma.donation.aggregate({
      where: {
        userId: stats.id,
        status: {
          in: ['Paid', 'PAID', 'paid', 'COMPLETED', 'Completed', 'completed', 'SUCCESS', 'success']
        }
      },
      _count: {
        _all: true
      },
      _sum: {
        amount: true
      }
    });

    console.log('API: Donation aggregates:', donations);

    // Only include calculated values if they are greater than 0
    const response = {
      ...stats,
      ...(donations._count._all > 0 && { calculatedDonationCount: donations._count._all }),
      ...((donations._sum.amount ?? 0) > 0 && { calculatedTotalDonated: donations._sum.amount })
    };

    console.log('API: Returning stats:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('API: Error fetching user stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}