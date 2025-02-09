import prisma from '@/app/lib/db';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { PaymentMethod, PaymentStatus, NotificationType } from '@prisma/client';

export async function createPayment(requestId: string, amount: number, currency: string, method: string) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    const userId = user?.id;
    if (!userId) {
      throw new Error('Unauthorized');
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        amount,
        currency,
        paymentMethod: method as PaymentMethod,
        status: PaymentStatus.PENDING,
        userts: new Date(),
        request: {
          connect: {
            id: requestId
          }
        },
        sender: {
          connect: {
            id: userId
          }
        }
      },
      include: {
        request: {
          include: {
            User: true
          }
        },
        sender: true
      }
    });

    // Create notification for request creator
    if (payment.request?.userId) {
      await prisma.notification.create({
        data: {
          type: NotificationType.PAYMENT_RECEIVED,
          recipientId: payment.request.userId,
          issuerId: userId,
          requestId: requestId,
          read: false
        }
      });
    }

    return payment;
  } catch (error) {
    console.error('[CREATE_PAYMENT]', error);
    throw error;
  }
}

export async function updatePaymentStatus(paymentId: string, status: string, transactionId?: string) {
  try {
    const payment = await prisma.payment.update({
      where: {
        id: paymentId
      },
      data: {
        status: status as PaymentStatus,
        merchantRequestId: transactionId,
        ...(status === PaymentStatus.COMPLETED && {
          request: {
            update: {
              status: 'ANSWERED'
            }
          }
        })
      },
      include: {
        request: {
          include: {
            User: true
          }
        },
        sender: true
      }
    });

    if (status === PaymentStatus.COMPLETED && payment.request?.userId) {
      // Update user stats
      await prisma.$transaction([
        // Update sender's stats
        prisma.user.update({
          where: { id: payment.userId },
          data: {
            totalDonated: {
              increment: payment.amount
            },
            donationCount: {
              increment: 1
            }
          }
        })
      ]);

      // Create notifications
      await prisma.$transaction([
        // Notify request creator
        prisma.notification.create({
          data: {
            type: NotificationType.PAYMENT_COMPLETED,
            recipientId: payment.request.userId,
            issuerId: payment.userId,
            requestId: payment.requestId,
            read: false
          }
        }),
        // Notify sender
        prisma.notification.create({
          data: {
            type: NotificationType.PAYMENT_SENT,
            recipientId: payment.userId,
            issuerId: payment.userId,
            requestId: payment.requestId,
            read: false
          }
        })
      ]);
    }

    return payment;
  } catch (error) {
    console.error('[UPDATE_PAYMENT_STATUS]', error);
    throw error;
  }
}