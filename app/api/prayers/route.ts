import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";





export async function POST(req: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    const userId = user?.id;
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const json = await req.json();
    const { title, content, isMonetary, amount, currency } = json;

    const prayer = await prisma.prayer.create({
      data: {
        title,
        content,
        isMonetary: isMonetary || false,
        amount: amount ? parseFloat(amount) : null,
        currency,
        creator: {
          connect: {
            id: userId
          }
        }
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    // Update user stats
    await prisma.user.update({
      where: { id: userId },
      data: {
        prayersCreated: {
          increment: 1
        }
      }
    });

    return NextResponse.json(prayer);
  } catch (error) {
    console.error('[PRAYERS_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const communityId = searchParams.get('communityId');
    const creatorId = searchParams.get('creatorId');

    let where: any = {};

    if (status) {
      where.status = status;
    }

    if (communityId) {
      where.communityId = communityId;
    }

    if (creatorId) {
      where.creatorId = creatorId;
    }

    const prayers = await prisma.prayer.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        community: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(prayers);
  } catch (error) {
    console.error('[PRAYERS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 