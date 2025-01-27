'use client';

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
  return (
    <Card className="w-full max-w-xl mx-auto border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50 overflow-hidden my-6">
      <div className="relative">
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/80 via-primary to-secondary/80" />
        <div className="absolute top-1 left-0 w-full h-px bg-white/20" />
        
        {/* Fully Funded Badge */}
        {amount - 700 <= 0 && (
          <div className="absolute -right-12 top-6 rotate-45 z-10">
            <div className="bg-[#00262f] text-white px-12 py-1 text-sm font-semibold shadow-lg">
              Fully Funded
            </div>
          </div>
        )}

        {/* Owner's Cashout Button - Only visible to owner when fully funded */}
        {isOwner && amount - 700 <= 0 && (
          <div className="absolute top-4 left-4 z-10">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 bg-[#00262f] text-white rounded-full font-medium shadow-lg hover:shadow-xl hover:bg-[#003a47] transition-all"
            >
              <span className="relative flex h-3 w-3 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
              Cashout Available
            </motion.button>
          </div>
        )}
        
        <div className="p-6">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-4">
            <Link 
              href={`/c/${communityName}`} 
              className="group flex items-center gap-2 px-3 py-1.5 bg-primary/5 hover:bg-primary/10 rounded-full transition-colors"
            >
              <Users className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-primary">
                c/{communityName.replace(/_/g, ' ')}
              </span>
            </Link>
            <div className="flex items-center gap-2 text-xs font-medium">
              <div className="px-3 py-1.5 bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 rounded-full flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1.5" />
                <Counter 
                  deadline={new Date(deadline)} 
                  createdAt={new Date(createdAt)} 
                />
              </div>
            </div>
          </div>
          
          {/* Title and User Info */}
          <Link href={`/request/${id}`} className="block group">
            <h2 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
              {title}
            </h2>
          </Link>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <ClientAvatar className="w-12 h-12 rounded-full ring-2 ring-primary/10" />
              <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary shadow-lg flex items-center justify-center transform hover:scale-110 transition-transform">
                <div className="absolute inset-0.5 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
                  <span className="text-xs font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">
                    L{level}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Link href={`/user/${userId}`} className="text-sm font-semibold hover:text-primary transition-colors flex items-center gap-1.5">
                  {userName}
                  <BadgeCheck className="w-4 h-4 text-primary" />
                </Link>
                <div className="px-2 py-0.5 rounded-md bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/5">
                  <span className="text-xs font-medium text-primary">Level {level}</span>
                </div>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Joined {new Date(createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Contribution Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 mb-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Contributed Amount */}
              <div className="space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary/80" />
                  Contributed
                </p>
                <p className="text-2xl font-bold text-primary">
                  KES 700
                  <span className="text-sm font-normal opacity-70 ml-1">/=</span>
                </p>
              </div>
              
              {/* Goal Amount */}
              <div className="space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-secondary/80" />
                  Goal
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  KES {amount.toLocaleString()}
                  <span className="text-sm font-normal text-gray-500 ml-1">/=</span>
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2 mb-4">
              <div className="relative mb-4">
                <Slider contributed={700} total={amount} />
                <div className="absolute -top-1 left-0 w-full h-8 bg-gradient-to-t from-transparent to-white/20 dark:to-black/20 pointer-events-none" />
              </div>
              <div className="flex justify-between items-center">
                <div className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                  {((700 / amount) * 100).toFixed(1)}% funded
                </div>
                {amount - 700 > 0 ? (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 dark:bg-orange-500/10 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500/80" />
                    <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                      KES {(amount - 700).toLocaleString()}/= remaining
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-500/10 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500/80" />
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                      KES {Math.abs(amount - 700).toLocaleString()}/= excessive
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-between items-center text-sm border-t border-gray-100 dark:border-gray-700 pt-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-full">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  12 contributors
                </span>
              </div>
              <span className="text-xs text-gray-500">
                Deadline: {new Date(deadline).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Content Section */}
          {imageString && (
            <div className="mb-6 rounded-xl overflow-hidden">
              <Image
                src={imageString}
                alt="Request image"
                width={100}
                height={50}
                layout="responsive"
                className="hover:scale-105 transition-transform duration-500"
              />
            </div>
          )}
          
          {jsonContent && <RenderToJson data={jsonContent} />}
          
          {/* Action Buttons */}
          <div className="flex justify-between items-center mb-4">
            {/* Left side - Vote buttons */}
            <div className="flex items-center">
              <VoteButtons
                initialVoteCount1={voteCount1}
                initialVoteCount2={voteCount2}
                requestId={id}
              />
            </div>

            {/* Right side - Action buttons */}
            <div className="flex items-center gap-2">
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
                    className="flex items-center gap-1.5 px-4 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <MessageCircleIcon className="w-4 h-4 text-gray-600 dark:text-gray-300 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {commentCount}
                    </span>
                  </Button>
                  <motion.span
                    initial={{ opacity: 0, y: 20 }}
                    whileHover={{ opacity: 1, y: 25 }}
                    className="absolute left-1/2 -translate-x-1/2 text-xs text-gray-500 whitespace-nowrap pointer-events-none"
                  >
                    Comments
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
                  className="px-4 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <BookmarkIcon className="w-4 h-4 text-gray-600 dark:text-gray-300 group-hover:text-primary group-hover:scale-110 transition-all" />
                </Button>
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  whileHover={{ opacity: 1, y: 25 }}
                  className="absolute left-1/2 -translate-x-1/2 text-xs text-gray-500 whitespace-nowrap pointer-events-none"
                >
                  Save
                </motion.span>
              </motion.div>

              <CopyLink 
                id={id} 
                className="px-4 rounded-full"
              />
            </div>
          </div>

          {pointsUsed && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Points used: {pointsUsed}
            </div>
          )}
        </div>
      </div>

      {/* Help Now Button and Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button 
            variant="default" 
            className={`w-full font-semibold py-4 rounded-none transition-all group relative overflow-hidden
              ${amount - 700 <= 0 
                ? 'bg-[#00262f] hover:bg-[#003a47]'
                : 'bg-gradient-to-r from-primary to-secondary hover:opacity-90'
              } text-white`}
            disabled={amount - 700 <= 0}
          >
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <span className="relative flex items-center gap-2 justify-center">
              {amount - 700 <= 0 ? (
                <>
                  <span className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    Goal Achieved!
                  </span>
                  <span className="text-xs opacity-80 group-hover:opacity-100 transition-opacity">
                    • Request Completed
                  </span>
                </>
              ) : (
                <>
                  Support {userName.split(' ')[0]} 
                  <span className="text-xs opacity-80 group-hover:opacity-100 transition-opacity">
                    • Every Shilling Counts
                  </span>
                </>
              )}
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
