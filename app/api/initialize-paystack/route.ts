import { NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { prisma } from "@/app/lib/db";
import { PaymentStatus, PaymentMethod } from "@prisma/client";



export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, amount, reference, callback_url, metadata } = body;
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const transactionType = metadata?.type;
    const requestId = metadata?.request_id;

    // console.log('Metadata receiveddddddd:', metadata);
    // console.log('metaaaaaaaaaaaaaaaaaaaaaaa', metadata?.request_id)


    if (!process.env.PAYSTACK_SECRET_KEY) {
      return NextResponse.json({ message: 'Paystack secret key is not configured' }, { status: 500 });
    }

    // Fetch user's deposit wallet
    const depositWallet = await prisma.depositWallet.findUnique({
      where: { userId: user.id },
    });

    if (!depositWallet) {
      return NextResponse.json({ message: 'Deposit wallet not found' }, { status: 404 });
    }

    let remainingAmount = amount;
    let shouldUsePaystack = true;

    if (transactionType === 'donation') {
      // console.log(`[Processing donation] Checking deposit wallet for user:::::::::::::: ${user.id}`);

      if (depositWallet.balance >= amount) {
        // Fully deduct from deposit wallet (No need for Paystack)
        await prisma.depositWallet.update({
          where: { userId: user.id },
          data: { balance: { decrement: amount } },
        });

        // console.log(`[Donation] Deducted ${amount} from DepositWallet. No Paystack neededdddddddddddddddddddddddd.`);
        

        // Create Payment & Donation directly
        const { payment, donation } = await prisma.$transaction(async (tx) => {
          const payment = await tx.payment.create({
            data: {
              amount,
              paymentMethod: PaymentMethod.PAYSTACK,
              status: PaymentStatus.COMPLETED,
              merchantRequestId: reference,
              resultCode: '00',
              resultDesc: 'Success',
              sender: { connect: { id: user.id } },
              request: { connect: { id: requestId } },
              userts: new Date(),
            },
          });

          // console.log(payment, 'its payback timeeeeeeeeeeeeeeeeeeeeee')

          const donation = await tx.donation.create({
            data: {
              userId: user.id,
              requestId,
              amount,
              payment: { connect: { id: payment.id } },
              status: PaymentStatus.COMPLETED,
              invoice: reference,
            },
          });

          // console.log('donationnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn', donation)

          return { payment, donation };
        });

        // Create transaction between donor and receiver
        const request = await prisma.request.findUnique({
          where: { id: requestId },
          include: { User: true },
        });

        if (request && request.User) {
          await prisma.transaction.create({
            data: {
              giverId: user.id,
              receiverId: request.User.id,
              amount,
            },
          });
        };

        console.log('requestttttt', request)

        // Award points & update stats
        await prisma.$transaction([
          prisma.points.create({
            data: {
              user: { connect: { id: user.id } },
              amount: 1,
              payment: { connect: { id: payment.id } },
            },
          }),
          prisma.user.update({
            where: { id: user.id },
            data: {
              totalDonated: { increment: amount },
              donationCount: { increment: 1 },
            },
          }),
        ]);

        return NextResponse.json({
          success: true,
          message: 'Donation completed using DepositWallet',
          redirect_url: 'https://fitrii.com/',
        });
        
      } else if (depositWallet.balance > 0) {
        // Partial payment from DepositWallet, remaining via Paystack
        const fullDonationAmount = amount; // 10 KES
        const depositWalletBalance = depositWallet.balance; // 6 KES
        remainingAmount = fullDonationAmount - depositWallet.balance;

       
       


        await prisma.depositWallet.update({
          where: { userId: user.id },
          data: { balance: { decrement: depositWallet.balance } },
        });

        // const donation = await prisma.donation.create({
        //   data: {
        //     userId: user.id,
        //     requestId,
        //     amount: fullDonationAmount, // 10 KES
        //     status: 'PENDING', // Set to PENDING until Paystack confirms
        //     invoice: reference,
        //   },
        // });

        console.log(`[Donation] Partial deduction: ${depositWallet.balance}. Remaining: ${remainingAmount} via Paystack.`);
      }
    }

    if (shouldUsePaystack) {
      // Initialize transaction with Paystack
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: Math.round(remainingAmount * 100),
          reference,
          callback_url,
          channels: ['card', 'mobile_money'],
          metadata,
          currency: 'KES',
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
  } catch (error) {
    console.error('Payment initialization error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}







// export async function POST(req: Request) {
//     try {
//         const body = await req.json();
//         const { email, amount, reference, callback_url, metadata } = body;
//         console.log('meta amefikaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', metadata);
//         console.log({ email, amount, reference, callback_url, metadata }, 'nodescritpinggggggggggggggg::::::::::::::::::::::::::::')

//         if (!process.env.PAYSTACK_SECRET_KEY) {
//             return NextResponse.json({ message: 'Paystack secret key is not configured' }, { status: 500 });
//         }

//         if (metadata && metadata.request_id) {
//             // Donation logic
//             return await handleDonation(email, amount, reference, callback_url, metadata);
//         } else {
//             // Deposit logic
//             return await handleDeposit(email, amount, reference, callback_url, metadata);
//         }
//     } catch (error) {
//         console.error('Payment initialization error:', error);
//         return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
//     }
// }

// async function initializePaystack(email: string, amount: number, reference: string, callback_url: string, metadata: any) {
//     const response = await fetch('https://api.paystack.co/transaction/initialize', {
//         method: 'POST',
//         headers: {
//             Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//             email,
//             amount: Math.round(amount * 100), // Convert KES to cents for Paystack
//             reference,
//             callback_url,
//             channels: ['card', 'mobile_money'],
//             metadata,
//             currency: 'KES', // Kenyan Shillings
//         }),
//     });

//     const data = await response.json();

//     if (!response.ok) {
//         console.error('Paystack initialization failed:', data);
//         throw new Error(data.message || 'Failed to initialize payment');
//     }

//     return data.data;
// }

// async function handleDeposit(email: string, amount: number, reference: string, callback_url: string, metadata: any) {
//     try {
//         const paystackData = await initializePaystack(email, amount, reference, callback_url, metadata);
//         console.log(paystackData,'datass/////////////////////')
//         return NextResponse.json(paystackData);
//     } catch (error: any) {
//         return NextResponse.json({ message: error.message }, { status: 500 });
//     }
// }

// async function handleDonation(email: string, amount: number, reference: string, callback_url: string, metadata: any) {
//   const { request_id } = metadata;
//   const { getUser } = getKindeServerSession();
//   const user = await getUser();

//   if (!user || !user.id) {
//       return NextResponse.json({ message: 'User not authenticated' }, { status: 401 });
//   }

//   try {
//       const depositWallet = await prisma.depositWallet.findUnique({
//           where: { userId: user.id },
//       });
//       console.log(depositWallet, 'mbona unasumbua hiviiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii')

//       if (!depositWallet) {
//           return NextResponse.json({ message: 'Deposit wallet not found' }, { status: 404 });
//       }

//       if (depositWallet.balance >= amount) {
//           // Sufficient balance in deposit wallet
//           await prisma.depositWallet.update({
//               where: { userId: user.id },
//               data: { balance: { decrement: amount } },
//           });
//           await processDonation(user.id, request_id, amount, reference);
//           return NextResponse.json({ message: 'Donation processed from wallet', redirectUrl: 'https://fitrii.com' }); // Return URL here
//       } else {
//           // Insufficient balance, process remaining amount via Paystack
//           const remainingAmount = amount - depositWallet.balance;
//           await prisma.depositWallet.update({
//               where: { userId: user.id },
//               data: { balance: 0 },
//           });
//           const paystackData = await initializePaystack(email, remainingAmount, reference, callback_url, metadata);
//           await processDonation(user.id, request_id, amount, reference);
//           return NextResponse.json(paystackData); // Paystack initialization returns its data
//       }
//   } catch (error: any) {
//       console.error('Donation processing error:', error);
//       return NextResponse.json({ message: error.message }, { status: 500 });
//   }
// }

// async function processDonation(userId: string, requestId: string, amount: number, reference: string) {
//     // Implement the donation processing logic here
//     const request = await prisma.request.findUnique({
//         where: { id: requestId },
//         include: { User: true },
//     });
//     console.log(request, amount, 'requeestingggyyyyy, ya pesaaaa')

//     if (!request) {
//         throw new Error("Request not found");
//     }

//     const payment = await prisma.payment.create({
//         data: {
//             amount,
//             paymentMethod: "PAYSTACK",
//             status: "COMPLETED",
//             merchantRequestId: reference,
//             resultCode: "00",
//             resultDesc: "Success",
//             sender: { connect: { id: userId } },
//             request: { connect: { id: requestId } },
//             userts: new Date(),
//         },
//     });
//     const donation = await prisma.donation.create({
//         data: {
//             userId: userId,
//             requestId,
//             amount,
//             payment: { connect: { id: payment.id } },
//             status: "COMPLETED",
//             invoice: reference,
//         },
//     });

//     const [updatedUser] = await prisma.$transaction([
//             prisma.user.update({
//             where: { id: userId },
//             data: {
//                 totalDonated: { increment: amount },
//                 donationCount: { increment: 1 },
//             },
//         }),
//     ]);

//     console.log(`Donation processed:`, {
//         userStats: {
//             totalDonated: updatedUser.totalDonated,
//             donationCount: updatedUser.donationCount,
//         },
//     });
// }


















// import { NextResponse } from 'next/server';
// import prisma from "../../lib/db";
// import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

// // import { NextResponse } from 'next/server';

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






// import { NextResponse } from 'next/server';
// import prisma from "../../lib/db";
// import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

// // import { NextResponse } from 'next/server';

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
