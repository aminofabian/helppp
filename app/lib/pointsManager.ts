import { calculateLevel } from './levelCalculator';
import { prisma } from '@/app/lib/db';
import { NotificationType, PaymentStatus } from '@prisma/client';

export interface PointsTransaction {
  userId: string;
  amount: number;
  paymentId: string;
  description?: string;
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
  const completedDonations = await prisma.donation.count({
    where: {
      userId,
      status: PaymentStatus.COMPLETED
    }
  });

  // First-time donor bonus
  if (completedDonations === 0) {
    console.log(`First-time donor bonus of ${POINTS_MULTIPLIERS.FIRST_TIME_BONUS} points awarded`);
    totalPoints += POINTS_MULTIPLIERS.FIRST_TIME_BONUS;
  }

  // Large donation bonus
  for (const [threshold, bonus] of Object.entries(POINTS_MULTIPLIERS.LARGE_DONATION_BONUS)) {
    if (amount >= parseInt(threshold)) {
      console.log(`Large donation bonus of ${bonus} points awarded for amount >= ${threshold}`);
      totalPoints += bonus;
    }
  }

  // Streak bonus
  const streak = await calculateDonationStreak(userId);
  console.log(`Current donation streak: ${streak} days`);
  
  for (const [days, multiplier] of Object.entries(POINTS_MULTIPLIERS.STREAK)) {
    if (streak >= parseInt(days)) {
      const oldPoints = totalPoints;
      totalPoints = Math.floor(totalPoints * multiplier);
      console.log(`Streak bonus: ${days} days streak (${multiplier}x) increased points from ${oldPoints} to ${totalPoints}`);
      break; // Only apply the highest streak multiplier
    }
  }

  console.log(`Final points calculation: ${totalPoints} points for ${amount} KES donation`);
  return totalPoints;
}

async function calculateDonationStreak(userId: string): Promise<number> {
  const donations = await prisma.donation.findMany({
    where: { 
      userId,
      status: PaymentStatus.COMPLETED
    },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true }
  });

  if (!donations.length) return 0;

  let streak = 1;
  const oneDayMs = 24 * 60 * 60 * 1000;
  const threeDaysMs = 3 * oneDayMs;

  for (let i = 0; i < donations.length - 1; i++) {
    const currentDonation = donations[i].createdAt;
    const nextDonation = donations[i + 1].createdAt;
    const timeDiff = currentDonation.getTime() - nextDonation.getTime();

    if (timeDiff <= threeDaysMs) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export async function processPointsTransaction(transaction: PointsTransaction) {
  const { userId, amount, paymentId, description } = transaction;

  console.log(`Processing points transaction:`, {
    userId,
    amount,
    paymentId,
    description
  });

  try {
    // Check if points were already awarded for this payment
    const existingPoints = await prisma.points.findFirst({
      where: { paymentId }
    });

    if (existingPoints) {
      console.log(`Points already awarded for payment ${paymentId}:`, existingPoints);
      return;
    }

    // Create points record
    const points = await prisma.points.create({
      data: {
        userId,
        amount,
        paymentId
      }
    });

    console.log(`Created points record:`, points);

    // Update user's total points and level
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        points: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const totalPoints = user.points.reduce((sum, p) => sum + p.amount, 0);
    const newLevel = calculateLevel(totalPoints);

    console.log(`User stats:`, {
      userId,
      currentLevel: user.level,
      newLevel,
      totalPoints
    });

    // Update user level if changed
    if (newLevel !== user.level) {
      await prisma.user.update({
        where: { id: userId },
        data: { 
          level: newLevel,
          totalDonated: user.totalDonated + amount,
          donationCount: user.donationCount + 1
        }
      });

      // Create level up notification
      await prisma.notification.create({
        data: {
          recipientId: userId,
          issuerId: userId,
          type: NotificationType.PAYMENT_COMPLETED,
          title: 'Level Up! 🎉',
          content: `Congratulations! You've reached Level ${newLevel}! You now have ${totalPoints} total points.`
        }
      });

      console.log(`User leveled up from ${user.level} to ${newLevel}`);
    } else {
      // Update donation stats even if level didn't change
      await prisma.user.update({
        where: { id: userId },
        data: { 
          totalDonated: user.totalDonated + amount,
          donationCount: user.donationCount + 1
        }
      });
    }
  } catch (error) {
    console.error('Error processing points transaction:', error);
    throw error;
  }
}

export async function getUserDonationStats(userId: string): Promise<DonationStats> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      donations: {
        where: { status: PaymentStatus.COMPLETED }
      },
      points: true
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  const totalPoints = user.points.reduce((sum, p) => sum + p.amount, 0);
  const streak = await calculateDonationStreak(userId);

  return {
    totalDonated: user.totalDonated || 0,
    donationCount: user.donationCount || 0,
    points: totalPoints,
    level: user.level,
    streak
  };
}

export function calculatePointsToNextLevel(currentPoints: number): number {
  const currentLevel = calculateLevel(currentPoints);
  const nextLevelPoints = currentLevel * 1000;
  return nextLevelPoints - currentPoints;
}
