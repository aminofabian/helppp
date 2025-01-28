import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

export async function GET() {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    const communities = await prisma.community.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        totalDonations: true,
        successfulRequests: true,
        _count: {
          select: {
            memberships: true,
            requests: true
          }
        },
        User: {
          select: {
            userName: true
          }
        },
        memberships: user ? {
          where: {
            userId: user.id
          }
        } : false
      },
      orderBy: {
        memberships: {
          _count: 'desc'
        }
      },
      take: 10
    });

    // Transform the response to include isMember flag
    const communitiesWithMembership = communities.map(community => ({
      ...community,
      isMember: community.memberships?.length > 0,
      memberships: undefined // Remove memberships from response
    }));

    return NextResponse.json(communitiesWithMembership);
  } catch (error) {
    console.error('Error fetching communities:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 