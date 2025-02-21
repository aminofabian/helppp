import { NextResponse } from 'next/server';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from '@/app/lib/db';

export async function GET() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const count = await prisma.notification.count({
      where: { 
        recipientId: user.id,
        read: false
      }
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error fetching notifications count:", error);
    return NextResponse.json({ error: 'Failed to fetch notifications count' }, { status: 500 });
  }
}