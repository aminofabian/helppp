import prisma from '@/app/lib/db';
import { createNotification } from '@/app/lib/notifications';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NotificationType } from '@prisma/client';

export async function createTestimony(prayerId: string, content: string, isAnonymous: boolean = false) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    const userId = user?.id;
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const prayer = await prisma.prayer.findUnique({
      where: { id: prayerId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!prayer) {
      throw new Error('Prayer not found');
    }

    const testimony = await prisma.testimony.create({
      data: {
        response: content,
        prayer: {
          connect: {
            id: prayerId
          }
        },
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
        },
        prayer: {
          select: {
            id: true,
            title: true,
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

    // Create notification for prayer creator
    if (prayer.user.id !== userId) {
      await createNotification({
        type: NotificationType.NEWREQUEST,
        title: "New Testimony",
        content: `Someone has shared a testimony on your prayer request`,
        userId: prayer.user.id,
        prayerId
      });
    }

    return testimony;
  } catch (error) {
    console.error('[CREATE_TESTIMONY]', error);
    throw error;
  }
}

export async function getTestimonies(prayerId: string) {
  try {
    const testimonies = await prisma.testimony.findMany({
      where: {
        prayerId
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return testimonies;
  } catch (error) {
    console.error('[GET_TESTIMONIES]', error);
    throw error;
  }
}

export async function deleteTestimony(testimonyId: string) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    const userId = user?.id;
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const testimony = await prisma.testimony.findUnique({
      where: { id: testimonyId },
      include: {
        prayer: {
          select: {
            userId: true
          }
        }
      }
    });

    if (!testimony) {
      throw new Error('Testimony not found');
    }

    // Only allow the testimony creator or prayer creator to delete
    if (testimony.userId !== userId && testimony.prayer.userId !== userId) {
      throw new Error('Not authorized to delete this testimony');
    }

    await prisma.testimony.delete({
      where: { id: testimonyId }
    });
  } catch (error) {
    console.error('[DELETE_TESTIMONY]', error);
    throw error;
  }
}