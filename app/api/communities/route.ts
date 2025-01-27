import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';

export async function GET() {
  try {
    const communities = await prisma.community.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        _count: {
          select: {
            memberships: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10 // Limit to 10 most recent communities
    });

    return NextResponse.json({
      communities: communities.map(community => ({
        id: community.id,
        name: community.name,
        description: community.description,
        memberCount: community._count.memberships
      }))
    });
  } catch (error) {
    console.error('Error fetching communities:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 