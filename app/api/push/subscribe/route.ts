import { NextResponse } from 'next/server';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from '@/app/lib/db';
import webpush from 'web-push';

// Configure web-push with your VAPID keys
if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  throw new Error('VAPID keys must be set in environment variables');
}

webpush.setVapidDetails(
  'mailto:fabianngaira@gmail.com', // Using admin email from .env
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export async function POST(request: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await request.json();

    // Store the subscription in the database
    await prisma.pushSubscription.create({
      data: {
        userId: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      }
    });

    return NextResponse.json({ message: 'Subscription added successfully' });
  } catch (error) {
    console.error('Error storing push subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}