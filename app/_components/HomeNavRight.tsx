'use client';

import React, { useEffect, useState } from 'react';
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CreditCard, Users, Trophy, HandHeart, Star, Activity } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import DonationCount from './DonationCount';
import { calculateLevel } from '@/app/lib/levelCalculator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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

const LEVEL_PERKS = {
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
  
  // Calculate points based on total donations
  const calculatedPoints = Math.floor((stats?.calculatedTotalDonated || stats?.totalDonated || 0) / 50);
  const currentLevel = calculateLevel(calculatedPoints);
  
  // Get the next level threshold from the level calculator
  const LEVEL_THRESHOLDS = [
    { level: 10, points: 10000 },
    { level: 9, points: 5000 },
    { level: 8, points: 2000 },
    { level: 7, points: 1200 },
    { level: 6, points: 500 },
    { level: 5, points: 120 },
    { level: 4, points: 30 },
    { level: 3, points: 70 },
    { level: 2, points: 12 },
    { level: 1, points: 0 }
  ];
  
  const currentThreshold = LEVEL_THRESHOLDS.find(t => t.level === currentLevel);
  const nextThreshold = LEVEL_THRESHOLDS.find(t => t.level === currentLevel + 1);
  const pointsNeeded = nextThreshold ? nextThreshold.points - calculatedPoints : 0;
  const progress = nextThreshold ? ((calculatedPoints - (currentThreshold?.points || 0)) / (nextThreshold.points - (currentThreshold?.points || 0))) * 100 : 100;

  const nextLevel = currentLevel + 1;
  const currentPerks = LEVEL_PERKS[currentLevel as keyof typeof LEVEL_PERKS];
  const nextPerks = LEVEL_PERKS[nextLevel as keyof typeof LEVEL_PERKS];

  useEffect(() => {
    // Function to fetch updated stats
    const fetchUpdatedStats = async () => {
      try {
        const response = await fetch(`/api/user-stats?userId=${initialUser.id}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched updated stats:', data);
          
          // Only update if we have valid non-zero values
          setStats(prevStats => ({
            ...prevStats,
            level: data.level > 0 ? data.level : prevStats.level,
            totalDonated: data.totalDonated > 0 ? data.totalDonated : prevStats.totalDonated,
            donationCount: data.donationCount > 0 ? data.donationCount : prevStats.donationCount,
            points: data.points?.length > 0 ? data.points : prevStats.points,
            calculatedDonationCount: data.calculatedDonationCount > 0 ? data.calculatedDonationCount : prevStats.calculatedDonationCount,
            calculatedTotalDonated: data.calculatedTotalDonated > 0 ? data.calculatedTotalDonated : prevStats.calculatedTotalDonated
          }));
        }
      } catch (error) {
        console.error('Error fetching updated stats:', error);
      }
    };

    // Poll for updates every 30 seconds instead of 10
    const interval = setInterval(fetchUpdatedStats, 30000);

    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, [initialUser.id]);

  // Ensure we always have the latest initial stats
  useEffect(() => {
    if ((initialStats.calculatedTotalDonated ?? 0) > 0 || (initialStats.calculatedDonationCount ?? 0) > 0) {
      setStats(initialStats);
    }
  }, [initialStats]);

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
      <Card className="overflow-hidden bg-white/95 backdrop-blur-sm 
                      dark:bg-gray-900/30 dark:backdrop-blur-md
                      shadow-lg hover:shadow-xl transition-all duration-300
                      dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]
                      dark:border-gray-800/30 rounded-lg">
        <div className="p-6 space-y-6">
          <h1 className='text-sm font-medium text-green-600 
                        bg-green-100/80 backdrop-blur-sm
                        dark:bg-green-900/20 dark:text-green-400
                        p-3 rounded-lg shadow-inner text-center
                        transition-all duration-300'>
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

          <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 
                          dark:from-gray-800/40 dark:via-gray-800/60 dark:to-gray-800/40 
                          p-4 rounded-lg space-y-2 shadow-inner
                          transition-all duration-300">
            <Dialog>
              <DialogTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer 
                              hover:opacity-80 transition-opacity duration-200
                              dark:text-gray-200">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                    <span className="font-semibold">Level {currentLevel}</span>
                  </div>
                  <div className="text-sm text-muted-foreground dark:text-gray-400">
                    {calculatedPoints} / {nextThreshold?.points || calculatedPoints} XP
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    Level Progress
                  </DialogTitle>
                  <DialogDescription>
                    <div className="space-y-4 mt-2">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span>Current Level: {currentLevel}</span>
                          <span>Points: {calculatedPoints}</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <p className="text-sm text-muted-foreground mt-1">
                          {pointsNeeded} points needed for Level {currentLevel + 1}
                        </p>
                        {currentPerks && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Current limit: {currentPerks.limit}
                          </p>
                        )}
                      </div>
                      
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-2">Current Level Perks</h4>
                        <ul className="space-y-2">
                          {currentPerks?.perks.map((perk, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm">
                              {perk.icon}
                              {perk.text}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {nextPerks && (
                        <div className="border-t pt-4">
                          <h4 className="font-medium mb-2">Next Level Perks</h4>
                          <ul className="space-y-2">
                            {nextPerks.perks.map((perk, index) => (
                              <li key={index} className="flex items-center gap-2 text-sm">
                                {perk.icon}
                                {perk.text}
                              </li>
                            ))}
                          </ul>
                          <p className="text-xs text-muted-foreground mt-2">
                            Next level limit: {nextPerks.limit}
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
            <Progress value={progress} className="h-2 dark:bg-gray-800/50" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50/80 backdrop-blur-sm
                          dark:bg-gray-800/30 dark:backdrop-blur-md
                          p-3 rounded-lg shadow-sm hover:shadow-md
                          transition-all duration-300">
              <div className="flex items-center gap-2 mb-1">
                <HandHeart className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Total Given</span>
              </div>
              <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                KES {(stats?.calculatedTotalDonated || stats?.totalDonated || 0).toLocaleString()}
              </p>
            </div>
            <DonationCount 
              initialCount={stats?.calculatedDonationCount || stats?.donationCount || 0} 
              userId={initialUser.id} 
            />
          </div>
          
          <div className="space-y-4">
            <div className="bg-primary/95 backdrop-blur-sm text-white 
                          dark:bg-gray-800/60 dark:backdrop-blur-md
                          p-4 rounded-lg shadow-lg
                          transition-all duration-300">
              <div className="text-xs uppercase mb-1 opacity-90">Account balance</div>
              <div className="text-2xl font-bold dark:text-gray-100">{wallet ? `${wallet.balance} KES` : '0 KES'}</div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full mt-3 bg-green-500/90 hover:bg-green-600 
                                   dark:bg-green-600/80 dark:hover:bg-green-700
                                   text-white shadow-md hover:shadow-lg
                                   transition-all duration-300">
                    Add funds
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Funds to Wallet</DialogTitle>
                    <DialogDescription>
                      <WalletDepositForm 
                        onSuccess={(newBalance) => {
                          setWallet(prev => ({ ...prev, balance: newBalance }));
                        }} 
                      />
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="bg-green-50/80 backdrop-blur-sm
                          dark:bg-gray-800/40 dark:backdrop-blur-md
                          p-4 rounded-lg shadow-md
                          transition-all duration-300">
              <div className="text-xs text-primary dark:text-gray-300 uppercase mb-1">Current balance</div>
              <div className="text-2xl font-bold text-primary dark:text-gray-200">
                {wallet ? `${wallet.balance} KES` : '0 KES'}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" 
                            className="w-full lowercase text-xs text-primary
                                     dark:text-gray-300 dark:border-gray-700
                                     dark:hover:bg-gray-700/50
                                     transition-all duration-300">
                      Withdraw
                    </Button>
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
                <Button variant="outline" 
                        className="w-full lowercase text-xs text-primary
                                 dark:text-gray-300 dark:border-gray-700
                                 dark:hover:bg-gray-700/50
                                 transition-all duration-300">
                  Deposit
                </Button>
              </div>
            </div>
          </div>
          
          <Separator className='my-6 dark:bg-gray-700/30' />
          
          <div className='space-y-4'>
            <Button className="w-full bg-primary/90 hover:bg-green-600/90 
                             dark:bg-gray-800/80 dark:hover:bg-gray-700
                             text-white shadow-md hover:shadow-lg
                             transition-all duration-300" asChild>
              <Link href='/c/eldoret/create'>
                <CreditCard className="w-4 h-4 mr-2" />
                Create a Help Request
              </Link>
            </Button>
            <Button variant='outline' 
                    className="w-full border-green-50 shadow-md 
                             text-primary hover:bg-green-100/50
                             dark:border-gray-700 dark:text-gray-300
                             dark:hover:bg-gray-700/50
                             transition-all duration-300" asChild>
              <Link href='/c/create'>
                <Users className="w-4 h-4 mr-2 text-xs" />
                Create a Community
              </Link>
            </Button>
          </div>
        </div>
      </Card>
      <Card className='hidden sm:block w-full mt-4 
                      bg-white/95 dark:bg-gray-900/30 
                      backdrop-blur-sm dark:backdrop-blur-md
                      shadow-lg dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]
                      dark:border-gray-800/30
                      transition-all duration-300'>      
        <div className='sticky flex bottom-0 w-full justify-evenly gap-2 
                       border-t dark:border-gray-800/30 
                       bg-card dark:bg-gray-800/40 p-3
                       transition-all duration-300'>
          <MenuBar className='sticky flex bottom-0 w-full justify-evenly gap-2 
                            border-t dark:border-gray-800/30 
                            bg-card dark:bg-gray-800/40 p-3'/>
        </div>
      </Card>
    </div>
  );
};

