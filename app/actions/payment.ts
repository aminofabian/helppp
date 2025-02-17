import prisma from '@/app/lib/db';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { PaymentMethod, PaymentStatus, NotificationType } from '@prisma/client';

export async function createPayment(answerId: string, amount: number, currency: string, method: PaymentMethod) {
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
        paymentMethod: method,
        status: PaymentStatus.PENDING,
        userts: new Date(),
        userId,
        answer: {
          connect: {
            id: answerId
          }
        }
      },
      include: {
        answer: {
          include: {
            user: true
          }
        }
      }
    });

    // Create notification for answer creator
    if (payment.answer?.user?.id) {
      await prisma.notification.create({
        data: {
          type: NotificationType.PAYMENT_RECEIVED,
          title: 'New payment received!',
          content: `Someone has sent a payment of ${currency} ${amount} for your answer.`,
          recipientId: payment.answer.user.id,
          issuerId: userId,
          requestId: payment.answer.prayerId
        }
      });
    }

    return payment;
  } catch (error) {
    console.error('Error creating payment:', error);
    throw error;
  }
}

export async function updatePaymentStatus(paymentId: string, status: PaymentStatus, transactionDate?: Date) {
  try {
    const payment = await prisma.payment.update({
      where: {
        id: paymentId,
      },
      data: {
        status,
        transactionDate,
      },
      include: {
        answer: {
          include: {
            user: true
          }
        },
        sender: true
      }
    });

    if (status === PaymentStatus.PENDING && payment.answer?.user?.id && payment.userId) {
      // Create notifications
      await prisma.$transaction([
        // Notify answer creator
        prisma.notification.create({
          data: {
            type: NotificationType.PAYMENT_COMPLETED,
            title: 'Payment completed!',
            content: `The payment of ${payment.currency} ${payment.amount} has been completed.`,
            recipientId: payment.answer.user.id,
            issuerId: payment.userId,
            requestId: payment.answer.prayerId
          }
        }),
        // Notify sender
        prisma.notification.create({
          data: {
            type: NotificationType.PAYMENT_SENT,
            title: 'Payment sent successfully!',
            content: `Your payment of ${payment.currency} ${payment.amount} has been sent successfully.`,
            recipientId: payment.userId,
            issuerId: payment.answer.user.id,
            requestId: payment.answer.prayerId
          }
        })
      ]);
    }

    return payment;
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
} 