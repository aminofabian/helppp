import React from 'react'
import ProfileHeader from '../_profileComponents/profileheader'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { notFound, redirect, useSearchParams } from 'next/navigation';
import prisma from '@/app/lib/db';
import HomeNavRightWrapper from '@/app/_components/HomeNavRightWrapper';
import { Verified, Heart, HandHeart, Trophy, Activity, Calendar, HelpCircle, TrendingUp, Users, Medal, History, Wallet, Pencil, Flame, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { cn } from '@/lib/utils'

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
        },
        orderBy: {
          createdAt: 'desc'
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
              amount: true,
              createdAt: true,
              User: {
                select: {
                  userName: true,
                  imageUrl: true
                }
              }
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
          createdAt: true,
          Request: {
            select: {
              title: true,
              User: {
                select: {
                  userName: true,
                  imageUrl: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
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
      },
      memberships: {
        select: {
          community: {
            select: {
              id: true,
              name: true,
              description: true,
              _count: {
                select: {
                  memberships: true
                }
              }
            }
          },
          totalDonated: true
        }
      }
    }
  });
  
  if(!data) {
    return notFound();
  }
  
  return data;
}

// Helper function to calculate donation streak
function calculateDonationStreak(donations: any[]) {
  if (!donations.length) return 0;
  
  const today = new Date();
  const sortedDonations = donations.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  let streak = 0;
  let currentDate = new Date(sortedDonations[0].createdAt);
  
  // If the most recent donation is more than 2 days old, streak is broken
  if ((today.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24) > 2) {
    return 0;
  }
  
  for (let i = 0; i < sortedDonations.length - 1; i++) {
    const current = new Date(sortedDonations[i].createdAt);
    const next = new Date(sortedDonations[i + 1].createdAt);
    const diffDays = (current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24);
    
    if (diffDays <= 2) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak + 1;
}

// Helper function to calculate monthly stats
function calculateMonthlyStats(donations: any[]) {
  const monthlyDonations = donations.reduce((acc: any, donation) => {
    const date = new Date(donation.createdAt);
    const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
    if (!acc[monthYear]) {
      acc[monthYear] = { total: 0, count: 0 };
    }
    acc[monthYear].total += donation.amount;
    acc[monthYear].count += 1;
    return acc;
  }, {});

  return Object.entries(monthlyDonations)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, stats]: [string, any]) => ({
      month: new Date(month).toLocaleDateString('en-US', { month: 'short' }),
      total: stats.total,
      count: stats.count
    }));
}

// Helper function to calculate donation patterns
function calculateDonationPatterns(donations: any[]) {
  const patterns = {
    timeOfDay: {
      morning: 0,   // 6-12
      afternoon: 0, // 12-18
      evening: 0,   // 18-24
      night: 0      // 0-6
    },
    dayOfWeek: {
      Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0,
      Thursday: 0, Friday: 0, Saturday: 0
    },
    averageResponse: 0,
    completionRate: 0,
    categories: new Map()
  };

  donations.forEach(donation => {
    const date = new Date(donation.createdAt);
    const hour = date.getHours();
    const day = date.toLocaleDateString('en-US', { weekday: 'long' });

    // Time of day
    if (hour >= 6 && hour < 12) patterns.timeOfDay.morning++;
    else if (hour >= 12 && hour < 18) patterns.timeOfDay.afternoon++;
    else if (hour >= 18 && hour < 24) patterns.timeOfDay.evening++;
    else patterns.timeOfDay.night++;

    // Day of week
    patterns.dayOfWeek[day as keyof typeof patterns.dayOfWeek]++;

    // Track request categories if available
    if (donation.Request?.category) {
      const count = patterns.categories.get(donation.Request.category) || 0;
      patterns.categories.set(donation.Request.category, count + 1);
    }
  });

  // Calculate completion rate
  const completedDonations = donations.filter(d => d.status === 'completed').length;
  patterns.completionRate = (completedDonations / donations.length) * 100;

  return patterns;
}

export default async function UserProfile({ params, searchParams }: { 
  params: { id: string },
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const data = await getData(params.id);
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  
  if (!user) {
    return redirect('/api/auth/login');
  }

  // Get the user's level from the database
  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { level: true }
  });

  // Restrict access to level 5 and above
  if (!currentUser || currentUser.level < 5) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-4">
        <div className="bg-primary/10 p-3 rounded-full">
          <Users className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-center">Level 5 Required</h1>
        <p className="text-muted-foreground text-center max-w-md">
          This feature is only available to level 5 members and above. Continue helping others to level up and unlock this feature.
        </p>
        <Button asChild className="mt-4">
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    );
  }

  // Check if this profile belongs to the current user
  const isOwnProfile = user.id === params.id;

  // Calculate total amount requested
  const totalRequested = data.requests.reduce((acc: number, req: RequestFromDB) => acc + req.amount, 0);
  
  // Get status color based on request status
  const getStatusColor = (status: string | null) => {
    switch ((status || 'pending').toLowerCase()) {
      case 'pending':
        return 'text-primary/70 bg-primary/10 dark:bg-primary/20';
      case 'completed':
        return 'text-primary bg-primary/10 dark:bg-primary/20';
      case 'rejected':
        return 'text-destructive bg-destructive/10 dark:bg-destructive/20';
      default:
        return 'text-gray-500 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  // Calculate total amount donated for a request
  const getTotalDonated = (request: RequestFromDB) => {
    return request.donations.reduce((acc: number, donation) => acc + donation.amount, 0);
  };
  
  // Calculate achievements
  const achievements = [
    {
      title: "Early Adopter",
      description: "Joined in the early days",
      icon: <Medal className="w-5 h-5 text-primary" />,
      earned: new Date(data.createdAt).getFullYear() <= 2024
    },
    {
      title: "Generous Soul",
      description: "Donated over KES 10,000",
      icon: <HandHeart className="w-5 h-5 text-primary" />,
      earned: data.totalDonated >= 10000
    },
    {
      title: "Community Pillar",
      description: "Member of 5+ communities",
      icon: <Users className="w-5 h-5 text-primary" />,
      earned: data.memberships.length >= 5
    },
    {
      title: "Helper Extraordinaire",
      description: "Helped 10+ people",
      icon: <Heart className="w-5 h-5 text-primary" />,
      earned: data.donationCount >= 10
    }
  ];
  
  // Calculate donation streak and stats
  const donationStreak = calculateDonationStreak(data.donations);
  const monthlyStats = calculateMonthlyStats(data.donations);
  const averageDonation = data.totalDonated / (data.donationCount || 1);
  const donationGrowth = monthlyStats.length > 1 
    ? ((monthlyStats[monthlyStats.length - 1].total - monthlyStats[0].total) / monthlyStats[0].total) * 100 
    : 0;

  // Calculate donation patterns
  const donationPatterns = calculateDonationPatterns(data.donations);

  // Pagination logic
  const itemsPerPage = 20;
  const currentPage = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1;
  const totalPages = Math.ceil(data.donations.length / itemsPerPage);
  
  // Get paginated donations
  const getPaginatedDonations = () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return data.donations.slice(start, end);
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 lg:gap-8 my-5">
      {/* Left Sidebar - Navigation */}
      <div className="h-fit rounded-lg bg-gray-100 dark:bg-gray-800 p-4">
        <HomeNavRightWrapper />
      </div>

      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Profile Header */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6">
          <div className="flex justify-between items-start mb-4">
            {isOwnProfile && (
              <Button
                variant="outline"
                size="sm"
                className="text-primary hover:text-primary/80 hover:bg-primary/10 border-primary/20"
                asChild
              >
                <Link href="/settings">
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Username
                </Link>
              </Button>
            )}
          </div>
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

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Donation Streak */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Flame className="h-4 w-4 text-primary" />
                Donation Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{donationStreak} days</div>
              <p className="text-xs text-muted-foreground mt-1">Keep the momentum going!</p>
            </CardContent>
          </Card>

          {/* Average Donation */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Average Donation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">KES {Math.round(averageDonation).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Per donation</p>
            </CardContent>
          </Card>

          {/* Monthly Growth */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-primary" />
                Monthly Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{donationGrowth > 0 ? '+' : ''}{Math.round(donationGrowth)}%</div>
              <p className="text-xs text-muted-foreground mt-1">Over last 6 months</p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Time Distribution */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Donation Time Patterns</h4>
            <div className="space-y-1">
              {Object.entries(donationPatterns.timeOfDay).map(([time, count]) => (
                <div key={time} className="flex items-center gap-2">
                  <div className="w-24 text-sm">{time.charAt(0).toUpperCase() + time.slice(1)}</div>
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary"
                      style={{ 
                        width: `${(count / data.donations.length) * 100}%` 
                      }}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground w-12 text-right">
                    {Math.round((count / data.donations.length) * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Distribution */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Weekly Activity</h4>
            <div className="space-y-1">
              {Object.entries(donationPatterns.dayOfWeek).map(([day, count]) => (
                <div key={day} className="flex items-center gap-2">
                  <div className="w-24 text-sm">{day.slice(0, 3)}</div>
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary"
                      style={{ 
                        width: `${(count / data.donations.length) * 100}%` 
                      }}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground w-12 text-right">
                    {Math.round((count / data.donations.length) * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Completion Rate</h4>
              <div className="flex items-center gap-4">
                <div className="h-8 flex-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary"
                    style={{ width: `${donationPatterns.completionRate}%` }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {Math.round(donationPatterns.completionRate)}%
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-2">Most Active Times</h4>
              <div className="space-y-1 text-sm">
                {Object.entries(donationPatterns.timeOfDay)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 2)
                  .map(([time, count]) => (
                    <div key={time} className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {time.charAt(0).toUpperCase() + time.slice(1)}
                      </span>
                      <span className="font-medium">
                        {Math.round((count / data.donations.length) * 100)}% of donations
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Donation Chart with Enhanced Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Donation Analytics
            </CardTitle>
            <CardDescription>Detailed monthly donation trends and patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Existing chart */}
              <div className="h-[200px] w-full">
                <div className="flex items-end justify-between h-full gap-2">
                  {monthlyStats.map((stat, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div 
                        className="w-full bg-primary/20 rounded-t"
                        style={{ 
                          height: `${(stat.total / Math.max(...monthlyStats.map(s => s.total))) * 150}px`,
                        }}
                      />
                      <span className="text-xs text-muted-foreground">{stat.month}</span>
                      <span className="text-xs font-medium">KES {(stat.total / 1000).toFixed(1)}k</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Analytics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Monthly Growth</h4>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">
                      {donationGrowth > 0 ? '+' : ''}{Math.round(donationGrowth)}%
                    </span>
                    <span className="text-sm text-muted-foreground">vs last month</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Average Per Month</h4>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">
                      KES {Math.round(data.totalDonated / monthlyStats.length).toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">per month</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Best Month</h4>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">
                      KES {Math.max(...monthlyStats.map(s => s.total)).toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">highest</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different sections */}
        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="requests" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Requests</TabsTrigger>
            <TabsTrigger value="donations" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Donations</TabsTrigger>
            <TabsTrigger value="points" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Points</TabsTrigger>
            <TabsTrigger value="communities" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Communities</TabsTrigger>
          </TabsList>

          {/* Help Requests Tab */}
          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle>Help Requests</CardTitle>
                <CardDescription>View all help requests created by {data.firstName}</CardDescription>
              </CardHeader>
              <CardContent>
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
                      {data.requests.map((request: RequestFromDB, index: number) => {
                        const amountDonated = getTotalDonated(request);
                        return (
                          <TableRow key={request.id}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell className="max-w-[200px]">
                              <Link href={`/request/${request.id}`} className="hover:text-primary">
                                <p className="font-medium text-sm">{request.title}</p>
                                <p className="truncate text-xs text-muted-foreground">
                                  {typeof request.textContent === 'object' && request.textContent?.content?.[0]?.content?.[0]?.text || 'No description provided'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(request.createdAt).toLocaleDateString()}
                                </p>
                              </Link>
                            </TableCell>
                            <TableCell>KES {request.amount.toLocaleString()}</TableCell>
                            <TableCell>KES {amountDonated.toLocaleString()}</TableCell>
                            <TableCell className="w-[100px]">
                              <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary" 
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Donations Tab */}
          <TabsContent value="donations">
            <Card>
              <CardHeader>
                <CardTitle>Donation History</CardTitle>
                <CardDescription>
                  Showing {getPaginatedDonations().length} of {data.donations.length} donations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getPaginatedDonations().map((donation, index) => (
                    <div key={donation.id} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <div className="flex items-center gap-4 w-full">
                        <div className="bg-primary/10 px-2 py-1 rounded-md min-w-[3rem] text-center">
                          <span className="text-sm font-medium text-primary">
                            #{(currentPage - 1) * itemsPerPage + index + 1}
                          </span>
                        </div>
                        <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-full">
                          <HandHeart className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div className="flex-grow">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">
                                Donated to {donation.Request?.User?.userName || 'unknown user'}'s request
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {donation.Request?.title}
                              </p>
                            </div>
                            <p className="font-semibold text-emerald-600">
                              KES {donation.amount.toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(donation.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(donation.status)}`}>
                              {donation.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-6">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <Link 
                            href={{ query: { ...searchParams, page: Math.max(1, currentPage - 1) } }}
                            className={cn(currentPage === 1 && "pointer-events-none opacity-50")}
                          >
                            <PaginationPrevious />
                          </Link>
                        </PaginationItem>
                        
                        {[...Array(totalPages)].map((_, i) => {
                          const page = i + 1;
                          // Show first page, last page, and pages around current page
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 2 && page <= currentPage + 2)
                          ) {
                            return (
                              <PaginationItem key={page}>
                                <Link 
                                  href={{ query: { ...searchParams, page } }}
                                  className={cn(
                                    "h-9 w-9 flex items-center justify-center rounded-md",
                                    currentPage === page && "bg-primary/10 text-primary font-medium"
                                  )}
                                >
                                  {page}
                                </Link>
                              </PaginationItem>
                            );
                          }
                          // Show ellipsis for gaps
                          if (
                            page === currentPage - 3 ||
                            page === currentPage + 3
                          ) {
                            return <PaginationEllipsis key={page} />;
                          }
                          return null;
                        })}

                        <PaginationItem>
                          <Link 
                            href={{ query: { ...searchParams, page: Math.min(totalPages, currentPage + 1) } }}
                            className={cn(currentPage === totalPages && "pointer-events-none opacity-50")}
                          >
                            <PaginationNext />
                          </Link>
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Points History Tab */}
          <TabsContent value="points">
            <Card>
              <CardHeader>
                <CardTitle>Points History</CardTitle>
                <CardDescription>Track your points and level progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.points.map((point) => (
                    <div key={point.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full">
                        <Trophy className="w-5 h-5 text-purple-500" />
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-center">
                          <p className="font-medium">Earned Points</p>
                          <p className="font-semibold text-purple-600">
                            +{point.amount} XP
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(point.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Communities Tab */}
          <TabsContent value="communities">
            <Card>
              <CardHeader>
                <CardTitle>Communities</CardTitle>
                <CardDescription>Communities {data.firstName} is a member of</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {data.memberships.map((membership) => (
                    <Link 
                      key={membership.community.id}
                      href={`/c/${membership.community.name}`}
                      className="block group"
                    >
                      <div className="p-4 rounded-lg border bg-card hover:bg-accent transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-semibold">
                            {membership.community.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-grow">
                            <h4 className="font-semibold group-hover:text-primary transition-colors">
                              {membership.community.name.replace(/_/g, ' ')}
                            </h4>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {membership.community.description || 'No description available'}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                <span>{membership.community._count.memberships}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <HandHeart className="w-4 h-4" />
                                <span>KES {membership.totalDonated.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Right Sidebar */}
      <div className="lg:col-span-1 space-y-6">
        {/* Achievements Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {achievements.map((achievement, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    achievement.earned
                      ? 'bg-primary/10'
                      : 'bg-gray-100 dark:bg-gray-800 opacity-50'
                  }`}
                >
                  <div className="shrink-0">{achievement.icon}</div>
                  <div>
                    <p className="font-medium">{achievement.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {achievement.description}
                    </p>
                  </div>
                  {achievement.earned && (
                    <Verified className="w-5 h-5 text-primary ml-auto" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...data.donations, ...data.requests]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5)
                .map((activity) => {
                  const isDonation = 'status' in activity;
                  const amount = isDonation ? (activity as typeof data.donations[0]).amount : (activity as typeof data.requests[0]).amount;
                  return (
                    <div key={activity.id} className="flex items-start gap-3 pb-4 border-b dark:border-gray-700 last:border-0">
                      <div className={`p-2 rounded-full ${
                        isDonation 
                          ? 'bg-emerald-100 dark:bg-emerald-900/30' 
                          : 'bg-blue-100 dark:bg-blue-900/30'
                      }`}>
                        {isDonation ? (
                          <HandHeart className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <HelpCircle className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm">
                          {isDonation 
                            ? `Donated KES ${amount.toLocaleString()}`
                            : `Created request for KES ${amount.toLocaleString()}`
                          }
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.createdAt).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Donation Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Donation Summary</CardTitle>
            <CardDescription>Summary of donations and contributions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <HandHeart className="w-4 h-4 text-primary" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Given</span>
                </div>
                <p className="text-lg font-semibold text-primary">KES {data.totalDonated.toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <HelpCircle className="w-4 h-4 text-primary" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Helped</span>
                </div>
                <p className="text-lg font-semibold text-primary">{data.donationCount} people</p>
              </div>
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="w-4 h-4 text-primary" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Balance</span>
                </div>
                <p className="text-lg font-semibold text-primary">KES {data.wallet?.balance.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
