import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

export async function POST(req: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    
    const { communityName } = await req.json();
    
    if (!communityName) {
      return new NextResponse('Community name is required', { status: 400 });
    }
    
    // First, get the community with current member count
    const community = await prisma.community.findUnique({
      where: { name: communityName },
      include: {
        memberships: {
          where: {
            userId: user.id
          }
        },
        _count: {
          select: {
            memberships: true
          }
        }
      }
    });

    if (!community) {
      return new NextResponse('Community not found', { status: 404 });
    }

    // Check if already a member
    if (community.memberships.length > 0) {
      return NextResponse.json({ 
        message: 'Already a member',
        memberCount: community._count.memberships
      }, { status: 200 });
    }
    
    // Create new membership
    const membership = await prisma.communityMember.create({
      data: {
        userId: user.id,
        communityId: community.id
      }
    });

    // Get updated member count
    const updatedCommunity = await prisma.community.findUnique({
      where: { name: communityName },
      include: {
        _count: {
          select: {
            memberships: true
          }
        }
      }
    });
    
    return NextResponse.json({ 
      message: 'Successfully joined community', 
      membership,
      memberCount: updatedCommunity?._count.memberships || 0
    });
    
  } catch (error) {
    console.error('Error joining community:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 