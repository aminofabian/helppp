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
  funded: number;
  contributors: number;
  title: string;
  amount: number;
  status?: string | null;
  jsonContent?: any;
  textContent?: any; 
  imageString?: string | null;
  createdAt: Date | string;
  deadline: Date | string;
  updatedAt?: Date | string;
  userName: string;
  communityName: string | null;
  userId: string;
  voteCount1: number;
  voteCount2: number;
  level?: number;
  commentCount?: number;
  pointsUsed: number;
  isOwner?: boolean;
}

export function RequestCard({
  id,
  title,
  funded,
  contributors,
  amount,
  status,
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
  const isFunded = status === 'FUNDED' || amount - funded <= 0;
  const fundedPercentage = ((funded / amount) * 100);
  const remainingAmount = amount - funded;

  return (
    <Card className="w-full max-w-xl mx-auto
                    border-0 md:border rounded-none md:rounded-xl
                    hover:translate-y-[-2px] transition-all duration-300
                    bg-white/95 backdrop-blur-sm dark:bg-gray-900/95
                    dark:border-gray-800/50
                    shadow-none md:shadow-md hover:shadow-lg
                    overflow-hidden mb-3 md:mb-4
                    p-4 sm:p-5 md:p-6
                    touch-pan-y
                    border-b border-gray-100 dark:border-gray-800 md:border-none">
      <div className="relative">
        {/* Funded Badge */}
        {isFunded && (
          <div className="absolute -right-8 top-4 rotate-45 z-10">
            <div className="bg-primary text-white 
                          px-8 py-0.5 text-xs font-medium shadow-md">
              Funded
            </div>
          </div>
        )}

        <div className="space-y-3">
          {/* Header - Community and Time */}
          <div className="flex justify-between items-center">
            {communityName && (
              <Link 
                href={`/c/${communityName}`} 
                className="flex items-center gap-1.5 px-2 py-1 
                         bg-secondary/50 hover:bg-secondary
                         dark:bg-gray-800 dark:hover:bg-gray-700
                         rounded-full transition-colors"
              >
                <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
                <span className="text-xs font-medium text-primary truncate max-w-[120px] sm:max-w-none">
                  c/{communityName.replace(/_/g, ' ')}
                </span>
              </Link>
            )}
            <div className="text-xs font-medium">
              <div className="px-2 py-1 bg-orange-100 text-orange-600 
                            dark:bg-gray-800 dark:text-orange-300
                            rounded-full flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                <Counter 
                  deadline={new Date(deadline)} 
                  createdAt={new Date(createdAt)} 
                />
              </div>
            </div>
          </div>
          
          {/* Title and User Info */}
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="relative flex-shrink-0">
              <ClientAvatar className="w-8 h-8 sm:w-10 sm:h-10 rounded-full 
                                    ring-2 ring-secondary dark:ring-primary/20" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full 
                            bg-primary
                            flex items-center justify-center">
                <div className="absolute inset-0.5 rounded-full 
                              bg-white dark:bg-gray-900 
                              flex items-center justify-center">
                  <span className="text-[8px] sm:text-[10px] font-bold text-primary">
                    L{level}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <Link href={`/request/${id}`} className="block">
                <h2 className="text-sm sm:text-base font-semibold 
                             text-gray-900 dark:text-gray-100
                             hover:text-primary dark:hover:text-primary 
                             transition-colors mb-0.5 line-clamp-2">
                  {title}
                </h2>
              </Link>
              <div className="flex items-center gap-2">
                <Link href={`/user/${userId}`} 
                      className="text-xs font-medium
                               text-gray-700 dark:text-gray-300
                               hover:text-primary dark:hover:text-primary 
                               transition-colors
                               flex items-center gap-1">
                  {userName}
                  <BadgeCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
                </Link>
              </div>
            </div>
          </div>

          {/* Description */}
          {(textContent || jsonContent) && (
            <div className="mt-1">
              <div>
                <div className={`text-sm sm:text-base
                              p-3 sm:p-4 rounded-lg
                              bg-secondary/20 dark:bg-gray-800
                              border border-secondary dark:border-gray-700
                              ${!isExpanded && "line-clamp-2"}`}>
                  <div className="leading-relaxed text-slate-700 dark:text-gray-200">
                    {textContent ? (
                      typeof textContent === 'string' 
                        ? textContent 
                        : typeof textContent === 'object' && textContent?.content?.[0]?.content?.[0]?.text 
                          ? textContent.content[0].content[0].text 
                          : typeof textContent === 'object' && textContent?.text
                            ? textContent.text
                            : 'No description provided'
                    ) : (
                      <RenderToJson data={jsonContent} />
                    )}
                  </div>
                </div>
                {((textContent && (
                  (typeof textContent === 'string' && textContent.length > 80) ||
                  (typeof textContent === 'object' && textContent?.content?.[0]?.content?.[0]?.text?.length > 80) ||
                  (typeof textContent === 'object' && textContent?.text?.length > 80)
                )) || (jsonContent && Object.keys(jsonContent).length > 2)) && (
                  <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs sm:text-sm font-medium
                             mt-1 px-3 py-1 rounded-full
                             text-primary
                             hover:bg-secondary/50 dark:hover:bg-gray-800
                             transition-colors"
                  >
                    {isExpanded ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Image */}
          {imageString && (
            <div className="rounded-lg overflow-hidden h-40 sm:h-48 
                          border border-secondary dark:border-gray-700">
              <Image
                src={imageString}
                alt={title}
                width={400}
                height={200}
                className="w-full h-full object-cover 
                         hover:scale-105 transition-transform duration-500"
              />
            </div>
          )}

          {/* Contribution Info */}
          <div className="bg-secondary/20 dark:bg-gray-800 
                        rounded-lg p-3 sm:p-4
                        border border-secondary dark:border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <p className="text-sm sm:text-base font-semibold text-primary">
                  KES {funded.toLocaleString()}
                  <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-1">/=</span>
                </p>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  of KES {amount.toLocaleString()}/=
                </p>
              </div>
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {fundedPercentage.toFixed(1)}% funded
              </div>
            </div>

            <div className="relative mb-2">
              <Slider contributed={funded} total={amount} />
            </div>

            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>{contributors} contributor{contributors !== 1 ? 's' : ''}</span>
              </div>
              {remainingAmount > 0 ? (
                <span className="text-orange-600 dark:text-orange-300">
                  KES {remainingAmount.toLocaleString()}/= remaining
                </span>
              ) : (
                <span className="text-primary">
                  Fully Funded
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <div className="flex items-center scale-90 sm:scale-100 origin-left">
              <VoteButtons
                initialVoteCount1={voteCount1}
                initialVoteCount2={voteCount2}
                requestId={id}
              />
            </div>

            <div className="flex items-center gap-0.5 sm:gap-1">
              <Link href={`/request/${id}`} passHref>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 px-1.5 sm:px-2 rounded-full
                           text-gray-600 hover:text-primary hover:bg-secondary/50
                           dark:text-gray-400 dark:hover:text-primary dark:hover:bg-gray-800"
                >
                  <MessageCircleIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                  <span className="text-xs">{commentCount}</span>
                </Button>
              </Link>

              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-1.5 sm:px-2 rounded-full
                         text-gray-600 hover:text-primary hover:bg-secondary/50
                         dark:text-gray-400 dark:hover:text-primary dark:hover:bg-gray-800"
              >
                <BookmarkIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>

              <CopyLink 
                id={id} 
                className="h-8 px-1.5 sm:px-2 rounded-full
                         text-gray-600 hover:text-primary hover:bg-secondary/50
                         dark:text-gray-400 dark:hover:text-primary dark:hover:bg-gray-800"
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
            className={`w-full py-2 sm:py-2.5 rounded-none
              ${isFunded
                ? 'bg-gray-900 dark:bg-gray-800 hover:bg-gray-800 dark:hover:bg-gray-700'
                : 'bg-primary hover:bg-primary/90'
              } text-white`}
            disabled={isFunded}
          >
            <span className="flex items-center gap-2 justify-center text-sm font-medium">
              {isFunded ? 'Goal Achieved!' : `Support ${userName.split(' ')[0]}`}
            </span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md 
                                bg-white dark:bg-gray-900
                                border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">Support {userName}</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Your contribution will help {userName.split(' ')[0]} reach their goal of KES {amount.toLocaleString()}/=
            </DialogDescription>
          </DialogHeader>
          <MpesaPay requestId={id} />
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button type="button" variant="outline" 
                      className="border-secondary dark:border-gray-700 
                               text-gray-700 dark:text-gray-300
                               hover:bg-secondary/50 dark:hover:bg-gray-800">
                Maybe Later
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default RequestCard;