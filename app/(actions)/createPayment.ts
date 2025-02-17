import prisma from '@/app/lib/db';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export async function createPayment(
  callbackData: any,
  donation: any,
  amount: number,
  mpesaReceiptNumber: string,
  phoneNumber: string,
  transactionDate: Date
) {
  return prisma.payment.create({
    data: {
      merchantRequestId: callbackData.MerchantRequestID,
      checkoutRequestId: callbackData.CheckoutRequestID,
      resultCode: callbackData.ResultCode.toString(),
      resultDesc: callbackData.ResultDesc,
      amount: amount,
      mpesaReceiptNumber,
      phoneNumber,
      transactionDate,
      userts: new Date(),
      paymentMethod: PaymentMethod.MPESA,
      status: PaymentStatus.PENDING,
      userId: donation.userId,
      donationId: donation.id,
      requestId: donation.requestId,
    }
  });
}