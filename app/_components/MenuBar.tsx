'use client'

import { Button } from '@/components/ui/button';
import { Bell, Bookmark, Home, Mail, NotebookIcon } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { useEffect, useState } from 'react';




interface MenuBarProps {
  className?: string
  
}

export default function MenuBar({ className }: MenuBarProps) {
  const [notificationCount, setNotificationCount] = useState(0);
  
  useEffect(() => {
    async function fetchNotificationCount() {
      try {
        const response = await fetch('/api/notifications/count');
        if (!response.ok) {
          throw new Error('Failed to fetch notification count');
        }
        const data = await response.json();
        setNotificationCount(data.count);
      } catch (error) {
        console.error('Error fetching notification count:', error);
      }
    }
    
    fetchNotificationCount();
    
    const intervalId = setInterval(fetchNotificationCount, 30000);
    
    return () => clearInterval(intervalId);
  }, []);
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
    
    <Button
    variant='secondary'
    className='flex items-center justify-start gap-1'
    title='Notifications'
    asChild
    >
    <Link href='/notifications' className="relative">
    <Bell />
    {notificationCount > 0 && (
      <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full px-2 py-1 text-xs">
      {notificationCount}
      </span>
    )}
    </Link>
    </Button>
    
    
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
