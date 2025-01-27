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
    
    // First, get the community
    const community = await prisma.community.findUnique({
      where: { name: communityName },
      include: {
        memberships: {
          where: {
            userId: user.id
          }
        }
      }
    });

    if (!community) {
      return new NextResponse('Community not found', { status: 404 });
    }

    // Check if already a member
    if (community.memberships.length > 0) {
      return NextResponse.json({ message: 'Already a member' }, { status: 200 });
    }
    
    // Create new membership
    const membership = await prisma.communityMember.create({
      data: {
        userId: user.id,
        communityId: community.id
      }
    });
    
    return NextResponse.json({ message: 'Successfully joined community', membership });
    
  } catch (error) {
    console.error('Error joining community:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 