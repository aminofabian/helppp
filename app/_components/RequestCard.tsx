'use client';

import React, { useState } from 'react';
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
  isOwner?: boolean;
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
  isOwner = false,
}: RequestCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="w-full max-w-xl mx-auto border-0 rounded-lg shadow hover:shadow-md transition-all duration-300 bg-white dark:bg-gray-800 overflow-hidden my-3">
      <div className="relative">
        {/* Top colored line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/80 via-primary to-secondary/80" />
        
        {/* Funded Badge */}
        {amount - 700 <= 0 && (
          <div className="absolute -right-8 top-4 rotate-45 z-10">
            <div className="bg-[#00262f] text-white px-8 py-0.5 text-xs font-medium shadow">
              Funded
            </div>
          </div>
        )}

        <div className="p-4">
          {/* Header - Community and Time */}
          <div className="flex justify-between items-center mb-3">
            <Link 
              href={`/c/${communityName}`} 
              className="group flex items-center gap-1.5 px-2 py-1 bg-primary/5 hover:bg-primary/10 rounded-full transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">
                c/{communityName.replace(/_/g, ' ')}
              </span>
            </Link>
            <div className="text-xs font-medium">
              <div className="px-2 py-1 bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 rounded-full flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                <Counter 
                  deadline={new Date(deadline)} 
                  createdAt={new Date(createdAt)} 
                />
              </div>
            </div>
          </div>
          
          {/* Title and User Info - More Compact */}
          <div className="flex items-start gap-3 mb-3">
            <div className="relative flex-shrink-0">
              <ClientAvatar className="w-10 h-10 rounded-full ring-2 ring-primary/10" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-primary to-secondary shadow flex items-center justify-center">
                <div className="absolute inset-0.5 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
                  <span className="text-[10px] font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">
                    L{level}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <Link href={`/request/${id}`} className="block group">
                <h2 className="text-base font-semibold group-hover:text-primary transition-colors line-clamp-2 mb-0.5">
                  {title}
                </h2>
              </Link>
              <div className="flex items-center gap-2">
                <Link href={`/user/${userId}`} className="text-xs font-medium hover:text-primary transition-colors flex items-center gap-1">
                  {userName}
                  <BadgeCheck className="w-3.5 h-3.5 text-primary" />
                </Link>
              </div>
            </div>
          </div>

          {/* Description - Collapsible */}
          {(textContent || jsonContent) && (
            <div className="mb-3">
              {textContent ? (
                <div>
                  <div className={`text-sm text-gray-600 dark:text-gray-300 ${!isExpanded && "line-clamp-2"}`}>
                    {typeof textContent === 'object' && textContent?.content?.[0]?.content?.[0]?.text || 'No description provided'}
                  </div>
                  <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs text-primary hover:text-primary/90 mt-1 font-medium"
                  >
                    {isExpanded ? 'Show less' : 'Read more'}
                  </button>
                </div>
              ) : jsonContent ? (
                <div>
                  <div className={`text-sm text-gray-600 dark:text-gray-300 ${!isExpanded && "line-clamp-2"}`}>
                    <RenderToJson data={jsonContent} />
                  </div>
                  <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs text-primary hover:text-primary/90 mt-1 font-medium"
                  >
                    {isExpanded ? 'Show less' : 'Read more'}
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* Image - If exists, show it smaller */}
          {imageString && (
            <div className="mb-3 rounded-lg overflow-hidden h-48">
              <Image
                src={imageString}
                alt="Request image"
                width={400}
                height={200}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          )}

          {/* Contribution Info - More Compact */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 mb-3">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-3">
                <p className="text-base font-semibold text-primary">
                  KES 700
                  <span className="text-xs font-normal opacity-70 ml-1">/=</span>
                </p>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  of KES {amount.toLocaleString()}/=
                </p>
              </div>
              <div className="text-xs font-medium">
                {((700 / amount) * 100).toFixed(1)}% funded
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative mb-2">
              <Slider contributed={700} total={amount} />
            </div>

            <div className="flex justify-between items-center text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>12 contributors</span>
              </div>
              {amount - 700 > 0 ? (
                <span className="text-orange-600">
                  KES {(amount - 700).toLocaleString()}/= remaining
                </span>
              ) : (
                <span className="text-green-600">
                  Fully Funded
                </span>
              )}
            </div>
          </div>
          

          {/* Action Buttons - More Compact */}
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <VoteButtons
                initialVoteCount1={voteCount1}
                initialVoteCount2={voteCount2}
                requestId={id}
              />
            </div>

            <div className="flex items-center gap-1">
              <Link href={`/request/${id}`} passHref>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 px-2 rounded-full"
                >
                  <MessageCircleIcon className="w-4 h-4 mr-1" />
                  <span className="text-xs">{commentCount}</span>
                </Button>
              </Link>

              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 rounded-full"
              >
                <BookmarkIcon className="w-4 h-4" />
              </Button>

              <CopyLink 
                id={id} 
                className="h-8 px-2 rounded-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Help Button */}
      <Dialog>
        <DialogTrigger asChild>
          <Button 
            variant="default" 
            className={`w-full py-2 rounded-none transition-all
              ${amount - 700 <= 0 
                ? 'bg-[#00262f] hover:bg-[#003a47]'
                : 'bg-gradient-to-r from-primary to-secondary hover:opacity-90'
              } text-white`}
            disabled={amount - 700 <= 0}
          >
            <span className="relative flex items-center gap-2 justify-center text-sm">
              {amount - 700 <= 0 ? 'Goal Achieved!' : `Support ${userName.split(' ')[0]}`}
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
