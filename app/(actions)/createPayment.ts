import prisma from '@/app/lib/db';
import { Prisma, PaymentStatus } from '@prisma/client';

export async function createPayment(
  callbackData: any,
  donation: any,
  amount: number,
  mpesaReceiptNumber: string,
  phoneNumber: string,
  transactionDate: Date,
) {
  return prisma.payment.create({
    data: {
      amount,
      currency: 'KES',
      paymentMethod: 'MPESA',
      status: PaymentStatus.PENDING,
      merchantRequestId: callbackData.MerchantRequestID,
      checkoutRequestId: callbackData.CheckoutRequestID,
      resultCode: callbackData.ResultCode.toString(),
      resultDesc: callbackData.ResultDesc,
      mpesaReceiptNumber,
      phoneNumber,
      transactionDate,
      userts: new Date(),
      sender: { connect: { id: donation.userId } },
      donation: { connect: { id: donation.id } },
      request: { connect: { id: donation.requestId } }
    }
  });
}