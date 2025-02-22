import prisma from "@/app/lib/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { generateUsername } from "unique-username-generator";
import { unstable_noStore as noStore } from "next/cache";

export async function GET(req: NextRequest) {
  noStore();
  console.log('Auth creation route triggered');
  
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    console.log('Kinde user data:', {
      id: user?.id,
      email: user?.email,
      given_name: user?.given_name,
      family_name: user?.family_name
    });

    if (!user || user === null || !user.id) {
      console.error('Invalid user data from Kinde');
      return NextResponse.json(
        { error: "Invalid user data" },
        { status: 400 }
      );
    }

    console.log('Checking for existing user:', user.id);
    let dbUser = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
      include: {
        points: true
      }
    });

    if (!dbUser) {
      console.log('Creating new user:', user.id);
      try {
        dbUser = await prisma.user.create({
          data: {
            id: user.id,
            email: user.email ?? "",
            firstName: user.given_name ?? "",
            lastName: user.family_name ?? "",
            imageUrl: user.picture,
            userName: generateUsername("-", 3, 15),
            level: 1,
            totalDonated: 0,
            donationCount: 0,
            points: {
              create: [] // Start with empty points array
            }
          },
          include: {
            points: true
          }
        });

        console.log('Successfully created new user with stats:', {
          userId: dbUser.id,
          level: dbUser.level,
          totalDonated: dbUser.totalDonated,
          donationCount: dbUser.donationCount,
          pointsCount: dbUser.points.length
        });
      } catch (createError) {
        console.error('Error creating user:', createError);
        return NextResponse.json(
          { error: "Failed to create user" },
          { status: 500 }
        );
      }
    } else {
      console.log('Found existing user:', {
        userId: dbUser.id,
        level: dbUser.level,
        totalDonated: dbUser.totalDonated,
        donationCount: dbUser.donationCount,
        pointsCount: dbUser.points.length
      });
    }

    const redirectUrl = process.env.NODE_ENV === "development"
      ? "http://localhost:3000/"
      : "https://fitrii.com/";
    
    console.log('Redirecting to:', redirectUrl);
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Auth creation error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}