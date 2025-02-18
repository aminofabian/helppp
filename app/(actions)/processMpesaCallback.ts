// File: app/(actions)/processMpesaCallback.ts

import prisma from '@/app/lib/db';
import { findDonation } from './findDonation';
import { createPayment } from './createPayment';
import { createPoints } from './createPoints';
import { updateUser } from './updateUser';
import { updateDonation } from './updateDonation';
import { updateWallet } from './updateWallet';
import { updateRequest } from './updateRequest';
import { updateCommunity } from './updateCommunity';
import { updateCommunityMember } from './updateCommunityMember';
import { createVote } from './createVote';

export async function processMpesaCallback(callbackData: any) {
  console.log('Processing callback data:', JSON.stringify(callbackData, null, 2));

  const { CheckoutRequestID, CallbackMetadata, Body } = callbackData;

  if (!CallbackMetadata?.Item) {
    console.error('CallbackMetadata or Item is missing');
    return { success: false };
  }

  const getMetadataValue = (name: string) => {
    const item = CallbackMetadata.Item.find((item: any) => item.Name === name);
    return item?.Value;
  };

  const amount = parseFloat(getMetadataValue('Amount') ?? 0);
  console.log('this is the saved amount', amount);
  const mpesaReceiptNumber = getMetadataValue('MpesaReceiptNumber');
  console.log('this is the saved amount', mpesaReceiptNumber);

  const transactionDate = getMetadataValue('TransactionDate');
  console.log('this is the saved amount', mpesaReceiptNumber)
  const phoneNumber = getMetadataValue('PhoneNumber')?.toString();

  const ResultDesc = Body.stkCallback.ResultDesc?.toString();
  console.log(ResultDesc, 'this is it');


  if (!amount || !mpesaReceiptNumber || !transactionDate || !phoneNumber) {
    console.error('One or more required fields are missing or invalid');
    return { success: false };
  }

  const donation = await findDonation(
    CheckoutRequestID,
    amount.toString(),
    phoneNumber.toString()
  );

  if (!donation || !donation.Request) {
    console.error('Donation or associated request not found');
    return { success: false };
  }

  try {
    const result = await prisma.$transaction(async () => {
      const payment = await createPayment(
        callbackData,
        donation,
        amount,
        mpesaReceiptNumber,
        phoneNumber,
        transactionDate
      );

      await createPoints(donation.userId, amount, payment.id);
      await updateUser(donation.userId, amount);
      await updateDonation(donation.id, payment.id);

      if (donation.Request) {
        await updateWallet(donation.Request.userId, amount);

        const updatedRequest = await updateRequest(
          donation.Request.id,
          amount
        );

        if (donation.Request.communityName && donation.Request.Community) {
          await updateCommunity(
            donation.Request.communityName,
            amount,
            updatedRequest?.status === 'FUNDED'
          );
          await updateCommunityMember(
            donation.userId,
            donation.Request.Community.id,
            amount
          );
        } else {
          console.error('Community data is missing');
        }

        await createVote(donation.userId, donation.Request.id);
      } else {
        console.error('Request part of donation is null');
      }

      // Trigger revalidation
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/revalidate-donation`, {
        method: 'POST',
      });

      return { success: true };
    });

    return result;
  } catch (error) {
    console.error('Error in transaction:', error);
    return { success: false };
  }
}






// // File: app/(actions)/processMpesaCallback.ts

// import prisma from '@/app/lib/db';
// import { findDonation } from './findDonation';
// import { createPayment } from './createPayment';
// import { createPoints } from './createPoints';
// import { updateUser } from './updateUser';
// import { updateDonation } from './updateDonation';
// import { updateWallet } from './updateWallet';
// import { updateRequest } from './updateRequest';
// import { updateCommunity } from './updateCommunity';
// import { updateCommunityMember } from './updateCommunityMember';
// import { createVote } from './createVote';

// export async function processMpesaCallback(callbackData: any) {
//   console.log('Processing callback data:', JSON.stringify(callbackData, null, 2));

//   const { CheckoutRequestID, CallbackMetadata } = callbackData;

//   if (!CallbackMetadata || !CallbackMetadata.Item) {
//     console.error('CallbackMetadata or Item is missing');
//     return { success: false };
//   }

//   const getMetadataValue = (name: string) => {
//     const item = CallbackMetadata.Item.find((item: any) => item.Name === name);
//     return item ? item.Value : undefined;
//   };

//   const amount = getMetadataValue('Amount');
//   const mpesaReceiptNumber = getMetadataValue('MpesaReceiptNumber');
//   const transactionDate = getMetadataValue('TransactionDate');
//   const phoneNumber = getMetadataValue('PhoneNumber');

//   if (!amount || !mpesaReceiptNumber || !transactionDate || !phoneNumber) {
//     console.error('One or more required fields are undefined');
//     return { success: false };
//   }

//   const donation = await findDonation(
//     CheckoutRequestID,
//     amount.toString(), // Ensure amount is a string
//     phoneNumber.toString()
//   );

//   if (!donation || !donation.Request) {
//     console.error('Donation or associated request not found');
//     return { success: false };
//   }


//   try {
//     const result = await prisma.$transaction(async () => {
//       const payment = await createPayment(callbackData, donation, amount.toString(), mpesaReceiptNumber.toString(), phoneNumber.toString(), transactionDate.toString());
//       await createPoints(donation.userId, amount.toString(), payment.id);
//       await updateUser(donation.userId, amount.toString());
//       await updateDonation(donation.id, payment.id);

//       if (donation.Request) {
//         await updateWallet(donation.Request.userId, amount.toString());

//         const updatedRequest = await updateRequest(
//           donation.Request.id,
//           amount.toString(),
//         );

//         if (donation.Request.communityName && donation.Request.Community) {
//           await updateCommunity(donation.Request.communityName, amount.toString(), updatedRequest?.status === 'FUNDED');
//           await updateCommunityMember(donation.userId, donation.Request.Community.id, amount.toString());
//         } else {
//           console.error('Community data is missing');
//         }

//         await createVote(donation.userId, donation.Request.id);
//       } else {
//         console.error('Request part of donation is null');
//       }

//       return { success: true };
//     });

//     return result;
//   } catch (error) {
//     console.error('Error in transaction:', error);
//     return { success: false };
//   }
// }

