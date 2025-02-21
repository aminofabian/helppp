import { db } from "@/lib/db";
import { calculateLevel } from "./levelCalculator";

export interface PointsTransaction {
  userId: string;
  amount: number;
  type: 'DONATION' | 'BONUS' | 'REFERRAL' | 'STREAK';
  description: string;
  metadata?: any;
}

export interface DonationStats {
  totalDonated: number;
  donationCount: number;
  points: number;
  level: number;
  rank?: string;
  streak?: number;
}

const POINTS_MULTIPLIERS = {
  DONATION: 1, // Base multiplier for donations (1 point per 50 KES)
  STREAK: {
    3: 1.1,  // 10% bonus for 3-day streak
    7: 1.25, // 25% bonus for 7-day streak
    14: 1.5, // 50% bonus for 14-day streak
    30: 2,   // 100% bonus for 30-day streak
  },
  FIRST_TIME_BONUS: 10,  // Bonus points for first donation
  LARGE_DONATION_BONUS: { // Additional bonus points for large donations
    1000: 5,   // 5 bonus points for donations >= 1000 KES
    5000: 20,  // 20 bonus points for donations >= 5000 KES
    10000: 50, // 50 bonus points for donations >= 10000 KES
  }
};

export async function calculateDonationPoints(amount: number, userId: string): Promise<number> {
  let totalPoints = Math.floor(amount / 50); // Base points calculation

  // Get user's donation history
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      donations: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  // First-time donor bonus
  if (!user?.donations.length) {
    totalPoints += POINTS_MULTIPLIERS.FIRST_TIME_BONUS;
  }

  // Large donation bonus
  for (const [threshold, bonus] of Object.entries(POINTS_MULTIPLIERS.LARGE_DONATION_BONUS)) {
    if (amount >= parseInt(threshold)) {
      totalPoints += bonus;
      break; // Only apply the highest applicable bonus
    }
  }

  // Check donation streak
  const streak = await calculateDonationStreak(userId);
  if (streak) {
    // Apply streak multiplier
    for (const [days, multiplier] of Object.entries(POINTS_MULTIPLIERS.STREAK)) {
      if (streak >= parseInt(days)) {
        totalPoints = Math.floor(totalPoints * multiplier);
        break; // Only apply the highest applicable multiplier
      }
    }
  }

  return totalPoints;
}

async function calculateDonationStreak(userId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastDonations = await db.donation.findMany({
    where: {
      userId,
      status: 'COMPLETED',
      createdAt: {
        gte: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!lastDonations.length) return 0;

  let streak = 1;
  let currentDate = new Date(lastDonations[0].createdAt);
  currentDate.setHours(0, 0, 0, 0);

  for (let i = 1; i < lastDonations.length; i++) {
    const donationDate = new Date(lastDonations[i].createdAt);
    donationDate.setHours(0, 0, 0, 0);

    const daysDifference = Math.floor((currentDate.getTime() - donationDate.getTime()) / (24 * 60 * 60 * 1000));

    if (daysDifference === 1) {
      streak++;
      currentDate = donationDate;
    } else {
      break;
    }
  }

  return streak;
}

export async function processPointsTransaction(transaction: PointsTransaction) {
  const { userId, amount, type, description, metadata } = transaction;

  try {
    // Create points transaction record
    const pointsTransaction = await db.pointsTransaction.create({
      data: {
        userId,
        amount,
        type,
        description,
        metadata,
      },
    });

    // Update user's total points
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });

    const newTotalPoints = (user?.points || 0) + amount;
    const newLevel = calculateLevel(newTotalPoints);

    // Update user's points and level
    await db.user.update({
      where: { id: userId },
      data: {
        points: newTotalPoints,
        level: newLevel,
      },
    });

    // If it's a level up, create a notification
    const currentLevel = calculateLevel(user?.points || 0);
    if (newLevel > currentLevel) {
      await db.notification.create({
        data: {
          userId,
          type: 'LEVEL_UP',
          title: '🎉 Level Up!',
          message: `Congratulations! You've reached Level ${newLevel}!`,
          metadata: {
            oldLevel: currentLevel,
            newLevel,
            pointsNeeded: calculatePointsToNextLevel(newTotalPoints),
          },
        },
      });
    }

    return { success: true, points: amount, newTotal: newTotalPoints, newLevel };
  } catch (error) {
    console.error('Error processing points transaction:', error);
    return { success: false, error };
  }
}

export async function getUserDonationStats(userId: string): Promise<DonationStats> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      _count: {
        select: { donations: true },
      },
      donations: {
        where: { status: 'COMPLETED' },
        select: { amount: true },
      },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const totalDonated = user.donations.reduce((sum, donation) => sum + donation.amount, 0);
  const streak = await calculateDonationStreak(userId);

  return {
    totalDonated,
    donationCount: user._count.donations,
    points: user.points || 0,
    level: user.level || 1,
    streak,
  };
}

function calculatePointsToNextLevel(currentPoints: number): number {
  for (let i = 0; i < LEVEL_THRESHOLDS.length - 1; i++) {
    if (currentPoints >= LEVEL_THRESHOLDS[i + 1].points && 
        currentPoints < LEVEL_THRESHOLDS[i].points) {
      return LEVEL_THRESHOLDS[i].points - currentPoints;
    }
  }
  return 0; // Already at max level
}
