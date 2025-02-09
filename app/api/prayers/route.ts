import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { PrayerStatus } from '@prisma/client';
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
    const { title, content } = json;

    const prayer = await prisma.prayer.create({
      data: {
        title,
        content,
        user: {
          connect: {
            id: userId
          }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            imageUrl: true
          }
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
    const userId = searchParams.get('userId');

    let where: any = {};

    if (status) {
      where.status = status as PrayerStatus;
    }

    if (userId) {
      where.userId = userId;
    }

    const prayers = await prisma.prayer.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            imageUrl: true
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