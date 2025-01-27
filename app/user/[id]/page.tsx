import React from 'react'
import ProfileHeader from '../_profileComponents/profileheader'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { notFound, redirect } from 'next/navigation';
import prisma from '@/app/lib/db';
import HomeNavRight from '@/app/_components/HomeNavRight';
import { Verified, Heart, HandHeart, Trophy, Activity, Calendar, HelpCircle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";

type RequestFromDB = {
  id: string;
  title: string;
  textContent: any;
  amount: number;
  status: string | null;
  createdAt: Date;
  donations: {
    amount: number;
  }[];
}

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
      points: {
        select: {
          id: true,
          userId: true,
          amount: true,
          paymentId: true,
          createdAt: true
        }
      },
      level: true,
      createdAt: true,
      totalDonated: true,
      donationCount: true,
      requests: {
        select: {
          id: true,
          title: true,
          textContent: true,
          amount: true,
          status: true,
          createdAt: true,
          donations: {
            select: {
              amount: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      },
      donations: {
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true
        }
      },
      wallet: {
        select: {
          balance: true
        }
      },
      love: {
        select: {
          id: true,
          voteType: true
        }
      }
    }
  });
  
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

  // Calculate total amount requested
  const totalRequested = data.requests.reduce((acc: number, req: RequestFromDB) => acc + req.amount, 0);
  
  // Get status color based on request status
  const getStatusColor = (status: string | null) => {
    switch ((status || 'pending').toLowerCase()) {
      case 'pending':
        return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/20';
      case 'completed':
        return 'text-green-500 bg-green-100 dark:bg-green-900/20';
      case 'rejected':
        return 'text-red-500 bg-red-100 dark:bg-red-900/20';
      default:
        return 'text-gray-500 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  // Calculate total amount donated for a request
  const getTotalDonated = (request: RequestFromDB) => {
    return request.donations.reduce((acc: number, donation) => acc + donation.amount, 0);
  };
  
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 lg:gap-8 my-5">
      {/* Left Sidebar - Navigation */}
      <div className="h-fit rounded-lg bg-gray-100 dark:bg-gray-800 p-4">
        <HomeNavRight />
      </div>

      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Profile Header */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6">
          <ProfileHeader
            userName={data.userName}
            firstName={data.firstName}
            lastName={data.lastName}
            email={data.email}
            imageUrl={data.imageUrl || ''}
            points={data.points}
            totalDonated={data.totalDonated}
            donationCount={data.donationCount}
            requestCount={data.requests.length}
            walletBalance={data.wallet?.balance || 0}
            createdAt={data.createdAt}
            level={data.level}
          />
        </div>

        {/* Help Requests Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Help Requests</h3>
            <HelpCircle className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Title & Description</TableHead>
                  <TableHead>Target Amount</TableHead>
                  <TableHead>Donated</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.requests.slice(0, 5).map((request: RequestFromDB, index: number) => {
                  const amountDonated = getTotalDonated(request);
                  return (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="font-medium text-sm">{request.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {typeof request.textContent === 'object' && request.textContent?.content?.[0]?.content?.[0]?.text || 'No description provided'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </TableCell>
                      <TableCell>KES {request.amount.toLocaleString()}</TableCell>
                      <TableCell>KES {amountDonated.toLocaleString()}</TableCell>
                      <TableCell className="w-[100px]">
                        <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500" 
                            style={{ 
                              width: `${Math.min((amountDonated / request.amount) * 100, 100)}%` 
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {Math.round((amountDonated / request.amount) * 100)}%
                        </p>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {request.status || 'Pending'}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          {data.requests.length > 5 && (
            <div className="mt-4 flex justify-end">
              <Button variant="outline" size="sm">
                View All Requests
              </Button>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Help Activity</h3>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {data.donations.slice(0, 3).map((donation) => (
              <div key={donation.id} className="flex items-start gap-3 pb-4 border-b dark:border-gray-700">
                <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-full">
                  <HandHeart className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    Donated <span className="font-medium">KES {donation.amount}</span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(donation.createdAt).toLocaleDateString('en-US', { 
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Helper Milestones</h3>
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <HandHeart className="w-5 h-5 text-emerald-500" />
                <h4 className="font-medium text-gray-800 dark:text-gray-200">Generous Helper</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Made {data.donationCount} donations</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="w-5 h-5 text-blue-500" />
                <h4 className="font-medium text-gray-800 dark:text-gray-200">Community Support</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Helped {data.requests.length} requests</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Stats */}
      <div className="h-fit rounded-lg bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center w-full gap-y-4 order-2 md:order-last p-6">
        {/* Trust Level */}
        <div className="bg-white dark:bg-gray-700 rounded-xl shadow-lg p-4 w-full">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Trust Level</h3>
            <div className="flex items-center gap-2">
              <Verified className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-500">Active Helper</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-500 text-white rounded-full h-8 w-8 flex items-center justify-center font-semibold">
                {data.level}
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-300">Current Level</span>
            </div>
            <Button variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
              {data.points.reduce((acc, point) => acc + point.amount, 0)} Points
            </Button>
          </div>
        </div>

        {/* Help Impact */}
        <div className="bg-white dark:bg-gray-700 rounded-xl shadow-lg p-4 w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Help Impact</h3>
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <HandHeart className="w-4 h-4 text-emerald-500" />
                <p className="text-sm text-gray-600 dark:text-gray-300">Total Donated</p>
              </div>
              <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">KES {data.totalDonated.toLocaleString()}/=</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <HelpCircle className="w-4 h-4 text-blue-500" />
                <p className="text-sm text-gray-600 dark:text-gray-300">Total Requested</p>
              </div>
              <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">KES {totalRequested.toLocaleString()}/=</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <p className="text-sm text-gray-600 dark:text-gray-300">Success Rate</p>
              </div>
              <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                {Math.round((data.donationCount / (data.requests.length || 1)) * 100)}%
              </p>
            </div>
          </div>
        </div>

        {/* Impact Summary */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-4 w-full text-white">
          <h3 className="text-lg font-semibold mb-2">Community Impact</h3>
          <p className="text-sm opacity-90">
            You've helped {data.donationCount} people in their time of need. Your generosity has made a real difference in the community!
          </p>
        </div>
      </div>
    </div>
  )
}
