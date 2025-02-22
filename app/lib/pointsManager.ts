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
  console.log(`Calculating points for donation of KES ${amount} by user ${userId}`);
  
  // Base points calculation (1 point per 50 KES)
  let totalPoints = Math.floor(amount / 50);
  console.log(`Base points from amount: ${totalPoints}`);

  // Get user's donation history
  const completedDonations = await prisma.donation.count({
    where: {
      userId,
      status: PaymentStatus.COMPLETED
    }
  });
  console.log(`User has ${completedDonations} completed donations`);

  // First-time donor bonus (10 points)
  if (completedDonations === 0) {
    totalPoints += POINTS_MULTIPLIERS.FIRST_TIME_BONUS;
    console.log(`First-time donor bonus added: +${POINTS_MULTIPLIERS.FIRST_TIME_BONUS} points`);
  }

  // Large donation bonuses
  for (const [threshold, bonus] of Object.entries(POINTS_MULTIPLIERS.LARGE_DONATION_BONUS)) {
    if (amount >= parseInt(threshold)) {
      totalPoints += bonus;
      console.log(`Large donation bonus for ${threshold} KES: +${bonus} points`);
    }
  }

  // Calculate streak bonus
  const streak = await calculateDonationStreak(userId);
  console.log(`Current donation streak: ${streak} days`);
  
  let streakMultiplier = 1;
  for (const [days, multiplier] of Object.entries(POINTS_MULTIPLIERS.STREAK)) {
    if (streak >= parseInt(days)) {
      streakMultiplier = multiplier;
      console.log(`Applied streak multiplier: ${multiplier}x for ${days}+ day streak`);
    }
  }

  // Apply streak multiplier
  const finalPoints = Math.floor(totalPoints * streakMultiplier);
  console.log(`Final points after streak multiplier: ${finalPoints}`);

  return finalPoints;
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
  const { userId, amount, paymentId } = transaction;

  console.log(`Processing points transaction for user ${userId}:`, {
    amount,
    paymentId
  });

  try {
    // Check if points were already awarded for this payment
    const existingPoints = await prisma.points.findFirst({
      where: { paymentId }
    });

    if (existingPoints) {
      console.log(`Points already awarded for payment ${paymentId}:`, existingPoints);
      return existingPoints;
    }

    // Calculate points to award
    const pointsToAward = await calculateDonationPoints(amount, userId);
    console.log(`Calculated points to award: ${pointsToAward}`);

    // Create points record
    const points = await prisma.points.create({
      data: {
        userId,
        amount: pointsToAward,
        paymentId
      }
    });

    console.log(`Created points record:`, points);

    // Get user's current stats
    const userStats = await getUserDonationStats(userId);
    const newTotalPoints = userStats.points + pointsToAward;
    const newLevel = calculateLevel(newTotalPoints);

    // Update user in a single transaction
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        level: newLevel,
        totalDonated: {
          increment: amount
        },
        donationCount: {
          increment: 1
        }
      }
    });

    console.log(`Updated user stats:`, {
      userId,
      previousLevel: userStats.level,
      newLevel,
      previousPoints: userStats.points,
      newTotalPoints,
      pointsAwarded: pointsToAward
    });

    // Create level up notification if level changed
    if (newLevel > userStats.level) {
      await prisma.notification.create({
        data: {
          recipientId: userId,
          issuerId: userId,
          type: NotificationType.PAYMENT_COMPLETED,
          title: '🎉 Level Up!',
          content: `Congratulations! You earned ${pointsToAward} points and reached Level ${newLevel}! Your total points are now ${newTotalPoints}.`
        }
      });

      console.log(`User leveled up from ${userStats.level} to ${newLevel}`);
    } else {
      // Create points earned notification
      await prisma.notification.create({
        data: {
          recipientId: userId,
          issuerId: userId,
          type: NotificationType.PAYMENT_COMPLETED,
          title: '🌟 Points Earned!',
          content: `You earned ${pointsToAward} points for your donation! Your total points are now ${newTotalPoints}.`
        }
      });
    }

    return points;
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
