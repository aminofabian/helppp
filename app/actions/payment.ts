import prisma from '@/app/lib/db';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function createPayment(prayerId: string, amount: number, currency: string, method: string) {
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
        method: method as any, // Cast to PaymentMethod enum
        status: 'PENDING',
        prayer: {
          connect: {
            id: prayerId
          }
        },
        sender: {
          connect: {
            id: userId
          }
        }
      },
      include: {
        prayer: {
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        sender: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Create notification for prayer creator
    await prisma.notification.create({
      data: {
        type: 'PAYMENT_RECEIVED',
        title: 'New payment received!',
        content: `${payment.sender.name || 'Someone'} has sent a payment of ${currency} ${amount} for your prayer.`,
        userId: payment.prayer.creatorId,
        paymentId: payment.id
      }
    });

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
        status: status as any, // Cast to PaymentStatus enum
        transactionId,
        ...(status === 'COMPLETED' && {
          prayer: {
            update: {
              status: 'ANSWERED',
              isOpen: false
            }
          }
        })
      },
      include: {
        prayer: {
          include: {
            creator: {
              select: {
                id: true
              }
            }
          }
        },
        sender: {
          select: {
            id: true
          }
        }
      }
    });

    if (status === 'COMPLETED') {
      // Update user stats
      await prisma.$transaction([
        // Update sender's stats
        prisma.user.update({
          where: { id: payment.sender.id },
          data: {
            totalDonated: {
              increment: payment.amount
            }
          }
        }),
        // Update receiver's stats
        prisma.user.update({
          where: { id: payment.prayer.creator.id },
          data: {
            totalReceived: {
              increment: payment.amount
            }
          }
        })
      ]);

      // Create notifications
      await prisma.$transaction([
        // Notify prayer creator
        prisma.notification.create({
          data: {
            type: 'PAYMENT_COMPLETED',
            title: 'Payment completed!',
            content: `The payment of ${payment.currency} ${payment.amount} has been completed.`,
            userId: payment.prayer.creator.id,
            paymentId: payment.id
          }
        }),
        // Notify sender
        prisma.notification.create({
          data: {
            type: 'PAYMENT_SENT',
            title: 'Payment sent successfully!',
            content: `Your payment of ${payment.currency} ${payment.amount} has been sent successfully.`,
            userId: payment.sender.id,
            paymentId: payment.id
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