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
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        level: true,
        totalDonated: true,
        donationCount: true,
      },
      orderBy: {
        totalDonated: 'desc',
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  // Double-check authentication (even though middleware should handle this)
  if (!user?.email || !process.env.ADMIN_EMAILS?.includes(user.email)) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json();
    const { userId, level } = body;

    if (!userId || typeof level !== 'number' || level < 0) {
      return new NextResponse('Invalid request data', { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { level },
      select: {
        id: true,
        email: true,
        level: true,
        totalDonated: true,
        donationCount: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user level:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
