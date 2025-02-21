import { NextResponse } from 'next/server';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "@/app/lib/db";

export async function POST() {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create a test notification
    const notification = await prisma.notification.create({
      data: {
        type: 'COMMENT',
        title: 'Test Notification',
        content: 'This is a test notification',
        recipientId: user.id,
        issuerId: user.id, // Using same user as issuer for test
        read: false,
      },
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error('Error creating test notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
