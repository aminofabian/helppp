import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

/**
 * Handles the POST request to answer a prayer.
 * 
 * @param {Request} req - The incoming request.
 * @param {{ params: { id: string } }} - The route parameters.
 * @returns {Promise<NextResponse>} - The response to the request.
 */
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

    const { response } = await req.json();

    if (!response || typeof response !== 'string') {
      return new NextResponse('Response is required', { status: 400 });
    }

    // Update prayer status
    const updatedPrayer = await prisma.prayer.update({
      where: {
        id: params.id
      },
      data: {
        status: 'ANSWERED',
        answer: {
          create: {
            userId: userId,
            response: response
          }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        answer: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
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
        points: undefined  // Remove points creation since we need a payment ID
      }
    });

    // Create notification for prayer creator
    await prisma.notification.create({
      data: {
        recipientId: prayer.userId,
        issuerId: userId,
        type: "COMMENT",  // Using COMMENT type since there's no specific PRAYER_ANSWERED type
      }
    });

    return NextResponse.json(updatedPrayer);
  } catch (error) {
    console.error('[PRAYER_ANSWER]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}