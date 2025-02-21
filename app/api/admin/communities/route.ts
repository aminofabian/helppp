import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

export async function GET() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  // Double-check authentication
  if (!user?.email || !process.env.ADMIN_EMAILS?.includes(user.email)) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const communities = await prisma.community.findMany({
      include: {
        User: {
          select: {
            email: true,
            level: true,
          }
        },
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                level: true,
              }
            }
          }
        },
        requests: {
          select: {
            id: true,
            title: true,
            amount: true,
            status: true,
            createdAt: true,
          }
        },
        _count: {
          select: {
            requests: true,
            memberships: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform the data to include calculated fields
    const enrichedCommunities = communities.map(community => ({
      ...community,
      memberCount: community._count.memberships,
      requestCount: community._count.requests,
      totalAmount: community.totalDonations,
      successRate: community.successfulRequests > 0 
        ? (community.successfulRequests / community._count.requests * 100).toFixed(1) 
        : 0,
    }));

    return NextResponse.json(enrichedCommunities);
  } catch (error) {
    console.error('Error fetching communities:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
