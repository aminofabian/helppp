import prisma from '@/app/lib/db';

export async function findDonation(checkoutRequestID: string, amount: number, phoneNumber: string) {
  return prisma.donation.findFirst({
    where: {
      OR: [
        { invoice: checkoutRequestID },
        { amount: amount },
        { phoneNumber: phoneNumber }
      ]
    },
    include: {
      User: true,
      Request: {
        include: {
          User: true,
          Community: true
        }
      }
    }
  });
}
