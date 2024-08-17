// File: app/(actions)/findDonation.ts

import prisma from '@/app/lib/db';

export async function findDonation(invoice: string, amount: string, phoneNumber: string) {
  try {
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount)) {
      console.error('Invalid amount:', amount);
      return null;
    }

    const donation = await prisma.donation.findFirst({
      where: {
        OR: [
          { invoice },
          { amount: { equals: parsedAmount } },
          { phoneNumber }
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

    return donation;
  } catch (error) {
    console.error('Error finding donation:', error);
    return null;
  }
}