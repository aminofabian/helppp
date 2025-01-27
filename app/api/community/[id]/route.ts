import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get('page') || '1';
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    // Get community with basic data
    const community = await prisma.community.findUnique({
      where: {
        name: params.id,
      },
      select: {
        id: true,
        name: true,
        description: true,
        userId: true,
        creatorId: true,
        totalDonations: true,
        successfulRequests: true,
        User: {
          select: {
            userName: true,
            firstName: true,
            lastName: true,
          }
        },
        _count: {
          select: {
            memberships: true,
            requests: true
          }
        }
      }
    });

    if (!community) {
      return new NextResponse('Community not found', { status: 404 });
    }

    // Get requests with pagination
    const requests = await prisma.request.findMany({
      where: {
        communityName: params.id,
      },
      take: 10,
      skip: (Number(page) - 1) * 10,
      select: {
        id: true,
        title: true,
        textContent: true,
        imageString: true,
        amount: true,
        pointsUsed: true,
        deadline: true,
        createdAt: true,
        updatedAt: true,
        status: true,
        User: {
          select: {
            id: true,
            userName: true
          }
        },
        _count: {
          select: {
            Comment: true,
            Vote: true
          }
        },
        Vote: {
          select: {
            voteType: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get members usernames
    const members = await prisma.communityMember.findMany({
      where: {
        communityId: community.id
      },
      select: {
        user: {
          select: {
            userName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Check if current user is a member
    let isMember = false;
    if (user) {
      const membership = await prisma.communityMember.findUnique({
        where: {
          userId_communityId: {
            userId: user.id,
            communityId: community.id
          }
        }
      });
      isMember = !!membership;
    }

    return NextResponse.json({
      data: {
        ...community,
        requests,
        memberCount: community._count.memberships,
        requestCount: community._count.requests,
        isMember,
        members: members.map(m => m.user.userName)
      },
      count: community._count.requests
    });
  } catch (error) {
    console.error('Error fetching community:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 