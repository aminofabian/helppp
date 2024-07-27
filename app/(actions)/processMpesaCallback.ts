import prisma from '@/app/lib/db';
import { findDonation } from './findDonation';
import { createPayment } from './createPayment';
import { createPoints } from './createPoints';
import { updateUser } from './updateUser';
import { updateDonation } from './updateDonation';
import { updateWallet } from './updateWallet';
import { createTransaction } from './createTransaction';
import { updateRequest } from './updateRequest';
import { updateCommunity } from './updateCommunity';
import { updateCommunityMember } from './updateCommunityMember';
import { createVote } from './createVote';
import { CallbackData } from '../types/mpesa';

export async function processMpesaCallback(callbackData: CallbackData) {
  const { CheckoutRequestID, amount, phoneNumber, mpesaReceiptNumber, transactionDate } = callbackData;

  if (!phoneNumber || !mpesaReceiptNumber || !transactionDate) {
    console.error('One or more required fields are undefined');
    return { success: false };
  }

  const donation = await findDonation(CheckoutRequestID, amount, phoneNumber);

  if (!donation || !donation.Request) {
    console.error('Donation or associated request not found');
    return { success: false };
  }

  try {
    const result = await prisma.$transaction(async () => {
      const payment = await createPayment(callbackData, donation, amount, mpesaReceiptNumber, phoneNumber, transactionDate);
      await createPoints(donation.userId, amount, payment.id);
      await updateUser(donation.userId, amount);
      await updateDonation(donation.id, payment.id);

      // Check if donation.Request is not null before using it
      if (donation.Request) {
        await updateWallet(donation.Request.userId, amount);

        const updatedRequest = await updateRequest(
          donation.Request.id,
          amount,
        );

        if (donation.Request.communityName && donation.Request.Community) {
          await updateCommunity(donation.Request.communityName, amount, updatedRequest?.status === 'FUNDED');
          await updateCommunityMember(donation.userId, donation.Request.Community.id, amount);
        } else {
          console.error('Community data is missing');
        }

        await createVote(donation.userId, donation.Request.id);
      } else {
        console.error('Request part of donation is null');
      }

      return { success: true };
    });

    return result;
  } catch (error) {
    console.error('Error in transaction:', error);
    return { success: false };
  }
}
