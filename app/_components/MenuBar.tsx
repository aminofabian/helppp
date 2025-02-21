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
    <div className={`flex items-center justify-between w-full gap-1 ${className}`}>
      <Button
        variant='ghost'
        className='flex-1 flex items-center justify-center p-3
                  text-gray-600 hover:text-primary
                  dark:text-gray-400 dark:hover:text-primary
                  hover:bg-secondary/10
                  rounded-xl
                  transition-all duration-200 ease-in-out
                  group'
        title='Home'
        asChild
      >
        <Link href=''>
          <Home className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
        </Link>
      </Button>
      
      <Button
        variant='ghost'
        className='flex-1 flex items-center justify-center p-3
                  text-gray-600 hover:text-primary
                  dark:text-gray-400 dark:hover:text-primary
                  hover:bg-secondary/10
                  rounded-xl
                  transition-all duration-200 ease-in-out
                  group'
        title='Messages'
        asChild
      >
        <Link href='/messages'>
          <Mail className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
        </Link>
      </Button>
      
      <Dialog open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
        <DialogTrigger asChild>
          <Button
            variant='ghost'
            className='flex-1 flex items-center justify-center p-3
                      text-gray-600 hover:text-primary
                      dark:text-gray-400 dark:hover:text-primary
                      hover:bg-secondary/10
                      rounded-xl
                      transition-all duration-200 ease-in-out
                      group'
            title='Notifications'
            onClick={handleNotificationClick}
          >
            <div className="relative">
              <Bell className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
              {notificationCount > 0 && (
                <span className="absolute -top-2 -right-2 
                               bg-primary text-white 
                               rounded-full w-5 h-5 
                               flex items-center justify-center
                               text-xs font-medium
                               shadow-lg
                               animate-pulse
                               scale-100 group-hover:scale-110
                               transition-transform duration-200">
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
        variant='ghost'
        className='flex-1 flex items-center justify-center p-3
                  text-gray-600 hover:text-primary
                  dark:text-gray-400 dark:hover:text-primary
                  hover:bg-secondary/10
                  rounded-xl
                  transition-all duration-200 ease-in-out
                  group'
        title='Bookmarks'
        asChild
      >
        <Link href=''>
          <Bookmark className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
        </Link>
      </Button>
    </div>
  )
}
