'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CreditCard, Users, Trophy, HandHeart, Star, Activity } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import DonationCount from './DonationCount';
import { calculateLevel, LEVEL_THRESHOLDS } from '@/app/lib/levelCalculator';
import dynamic from 'next/dynamic';
import NotificationList from './NotificationList';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Dynamically import Dialog components with no SSR
const Dialog = dynamic(() => import("@/components/ui/dialog").then(mod => mod.Dialog), { ssr: false });
const DialogTrigger = dynamic(() => import("@/components/ui/dialog").then(mod => mod.DialogTrigger), { ssr: false });
const DialogContent = dynamic(() => import("@/components/ui/dialog").then(mod => mod.DialogContent), { ssr: false });
const DialogHeader = dynamic(() => import("@/components/ui/dialog").then(mod => mod.DialogHeader), { ssr: false });
const DialogTitle = dynamic(() => import("@/components/ui/dialog").then(mod => mod.DialogTitle), { ssr: false });
const DialogDescription = dynamic(() => import("@/components/ui/dialog").then(mod => mod.DialogDescription), { ssr: false });

import B2CPaymentForm from './B2CPaymentForm';
import MenuBar from './MenuBar';
import WalletDepositForm from './WalletDepositForm';

interface UserStats {
  level: number;
  totalDonated: number;
  donationCount: number;
  calculatedDonationCount?: number;
  calculatedTotalDonated?: number;
  points: { amount: number }[];
}

interface WalletData {
  balance: number;
}

type LevelNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

type Perk = {
  icon: React.ReactElement;
  text: string;
};

type LevelPerk = {
  perks: Perk[];
  limit: string;
  maxAmount: number;
};

const LEVEL_PERKS: Record<LevelNumber, LevelPerk> = {
  1: {
    perks: [
      { icon: <Users className="w-4 h-4 text-blue-500" />, text: "Can browse and view help requests" }
    ],
    limit: "Cannot post help requests",
    maxAmount: 0
  },
  2: {
    perks: [
      { icon: <HandHeart className="w-4 h-4 text-emerald-500" />, text: "Can post help requests" }
    ],
    limit: "Maximum help request amount: KES 1,000",
    maxAmount: 1000
  },
  3: {
    perks: [
      { icon: <HandHeart className="w-4 h-4 text-emerald-500" />, text: "Can post help requests" },
      { icon: <Users className="w-4 h-4 text-blue-500" />, text: "Can view detailed profiles" },
      { icon: <Activity className="w-4 h-4 text-purple-500" />, text: "Receive local notifications" }
    ],
    limit: "Maximum help request amount: KES 3,000",
    maxAmount: 3000
  },
  4: {
    perks: [
      { icon: <Trophy className="w-4 h-4 text-amber-500" />, text: "Can see top contributors" },
      { icon: <Activity className="w-4 h-4 text-purple-500" />, text: "Access basic analytics" }
    ],
    limit: "Maximum help request amount: KES 5,000",
    maxAmount: 5000
  },
  5: {
    perks: [
      { icon: <Users className="w-4 h-4 text-blue-500" />, text: "Create and moderate communities" }
    ],
    limit: "Maximum help request amount: KES 10,000",
    maxAmount: 10000
  },
  6: {
    perks: [
      { icon: <Star className="w-4 h-4 text-amber-500" />, text: "Priority support" },
      { icon: <Users className="w-4 h-4 text-blue-500" />, text: "Create public fundraising events" }
    ],
    limit: "Maximum help request amount: KES 20,000",
    maxAmount: 20000
  },
  7: {
    perks: [
      { icon: <Star className="w-4 h-4 text-amber-500" />, text: "Access premium templates" },
      { icon: <Activity className="w-4 h-4 text-purple-500" />, text: "Priority Funding available" },
      { icon: <HandHeart className="w-4 h-4 text-emerald-500" />, text: "Monthly impact reports" }
    ],
    limit: "Maximum help request amount: KES 50,000",
    maxAmount: 50000
  },
  8: {
    perks: [
      { icon: <Star className="w-4 h-4 text-amber-500" />, text: "Exclusive giver matching" },
      { icon: <Users className="w-4 h-4 text-blue-500" />, text: "Create recurring campaigns" },
      { icon: <Activity className="w-4 h-4 text-purple-500" />, text: "Early access to features" }
    ],
    limit: "Maximum help request amount: KES 100,000",
    maxAmount: 100000
  },
  9: {
    perks: [
      { icon: <Star className="w-4 h-4 text-amber-500" />, text: "Mentorship from top donors" },
      { icon: <Users className="w-4 h-4 text-blue-500" />, text: "Create Social Circles" },
      { icon: <HandHeart className="w-4 h-4 text-emerald-500" />, text: "Priority Funding at 15%" }
    ],
    limit: "Maximum help request amount: KES 1,000,000",
    maxAmount: 1000000
  },
  10: {
    perks: [
      { icon: <Star className="w-4 h-4 text-amber-500" />, text: "Featured on main page" },
      { icon: <Users className="w-4 h-4 text-blue-500" />, text: "Advanced Social Circles" },
      { icon: <Activity className="w-4 h-4 text-purple-500" />, text: "Advanced analytics" }
    ],
    limit: "Maximum help request amount: KES 100,000,000",
    maxAmount: 100000000
  }
};

export default function HomeNavRight({ 
  initialUser, 
  initialStats, 
  initialWallet 
}: { 
  initialUser: any;
  initialStats: UserStats;
  initialWallet: WalletData;
}) {
  const [stats, setStats] = useState<UserStats>(initialStats);
  const [wallet, setWallet] = useState<WalletData>(initialWallet);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [hasRunningRequest, setHasRunningRequest] = useState(false);

  useEffect(() => {
    // Function to fetch updated stats
    const fetchUpdatedStats = async () => {
      try {
        const response = await fetch(`/api/user-stats?userId=${initialUser.id}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched updated stats:', data);
          
          // Update stats with new values, regardless of whether they are zero
          setStats(prevStats => ({
            ...prevStats,
            level: data.level !== undefined ? data.level : prevStats.level,
            totalDonated: data.totalDonated !== undefined ? data.totalDonated : prevStats.totalDonated,
            donationCount: data.donationCount !== undefined ? data.donationCount : prevStats.donationCount,
            points: data.points || prevStats.points,
            calculatedDonationCount: data.calculatedDonationCount !== undefined ? data.calculatedDonationCount : prevStats.calculatedDonationCount,
            calculatedTotalDonated: data.calculatedTotalDonated !== undefined ? data.calculatedTotalDonated : prevStats.calculatedTotalDonated
          }));
        }
      } catch (error) {
        console.error('Error fetching updated stats:', error);
      }
    };

    // Fetch immediately when component mounts
    fetchUpdatedStats();

    // Then poll for updates every 10 seconds
    const interval = setInterval(fetchUpdatedStats, 10000);

    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, [initialUser.id]);

  useEffect(() => {
    // Check for running requests
    const checkRunningRequests = async () => {
      try {
        const response = await fetch(`/api/user-requests/running?userId=${initialUser.id}`);
        if (response.ok) {
          const data = await response.json();
          setHasRunningRequest(data.hasRunningRequest);
        }
      } catch (error) {
        console.error('Error checking running requests:', error);
      }
    };

    checkRunningRequests();
    const interval = setInterval(checkRunningRequests, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [initialUser.id]);

  if (!initialUser) {
    return <div>
    
    <div className="mt-6 mb-2">
    <Image src="/logo.svg" alt="Fitrii Logo"
    sizes="100dvw"
    style={{
      width: '300',
      height: 'auto',
    }}
    width={60}
    height={40}
    
    />
    <h2 className="text-xl font-semibold tracking-wide">Invest in Humanity </h2>
    
    <div className="flex flex-col">
    </div>
    </div>
    <p className="dark:text-gray-800">Spreading Kindness, One Act at a Time: Join Us in Making a Difference Today!.</p>
    <Separator className='my-5' /> 
    <div className='flex flex-col justify-center flex-shrink gap-y-5'>
    <Button asChild>
    <Link href='/c/eldoret/create'>
    Create a Help Request
    </Link>
    </Button>
    
    
    <Button variant='outline' asChild>
    <Link href='/c/create'>
    Create You Own Help Community
    </Link>
    </Button>
    </div>
    
    
    </div>;
    
  }
  
  return (
    <div className="max-w-md mx-auto">
      <Card className="overflow-hidden bg-white dark:bg-gray-900
                      shadow-md hover:shadow-lg transition-all duration-300
                      dark:border-gray-800 rounded-lg">
        <div className="p-6 space-y-6">
          <h1 className='text-sm font-medium text-primary 
                        bg-secondary/30
                        dark:bg-gray-800 dark:text-primary
                        p-3 rounded-lg text-center
                        transition-colors'>
            Welcome aboard{' '}
            {initialUser.given_name || initialUser.family_name ? (
              <>
                {initialUser.given_name && (
                  <span className="capitalize">{initialUser.given_name.toLowerCase()} </span>
                )}
                {initialUser.family_name && (
                  <span className="capitalize">{initialUser.family_name.toLowerCase()}</span>
                )}
              </>
            ) : (
              "there"
            )}...
          </h1>

          <div className="bg-secondary/20 dark:bg-gray-800 
                          p-4 rounded-lg space-y-2
                          transition-colors">
            <Suspense fallback={<div>Loading...</div>}>
              <Dialog>
                <DialogTrigger asChild>
                  <div className="flex items-center justify-between cursor-pointer 
                              hover:opacity-80 transition-opacity
                              dark:text-gray-200">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-primary" />
                      <span className="font-semibold">Level {stats.level}</span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {stats.points.reduce((acc, point) => acc + point.amount, 0)} / {LEVEL_THRESHOLDS.find((t: { level: number }) => t.level === stats.level + 1)?.points || LEVEL_THRESHOLDS[0].points} XP
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-primary" />
                      Level Progress
                    </DialogTitle>
                    <DialogDescription>
                      <div className="space-y-4 mt-2">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span>Current Level: {stats.level}</span>
                            <span>Points: {stats.points.reduce((acc, point) => acc + point.amount, 0)}</span>
                          </div>
                          <Progress 
                            value={((stats.points.reduce((acc, point) => acc + point.amount, 0) - (LEVEL_THRESHOLDS.find((t: { level: number }) => t.level === stats.level)?.points || 0)) / 
                                  ((LEVEL_THRESHOLDS.find((t: { level: number }) => t.level === stats.level + 1)?.points || LEVEL_THRESHOLDS[0].points) - 
                                  (LEVEL_THRESHOLDS.find((t: { level: number }) => t.level === stats.level)?.points || 0)) * 100)} 
                            className="h-2 dark:bg-gray-800" 
                          />
                          <p className="text-sm text-muted-foreground mt-1">
                            {(LEVEL_THRESHOLDS.find((t: { level: number }) => t.level === stats.level + 1)?.points || LEVEL_THRESHOLDS[0].points) - 
                             stats.points.reduce((acc, point) => acc + point.amount, 0)} points needed for Level {stats.level + 1}
                          </p>
                          {LEVEL_PERKS[stats.level as LevelNumber] && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Current limit: {LEVEL_PERKS[stats.level as LevelNumber].limit}
                            </p>
                          )}
                        </div>
                        
                        <div className="border-t pt-4">
                          <h4 className="font-medium mb-2">Current Level Perks</h4>
                          <ul className="space-y-2">
                            {LEVEL_PERKS[stats.level as LevelNumber]?.perks.map((perk, index) => (
                              <li key={index} className="flex items-center gap-2 text-sm">
                                {perk.icon}
                                {perk.text}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {LEVEL_PERKS[(stats.level + 1) as LevelNumber] && (
                          <div className="border-t pt-4">
                            <h4 className="font-medium mb-2">Next Level Perks</h4>
                            <ul className="space-y-2">
                              {LEVEL_PERKS[(stats.level + 1) as LevelNumber].perks.map((perk, index) => (
                                <li key={index} className="flex items-center gap-2 text-sm">
                                  {perk.icon}
                                  {perk.text}
                                </li>
                              ))}
                            </ul>
                            <p className="text-xs text-muted-foreground mt-2">
                              Next level limit: {LEVEL_PERKS[(stats.level + 1) as LevelNumber].limit}
                            </p>
                          </div>
                        )}

                        <div className="bg-muted p-3 rounded-lg mt-4">
                          <h4 className="font-medium mb-2">How to Earn Points</h4>
                          <ul className="space-y-1 text-sm">
                            <li>• Donate to help requests (1 point per KES 50)</li>
                            <li>• Create help communities (100 points)</li>
                            <li>• Receive successful donations (50 points)</li>
                          </ul>
                        </div>
                      </div>
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </Suspense>
            <Progress value={(stats.points.reduce((acc, point) => acc + point.amount, 0) / (stats.level * 1000)) * 100} className="h-2 dark:bg-gray-800" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-secondary/20
                          dark:bg-gray-800
                          p-3 rounded-lg shadow-sm hover:shadow
                          transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <HandHeart className="w-4 h-4 text-primary" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Total Given</span>
              </div>
              <p className="text-lg font-semibold text-primary">
                KES {(stats.calculatedTotalDonated || stats.totalDonated || 0).toLocaleString()}
              </p>
            </div>
            <DonationCount 
              initialCount={stats.calculatedDonationCount || stats.donationCount || 0} 
              userId={initialUser.id} 
            />
          </div>

          <div className="bg-secondary/10 dark:bg-gray-800/50 p-4 rounded-lg space-y-3">
            <h3 className="text-sm font-medium text-primary dark:text-gray-200 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Your Impact Stats
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/50 dark:bg-gray-800 p-3 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400">Total Points</div>
                <div className="text-lg font-semibold text-primary">
                  {stats.points.reduce((acc, point) => acc + point.amount, 0).toLocaleString()} XP
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Next Level: {(stats.level * 1000).toLocaleString()} XP
                </div>
              </div>
              
              <div className="bg-white/50 dark:bg-gray-800 p-3 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400">People Helped</div>
                <div className="text-lg font-semibold text-primary">
                  {stats.calculatedDonationCount || stats.donationCount || 0}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Through {(stats.calculatedTotalDonated || stats.totalDonated || 0).toLocaleString()} KES
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>Progress to Level {stats.level + 1}</span>
                {(() => {
                  const currentPoints = stats.points.reduce((acc, point) => acc + point.amount, 0);
                  const currentLevelPoints = LEVEL_THRESHOLDS.find((t: { level: number }) => t.level === stats.level)?.points || 0;
                  const nextLevelPoints = LEVEL_THRESHOLDS.find((t: { level: number }) => t.level === stats.level + 1)?.points || LEVEL_THRESHOLDS[0].points;
                  const percentage = Math.round(((currentPoints - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100);
                  return <span>{percentage}%</span>;
                })()}
              </div>
              <Progress 
                value={((stats.points.reduce((acc, point) => acc + point.amount, 0) - (LEVEL_THRESHOLDS.find((t: { level: number }) => t.level === stats.level)?.points || 0)) / 
                      ((LEVEL_THRESHOLDS.find((t: { level: number }) => t.level === stats.level + 1)?.points || LEVEL_THRESHOLDS[0].points) - 
                      (LEVEL_THRESHOLDS.find((t: { level: number }) => t.level === stats.level)?.points || 0)) * 100)} 
                className="h-2 dark:bg-gray-800" 
              />
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {(LEVEL_THRESHOLDS.find((t: { level: number }) => t.level === stats.level + 1)?.points || LEVEL_THRESHOLDS[0].points) - 
                 stats.points.reduce((acc, point) => acc + point.amount, 0)} points needed,
              </div>
            </div>

            <div className="bg-white/50 dark:bg-gray-800 p-3 rounded-lg">
              <h4 className="text-sm font-medium mb-2 text-primary dark:text-gray-200">Quick Stats</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Current Level</span>
                  <span className="font-medium text-primary">{stats.level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Max Request Amount</span>
                  <span className="font-medium text-primary">
                    {LEVEL_PERKS[stats.level as LevelNumber]?.maxAmount.toLocaleString()} KES
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Active Perks</span>
                  <span className="font-medium text-primary">
                    {LEVEL_PERKS[stats.level as LevelNumber]?.perks.length || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-primary text-white 
                          dark:bg-gray-800
                          p-4 rounded-lg shadow-md
                          transition-colors">
              <div className="text-xs uppercase mb-1 opacity-90">Account balance</div>
              <div className="text-2xl font-bold dark:text-gray-100">{wallet ? `${wallet.balance} KES` : '0 KES'}</div>
              <Suspense fallback={<div>Loading...</div>}>
                <TooltipProvider>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <Button 
                              variant="outline" 
                              className="w-full lowercase text-xs text-slate-600
                                       dark:text-gray-300 dark:border-gray-700
                                       dark:hover:bg-gray-700
                                       transition-colors"
                              disabled={hasRunningRequest}
                            >
                              Withdraw
                            </Button>
                          </div>
                        </TooltipTrigger>
                        {hasRunningRequest && (
                          <TooltipContent>
                            <p>Funds will be available once your request is completed</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Withdraw Funds</DialogTitle>
                        <DialogDescription>
                          <B2CPaymentForm amountValue={wallet ? wallet.balance : 0} />
                        </DialogDescription>
                      </DialogHeader>
                    </DialogContent>
                  </Dialog>
                </TooltipProvider>
              </Suspense>
            </div>
            
            <div className="bg-secondary/20
                          dark:bg-gray-800
                          p-4 rounded-lg shadow-md
                          transition-colors">
              <div className="text-xs text-primary dark:text-gray-300 uppercase mb-1">Current balance</div>
              <div className="text-2xl font-bold text-primary dark:text-gray-200">
                {wallet ? `${wallet.balance} KES` : '0 KES'}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Suspense fallback={<div>Loading...</div>}>
                  <TooltipProvider>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <Button 
                                variant="outline" 
                                className="w-full lowercase text-xs text-primary
                                         dark:text-gray-300 dark:border-gray-700
                                         dark:hover:bg-gray-700
                                         transition-colors"
                                disabled={hasRunningRequest}
                              >
                                Withdraw
                              </Button>
                            </div>
                          </TooltipTrigger>
                          {hasRunningRequest && (
                            <TooltipContent>
                              <p>Funds will be available once your request is completed</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Withdraw Funds</DialogTitle>
                          <DialogDescription>
                            <B2CPaymentForm amountValue={wallet ? wallet.balance : 0} />
                          </DialogDescription>
                        </DialogHeader>
                      </DialogContent>
                    </Dialog>
                  </TooltipProvider>
                </Suspense>
                <Button variant="outline" 
                        className="w-full lowercase text-xs text-primary
                                 dark:text-gray-300 dark:border-gray-700
                                 dark:hover:bg-gray-700
                                 transition-colors">
                  Deposit
                </Button>
              </div>
            </div>
          </div>
          
          <Separator className='my-6 dark:bg-gray-700' />
          
          <div className='space-y-4'>
            <Button className="w-full bg-primary hover:bg-primary/90 
                             dark:bg-gray-800 dark:hover:bg-gray-700
                             text-white shadow-md hover:shadow-lg
                             transition-colors" asChild>
              <Link href='/c/eldoret/create'>
                <CreditCard className="w-4 h-4 mr-2" />
                Create a Help Request
              </Link>
            </Button>
            <Button variant='outline' 
                    className="w-full border-secondary shadow-md 
                             text-primary hover:bg-secondary/20
                             dark:border-gray-700 dark:text-gray-300
                             dark:hover:bg-gray-700
                             transition-colors" asChild>
              <Link href='/c/create'>
                <Users className="w-4 h-4 mr-2 text-xs" />
                Create a Community
              </Link>
            </Button>
          </div>
          <div className="flex items-center space-x-4">
            <Dialog>
              <DialogTrigger asChild>
                <div className="cursor-pointer">
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Notifications</DialogTitle>
                  <DialogDescription>
                    Stay updated with your latest activities
                  </DialogDescription>
                </DialogHeader>
                <NotificationList className="max-h-[60vh] overflow-y-auto" />
              </DialogContent>
            </Dialog>
            
            <Dialog open={isWalletOpen} onOpenChange={setIsWalletOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" 
                        className="w-full lowercase text-xs text-primary
                                 dark:text-gray-300 dark:border-gray-700
                                 dark:hover:bg-gray-700
                                 transition-colors">
                  Wallet
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Wallet</DialogTitle>
                  <DialogDescription>
                    Manage your wallet
                  </DialogDescription>
                </DialogHeader>
                <WalletDepositForm 
                  onSuccess={(newBalance) => {
                    setWallet(prev => ({ ...prev, balance: newBalance }));
                  }} 
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </Card>
      <Card className='hidden sm:block w-full mt-4 
                      bg-white dark:bg-gray-900 
                      shadow-md dark:border-gray-800
                      transition-colors'>      
        <div className='sticky flex bottom-0 w-full justify-evenly gap-2 
                       border-t dark:border-gray-800 
                       bg-card dark:bg-gray-800 p-3
                       transition-colors'>
          <MenuBar />
        </div>
      </Card>
    </div>
  );
};
