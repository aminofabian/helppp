import { NextResponse } from 'next/server';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "@/app/lib/db";

export async function GET() {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user?.id) {
      console.log('No user found in session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Fetching notifications for user:', user.id);

    const notifications = await prisma.notification.findMany({
      where: {
        recipientId: user.id,
      },
      include: {
        issuer: {
          select: {
            firstName: true,
            lastName: true,
          }
        },
        request: {
          select: {
            title: true,
          }
        },
        donation: {
          select: {
            amount: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to last 50 notifications
    });

    console.log('Found notifications:', notifications.length);
    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
