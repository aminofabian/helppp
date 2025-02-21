import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { calculateLevel } from '@/app/lib/levelCalculator';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { userId, amount, points, donationType } = await req.json();
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    // Ensure user is authenticated and matches the request
    if (!user?.id || user.id !== userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get existing user
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        totalDonated: true,
        donationCount: true,
        points: true,
        level: true
      }
    });

    if (!existingUser) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Calculate new total points
    const newPoints = {
      amount: points,
      createdAt: new Date(),
      type: 'donation'
    };

    // Update user stats
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        totalDonated: (existingUser.totalDonated || 0) + amount,
        donationCount: (existingUser.donationCount || 0) + 1,
        points: {
          create: {
            amount: points,
            payment: {
              connect: {
                id: donationType // assuming this is the payment ID
              }
            }
          }
        }
      },
      include: {
        points: true
      }
    });

    // Calculate total points and update level if needed
    const totalPoints = updatedUser.points.reduce((acc, point) => acc + point.amount, 0);
    const newLevel = calculateLevel(totalPoints);

    if (newLevel !== updatedUser.level) {
      await prisma.user.update({
        where: { id: userId },
        data: { level: newLevel }
      });
    }

    return NextResponse.json({
      totalDonated: updatedUser.totalDonated,
      donationCount: updatedUser.donationCount,
      points: totalPoints,
      level: newLevel
    });
  } catch (error) {
    console.error('Error updating user stats:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 