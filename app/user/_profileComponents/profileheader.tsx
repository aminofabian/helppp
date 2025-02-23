import React from 'react'
import { Mail, Calendar, Trophy, Star, Wallet, HandHeart, HelpCircle } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import Image from 'next/image'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface PHProps {
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  imageUrl: string;
  level: number;
  totalDonated: number;
  donationCount: number;
  requestCount: number;
  walletBalance: number;
  createdAt: Date;
  points: { id: string; userId: string; amount: number; paymentId: string; createdAt: Date; }[];
}

export default function ProfileHeader({userName, firstName, lastName, email, points, imageUrl, level, totalDonated, donationCount, requestCount, walletBalance, createdAt}: PHProps) {
  const totalPoints = points.reduce((sum, point) => sum + point.amount, 0);
  const nextLevel = (level + 1) * 1000;
  const progress = (totalPoints / nextLevel) * 100;
  
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  
  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      {/* Header Banner */}
      <div className="h-32 bg-gradient-to-r from-primary to-primary/60 relative">
        <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-gray-800/90 px-3 py-1.5 rounded-full shadow flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Level {level}</span>
        </div>
      </div>

      <div className="p-6">
        {/* Profile Section */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="relative -mt-16 sm:-mt-20">
            <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-white dark:border-gray-700 shadow-lg">
              <AvatarImage src={imageUrl} alt={`${firstName} ${lastName}`} />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-primary to-primary/60 rounded-full p-2 shadow-lg">
              <Star className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{firstName} {lastName}</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">@{userName}</p>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Progress to Level {level + 1}</span>
                <span className="font-medium">{totalPoints} / {nextLevel} XP</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
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
                  <Trophy className="w-4 h-4 text-amber-500" />
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
                <Calendar className="w-4 h-4" />
                <span>Joined {new Date(createdAt).toLocaleDateString('en-US', { 
                  month: 'long',
                  year: 'numeric'
                })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}