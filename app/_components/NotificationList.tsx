'use client'
import React from 'react';
import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: 'LIKE' | 'COMMENT' | 'DONATION' | 'NEWREQUEST';
  title: string;
  content: string;
  read: boolean;
  createdAt: string;
  issuer: {
    firstName: string;
    lastName: string;
  };
  donation?: {
    amount: number;
  };
  request?: {
    title: string;
  };
}

export interface NotificationListProps {
  className?: string;
  showIcon?: boolean;
  onCountChange?: (count: number) => void;
}

export default function NotificationList({ className, showIcon = false, onCountChange }: NotificationListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    async function fetchNotifications() {
      try {
        const response = await fetch('/api/notifications');
        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }
        const data = await response.json();
        setNotifications(data);
        const unread = data.filter((n: Notification) => !n.read).length;
        setUnreadCount(unread);
        onCountChange?.(unread);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    }
    
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [onCountChange]);

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ read: true }),
      });
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
      onCountChange?.(unreadCount - 1);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const getNotificationContent = (notification: Notification) => {
    const userName = `${notification.issuer.firstName} ${notification.issuer.lastName}`;
    
    switch (notification.type) {
      case 'LIKE':
        return (
          <>
            <p className="text-sm font-medium">
              <span className="text-blue-600">{userName}</span> liked your request
              {notification.request && (
                <span className="font-normal text-gray-600"> "{notification.request.title}"</span>
              )}
            </p>
          </>
        );
      case 'COMMENT':
        return (
          <>
            <p className="text-sm font-medium">
              <span className="text-blue-600">{userName}</span> commented:
              <span className="font-normal text-gray-600"> "{notification.content}"</span>
            </p>
            {notification.request && (
              <p className="text-xs text-gray-500 mt-1">
                on your request "{notification.request.title}"
              </p>
            )}
          </>
        );
      case 'DONATION':
        return (
          <>
            <p className="text-sm font-medium">
              <span className="text-blue-600">{userName}</span> donated
              {notification.donation && (
                <span className="text-green-600 font-semibold"> {formatAmount(notification.donation.amount)}</span>
              )}
            </p>
            {notification.request && (
              <p className="text-xs text-gray-500 mt-1">
                to your request "{notification.request.title}"
              </p>
            )}
          </>
        );
      case 'NEWREQUEST':
        return (
          <p className="text-sm font-medium">
            <span className="text-blue-600">{userName}</span> posted a new request:
            <span className="font-normal text-gray-600"> "{notification.content}"</span>
          </p>
        );
      default:
        return <p className="text-sm">{notification.content}</p>;
    }
  };
  
  return (
    <div className={cn("relative", className)}>
      {showIcon && (
        <div className="relative inline-block">
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {unreadCount}
            </div>
          )}
        </div>
      )}
      <div className="space-y-2">
        {notifications.map((notification) => (
          <div 
            key={notification.id}
            className={cn(
              "p-3 rounded-lg transition-colors cursor-pointer",
              notification.read ? "bg-gray-100" : "bg-blue-50 hover:bg-blue-100"
            )}
            onClick={() => !notification.read && markAsRead(notification.id)}
          >
            {getNotificationContent(notification)}
            <p className="text-xs text-gray-500 mt-1">
              {new Date(notification.createdAt).toLocaleDateString()} at {new Date(notification.createdAt).toLocaleTimeString()}
            </p>
          </div>
        ))}
        {notifications.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-4">No notifications</p>
        )}
      </div>
    </div>
  );
}
