import prisma from '@/app/lib/db';

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
      merchantRequestID: callbackData.MerchantRequestID,
      checkoutRequestID: callbackData.CheckoutRequestID,
      resultCode: callbackData.ResultCode.toString(),
      resultDesc: callbackData.ResultDesc,
      amount: amount,
      userts: new Date(),
      user: { connect: { id: donation.userId } },
      donation: { connect: { id: donation.id } },
      request: { connect: { id: donation.requestId } },
      mpesaReceiptNumber: mpesaReceiptNumber,
      phoneNumber: phoneNumber,
      transactionDate: transactionDate
    }
  });
}