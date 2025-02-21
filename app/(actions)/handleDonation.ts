'use server'

import { prisma } from "@/app/lib/db";
import { PaymentMethod, PaymentStatus, NotificationType } from "@prisma/client";
import { calculateDonationPoints, processPointsTransaction, getUserDonationStats } from "@/app/lib/pointsManager";

interface DonationData {
  amount: number;
  userId: string;
  requestId: string;
  paymentMethod: PaymentMethod;
  transactionId: string;
  email?: string;
  phoneNumber?: string;
}

export async function createDonationRequest(data: DonationData) {
  try {
    // Calculate potential points (will be awarded when payment completes)
    const potentialPoints = await calculateDonationPoints(data.amount, data.userId);

    // Create donation record
    const donation = await prisma.donation.create({
      data: {
        amount: data.amount,
        userId: data.userId,
        requestId: data.requestId,
        invoice: data.transactionId,
        status: PaymentStatus.PENDING,
        phoneNumber: data.phoneNumber,
        createdAt: new Date(),
      }
    });

    return { success: true, donation };
  } catch (error) {
    console.error('Error creating donation request:', error);
    return { success: false, error };
  }
}

export async function updateDonationStatus(
  transactionId: string,
  status: PaymentStatus,
  mpesaReceiptNumber?: string
) {
  try {
    // Extract requestId - handle both Paystack and Till payment formats
    let requestId = transactionId;
    if (transactionId.includes('_')) {
      // For Paystack payments, requestId is before the underscore
      requestId = transactionId.split('_')[0];
    } else if (mpesaReceiptNumber) {
      // For Till payments, use the transactionId directly as it's already the requestId
      requestId = transactionId;
    }

    console.log('Looking for donation with requestId:', requestId);

    // Find the donation by requestId and pending status
    const donation = await prisma.donation.findFirst({
      where: {
        requestId: requestId,
        status: PaymentStatus.PENDING
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        User: true,
        Request: {
          include: {
            User: true
          }
        }
      }
    });

    if (!donation) {
      throw new Error(`Donation not found for requestId: ${requestId}`);
    }

    if (!donation.Request) {
      throw new Error('Request not found for donation');
    }

    // Update the donation status
    const updatedDonation = await prisma.donation.update({
      where: { id: donation.id },
      data: {
        status,
        mpesaReceiptNumber,
        invoice: transactionId,
        transactionDate: status === PaymentStatus.COMPLETED ? new Date() : undefined
      }
    });

    // If payment completed successfully
    if (status === PaymentStatus.COMPLETED) {
      // Calculate and award points
      const points = await calculateDonationPoints(donation.amount, donation.userId);
      console.log(`Calculated points for donation ${donation.id}: ${points}`);
      
      // Update request's amount
      await prisma.request.update({
        where: { id: donation.requestId },
        data: {
          amount: {
            increment: donation.amount
          }
        }
      });

      // Process points transaction
      await processPointsTransaction({
        userId: donation.userId,
        amount: points,
        paymentId: transactionId,
        description: `Points earned for donating KES ${donation.amount}`
      });

      // Get donor's updated stats
      const donorStats = await getUserDonationStats(donation.userId);
      console.log(`Updated donor stats for ${donation.userId}:`, donorStats);

      // Create notification for the request owner
      await prisma.notification.create({
        data: {
          recipientId: donation.Request.userId,
          issuerId: donation.userId,
          type: NotificationType.DONATION,
          title: 'New Donation Received! 🎉',
          content: donation.User ? 
            `${donation.User.firstName} donated KES ${donation.amount} to your request. They earned ${points} points and are now at Level ${donorStats.level}!` :
            `Someone donated KES ${donation.amount} to your request`,
          donationId: donation.id,
          requestId: donation.requestId
        }
      });

      // Create notification for the donor about points earned
      await prisma.notification.create({
        data: {
          recipientId: donation.userId,
          issuerId: donation.Request.userId,
          type: NotificationType.PAYMENT_COMPLETED,
          title: 'Points Earned! 🌟',
          content: `You earned ${points} points for your donation of KES ${donation.amount}. Your total points are now ${donorStats.points} and you're at Level ${donorStats.level}. Keep up the great work with your ${donorStats.streak} donation streak!`,
          donationId: donation.id,
          requestId: donation.requestId
        }
      });

      // If this completes the request's goal, create a special notification
      if (donation.Request.amount && donation.amount >= donation.Request.amount) {
        await prisma.notification.create({
          data: {
            recipientId: donation.Request.userId,
            issuerId: donation.userId,
            type: NotificationType.PAYMENT_RECEIVED,
            title: 'Fundraising Goal Reached! 🎊',
            content: `Congratulations! Your request has reached its fundraising goal of KES ${donation.Request.amount}. Total amount raised: KES ${donation.amount}`,
            donationId: donation.id,
            requestId: donation.requestId
          }
        });
      }
    }

    return { success: true, donation: updatedDonation };
  } catch (error) {
    console.error('Error updating donation status:', error);
    return { success: false, error };
  }
}
