'use client'

import { Button } from '@/components/ui/button';
import { Bell, Bookmark, Home, Mail, NotebookIcon } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import NotificationList from './NotificationList';

interface MenuBarProps {
  className?: string
}

export default function MenuBar({ className }: MenuBarProps) {
  const [notificationCount, setNotificationCount] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  useEffect(() => {
    async function fetchNotificationCount() {
      try {
        console.log('Fetching notification count...');
        const response = await fetch('/api/notifications/count');
        if (!response.ok) {
          throw new Error('Failed to fetch notification count');
        }
        const data = await response.json();
        console.log('Notification count:', data.count);
        setNotificationCount(data.count);
      } catch (error) {
        console.error('Error fetching notification count:', error);
      }
    }
    
    fetchNotificationCount();
    const intervalId = setInterval(fetchNotificationCount, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const handleNotificationClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsNotificationsOpen(true);
  };

  return (
    <div className={className}>
      <Button
        variant='secondary'
        className='flex items-center justify-start gap-1'
        title='Home'
        asChild
      >
        <Link href=''>
          <Home />
        </Link>
      </Button>
      
      <Button
        variant='secondary'
        className='flex items-center justify-start gap-1'
        title='Messages'
        asChild
      >
        <Link href='/messages'>
          <Mail />
        </Link>
      </Button>
      
      <Dialog open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
        <DialogTrigger asChild>
          <Button
            variant='secondary'
            className='flex items-center justify-start gap-1 relative'
            title='Notifications'
            onClick={handleNotificationClick}
          >
            <div className="relative">
              <Bell className="w-6 h-6" />
              {notificationCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full px-2 py-1 text-xs min-w-[20px] h-5 flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </div>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notifications</DialogTitle>
            <DialogDescription>
              Stay updated with your latest activities
            </DialogDescription>
          </DialogHeader>
          <NotificationList 
            onCountChange={setNotificationCount}
            isOpen={isNotificationsOpen}
            className="max-h-[60vh] overflow-y-auto"
          />
        </DialogContent>
      </Dialog>
      
      <Button
        variant='secondary'
        className='flex items-center justify-start gap-1'
        title='Bookmarks'
        asChild
      >
        <Link href=''>
          <Bookmark />
        </Link>
      </Button>
    </div>
  )
}
