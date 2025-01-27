import React from 'react'
import ProfileHeader from '../_profileComponents/profileheader'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { notFound, redirect } from 'next/navigation';
import prisma from '@/app/lib/db';
import HomeNavRight from '@/app/_components/HomeNavRight';
import { Verified, Heart, HandHeart, Trophy, Activity, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

async function getData(id: string) {
  const data = await prisma.user.findUnique({
    where: {
      id: id
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      userName: true,
      imageUrl: true,
      points: true,
      donations: {
        select: {
          id: true,
          amount: true,
          Request: {
            select: {
              id: true,
              User: {
                select:{
                  id: true,
                  userName: true, 
                }
              }
            }
          }
        }
      }
    }
  })
  if(!data) {
    return notFound();
  }
  return data;
}

export default async function UserProfile({ params }: { params: { id: string } }) {
  const data = await getData(params.id);
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  
  if (!user) {
    return redirect('/api/auth/login');
  }
  
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 lg:gap-8 my-5">
      {/* Left Sidebar */}
      <div className="h-fit rounded-lg bg-gray-100 dark:bg-gray-800 p-4">
        <HomeNavRight />
      </div>

      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Profile Header */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6">
          <ProfileHeader
            userName={data?.userName || ''}
            firstName={data?.firstName || ''}
            lastName={data?.lastName || ''}
            email={data?.email || ''}
            imageUrl={data?.imageUrl || ''}
            points={data?.points || []}
          />
          
          {/* Bio Section */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-300">
              I'm passionate about helping others and making a positive impact in my community. Every small contribution counts towards making someone's life better.
            </p>
            <div className="flex items-center gap-2 mt-4 text-sm text-gray-500 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>Joined December 2023</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Recent Activity</h3>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3 pb-4 border-b dark:border-gray-700">
              <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-full">
                <HandHeart className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-gray-800 dark:text-gray-200">Donated to <span className="font-medium">Medical Support Fund</span></p>
                <p className="text-xs text-gray-500 dark:text-gray-400">2 days ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                <Heart className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-800 dark:text-gray-200">Received help for <span className="font-medium">Education Support</span></p>
                <p className="text-xs text-gray-500 dark:text-gray-400">1 week ago</p>
              </div>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Achievements</h3>
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <HandHeart className="w-5 h-5 text-amber-500" />
                <h4 className="font-medium text-gray-800 dark:text-gray-200">Generous Soul</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Made 5+ donations</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-purple-500" />
                <h4 className="font-medium text-gray-800 dark:text-gray-200">Rising Star</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Reached Level 3</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Stats */}
      <div className="h-fit rounded-lg bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center w-full gap-y-4 order-2 md:order-last p-6">
        {/* Trust Score Section */}
        <div className="bg-white dark:bg-gray-700 rounded-xl shadow-lg p-4 w-full">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Trust Score</h3>
            <div className="flex items-center gap-2">
              <Verified className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-500">Verified Helper</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-500 text-white rounded-full h-8 w-8 flex items-center justify-center font-semibold">
                3
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-300">Helper Level</span>
            </div>
            <Button variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
              2000 Points
            </Button>
          </div>
        </div>

        {/* Help Stats Section */}
        <div className="bg-white dark:bg-gray-700 rounded-xl shadow-lg p-4 w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Help Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-600 rounded-lg p-3">
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Donated</p>
              <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">KES 2,000/=</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-600 rounded-lg p-3">
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Requested</p>
              <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">KES 3,000/=</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-600 rounded-lg p-3">
              <p className="text-sm text-gray-600 dark:text-gray-300">Requests Made</p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">20</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">requests</span>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-600 rounded-lg p-3">
              <p className="text-sm text-gray-600 dark:text-gray-300">Donations Made</p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">15</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">donations</span>
              </div>
            </div>
          </div>
        </div>

        {/* Impact Summary */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-4 w-full text-white">
          <h3 className="text-lg font-semibold mb-2">Your Impact</h3>
          <p className="text-sm opacity-90">You've helped 15 people in their time of need. Keep making a difference!</p>
        </div>
      </div>
    </div>
  )
}
