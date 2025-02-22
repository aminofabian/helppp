import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { unstable_noStore as noStore } from "next/cache";

export async function GET(req: NextRequest) {
  noStore();
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check for any running requests (not completed or failed)
    const runningRequest = await prisma.request.findFirst({
      where: {
        userId,
        status: {
          notIn: ['COMPLETED', 'FAILED', 'CANCELLED']
        }
      }
    });

    return NextResponse.json({
      hasRunningRequest: !!runningRequest,
      request: runningRequest
    });
  } catch (error) {
    console.error('Error checking running requests:', error);
    return NextResponse.json(
      { error: 'Failed to check running requests' },
      { status: 500 }
    );
  }
} 