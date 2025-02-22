import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { calculateLevel } from "@/app/lib/levelCalculator";
import { unstable_noStore as noStore } from "next/cache";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { generateUsername } from "unique-username-generator";

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
    let user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        points: true,
        donations: {
          where: { status: 'COMPLETED' }
        }
      }
    });

    // If user doesn't exist, try to create them using Kinde data
    if (!user) {
      console.log(`User ${userId} not found, attempting to create...`);
      const { getUser } = getKindeServerSession();
      const kindeUser = await getUser();

      if (kindeUser && kindeUser.id === userId) {
        try {
          user = await prisma.user.create({
            data: {
              id: kindeUser.id,
              email: kindeUser.email ?? "",
              firstName: kindeUser.given_name ?? "",
              lastName: kindeUser.family_name ?? "",
              imageUrl: kindeUser.picture,
              userName: generateUsername("-", 3, 15),
              level: 1,
              totalDonated: 0,
              donationCount: 0,
              points: {
                create: []
              }
            },
            include: {
              points: true,
              donations: {
                where: { status: 'COMPLETED' }
              }
            }
          });
          console.log(`Created new user ${userId} with default stats`);
        } catch (createError) {
          console.error(`Failed to create user ${userId}:`, createError);
          return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
        }
      } else {
        console.log(`No Kinde data found for user ${userId}`);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
    }

    // Ensure all required fields exist
    const totalPoints = user.points.reduce((sum, point) => sum + point.amount, 0);
    const calculatedDonationCount = user.donations.length;
    const calculatedTotalDonated = user.donations.reduce((sum, d) => sum + d.amount, 0);

    // Update user if any stats are missing
    if (!user.level || !user.totalDonated || !user.donationCount) {
      console.log(`Updating missing stats for user ${userId}`);
      user = await prisma.user.update({
        where: { id: userId },
        data: {
          level: user.level || calculateLevel(totalPoints),
          totalDonated: user.totalDonated || calculatedTotalDonated,
          donationCount: user.donationCount || calculatedDonationCount
        },
        include: {
          points: true,
          donations: {
            where: { status: 'COMPLETED' }
          }
        }
      });
    }

    // Prepare stats response
    const donationStats = {
      totalDonated: user.totalDonated || 0,
      donationCount: user.donationCount || 0,
      calculatedTotalDonated: calculatedTotalDonated,
      calculatedDonationCount: calculatedDonationCount,
      points: user.points,
      level: user.level || calculateLevel(totalPoints)
    };

    console.log(`Returning stats for user ${userId}:`, donationStats);

    return NextResponse.json(donationStats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    );
  }
}