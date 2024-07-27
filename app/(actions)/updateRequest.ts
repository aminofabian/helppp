import prisma from '@/app/lib/db';

export async function updateRequest(requestId: string, amount: number) {
  // Fetch the current request including its donations
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: { donations: true },
  });

  if (!request) {
    throw new Error('Request not found');
  }

  // Calculate the total donations
  const totalDonations = request.donations.reduce((sum, donation) => sum + donation.amount, 0);

  // Define the margin
  const margin = 1.1;

  // Update the request amount and status
  return prisma.request.update({
    where: { id: requestId },
    data: {
      amount: { increment: amount },
      status: totalDonations + amount >= request.amount * margin ? 'FUNDED' : undefined,
    },
  });
}
