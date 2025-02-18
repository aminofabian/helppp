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
    <Card className="w-full max-w-xl mx-auto border-0 rounded-lg 
                    shadow hover:shadow-md transition-all duration-300 
                    bg-white/95 dark:bg-gray-900/80
                    dark:backdrop-blur-md overflow-hidden my-3">
      <div className="relative">
        {/* Top colored line */}
        <div className="absolute top-0 left-0 w-full h-1 
                      bg-gradient-to-r from-primary/60 via-primary/80 to-secondary/60 
                      dark:from-gray-700 dark:via-gray-600 dark:to-gray-700" />
        
        {/* Funded Badge */}
        {isFunded && (
          <div className="absolute -right-8 top-4 rotate-45 z-10">
            <div className="bg-[#00262f]/90 dark:bg-gray-900/90 text-white 
                          px-8 py-0.5 text-xs font-medium shadow-md backdrop-blur-sm">
              Funded
            </div>
          </div>
        )}

        <div className="p-4">
          {/* Header - Community and Time */}
          <div className="flex justify-between items-center mb-3">
            {communityName && (
              <Link 
                href={`/c/${communityName}`} 
                className="group flex items-center gap-1.5 px-2 py-1 
                         bg-primary/5 hover:bg-primary/10 
                         dark:bg-gray-800/60 dark:hover:bg-gray-800/80 
                         rounded-full transition-colors"
              >
                <Users className="w-3.5 h-3.5 text-primary dark:text-gray-300" />
                <span className="text-xs font-medium text-primary dark:text-gray-300">
                  c/{communityName.replace(/_/g, ' ')}
                </span>
              </Link>
            )}
            <div className="text-xs font-medium">
              <div className="px-2 py-1 bg-orange-50 text-orange-600 
                            dark:bg-gray-800/60 dark:text-orange-300
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
          <div className="flex items-start gap-3 mb-3">
            <div className="relative flex-shrink-0">
              <ClientAvatar className="w-10 h-10 rounded-full 
                                    ring-2 ring-primary/10 dark:ring-gray-700" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full 
                            bg-gradient-to-br from-primary to-secondary 
                            dark:from-gray-700 dark:to-gray-600
                            shadow flex items-center justify-center">
                <div className="absolute inset-0.5 rounded-full 
                              bg-white dark:bg-gray-900 
                              flex items-center justify-center">
                  <span className="text-[10px] font-bold 
                                 bg-gradient-to-br from-primary to-secondary 
                                 dark:from-gray-400 dark:to-gray-300
                                 bg-clip-text text-transparent">
                    L{level}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <Link href={`/request/${id}`} className="block group">
                <h2 className="text-base font-semibold 
                             text-gray-900 dark:text-gray-50
                             group-hover:text-primary dark:group-hover:text-white 
                             transition-colors line-clamp-2 mb-0.5">
                  {title}
                </h2>
              </Link>
              <div className="flex items-center gap-2">
                <Link href={`/user/${userId}`} 
                      className="text-xs font-medium hover:text-primary 
                               text-gray-700 dark:text-gray-200 dark:hover:text-white 
                               transition-colors flex items-center gap-1">
                  {userName}
                  <BadgeCheck className="w-3.5 h-3.5 text-primary dark:text-gray-200" />
                </Link>
              </div>
            </div>
          </div>

          {/* Description */}
          {(textContent || jsonContent) && (
            <div className="mb-3 mt-2">
              {textContent ? (
                <div>
                  <div className={`text-sm text-gray-800 dark:text-white
                                leading-relaxed tracking-wide
                                ${!isExpanded && "line-clamp-2"}`}>
                    {typeof textContent === 'object' && textContent?.content?.[0]?.content?.[0]?.text || 'No description provided'}
                  </div>
                  <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs text-primary hover:text-primary/90 
                             dark:text-gray-100 dark:hover:text-white
                             mt-2 font-medium transition-colors"
                  >
                    {isExpanded ? 'Show less' : 'Read more'}
                  </button>
                </div>
              ) : jsonContent ? (
                <div>
                  <div className={`text-sm text-gray-800 dark:text-white
                                leading-relaxed tracking-wide
                                ${!isExpanded && "line-clamp-2"}`}>
                    <RenderToJson data={jsonContent} />
                  </div>
                  <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs text-primary hover:text-primary/90 
                             dark:text-gray-100 dark:hover:text-white
                             mt-2 font-medium transition-colors"
                  >
                    {isExpanded ? 'Show less' : 'Read more'}
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* Image */}
          {imageString && (
            <div className="mb-3 rounded-lg overflow-hidden h-48">
              <Image
                src={imageString}
                alt={title}
                width={400}
                height={200}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          )}

          {/* Contribution Info */}
          <div className="bg-gray-50/80 dark:bg-gray-800/40 
                        backdrop-blur-sm rounded-lg p-3 mb-3 
                        shadow-sm transition-all duration-300">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-3">
                <p className="text-base font-semibold text-primary dark:text-gray-200">
                  KES {funded.toLocaleString()}
                  <span className="text-xs font-normal opacity-70 ml-1">/=</span>
                </p>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  of KES {amount.toLocaleString()}/=
                </p>
              </div>
              <div className="text-xs font-medium dark:text-gray-400">
                {fundedPercentage.toFixed(1)}% funded
              </div>
            </div>

            <div className="relative mb-2">
              <Slider contributed={funded} total={amount} />
            </div>

            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>{contributors} contributor{contributors !== 1 ? 's' : ''}</span>
              </div>
              {remainingAmount > 0 ? (
                <span className="text-orange-600 dark:text-orange-400">
                  KES {remainingAmount.toLocaleString()}/= remaining
                </span>
              ) : (
                <span className="text-green-600 dark:text-green-400">
                  Fully Funded
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
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
                  className="h-8 px-2 rounded-full
                           dark:text-gray-300 dark:hover:bg-gray-800/60"
                >
                  <MessageCircleIcon className="w-4 h-4 mr-1" />
                  <span className="text-xs">{commentCount}</span>
                </Button>
              </Link>

              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 rounded-full
                         dark:text-gray-300 dark:hover:bg-gray-800/60"
              >
                <BookmarkIcon className="w-4 h-4" />
              </Button>

              <CopyLink 
                id={id} 
                className="h-8 px-2 rounded-full
                         dark:text-gray-300 dark:hover:bg-gray-800/60"
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
              ${isFunded
                ? 'bg-gray-900/90 dark:bg-gray-800 hover:bg-gray-900 dark:hover:bg-gray-700'
                : 'bg-gradient-to-r from-primary/90 to-secondary/90 dark:from-gray-800 dark:to-gray-700 hover:opacity-90'
              } text-white backdrop-blur-sm`}
            disabled={isFunded}
          >
            <span className="relative flex items-center gap-2 justify-center text-sm">
              {isFunded ? 'Goal Achieved!' : `Support ${userName.split(' ')[0]}`}
            </span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md 
                                dark:bg-gray-900/90 dark:backdrop-blur-md
                                dark:border-gray-800/30">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-200">Support {userName}</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Your contribution will help {userName.split(' ')[0]} reach their goal of KES {amount.toLocaleString()}/=
            </DialogDescription>
          </DialogHeader>
          <MpesaPay requestId={id} />
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button type="button" variant="outline" 
                      className="dark:border-gray-700 dark:text-gray-300
                               dark:hover:bg-gray-800/60">
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
