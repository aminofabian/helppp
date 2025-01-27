'use client'

import { CalendarDays, Mail, User2, Gift, HandHeart, HelpCircle } from 'lucide-react'
import Image from 'next/image'
import { motion } from 'framer-motion'

interface ProfileHeaderProps {
  userName: string
  firstName: string
  lastName: string
  email: string
  imageUrl: string
  points: any[]
}

export default function ProfileHeader({
  userName,
  firstName,
  lastName,
  email,
  imageUrl,
  points
}: ProfileHeaderProps) {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        {/* Cover Image */}
        <div className="h-32 bg-gradient-to-r from-emerald-400 to-blue-500"></div>
        
        {/* Profile Content */}
        <div className="p-6">
          {/* Avatar and Basic Info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
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
                <div className="absolute bottom-0 right-0 bg-emerald-500 rounded-full p-2 border-2 border-white dark:border-gray-700">
                  <Gift className="w-4 h-4 text-white" />
                </div>
              </div>
            </motion.div>

            {/* User Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {firstName} {lastName}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mb-4">@{userName}</p>
              
              {/* Stats Row */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-6 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Requests</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">190</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <HandHeart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Donations</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">200</p>
                  </div>
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
                  <span>Joined December 2023</span>
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