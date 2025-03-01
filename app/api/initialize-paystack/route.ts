import { NextResponse } from 'next/server';
import prisma from "../../lib/db";
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

// import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, amount, reference, callback_url, metadata } = body;
    console.log('Metadata received:', metadata);

    

    if (!process.env.PAYSTACK_SECRET_KEY) {
      return NextResponse.json(
        { message: 'Paystack secret key is not configured' },
        { status: 500 }
      );
    }


    const { getUser } = getKindeServerSession();
    const user = await getUser();
    // Handle donations
    if (metadata.type === 'donation') {
      const requestId = metadata.request_id || metadata.requestId;
      const userId = user.id; // ID of the user making the donation

      if (!requestId || !userId) {
        return NextResponse.json(
          { message: 'Request ID or User ID is missing in metadata' },
          { status: 400 }
        );
      }

      // Fetch the user's deposit wallet
       // Fetch the user's deposit wallet or create one if it doesn't exist
  const depositWallet = await prisma.depositWallet.upsert({
    where: { userId },
    create: {
      userId,
      balance: 0, // Initialize balance to 0
      name: "Donation Pool", // Default name
    },
    update: {}, // No updates needed if the wallet already exists
  });

  console.log('Deposit wallet:', depositWallet);



      // Check if the deposit wallet has sufficient balance
      if (depositWallet.balance >= amount) {
        // Deduct the full amount from the deposit wallet
        await prisma.depositWallet.update({
          where: { userId },
          data: { balance: { decrement: amount } },
        });

        // Fetch the request and recipient details
        const request = await prisma.request.findUnique({
          where: { id: requestId },
          include: { User: true }, // Include the recipient user
        });

        if (!request || !request.User) {
          return NextResponse.json(
            { message: 'Request or recipient not found' },
            { status: 404 }
          );
        }

        // Update the recipient's wallet
        const updatedWallet = await prisma.wallet.upsert({
          where: { userId: request.User.id },
          create: { userId: request.User.id, balance: amount },
          update: { balance: { increment: amount } },
        });

        // Create a donation record
        await prisma.donation.create({
          data: {
            userId,
            requestId,
            amount,
            status: 'COMPLETED',
            invoice: reference,
          },
        });

        return NextResponse.json({
          message: 'Donation processed successfully from deposit wallet',
          data: {
            depositWalletBalance: depositWallet.balance - amount,
            recipientWalletBalance: updatedWallet.balance,
          },
        });
      } else {
        // If deposit wallet balance is insufficient, send the remaining amount to Paystack
        const remainingAmount = amount - depositWallet.balance;

        // Deduct the available balance from the deposit wallet
        await prisma.depositWallet.update({
          where: { userId },
          data: { balance: 0 }, // Set balance to 0
        });

        // Initialize Paystack transaction for the remaining amount
        const response = await fetch('https://api.paystack.co/transaction/initialize', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            amount: Math.round(remainingAmount * 100), // Convert KES to cents for Paystack
            reference,
            callback_url,
            channels: ['card', 'mobile_money'],
            metadata,
            currency: 'KES', // Kenyan Shillings
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error('Paystack initialization failed:', data);
          return NextResponse.json(
            { message: data.message || 'Failed to initialize payment' },
            { status: response.status }
          );
        }

        return NextResponse.json({
          message: 'Partial donation processed from deposit wallet. Remaining amount sent to Paystack.',
          data: {
            depositWalletBalance: 0,
            paystackResponse: data.data,
          },
        });
      }
    }

    // Handle deposits (proceed directly to Paystack)
    if (metadata.type === 'deposit') {
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: Math.round(amount * 100), // Convert KES to cents for Paystack
          reference,
          callback_url,
          channels: ['card', 'mobile_money'],
          metadata,
          currency: 'KES', // Kenyan Shillings
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Paystack initialization failed:', data);
        return NextResponse.json(
          { message: data.message || 'Failed to initialize payment' },
          { status: response.status }
        );
      }

      return NextResponse.json(data.data);
    }

    // If metadata type is neither 'donation' nor 'deposit'
    return NextResponse.json(
      { message: 'Invalid metadata type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Payment initialization error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
// import { NextResponse } from 'next/server';

// export async function POST(req: Request) {
//   try {
//     const body = await req.json();
//     const { email, amount, reference, callback_url, metadata } = body;
//     console.log('meta amefikaaaaaaaaaaaaaaaaaa', metadata)

//     if (!process.env.PAYSTACK_SECRET_KEY) {
//       return NextResponse.json(
//         { message: 'Paystack secret key is not configured' },
//         { status: 500 }
//       );
//     }

//     // Initialize transaction with Paystack
//     const response = await fetch('https://api.paystack.co/transaction/initialize', {
//       method: 'POST',
//       headers: {
//         Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         email,
//         amount: Math.round(amount * 100), // Convert KES to cents for Paystack
//         reference,
//         callback_url,
//         channels: ['card', 'mobile_money'],
//         metadata,
//         currency: 'KES', // Kenyan Shillings
//       }),
//     });

//     const data = await response.json();

//     if (!response.ok) {
//       console.error('Paystack initialization failed:', data);
//       return NextResponse.json(
//         { message: data.message || 'Failed to initialize payment' },
//         { status: response.status }
//       );
//     }

//     return NextResponse.json(data.data);
//   } catch (error) {
//     console.error('Payment initialization error:', error);
//     return NextResponse.json(
//       { message: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// };
