import React from 'react'
import ProfileHeader from '../_profileComponents/profileheader'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { notFound, redirect } from 'next/navigation';
import prisma from '@/app/lib/db';
import HomeNavRightWrapper from '@/app/_components/HomeNavRightWrapper';
import { Verified, Heart, HandHeart, Trophy, Activity, Calendar, HelpCircle, TrendingUp, Users, Medal, History, Wallet } from 'lucide-react';
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

export default async function UserProfile({ params }: { params: { id: string } }) {
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
                <CardDescription>Track all donations made by {data.firstName}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.donations.map((donation) => (
                    <div key={donation.id} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
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
                  ))}
                </div>
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
