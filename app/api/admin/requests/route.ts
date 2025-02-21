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
    const requests = await prisma.request.findMany({
      select: {
        id: true,
        title: true,
        amount: true,
        createdAt: true,
        deadline: true,
        donations: {
          select: {
            amount: true,
            status: true,
          },
          where: {
            status: 'COMPLETED'
          }
        },
        User: {
          select: {
            email: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const now = new Date();

    const requestsWithTotalDonations = requests.map(request => {
      const createdDate = new Date(request.createdAt);
      const deadlineDate = new Date(request.deadline);
      const daysRunning = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysUntilDeadline = Math.floor((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        ...request,
        user: request.User,
        totalDonated: request.donations.reduce((sum, d) => sum + d.amount, 0),
        isFullyFunded: request.donations.reduce((sum, d) => sum + d.amount, 0) >= request.amount,
        daysRunning,
        daysUntilDeadline,
        isExpired: now > deadlineDate
      };
    });

    return NextResponse.json(requestsWithTotalDonations);
  } catch (error) {
    console.error('Error fetching requests:', error);
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
    const { requestId, extensionDays } = body;

    if (!requestId || !extensionDays || extensionDays <= 0) {
      return new NextResponse('Invalid request data', { status: 400 });
    }

    const existingRequest = await prisma.request.findUnique({
      where: { id: requestId },
      select: { deadline: true }
    });

    if (!existingRequest) {
      return new NextResponse('Request not found', { status: 404 });
    }

    const currentDeadline = new Date(existingRequest.deadline);
    const newDeadline = new Date(currentDeadline);
    newDeadline.setDate(currentDeadline.getDate() + extensionDays);

    const updatedRequest = await prisma.request.update({
      where: { id: requestId },
      data: { deadline: newDeadline },
      select: {
        id: true,
        title: true,
        amount: true,
        createdAt: true,
        deadline: true,
        donations: {
          select: {
            amount: true,
            status: true,
          },
          where: {
            status: 'COMPLETED'
          }
        },
        User: {
          select: {
            email: true,
          }
        }
      },
    });

    const now = new Date();
    const createdDate = new Date(updatedRequest.createdAt);
    const deadlineDate = new Date(updatedRequest.deadline);
    const daysRunning = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysUntilDeadline = Math.floor((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const formattedRequest = {
      ...updatedRequest,
      user: updatedRequest.User,
      totalDonated: updatedRequest.donations.reduce((sum, d) => sum + d.amount, 0),
      isFullyFunded: updatedRequest.donations.reduce((sum, d) => sum + d.amount, 0) >= updatedRequest.amount,
      daysRunning,
      daysUntilDeadline,
      isExpired: now > deadlineDate
    };

    return NextResponse.json(formattedRequest);
  } catch (error) {
    console.error('Error extending request deadline:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
