'use client'

import { CalendarDays, Mail, Wallet, Gift, HandHeart, HelpCircle, Heart, Star, Trophy, TrendingUp, Verified } from 'lucide-react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Progress } from '@/components/ui/progress'
import React from 'react'

export interface ProfileHeaderProps {
  userName: string
  firstName: string
  lastName: string
  email: string
  imageUrl: string
  level: number
  totalDonated: number
  donationCount: number
  requestCount: number
  walletBalance: number
  createdAt: Date
  points: {
    id: string
    userId: string
    amount: number
    paymentId: string
    createdAt: Date
  }[]
}

function ProfileHeader({
  userName,
  firstName,
  lastName,
  email,
  imageUrl,
  level,
  totalDonated,
  donationCount,
  requestCount,
  walletBalance,
  createdAt,
  points
}: ProfileHeaderProps) {
  const totalPoints = points.reduce((acc, point) => acc + point.amount, 0);
  const nextLevel = (level + 1) * 1000;
  const progress = (totalPoints / nextLevel) * 100;

  const getLevelTitle = (level: number) => {
    if (level <= 2) return "Beginner Helper"
    if (level <= 5) return "Regular Helper"
    if (level <= 8) return "Advanced Helper"
    return "Elite Helper"
  }

  const getVerificationBadge = (level: number, donationCount: number) => {
    if (level >= 5 && donationCount >= 20) return "Verified Helper"
    if (level >= 3 && donationCount >= 10) return "Active Helper"
    return "New Helper"
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        {/* Cover Image with Level Banner */}
        <div className="h-32 bg-gradient-to-r from-emerald-400 to-blue-500 relative">
          <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-white/90 dark:bg-gray-800/90 px-4 py-2 rounded-full shadow-lg">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span className="font-semibold">{getLevelTitle(level)}</span>
          </div>
        </div>
        
        {/* Profile Content */}
        <div className="p-6">
          {/* Avatar and Basic Info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar with Level Badge */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative -mt-16 sm:-mt-20"
            >
              <div className="relative h-24 w-24 sm:h-32 sm:w-32">
                <Image
                  src={imageUrl || '/default-avatar.png'}
                  alt="Profile"
                  width={128}
                  height={128}
                  className="rounded-full border-4 border-white dark:border-gray-700 shadow-lg object-cover"
                />
                <div className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg">
                  <div className="bg-emerald-500 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold">
                    {level}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* User Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {firstName} {lastName}
                </h1>
                <Verified className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-4">
                <p className="text-gray-500 dark:text-gray-400">@{userName}</p>
                <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs rounded-full">
                  {getVerificationBadge(level, donationCount)}
                </span>
              </div>
              
              {/* Level Progress */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Progress to Level {level + 1}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{totalPoints} / {nextLevel} XP</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <HandHeart className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Given</span>
                  </div>
                  <p className="text-lg font-semibold text-emerald-600">KES {totalDonated.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <HelpCircle className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Helped</span>
                  </div>
                  <p className="text-lg font-semibold text-blue-600">{donationCount} people</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet className="w-4 h-4 text-purple-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Balance</span>
                  </div>
                  <p className="text-lg font-semibold text-purple-600">KES {walletBalance.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Requests</span>
                  </div>
                  <p className="text-lg font-semibold text-amber-600">{requestCount}</p>
                </div>
              </div>

              {/* Contact & Join Date */}
              <div className="flex flex-col sm:flex-row gap-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" />
                  <span>Member since {new Date(createdAt).toLocaleDateString('en-US', { 
                    month: 'long',
                    year: 'numeric'
                  })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">About Me</h2>
            <p className="text-gray-600 dark:text-gray-400">
              I'm passionate about helping others and making a positive impact in my community. Every small contribution counts towards making someone's life better.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileHeader 