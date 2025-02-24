import webpush from 'web-push';
import prisma from './db';
import { PushSubscription } from '@prisma/client';

interface WebPushError extends Error {
  statusCode?: number;
}

export async function sendPushNotification(userId: string, notification: { title: string, content: string, url?: string }) {
  try {
    // Get all push subscriptions for the user
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId }
    });

    // Send push notification to each subscription
    const notifications = subscriptions.map(async (subscription: PushSubscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth
            }
          },
          JSON.stringify({
            title: notification.title,
            content: notification.content,
            url: notification.url || '/'
          })
        );
      } catch (error) {
        console.error('Error sending push notification:', error);
        
        // If subscription is no longer valid, remove it
        if ((error as WebPushError).statusCode === 410) {
          await prisma.pushSubscription.delete({
            where: { endpoint: subscription.endpoint }
          });
        }
      }
    });

    await Promise.all(notifications);
  } catch (error) {
    console.error('Error sending push notifications:', error);
  }
} 