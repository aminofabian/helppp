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
    <Card className="w-full max-w-xl mx-auto border-0 rounded-xl 
                    group hover:translate-y-[-2px]
                    shadow-lg hover:shadow-xl transition-all duration-500 
                    bg-white/95 dark:bg-gray-900/40
                    dark:backdrop-blur-xl dark:border dark:border-gray-800/20
                    dark:hover:bg-gray-900/50 dark:hover:border-gray-700/50
                    dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]
                    dark:hover:shadow-[0_12px_48px_rgba(0,0,0,0.4)]
                    overflow-hidden my-3">
      <div className="relative">
        {/* Enhanced ambient light effect */}
        <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-green-500/10 dark:via-purple-500/5 dark:to-teal-500/10 
                      opacity-0 group-hover:opacity-100 transition-opacity duration-500
                      dark:group-hover:animate-pulse" />

        {/* Glowing top line */}
        <div className="absolute top-0 left-0 w-full h-1 
                      bg-gradient-to-r from-primary/60 via-primary/80 to-secondary/60 
                      dark:from-green-400 dark:via-purple-400 dark:to-teal-400
                      dark:opacity-60 dark:group-hover:opacity-90 transition-all duration-500
                      dark:shadow-[0_0_15px_rgba(16,185,129,0.4)]" />
        
        {/* Funded Badge */}
        {isFunded && (
          <div className="absolute -right-8 top-4 rotate-45 z-10">
            <div className="bg-gradient-to-r from-green-500/90 to-teal-500/90 text-white 
                          px-8 py-0.5 text-xs font-medium shadow-lg backdrop-blur-sm">
              Funded
            </div>
          </div>
        )}

        <div className="p-4 relative z-10">
          {/* Header - Community and Time */}
          <div className="flex justify-between items-center mb-3">
            {communityName && (
              <Link 
                href={`/c/${communityName}`} 
                className="group/link flex items-center gap-1.5 px-2 py-1 
                         bg-primary/5 hover:bg-primary/10 
                         dark:bg-gray-800/40 dark:hover:bg-gray-800/60 
                         dark:backdrop-blur-sm
                         rounded-full transition-all duration-300"
              >
                <Users className="w-3.5 h-3.5 text-primary dark:text-green-400 
                               group-hover/link:rotate-12 transition-transform duration-300" />
                <span className="text-xs font-medium text-primary dark:text-green-400">
                  c/{communityName.replace(/_/g, ' ')}
                </span>
              </Link>
            )}
            <div className="text-xs font-medium">
              <div className="px-2 py-1 bg-orange-50 text-orange-600 
                            dark:bg-gray-800/40 dark:text-orange-300
                            dark:backdrop-blur-sm rounded-full flex items-center
                            shadow-sm dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)]
                            transition-all duration-300">
                <Clock className="w-3 h-3 mr-1 animate-pulse" />
                <Counter 
                  deadline={new Date(deadline)} 
                  createdAt={new Date(createdAt)} 
                />
              </div>
            </div>
          </div>
          
          {/* Title and User Info */}
          <div className="flex items-start gap-3 mb-3">
            <div className="relative flex-shrink-0 group/avatar">
              <ClientAvatar className="w-10 h-10 rounded-full 
                                    ring-2 ring-primary/10 dark:ring-green-500/20
                                    group-hover/avatar:ring-primary dark:group-hover/avatar:ring-green-500
                                    transition-all duration-300" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full 
                            bg-gradient-to-br from-green-500 to-teal-500
                            dark:from-green-400 dark:to-teal-400
                            shadow-lg group-hover/avatar:scale-110 transition-transform duration-300
                            flex items-center justify-center">
                <div className="absolute inset-0.5 rounded-full 
                              bg-white dark:bg-gray-900 
                              flex items-center justify-center">
                  <span className="text-[10px] font-bold 
                                 bg-gradient-to-br from-green-500 to-teal-500
                                 bg-clip-text text-transparent">
                    L{level}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <Link href={`/request/${id}`} className="block group/title">
                <h2 className="text-base font-semibold 
                             text-gray-900 dark:text-gray-100
                             group-hover/title:text-primary dark:group-hover/title:text-green-400 
                             transition-colors duration-300 line-clamp-2 mb-0.5">
                  {title}
                </h2>
              </Link>
              <div className="flex items-center gap-2">
                <Link href={`/user/${userId}`} 
                      className="text-xs font-medium
                               text-gray-700 dark:text-gray-300
                               hover:text-primary dark:hover:text-green-400 
                               transition-colors duration-300
                               flex items-center gap-1">
                  {userName}
                  <BadgeCheck className="w-3.5 h-3.5 text-primary dark:text-green-400" />
                </Link>
              </div>
            </div>
          </div>

          {/* Description */}
          {(textContent || jsonContent) && (
            <div className="mb-3 mt-2">
              {textContent ? (
                <div>
                  <div className={`relative text-base font-medium
                                p-6 rounded-xl
                                bg-white dark:bg-gray-800/50
                                border-2 border-white/20 dark:border-white/5
                                shadow-[0_0_15px_rgba(255,255,255,0.1)]
                                dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]
                                backdrop-blur-sm
                                ${!isExpanded && "line-clamp-2"}`}>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-slate-400/5 
                                  dark:from-green-500/5 dark:to-purple-500/5
                                  rounded-xl opacity-100" />
                    <div className="relative z-10 leading-relaxed tracking-wide
                                  text-gray-900 dark:text-slate-50">
                      {typeof textContent === 'object' && textContent?.content?.[0]?.content?.[0]?.text || 'No description provided'}
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-sm font-semibold
                             mt-3 px-5 py-2 rounded-full
                             bg-white/10 hover:bg-white/20
                             text-slate-50
                             transition-all duration-300
                             shadow-md hover:shadow-lg"
                  >
                    {isExpanded ? 'Show less' : 'Read more'}
                  </button>
                </div>
              ) : jsonContent ? (
                <div>
                  <div className={`relative text-base font-medium
                                p-6 rounded-xl
                                bg-white dark:bg-gray-800/50
                                border-2 border-white/20 dark:border-white/5
                                shadow-[0_0_15px_rgba(255,255,255,0.1)]
                                dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]
                                backdrop-blur-sm
                                ${!isExpanded && "line-clamp-2"}`}>
                    <div className="absolute inset-0
                                  rounded-xl" />
                    <div className="relative z-50 leading-relaxed tracking-wide
                                  text-gray-400 dark:text-white">
                      <RenderToJson data={jsonContent} />
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-sm font-semibold
                             mt-3 px-5 py-2 rounded-full"
                  >
                    {isExpanded ? 'Show less' : 'Read more'}
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* Image */}
          {imageString && (
            <div className="mb-3 rounded-lg overflow-hidden h-48 
                          shadow-lg dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]
                          group/image">
              <Image
                src={imageString}
                alt={title}
                width={400}
                height={200}
                className="w-full h-full object-cover 
                         group-hover/image:scale-105 transition-transform duration-700"
              />
            </div>
          )}

          {/* Contribution Info */}
          <div className="bg-gray-50/80 dark:bg-gray-800/40 
                        backdrop-blur-lg rounded-xl p-4
                        shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.2)]
                        border border-gray-200/50 dark:border-gray-700/30
                        group-hover:border-gray-300/50 dark:group-hover:border-gray-600/50
                        dark:group-hover:shadow-[0_8px_32px_rgba(16,185,129,0.15)]
                        transition-all duration-500 mb-3
                        dark:bg-gradient-to-br dark:from-gray-800/40 dark:to-gray-900/40">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-3">
                <p className="text-base font-semibold bg-gradient-to-r from-primary to-secondary
                           dark:from-green-400 dark:to-teal-400
                           bg-clip-text text-transparent">
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
                <span className="text-orange-600 dark:text-orange-300">
                  KES {remainingAmount.toLocaleString()}/= remaining
                </span>
              ) : (
                <span className="text-green-500 dark:text-green-400">
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
                           dark:text-gray-300 dark:hover:bg-gray-800/60
                           dark:hover:text-green-400 transition-colors duration-300"
                >
                  <MessageCircleIcon className="w-4 h-4 mr-1" />
                  <span className="text-xs">{commentCount}</span>
                </Button>
              </Link>

              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 rounded-full
                         dark:text-gray-300 dark:hover:bg-gray-800/60
                         dark:hover:text-green-400 transition-colors duration-300"
              >
                <BookmarkIcon className="w-4 h-4" />
              </Button>

              <CopyLink 
                id={id} 
                className="h-8 px-2 rounded-full
                         dark:text-gray-300 dark:hover:bg-gray-800/60
                         dark:hover:text-green-400 transition-colors duration-300"
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
            className={`w-full py-2.5 rounded-none transition-all duration-500
              ${isFunded
                ? 'bg-gray-900/90 dark:bg-gray-800/90 hover:bg-gray-900 dark:hover:bg-gray-700/90'
                : 'bg-gradient-to-r from-green-500/90 to-teal-500/90 hover:from-green-600/90 hover:to-teal-600/90 dark:shadow-[0_0_20px_rgba(16,185,129,0.3)]'
              } text-white backdrop-blur-sm`}
            disabled={isFunded}
          >
            <span className="relative flex items-center gap-2 justify-center text-sm font-medium">
              {isFunded ? 'Goal Achieved!' : `Support ${userName.split(' ')[0]}`}
            </span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md 
                                dark:bg-gray-900/90 dark:backdrop-blur-xl
                                dark:border-gray-800/30
                                dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
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
