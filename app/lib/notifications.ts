import prisma from '@/app/lib/db';
import { NotificationType } from '@prisma/client';

export async function createNotification({
  type,
  title,
  content,
  userId,
  prayerId,
  paymentId
}: {
  type: NotificationType;
  title: string;
  content: string;
  userId: string;
  prayerId?: string;
  paymentId?: string;
}) {
  try {
    // Check user's notification preferences
    const userSettings = await prisma.notificationSettings.findUnique({
      where: { userId }
    });

    if (!userSettings) {
      // Create default settings if they don't exist
      await prisma.notificationSettings.create({
        data: {
          userId,
          emailNotifications: true,
          pushNotifications: true,
          prayerUpdates: true,
          paymentUpdates: true,
          communityUpdates: true
        }
      });
    }

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        type,
        title,
        content,
        userId,
        prayerId,
        paymentId
      }
    });

    // TODO: Implement email notifications
    if (userSettings?.emailNotifications) {
      // Send email notification
    }

    // TODO: Implement push notifications
    if (userSettings?.pushNotifications) {
      // Send push notification
    }

    return notification;
  } catch (error) {
    console.error('[CREATE_NOTIFICATION]', error);
    throw error;
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });

    return notification;
  } catch (error) {
    console.error('[MARK_NOTIFICATION_READ]', error);
    throw error;
  }
}

export async function getUnreadNotifications(userId: string) {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        isRead: false
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    return notifications;
  } catch (error) {
    console.error('[GET_UNREAD_NOTIFICATIONS]', error);
    throw error;
  }
}

export async function deleteNotification(notificationId: string) {
  try {
    await prisma.notification.delete({
      where: { id: notificationId }
    });
  } catch (error) {
    console.error('[DELETE_NOTIFICATION]', error);
    throw error;
  }
} 