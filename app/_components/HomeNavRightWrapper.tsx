import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import prisma from '@/app/lib/db';
import HomeNavRight from './HomeNavRight';
import { redirect } from 'next/navigation';

async function getWalletData(userId: string) {
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    select: {
      balance: true,
    },
  });
  return wallet;
}

async function getUserStats(userId: string) {
  console.log('Fetching stats for user:', userId);
  
  // Debug: Check all donations in the system
  const allDonationsInSystem = await prisma.donation.findMany({
    select: {
      id: true,
      userId: true,
      amount: true,
      status: true,
      createdAt: true
    }
  });
  console.log('All donations in system:', allDonationsInSystem);

  // Get the base user stats
  const stats = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      level: true,
      totalDonated: true,
      donationCount: true,
      points: {
        select: {
          amount: true,
        }
      }
    }
  });

  // Calculate actual totals from paid donations
  const donations = await prisma.donation.aggregate({
    where: {
      userId: userId,
      status: {
        in: ['Paid', 'PAID', 'paid', 'COMPLETED', 'Completed', 'completed', 'SUCCESS', 'success']
      }
    },
    _count: {
      _all: true
    },
    _sum: {
      amount: true
    }
  });

  console.log('Donation aggregates for user:', userId, donations);

  const enrichedStats = {
    ...stats,
    calculatedDonationCount: donations._count._all,
    calculatedTotalDonated: donations._sum.amount || 0
  };

  console.log('Enriched user stats:', enrichedStats);
  return enrichedStats;
}

export default async function HomeNavRightWrapper() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user) {
    return redirect('/api/auth/login');
  }

  console.log('Current user:', user.id);
  const wallet = await getWalletData(user.id);
  const stats = await getUserStats(user.id);
  console.log('Initial stats being passed to HomeNavRight:', stats);

  return (
    <HomeNavRight
      initialUser={user}
      initialStats={{
        level: stats?.level ?? 1,
        totalDonated: stats?.totalDonated ?? 0,
        donationCount: stats?.donationCount ?? 0,
        points: stats?.points ?? [],
        calculatedDonationCount: stats?.calculatedDonationCount ?? 0,
        calculatedTotalDonated: stats?.calculatedTotalDonated ?? 0
      }}
      initialWallet={wallet || { balance: 0 }}
    />
  );
} 