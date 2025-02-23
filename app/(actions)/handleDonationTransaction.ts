import prisma from '@/app/lib/db';

export async function handleDonationTransaction(
  giverId: string,
  receiverId: string,
  amount: number,
  paymentId: string
) {
  console.log('Processing donation transaction:', {
    giverId,
    receiverId,
    amount,
    paymentId
  });

  try {
    // Find donation by payment ID
    const donation = await prisma.donation.findFirst({
      where: {
        payment: {
          id: paymentId
        }
      }
    });

    if (!donation) {
      throw new Error(`No donation found for payment ID: ${paymentId}`);
    }

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        giver: { connect: { id: giverId } },
        receiver: { connect: { id: receiverId } },
        amount: amount
      }
    });
    console.log('Created transaction:', transaction);

    // Update or create receiver's wallet
    const receiverWallet = await prisma.wallet.upsert({
      where: { userId: receiverId },
      create: { userId: receiverId, balance: amount },
      update: { balance: { increment: amount } }
    });
    console.log('Updated receiver wallet:', receiverWallet);

    // Update donation status
    await prisma.donation.update({
      where: { id: donation.id },
      data: { status: 'COMPLETED' }
    });
    console.log('Updated donation status to COMPLETED');

    return {
      transaction,
      wallet: receiverWallet,
      donation
    };
  } catch (error) {
    console.error('Error processing donation transaction:', error);
    throw error;
  }
} 