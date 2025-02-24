import prisma from '@/app/lib/db';
import { NotificationType } from '@prisma/client';
import { sendPushNotification } from './pushNotification';

export async function createNotification({
  type,
  title,
  content,
  recipientId,
  issuerId,
  requestId,
  donationId
}: {
  type: NotificationType;
  title: string;
  content: string;
  recipientId: string;
  issuerId: string;
  requestId?: string;
  donationId?: string;
}) {
  try {
    // Check user's notification preferences
    const userSettings = await prisma.user.findUnique({
      where: { id: recipientId },
      include: { notificationSettings: true }
    });

    if (!userSettings?.notificationSettings) {
      // Create default settings if they don't exist
      await prisma.notificationSettings.create({
        data: {
          userId: recipientId,
          emailEnabled: true,
          pushEnabled: true
        }
      });
    }

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        type,
        title,
        content,
        recipientId,
        issuerId,
        requestId,
        donationId
      }
    });

    // TODO: Implement email notifications
    if (userSettings?.notificationSettings?.emailEnabled) {
      // Send email notification
    }

    // Send push notification if enabled
    if (userSettings?.notificationSettings?.pushEnabled) {
      await sendPushNotification(recipientId, {
        title,
        content,
        url: requestId ? `/requests/${requestId}` : '/'
      });
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
      data: { read: true }
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
        recipientId: userId,
        read: false
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        issuer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            imageUrl: true
          }
        },
        request: true,
        donation: true
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