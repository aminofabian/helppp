import prisma from '@/app/lib/db';

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
      status: 'PENDING',
      method: 'MPESA',
      merchantRequestId: callbackData.MerchantRequestID,
      checkoutRequestId: callbackData.CheckoutRequestID,
      resultCode: callbackData.ResultCode.toString(),
      resultDesc: callbackData.ResultDesc,
      mpesaReceiptNumber,
      phoneNumber,
      transactionDate,
      sender: { connect: { id: donation.userId } },
      prayer: { connect: { id: donation.requestId } }
    }
  });
}