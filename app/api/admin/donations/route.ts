import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

export async function GET() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  // Double-check authentication (even though middleware should handle this)
  if (!user?.email || !process.env.ADMIN_EMAILS?.includes(user.email)) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const donations = await prisma.donation.findMany({
      select: {
        id: true,
        userId: true,
        amount: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Limit to last 100 donations for performance
    });

    return NextResponse.json(donations);
  } catch (error) {
    console.error('Error fetching donations:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
