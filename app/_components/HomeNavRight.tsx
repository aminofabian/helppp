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
  
  const totalPoints = stats?.points.reduce((sum, point) => sum + point.amount, 0) || 0;
  const nextLevel = ((stats?.level || 1) + 1) * 1000;
  const progress = (totalPoints / nextLevel) * 100;

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
    <Card className="overflow-hidden bg-white dark:bg-gray-800 shadow-lg rounded-lg">
    <div className="p-6 space-y-6">
    <h1 className='text-sm font-medium text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300 p-3 rounded-lg shadow-inner text-center'>
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
    
    <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-4 rounded-lg space-y-2">
    <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
    <Trophy className="w-5 h-5 text-amber-500" />
    <span className="font-semibold">Level {stats?.level || 1}</span>
    </div>
    <div className="text-sm text-muted-foreground">
    {totalPoints} / {nextLevel} XP
    </div>
    </div>
    <Progress value={progress} className="h-2" />
    </div>
    
    <div className="grid grid-cols-2 gap-4">
    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg">
    <div className="flex items-center gap-2 mb-1">
    <HandHeart className="w-4 h-4 text-emerald-500" />
    <span className="text-sm text-gray-600 dark:text-gray-400">Total Given</span>
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
    <div className="bg-primary text-white p-4 rounded-lg">
    <div className="text-xs uppercase mb-1">Account balance</div>
    <div className="text-2xl font-bold">{wallet ? `${wallet.balance} KES` : '0 KES'}</div>
    <Dialog>
    <DialogTrigger asChild>
    <Button className="w-full mt-3 bg-green-500 hover:bg-green-600 text-white">
    Add funds
    </Button>
    </DialogTrigger>
    <DialogContent>
    <DialogHeader>
    <DialogTitle>Add Funds</DialogTitle>
    <DialogDescription>
    <B2CPaymentForm amountValue={wallet ? wallet.balance : 0} />
    </DialogDescription>
    </DialogHeader>
    </DialogContent>
    </Dialog>
    </div>
    
    <div className="bg-green-50 dark:bg-gray-700 p-4 rounded-lg">
    <div className="text-xs text-primary dark:text-gray-400 uppercase mb-1">Current balance</div>
    <div className="text-2xl font-bold text-primary dark:text-gray-200">{wallet ? `${wallet.balance} KES` : '0 KES'}</div>
    <div className="mt-3 grid grid-cols-2 gap-2">
    <Dialog>
    <DialogTrigger asChild>
    <Button variant="outline" className="w-full lowercase text-xs text-primary">Withdraw</Button>
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
    <Button variant="outline" className="w-full lowercase text-xs text-primary">Deposit</Button>
    </div>
    </div>
    </div>
    
    <Separator className='my-6' />
    
    <div className='space-y-4'>
    <Button className="w-full bg-primary hover:bg-green-600 text-white" asChild>
    <Link href='/c/eldoret/create'>
    <CreditCard className="w-4 h-4 mr-2" />
    Create a Help Request
    </Link>
    </Button>
    <Button variant='outline' className="w-full border-green-50 shadow-md text-primary hover:bg-green-100" asChild>
    <Link href='/c/create'>
    <Users className="w-4 h-4 mr-2 text-xs" />
    Create a Community
    </Link>
    </Button>
    </div>
    </div>
    </Card>
    <Card className='hidden sm:block w-full mt-4'>      
    <div className='sticky flex bottom-0 w-full justify-evenly gap-2 border-t bg-card p-3'>
    <MenuBar className='sticky flex bottom-0 w-full justify-evenly gap-2 border-t bg-card p-3'/>
    </div>
    </Card>
    </div>
  );
};

