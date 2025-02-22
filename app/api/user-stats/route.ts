import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { calculateLevel } from "@/app/lib/levelCalculator";
import { unstable_noStore as noStore } from "next/cache";

export async function GET(req: NextRequest) {
  noStore();
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log(`Fetching stats for user: ${userId}`);

    // Get user with their points and donations
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        points: true,
        donations: {
          where: { status: 'COMPLETED' }
        }
      }
    });

    if (!user) {
      console.log(`User not found: ${userId}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate total points
    const totalPoints = user.points.reduce((sum, point) => sum + point.amount, 0);

    // Calculate donation stats
    const donationStats = {
      totalDonated: user.totalDonated || 0,
      donationCount: user.donationCount || 0,
      calculatedTotalDonated: user.donations.reduce((sum, d) => sum + d.amount, 0),
      calculatedDonationCount: user.donations.length,
      points: user.points,
      level: user.level || calculateLevel(totalPoints)
    };

    console.log(`Stats for user ${userId}:`, donationStats);

    return NextResponse.json(donationStats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    );
  }
}