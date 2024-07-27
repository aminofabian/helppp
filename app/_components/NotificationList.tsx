'use client'
import React from 'react';
import { useEffect, useState } from 'react';
import { Notification } from '@prisma/client';

export default function NotificationList() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  useEffect(() => {
    async function fetchNotifications() {
      const response = await fetch('/api/notifications/count');
      const data = await response.json();
      setNotifications(data);
      console.log(data)
    }
    fetchNotifications();
  }, []);
  
  return (
    <div>
    {notifications.map((notification) => (
      <div key={notification.id}>
      {/* Render notification based on type */}
      {notification.type === 'LIKE' && <p>Someone liked your request</p>}
      {notification.type === 'COMMENT' && <p>Someone commented on your request</p>}
      {notification.type === 'DONATION' && <p>Someone donated to your request</p>}
      </div>
    ))}
    </div>
  );
}

