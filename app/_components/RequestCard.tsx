import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck, BookmarkIcon, Clock, MessageCircleIcon, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogClose, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Slider from './Slider';
import Counter from './Counter';
import CopyLink from './CopyLink';
import MpesaPay from './MpesaPay';
import { VoteButtons } from './VoteButtons';
import { ClientAvatar } from './ClientAvatar';
import RenderToJson from './RenderToJson';
import { motion } from 'framer-motion';


interface RequestCardProps {
  id: string;
  title: string;
  amount: number;
  jsonContent?: any;
  textContent?: any; 
  imageString?: string;
  createdAt: string | Date;
  deadline: string | Date;
  updatedAt?: Date | string;
  userName: string;
  communityName: string;
  userId: string;
  voteCount1: number;
  voteCount2: number;
  level?: number;
  commentCount?: number;
  pointsUsed?: number;
}

export function RequestCard({
  id,
  title,
  amount,
  jsonContent,
  textContent,
  imageString,
  createdAt,
  deadline,
  updatedAt,
  userName,
  communityName,
  userId,
  voteCount1,
  voteCount2,
  level = 1,
  commentCount = 0,
  pointsUsed,
}: RequestCardProps) {
  
  
  
  return (
    <Card className="w-full max-w-xl mx-auto border border-gray-200 dark:border-gray-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-800 overflow-hidden my-6">
      <div className="p-5">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-3">
          <Link 
            href={`/c/${communityName}`} 
            className="text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1"
          >
            <Users className="w-4 h-4" />
            c/{communityName.replace(/_/g, ' ')}
          </Link>
          <div className="text-xs font-medium bg-primary/10 text-primary px-3 py-1.5 rounded-full flex items-center">
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            <Counter 
              deadline={new Date(deadline)} 
              createdAt={new Date(createdAt)} 
            />
          </div>
        </div>
        
        {/* Title and User Info */}
        <Link href={`/request/${id}`} className="block group">
          <h2 className="text-lg font-semibold mb-2.5 group-hover:text-primary transition-colors line-clamp-2">
            {title}
          </h2>
        </Link>
        
        <div className="flex items-center space-x-3 mb-4">
          <ClientAvatar className="w-8 h-8 rounded-full ring-2 ring-primary/10" />
          <div>
            <Link href={`/user/${userId}`} className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
              {userName}
              <BadgeCheck className="w-4 h-4 text-primary" />
            </Link>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Level {level} • {new Date(createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Contribution Info */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex flex-col">
              <p className='text-sm text-gray-600 dark:text-gray-400'>
                <span className="font-medium text-primary">{userName}</span> needs
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                KES {amount.toLocaleString()}<span className="text-sm font-normal text-gray-500">/=</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {Math.round((amount / 10000) * 100)}% funded
              </span>
              <p className="text-xs text-gray-500">of KES 10,000 goal</p>
            </div>
          </div>
          
          <div className="relative mb-4">
            <Slider amount={amount} />
            <div className="absolute -top-1 left-0 w-full h-8 bg-gradient-to-t from-transparent to-white/20 dark:to-black/20 pointer-events-none" />
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="font-medium text-gray-700 dark:text-gray-300">
                12 people have helped
              </span>
            </div>
            <span className="text-xs text-gray-500">
              {new Date(deadline).toLocaleDateString()} deadline
            </span>
          </div>
        </div>

        {/* Content Section */}
        {imageString && (
          <div className="mb-4">
            <Image
              src={imageString}
              alt="Request image"
              width={100}
              height={50}
              layout="responsive"
              className="rounded-lg"
            />
          </div>
        )}
        
        {jsonContent && <RenderToJson data={jsonContent} />}
        
        {/* Action Buttons */}
        <div className="flex justify-between items-center mb-6 px-1">
          {/* Left side - Vote buttons */}
          <div className="flex items-center">
            <VoteButtons
              initialVoteCount1={voteCount1}
              initialVoteCount2={voteCount2}
              requestId={id}
            />
          </div>

          {/* Right side - Action buttons */}
          <div className="flex items-center gap-1">
            <Link href={`/request/${id}`} passHref>
              <motion.div
                initial={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative group"
              >
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="flex items-center gap-1.5 px-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                >
                  <MessageCircleIcon className="w-4 h-4 text-gray-600 dark:text-gray-300 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300 min-w-[20px]">
                    {commentCount}
                  </span>
                </Button>
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  whileHover={{ opacity: 1, y: 25 }}
                  className="absolute left-1/2 -translate-x-1/2 text-xs text-gray-500 whitespace-nowrap pointer-events-none"
                >
                  Send Message
                </motion.span>
              </motion.div>
            </Link>

            <motion.div
              initial={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative group"
            >
              <Button 
                variant="ghost" 
                size="sm" 
                className="px-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
              >
                <BookmarkIcon className="w-4 h-4 text-gray-600 dark:text-gray-300 group-hover:text-primary group-hover:scale-110 transition-all" />
              </Button>
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                whileHover={{ opacity: 1, y: 25 }}
                className="absolute left-1/2 -translate-x-1/2 text-xs text-gray-500 whitespace-nowrap pointer-events-none"
              >
                Remember
              </motion.span>
            </motion.div>

            <CopyLink 
              id={id} 
              className="px-3 rounded-full"
            />
          </div>
        </div>

        {pointsUsed && (
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Points used: {pointsUsed}
          </div>
        )}
      </div>

      {/* Help Now Button and Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button 
            variant="default" 
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-none transition-colors group"
          >
            <span className="flex items-center gap-2">
              Support {userName.split(' ')[0]} 
              <span className="text-xs opacity-80 group-hover:opacity-100 transition-opacity">
                • Every Shilling Counts
              </span>
            </span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Support {userName}</DialogTitle>
            <DialogDescription>
              Your contribution will help {userName.split(' ')[0]} reach their goal of KES {amount.toLocaleString()}/=
            </DialogDescription>
          </DialogHeader>
          <MpesaPay requestId={id} />
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button type="button" variant="outline">Maybe Later</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default RequestCard;
