'use server'

import { db } from "@/lib/db";
import { PaymentMethod, PaymentStatus } from "@prisma/client";
import { calculateDonationPoints, processPointsTransaction, getUserDonationStats } from "@/lib/pointsManager";

interface DonationData {
  amount: number;
  userId: string;
  requestId: string;
  paymentMethod: PaymentMethod;
  transactionId: string;
  email?: string;
  phoneNumber?: string;
  metadata?: any;
}

export async function createDonationRequest(data: DonationData) {
  try {
    // Calculate potential points (will be awarded when payment completes)
    const potentialPoints = await calculateDonationPoints(data.amount, data.userId);

    // Create donation record
    const donation = await db.donation.create({
      data: {
        amount: data.amount,
        userId: data.userId,
        requestId: data.requestId,
        paymentMethod: data.paymentMethod,
        transactionId: data.transactionId,
        status: PaymentStatus.PENDING,
        potentialPoints: potentialPoints, // Store potential points
        email: data.email,
        phoneNumber: data.phoneNumber,
        metadata: data.metadata
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
  callbackData?: any
) {
  try {
    // Find the donation with user and request details
    const donation = await db.donation.findUnique({
      where: { transactionId },
      include: {
        user: true,
        request: {
          include: {
            User: true // Get request owner's details
          }
        }
      }
    });

    if (!donation) {
      throw new Error('Donation not found');
    }

    // Update the donation status
    const updatedDonation = await db.donation.update({
      where: { transactionId },
      data: {
        status,
        callbackData,
        completedAt: status === PaymentStatus.COMPLETED ? new Date() : undefined
      }
    });

    // If payment completed successfully
    if (status === PaymentStatus.COMPLETED) {
      // Calculate and award points
      const points = await calculateDonationPoints(donation.amount, donation.userId);
      
      // Process points transaction
      await processPointsTransaction({
        userId: donation.userId,
        amount: points,
        type: 'DONATION',
        description: `Points earned for donating KES ${donation.amount}`,
        metadata: {
          donationId: donation.id,
          requestId: donation.requestId,
          amount: donation.amount
        }
      });

      // Update request's received amount and stats
      await db.request.update({
        where: { id: donation.requestId },
        data: {
          receivedAmount: {
            increment: donation.amount
          },
          donationsCount: {
            increment: 1
          }
        }
      });

      // Get donor's updated stats
      const donorStats = await getUserDonationStats(donation.userId);

      // Create notification for the request owner
      await db.notification.create({
        data: {
          userId: donation.request.userId,
          type: 'DONATION_RECEIVED',
          title: 'New Donation Received! 🎉',
          message: `${donation.user.name} donated KES ${donation.amount} to your request`,
          metadata: {
            requestId: donation.requestId,
            donationId: donation.id,
            amount: donation.amount,
            donorId: donation.userId,
            donorLevel: donorStats.level,
            points: points
          }
        }
      });

      // Create notification for the donor about points earned
      await db.notification.create({
        data: {
          userId: donation.userId,
          type: 'POINTS_EARNED',
          title: 'Points Earned! 🌟',
          message: `You earned ${points} points for your donation of KES ${donation.amount}`,
          metadata: {
            requestId: donation.requestId,
            donationId: donation.id,
            pointsEarned: points,
            newTotal: donorStats.points,
            level: donorStats.level,
            streak: donorStats.streak
          }
        }
      });

      // If this completes the request's goal, create a special notification
      if (donation.request.receivedAmount + donation.amount >= donation.request.amount) {
        await db.notification.create({
          data: {
            userId: donation.request.userId,
            type: 'GOAL_REACHED',
            title: 'Fundraising Goal Reached! 🎊',
            message: `Your request has reached its fundraising goal of KES ${donation.request.amount}!`,
            metadata: {
              requestId: donation.requestId,
              goalAmount: donation.request.amount,
              totalRaised: donation.request.receivedAmount + donation.amount
            }
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
