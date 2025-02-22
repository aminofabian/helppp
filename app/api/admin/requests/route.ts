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
    const { requestId, extensionDays, action } = body;

    if (!requestId) {
      return new NextResponse('Invalid request data', { status: 400 });
    }

    const existingRequest = await prisma.request.findUnique({
      where: { id: requestId },
      select: { id: true, status: true, deadline: true }
    });

    if (!existingRequest) {
      return new NextResponse('Request not found', { status: 404 });
    }

    let updatedRequest;

    switch (action) {
      case 'extend':
        if (!extensionDays || extensionDays <= 0) {
          return new NextResponse('Invalid extension days', { status: 400 });
        }
        const currentDeadline = new Date(existingRequest.deadline);
        const newDeadline = new Date(currentDeadline);
        newDeadline.setDate(currentDeadline.getDate() + extensionDays);
        
        updatedRequest = await prisma.request.update({
          where: { id: requestId },
          data: { deadline: newDeadline },
        });
        break;

      case 'close':
        updatedRequest = await prisma.request.update({
          where: { id: requestId },
          data: { status: 'CLOSED' },
        });
        break;

      case 'block':
        updatedRequest = await prisma.request.update({
          where: { id: requestId },
          data: { status: 'BLOCKED' },
        });
        break;

      case 'delete':
        // First delete all associated records
        await prisma.$transaction([
          prisma.vote.deleteMany({ where: { requestId } }),
          prisma.comment.deleteMany({ where: { requestId } }),
          prisma.donation.deleteMany({ where: { requestId } }),
          prisma.notification.deleteMany({ where: { requestId } }),
          prisma.request.delete({ where: { id: requestId } }),
        ]);
        return new NextResponse(JSON.stringify({ message: 'Request deleted successfully' }));

      default:
        return new NextResponse('Invalid action', { status: 400 });
    }

    // Fetch the updated request with all necessary data
    const enrichedRequest = await prisma.request.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        title: true,
        amount: true,
        createdAt: true,
        deadline: true,
        status: true,
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

    if (!enrichedRequest) {
      return new NextResponse('Failed to fetch updated request', { status: 500 });
    }

    const now = new Date();
    const createdDate = new Date(enrichedRequest.createdAt);
    const deadlineDate = new Date(enrichedRequest.deadline);
    const daysRunning = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysUntilDeadline = Math.floor((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const totalDonated = enrichedRequest.donations.reduce((sum, d) => sum + d.amount, 0);

    return NextResponse.json({
      ...enrichedRequest,
      user: enrichedRequest.User,
      totalDonated,
      isFullyFunded: totalDonated >= enrichedRequest.amount,
      daysRunning,
      daysUntilDeadline,
      isExpired: now > deadlineDate
    });

  } catch (error) {
    console.error('Error updating request:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
