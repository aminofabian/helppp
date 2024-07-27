import prisma from '@/app/lib/db';

export async function updateDonation(
  donationId: string,
  paymentId: string
) {
  return prisma.donation.update({
    where: { id: donationId },
    data: {
      status: 'Paid',
      payment: { connect: { id: paymentId } }
    }
  });
}