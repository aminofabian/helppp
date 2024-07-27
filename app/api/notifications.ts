import { NextResponse } from 'next/server';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from '../lib/db';

export async function GET() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: { recipientId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

