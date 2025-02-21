import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  // Double-check authentication (even though middleware should handle this)
  if (!user?.email || !process.env.ADMIN_EMAILS?.includes(user.email)) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    // Calculate skip
    const skip = (page - 1) * limit;

    // Build where clause for search
    const where: Prisma.DonationWhereInput = search ? {
      OR: [
        {
          userId: {
            contains: search,
            mode: 'insensitive' as Prisma.QueryMode
          }
        },
        {
          status: {
            contains: search,
            mode: 'insensitive' as Prisma.QueryMode
          }
        }
      ]
    } : {};

    // Get total count for pagination
    const total = await prisma.donation.count({ where });

    // Get paginated donations
    const donations = await prisma.donation.findMany({
      where,
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
      skip,
      take: limit,
    });

    return NextResponse.json({
      donations,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit,
      }
    });
  } catch (error) {
    console.error('Error fetching donations:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
