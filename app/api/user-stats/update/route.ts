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

    // Get existing user with their points
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        points: true
      }
    });

    if (!existingUser) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Start a transaction to ensure data consistency
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Create points entry connected to payment
      const pointsEntry = await tx.points.create({
        data: {
          amount: points,
          user: {
            connect: { id: userId }
          },
          payment: {
            connect: { id: donationType }
          }
        }
      });

      // Update user stats
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          totalDonated: {
            increment: amount
          },
          donationCount: {
            increment: 1
          }
        },
        include: {
          points: true
        }
      });

      return updatedUser;
    });

    // Calculate total points and new level
    const totalPoints = updatedUser.points.reduce((acc, point) => acc + point.amount, 0);
    const newLevel = calculateLevel(totalPoints);

    // Update level if changed
    if (newLevel !== updatedUser.level) {
      await prisma.user.update({
        where: { id: userId },
        data: { level: newLevel }
      });
    }

    return NextResponse.json({
      success: true,
      totalDonated: updatedUser.totalDonated,
      donationCount: updatedUser.donationCount,
      points: totalPoints,
      level: newLevel
    });

  } catch (error) {
    console.error('Error updating user stats:', error);
    return new NextResponse('Internal Error', { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 