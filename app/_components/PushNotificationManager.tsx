'use client';

import { useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

export default function PushNotificationManager() {
  const { toast } = useToast();

  useEffect(() => {
    const registerServiceWorker = async () => {
      try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
          console.log('Push notifications are not supported');
          return;
        }

        // Register service worker
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered');

        // Check if we already have permission
        let permission = Notification.permission;
        if (permission === 'denied') {
          console.log('Push notifications permission denied');
          return;
        }

        // Request permission if not granted
        if (permission === 'default') {
          permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            console.log('Push notifications permission not granted');
            return;
          }
        }

        // Get push subscription
        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
          console.log('Already subscribed to push notifications');
          return;
        }

        // Get VAPID public key
        const response = await fetch('/api/push/vapid-public-key');
        const { publicKey } = await response.json();

        // Subscribe to push notifications
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: publicKey
        });

        // Send subscription to server
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(subscription)
        });

        toast({
          title: "Push Notifications Enabled",
          description: "You will now receive push notifications for important updates.",
        });
      } catch (error) {
        console.error('Error setting up push notifications:', error);
      }
    };

    registerServiceWorker();
  }, [toast]);

  return null;
} 