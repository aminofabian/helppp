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
import { calculateRequestAmount } from '@/app/lib/requestCalculator';
import WalletWithdrawForm from './WalletWithdrawForm';

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
  totalReceived: number;
  points: { amount: number }[];
}

interface WalletData {
  balance: number;
  depositWallet?: {
    balance: number;
    name: string;
  };
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

interface Point {
  amount: number;
}

export default function HomeNavRight({ 
  initialUser, 
  initialStats, 
  initialWallet 
}: { 
  initialUser: any;
  initialStats: UserStats;
  initialWallet: WalletData;
}) {
  const [stats, setStats] = useState<UserStats>({
    ...initialStats,
    points: initialStats.points || [],
    level: initialStats.level || 1,
    totalDonated: initialStats.totalDonated || 0,
    donationCount: initialStats.donationCount || 0,
    calculatedTotalDonated: initialStats.calculatedTotalDonated || 0,
    calculatedDonationCount: initialStats.calculatedDonationCount || 0,
    totalReceived: initialStats.totalReceived || 0
  });
  const [hasRunningRequest, setHasRunningRequest] = useState(false);
  const [wallet, setWallet] = useState<WalletData>(initialWallet || { balance: 0 });
  const [isClient, setIsClient] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isWalletDepositOpen, setIsWalletDepositOpen] = useState(false);
  const [isWalletWithdrawOpen, setIsWalletWithdrawOpen] = useState(false);

  // Set isClient to true when component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Log when modal state changes
  useEffect(() => {
    if (isClient) {
      console.log('Modal state changed:', isWalletDepositOpen);
    }
  }, [isWalletDepositOpen, isClient]);

  // Handle wallet update events
  const handleWalletUpdate = (event: CustomEvent) => {
    console.log('Wallet update event received:', event.detail);
    const { type, balance } = event.detail;
    
    if (type === 'deposit') {
      console.log('Updating deposit wallet balance to:', balance);
      setWallet(prev => ({
        ...prev,
        depositWallet: {
          ...prev.depositWallet,
          balance: Number(balance),
          name: prev.depositWallet?.name || "Donation Pool"
        }
      }));
    } else {
      console.log('Updating regular wallet balance to:', balance);
      setWallet(prev => ({
        ...prev,
        balance: Number(balance)
      }));
    }

    // Start aggressive polling after a wallet update event
    startAggressivePolling();
  };

  const startAggressivePolling = () => {
    console.log('Starting aggressive polling for wallet updates...');
    // Poll every second for 10 seconds
    let pollCount = 0;
    const maxPolls = 10;
    
    const pollInterval = setInterval(async () => {
      if (pollCount >= maxPolls) {
        clearInterval(pollInterval);
        console.log('Ending aggressive polling');
        return;
      }
      
      try {
        console.log(`Polling wallet data... (${pollCount + 1}/${maxPolls})`);
        const response = await fetch(`/api/wallet?userId=${initialUser.id}`);
        if (response.ok) {
          const data = await response.json();
          // console.log('Received wallet data:', data);
          if (data.balance !== undefined) {
            setWallet(prev => ({
              ...prev,
              balance: Number(data.balance),
              depositWallet: {
                ...prev.depositWallet,
                ...data.depositWallet,
                balance: Number(data.depositWallet?.balance || 0)
              }
            }));
          }
        }
      } catch (error) {
        console.error('Error polling wallet data:', error);
      }
      
      pollCount++;
    }, 1000);

    // Cleanup after 10 seconds
    setTimeout(() => {
      clearInterval(pollInterval);
      console.log('Ending aggressive polling');
    }, 10000);
  };

  // Add event listener
  useEffect(() => {
    if (!isClient || !initialUser?.id) return;

    const fetchWalletData = async () => {
      try {
        console.log('Fetching wallet data...');
        const response = await fetch(`/api/wallet?userId=${initialUser.id}`);
        if (response.ok) {
          const data = await response.json();
          // console.log('Received wallet data:', data);
          setWallet(prev => ({
            ...prev,
            balance: Number(data.balance || 0),
            depositWallet: {
              ...prev.depositWallet,
              balance: Number(data.depositWallet?.balance || 0),
              name: data.depositWallet?.name || "Donation Pool"
            }
          }));
        }
      } catch (error) {
        console.error('Error fetching wallet data:', error);
      }
    };

    window.addEventListener('wallet-updated', handleWalletUpdate as EventListener);
    console.log('Added wallet-updated event listener');

    // Initial fetch
    fetchWalletData();

    // Regular polling every 5 seconds
    const interval = setInterval(fetchWalletData, 5000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('wallet-updated', handleWalletUpdate as EventListener);
    };
  }, [initialUser?.id, isClient]);

  useEffect(() => {
    const fetchUpdatedStats = async () => {
      try {
        const response = await fetch(`/api/user-stats?userId=${initialUser.id}`);
        if (response.ok) {
          const newStats = await response.json();
          setStats(newStats);
        }
      } catch (error) {
        console.error('Error fetching updated stats:', error);
      }
    };

    // Only set up event listeners and intervals if we're on the client
    if (isClient) {
      const handleDonationEvent = (event: CustomEvent) => {
        const { amount, points } = event.detail;
        setStats(prevStats => {
          const newPoints = [...(prevStats.points || []), { amount: points }];
          const totalPoints = newPoints.reduce((acc: number, point: Point) => acc + (point?.amount || 0), 0);
          const newLevel = calculateLevel(totalPoints);
          
          return {
            ...prevStats,
            totalDonated: (prevStats.totalDonated || 0) + amount,
            donationCount: (prevStats.donationCount || 0) + 1,
            calculatedTotalDonated: (prevStats.calculatedTotalDonated || 0) + amount,
            calculatedDonationCount: (prevStats.calculatedDonationCount || 0) + 1,
            points: newPoints,
            level: newLevel
          };
        });
        
        fetchUpdatedStats();
      };

      window.addEventListener('donation-made', handleDonationEvent as EventListener);

      // Initial fetch and calculate level
      const initialFetch = async () => {
        try {
          const response = await fetch(`/api/user-stats?userId=${initialUser.id}`);
          if (response.ok) {
            const newStats = await response.json();
            const totalPoints = newStats.points?.reduce((acc: number, point: Point) => acc + (point?.amount || 0), 0) || 0;
            const calculatedLevel = calculateLevel(totalPoints);
            setStats({
              ...newStats,
              level: calculatedLevel
            });
          }
        } catch (error) {
          console.error('Error fetching updated stats:', error);
        }
      };

      initialFetch();

      // Poll for updates and recalculate level
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/user-stats?userId=${initialUser.id}`);
          if (response.ok) {
            const newStats = await response.json();
            const totalPoints = newStats.points?.reduce((acc: number, point: Point) => acc + (point?.amount || 0), 0) || 0;
            const calculatedLevel = calculateLevel(totalPoints);
            setStats({
              ...newStats,
              level: calculatedLevel
            });
          }
        } catch (error) {
          console.error('Error fetching updated stats:', error);
        }
      }, 10000);

      return () => {
        clearInterval(interval);
        window.removeEventListener('donation-made', handleDonationEvent as EventListener);
      };
    }
  }, [initialUser.id, isClient]);

  useEffect(() => {
    if (!isClient) return;

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
    const interval = setInterval(checkRunningRequests, 30000);

    return () => clearInterval(interval);
  }, [initialUser.id, isClient]);

  // Calculate total points with safety checks
  const totalPoints = stats.points?.reduce((acc: number, point: Point) => acc + (point?.amount || 0), 0) || 0;
  const currentLevelPoints = LEVEL_THRESHOLDS.find((t: { level: number }) => t.level === (stats.level || 1))?.points || 0;
  const nextLevelPoints = LEVEL_THRESHOLDS.find((t: { level: number }) => t.level === (stats.level || 1) + 1)?.points || LEVEL_THRESHOLDS[0].points;
  const pointsToNextLevel = Math.max(0, nextLevelPoints - totalPoints);
  const progressPercentage = Math.min(100, Math.max(0, ((totalPoints - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100));

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
    <div className="flex flex-col gap-4">
      {/* Wallet Card */}
      <Card className="p-4 border-2 border-primary/10 hover:border-primary/20 transition-colors">
        <div className="flex justify-between items-start">
          {/* Regular Wallet */}
          <div className="flex-1 px-2">
            <div className="mb-4">
              <span className="text-2xl font-bold">KES {wallet.balance.toLocaleString()}</span>
            </div>
            <Button 
              onClick={() => setIsWalletWithdrawOpen(true)} 
              className="w-full bg-primary hover:bg-primary/90 text-white"
              disabled={wallet.balance <= 0}
            >
              Withdraw
            </Button>
          </div>

          {/* Vertical Separator */}
          <div className="w-px h-32 bg-primary/10 mx-2" />

          {/* Donation Pool */}
          <div className="flex-1 px-2">
            <div className="mb-4">
              <span className="text-2xl font-bold">KES {(wallet.depositWallet?.balance || 0).toLocaleString()}</span>
            </div>
            <Button 
              onClick={() => {
                console.log('Add Funds clicked, opening modal...');
                setIsWalletDepositOpen(true);
              }} 
              className="w-full bg-primary hover:bg-primary/90 text-white"
            >
              Add Funds
            </Button>
          </div>
        </div>
      </Card>

      {isClient && (
        <>
          {/* Deposit Modal */}
          <Dialog open={isWalletDepositOpen} onOpenChange={setIsWalletDepositOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add to Donation Pool</DialogTitle>
                <DialogDescription>
                  Add funds to your donation pool - these can only be used for helping others
                </DialogDescription>
              </DialogHeader>
              <WalletDepositForm 
                onSuccess={(newBalance) => {
                  console.log('Deposit success, new balance:', newBalance);
                  setWallet(prev => ({
                    ...prev,
                    depositWallet: {
                      balance: newBalance,
                      name: prev.depositWallet?.name || "Donation Pool"
                    }
                  }));
                  setIsWalletDepositOpen(false);
                }}
                onClose={() => {
                  console.log('Closing deposit modal');
                  setIsWalletDepositOpen(false);
                }}
                isDepositWallet={true}
              />
            </DialogContent>
          </Dialog>

          {/* Withdraw Modal */}
          <Dialog open={isWalletWithdrawOpen} onOpenChange={setIsWalletWithdrawOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Withdraw from Wallet</DialogTitle>
                <DialogDescription>
                  Withdraw funds to your M-Pesa account
                </DialogDescription>
              </DialogHeader>
              <WalletWithdrawForm 
                onClose={() => setIsWalletWithdrawOpen(false)} 
                walletBalance={wallet.balance}
              />
            </DialogContent>
          </Dialog>
        </>
      )}

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
                        {totalPoints} / {nextLevelPoints} XP
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
                              <span>Points: {totalPoints}</span>
                            </div>
                            <Progress 
                              value={progressPercentage} 
                              className="h-2 dark:bg-gray-800" 
                            />
                            <p className="text-sm text-muted-foreground mt-1">
                              {pointsToNextLevel} points needed for Level {stats.level + 1}
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
              <Progress value={(totalPoints / (stats.level * 1000)) * 100} className="h-2 dark:bg-gray-800" />
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

            <div className="bg-secondary/20
                            dark:bg-gray-800
                            p-3 rounded-lg shadow-sm hover:shadow
                            transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="w-4 h-4 text-primary" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Request Amount</span>
              </div>
              {(() => {
                const totalDonated = stats.calculatedTotalDonated || stats.totalDonated || 0;
                const totalReceived = stats.totalReceived || 0;
                // console.log('Stats values:', {
                //   calculatedTotalDonated: stats.calculatedTotalDonated,
                //   totalDonated: stats.totalDonated,
                //   totalReceived: stats.totalReceived,
                //   finalTotalDonated: totalDonated,
                //   finalTotalReceived: totalReceived
                // });
                const requestAmount = calculateRequestAmount(totalDonated, totalReceived);
                const netAmount = totalDonated - totalReceived;
                return (
                  <>
                    <p className={`text-lg font-semibold ${netAmount < 0 ? 'text-red-500' : 'text-primary'}`}>
                      KES {requestAmount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Based on 110% of your net contributions (total donated - total received)
                    </p>
                  </>
                );
              })()}
            </div>

            <div className="bg-secondary/10 dark:bg-gray-800/50 p-4 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-primary dark:text-gray-200 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Level Progress
                </h3>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-xs">
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Detailed Impact Statistics</DialogTitle>
                      <DialogDescription>
                        Your complete contribution and impact metrics
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {/* Giving Impact */}
                      <div className="space-y-3 p-4 bg-secondary/10 dark:bg-gray-800/50 rounded-lg">
                        <h4 className="font-medium text-primary flex items-center gap-2">
                          <HandHeart className="w-4 h-4" />
                          Giving Impact
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Total Amount Given</span>
                            <span className="font-medium">KES {(stats.calculatedTotalDonated || stats.totalDonated || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">People Helped</span>
                            <span className="font-medium">{stats.calculatedDonationCount || stats.donationCount || 0}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Average Donation</span>
                            <span className="font-medium">
                              KES {stats.calculatedDonationCount ? 
                                Math.round((stats.calculatedTotalDonated || 0) / stats.calculatedDonationCount).toLocaleString() : 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Level Progress */}
                      <div className="space-y-3 p-4 bg-secondary/10 dark:bg-gray-800/50 rounded-lg">
                        <h4 className="font-medium text-primary flex items-center gap-2">
                          <Trophy className="w-4 h-4" />
                          Level & Points
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Current Level</span>
                            <span className="font-medium">{stats.level}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Total Points</span>
                            <span className="font-medium">{totalPoints.toLocaleString()} XP</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Next Level At</span>
                            <span className="font-medium">
                              {nextLevelPoints.toLocaleString()} XP
                            </span>
                          </div>
                        </div>
                        <Progress 
                          value={progressPercentage} 
                          className="h-2" 
                        />
                      </div>

                      {/* Account Limits */}
                      <div className="space-y-3 p-4 bg-secondary/10 dark:bg-gray-800/50 rounded-lg">
                        <h4 className="font-medium text-primary flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          Account Limits
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Max Request Amount</span>
                            <span className="font-medium">KES {LEVEL_PERKS[stats.level as LevelNumber]?.maxAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Active Perks</span>
                            <span className="font-medium">{LEVEL_PERKS[stats.level as LevelNumber]?.perks.length || 0}</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">{LEVEL_PERKS[stats.level as LevelNumber]?.limit}</p>
                      </div>

                      {/* Current Perks */}
                      <div className="space-y-3 p-4 bg-secondary/10 dark:bg-gray-800/50 rounded-lg">
                        <h4 className="font-medium text-primary flex items-center gap-2">
                          <Star className="w-4 h-4" />
                          Current Perks
                        </h4>
                        <ul className="space-y-2">
                          {LEVEL_PERKS[stats.level as LevelNumber]?.perks.map((perk, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm">
                              {perk.icon}
                              <span className="text-gray-600 dark:text-gray-400">{perk.text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>Progress to Level {stats.level + 1}</span>
                  <span>{progressPercentage.toFixed(2)}%</span>
                </div>
                <Progress 
                  value={progressPercentage} 
                  className="h-2 dark:bg-gray-800" 
                />
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col gap-1">
                    <span>Current: {totalPoints} points</span>
                    <span>Next Level: {nextLevelPoints} points</span>
                    <span>Remaining: {pointsToNextLevel} points</span>
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
    </div>
  );
};
