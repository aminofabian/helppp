import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page')) || 1;
    const pageSize = 10;

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

    // Get total count of requests for pagination
    const totalRequests = await prisma.request.count({
      where: {
        communityName: params.id
      }
    });

    // Get requests with pagination
    const requests = await prisma.$transaction([
      prisma.request.findMany({
        where: {
          communityName: params.id
        },
        take: pageSize,
        skip: Math.max(0, (page - 1) * pageSize),
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          User: {
            select: {
              id: true,
              userName: true
            }
          },
          Comment: {
            select: {
              id: true
            }
          },
          Vote: {
            select: {
              voteType: true
            }
          },
          donations: true,
          _count: {
            select: {
              Comment: true,
              Vote: true
            }
          }
        }
      })
    ]);

    // Calculate funded amount and contributors for each request
    const enrichedRequests = requests[0].map(request => {
      const funded = request.donations.reduce((sum, donation) => sum + donation.amount, 0);
      const contributors = new Set(request.donations.map(donation => donation.userId)).size;
      
      return {
        ...request,
        funded,
        contributors,
        donations: undefined // Remove raw donations data from response
      };
    });

    // Get members usernames
    const members = await prisma.user.findMany({
      where: {
        memberships: {
          some: {
            communityId: community.id
          }
        }
      },
      select: {
        userName: true
      },
      orderBy: {
        userName: 'asc'
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
        requests: enrichedRequests,
        memberCount: community._count.memberships,
        requestCount: community._count.requests,
        isMember,
        members: members.map(m => m.userName)
      },
      count: totalRequests,
      currentPage: page,
      totalPages: Math.ceil(totalRequests / pageSize)
    });
  } catch (error) {
    console.error('Error fetching community:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 