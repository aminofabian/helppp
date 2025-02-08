import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';


export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    const userId = user?.id;
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const prayer = await prisma.prayer.findUnique({
      where: {
        id: params.id
      }
    });

    if (!prayer) {
      return new NextResponse('Prayer not found', { status: 404 });
    }

    if (prayer.status !== 'PENDING') {
      return new NextResponse('Prayer is no longer pending', { status: 400 });
    }

    // Update prayer status
    const updatedPrayer = await prisma.prayer.update({
      where: {
        id: params.id
      },
      data: {
        status: 'ANSWERED',
        isOpen: false,
        answeredBy: {
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
            email: true
          }
        },
        answeredBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Update user stats
    await prisma.user.update({
      where: {
        id: userId
      },
      data: {
        prayersAnswered: {
          increment: 1
        }
      }
    });

    // Create notification for prayer creator
    await prisma.notification.create({
      data: {
        type: 'PRAYER_ANSWERED',
        title: 'Your prayer has been answered!',
        content: `${updatedPrayer.answeredBy?.name || 'Someone'} has answered your prayer: ${prayer.title}`,
        userId: prayer.creatorId,
        prayerId: prayer.id
      }
    });

    return NextResponse.json(updatedPrayer);
  } catch (error) {
    console.error('[PRAYER_ANSWER]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 