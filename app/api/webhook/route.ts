import { NextResponse } from "next/server";
import crypto from "crypto";
import { PaymentStatus, PaymentMethod } from "@prisma/client";
import { updateDonationStatus } from "@/app/(actions)/handleDonation";
import { prisma } from "@/app/lib/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { calculateLevel } from "@/app/lib/levelCalculator";
import { handleDonationTransaction } from "@/app/(actions)/handleDonationTransaction";

// Keep track of processed references in memory
const processedReferences = new Set<string>();


async function handlePaystackWebhook(event: any, webhookId: string) {
  const reference = event.data.reference;
  const metadata = event.data.metadata || {};
  const amount = event.data.amount / 100; // Convert from kobo to KES
  const customerEmail = event.data.customer.email;
  const requestId = metadata.request_id || metadata.requestId; // Handle both formats
  const paidAt = event.data.paid_at;
  const transactionType = metadata.type; // 'donation' or 'deposit'
 

  console.log(`[${webhookId}] ============ PAYSTACK TRANSACTION START ============`);
  console.log(`[${webhookId}] Transaction Details:`, {
    reference,
    amount,
    currency: event.data.currency,
    metadata,
    customer: event.data.customer,
    paidAt,
    requestId,
    transactionType,
  });

  // Check in-memory cache first
  if (processedReferences.has(reference)) {
    return NextResponse.json({ status: "success", message: "Payment already processed" });
  }

  try {
    // Get user ID from email
    console.log(`[${webhookId}] Fetching user ID for email: ${customerEmail}`);
    const user = await prisma.user.findUnique({
      where: { email: customerEmail },
      select: { id: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    console.log(`[${webhookId}] Found user:`, user);

    // Handle deposits
    if (transactionType === 'deposit') {
    
      // Update the user's deposit wallet balance
      const depositWallet = await prisma.depositWallet.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          balance: amount, // Set initial balance for new wallets
          name: "Donation Pool", // Default name
        },
        update: {
          balance: { increment: amount }, // Increment balance for existing wallets
        },
      });
    
    
      // Add reference to processed set
      processedReferences.add(reference);
    
      return NextResponse.json({
        status: "success",
        message: "Deposit processed successfully",
        data: {
          depositWalletId: depositWallet.id,
          newBalance: depositWallet.balance,
          reference,
        },
      });
    }

    // Handle donations
    if (transactionType === 'donation') {
      console.log(`[${webhookId}] Processing donation for request: ${requestId}`);


// fetch hold table using reference from paystack
    const hold = await prisma.hold.findUnique({
       where: { reference: reference }
    });

// Check if hold exists and has a balance greater than 0
if (hold && parseFloat(hold.amount.toString()) > 0) {
  // Decrement the deposit wallet balance by the hold amount
  await prisma.depositWallet.update({
    where: { userId: user.id },
    data: { 
      balance: { decrement: parseFloat(hold.amount.toString()) } 
    }
  });

  // Update the hold status to completed
  await prisma.hold.update({
    where: { reference: reference },
    data: { status: 'COMPLETED' }
  });
}

// Calculate total amount (including hold amount if it exists)
const holdAmount = hold ? parseFloat(hold.amount.toString()) : 0;
const totalAmount = holdAmount + amount;

      const { payment, donation } = await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.create({
          data: {
            amount: totalAmount,
            paymentMethod: PaymentMethod.PAYSTACK,
            status: PaymentStatus.COMPLETED,
            merchantRequestId: reference,
            resultCode: "00",
            resultDesc: "Success",
            sender: { connect: { id: user.id } },
            request: { connect: { id: requestId } },
            userts: new Date(paidAt),
          },
        });
        console.log(`[${webhookId}] Payment created:`, payment);

        const donation = await tx.donation.create({
          data: {
            userId: user.id,
            requestId,
            amount: totalAmount,
            payment: { connect: { id: payment.id } },
            status: PaymentStatus.COMPLETED,
            invoice: reference,
          },
        });
        console.log(`[${webhookId}] Donation created:`, donation);

        return { payment, donation };
      });

      // Second transaction: Update request and wallet
      if (requestId) {
        const request = await prisma.request.findUnique({
          where: { id: requestId },
          include: { User: true },
        });

        if (!request?.User) {
          throw new Error('Request or user not found');
        }

        await prisma.$transaction([
          prisma.request.update({
            where: { id: requestId },
            data: { status: 'PAID' },
          }),
          prisma.wallet.upsert({
            where: { userId: request.User.id },
            create: { userId: request.User.id, balance: totalAmount },
            update: { balance: { increment: totalAmount } },
          }),
          prisma.transaction.create({
            data: {
              amount: totalAmount,
              giver: { connect: { id: user.id } },
              receiver: { connect: { id: request.User.id } },
            },
          }),
        ]);
        console.log(`[${webhookId}] Updated request status and wallet`);
      };

      // Third transaction: Create points and update user stats
      const [points, updatedUser] = await prisma.$transaction([
        prisma.points.create({
          data: {
            user: { connect: { id: user.id } },
            amount: 1, // Always award 1 point per donation
            payment: { connect: { id: payment.id } },
          },
        }),
        prisma.user.update({
          where: { id: user.id },
          data: {
            totalDonated: { increment: totalAmount },
            donationCount: { increment: 1 },
          },
        }),
      ]);

      console.log(`[${webhookId}] Created points and updated user stats:`, {
        points,
        userStats: {
          totalDonated: updatedUser.totalDonated,
          donationCount: updatedUser.donationCount,
        },
      });

      // Add reference to processed set
      processedReferences.add(reference);

      return NextResponse.json({
        status: "success",
        message: "Donation processed successfully",
        data: {
          paymentId: payment.id,
          pointsId: points.id,
          reference,
        },
      });
    }

    // If transaction type is neither 'deposit' nor 'donation'
    console.error(`[${webhookId}] Unknown transaction type: ${transactionType}`);
    return NextResponse.json(
      { status: "error", message: "Unknown transaction type" },
      { status: 400 }
    );
  } catch (error) {
    console.error(`[${webhookId}] Error processing transaction:`, error);
    console.error(`[${webhookId}] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to process transaction",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};




export async function POST(req: Request) {
  const webhookId = crypto.randomBytes(16).toString('hex');
  
  // Immediate logging to verify webhook reception
  // console.log('========================');
  // console.log('WEBHOOK RECEIVED - RAW');
  // console.log('Timestamp:', new Date().toISOString());
  // console.log('Method:', req.method);
  // console.log('URL:', req.url);
  // console.log('Headers:', Object.fromEntries(req.headers.entries()));
  // console.log('========================');

  // console.log(`[${webhookId}] ============ PAYSTACK WEBHOOK START ============`);
  // console.log(`[${webhookId}] Webhook received at ${new Date().toISOString()}`);

  try {
    const rawBody = await req.text();
    // Log the raw body immediately
    // console.log('Raw webhook body received::::::::::::::::::::::::::::', rawBody);
    // console.log('Content length:', rawBody.length);
    
    // console.log(`[${webhookId}] Headers:`, {
    //   signature: req.headers.get('x-paystack-signature'),
    //   contentType: req.headers.get('content-type'),
    //   userAgent: req.headers.get('user-agent')
    // });

    let event: any;
    try {
      event = JSON.parse(rawBody);
      // console.log(`[${webhookId}] Parsed event:`, JSON.stringify(event, null, 2));
      // console.log(`[${webhookId}] Event type:`, event.event);
      // console.log(`[${webhookId}] Data:`, {
      //   reference: event.data?.reference,
      //   amount: event.data?.amount,
      //   metadata: event.data?.metadata,
      //   customer: event.data?.customer
      // });

      
     
    } catch (error) {
      console.error(`[${webhookId}] Error parsing JSON:`, error);
      return NextResponse.json({ status: 'error', message: 'Invalid JSON' }, { status: 400 });
    }

    // Check if it's a Kopokopo webhook
    if (event.data?.type === 'incoming_payment') {
      console.log(`[${webhookId}] Detected Kopokopo webhook`);
      return handleKopokopoWebhook(event.data, webhookId);
    }

    // Otherwise, treat it as a Paystack webhook
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const sig = req.headers.get('x-paystack-signature');

    if (!secretKey) {
      console.error(`[${webhookId}] Missing PAYSTACK_SECRET_KEY environment variable`);
      return NextResponse.json({ status: 'error', message: 'Server configuration error' }, { status: 500 });
    }

    if (!sig) {
      console.error(`[${webhookId}] Missing x-paystack-signature header`);
      return NextResponse.json({ status: 'error', message: 'Missing signature header' }, { status: 400 });
    }

    const computedSignature = crypto
      .createHmac('sha512', secretKey)
      .update(rawBody)
      .digest('hex');

    // console.log(`[${webhookId}] Signature verification:`, {
    //   received: sig,
    //   computed: computedSignature,
    //   match: sig === computedSignature
    // });

    if (sig !== computedSignature) {
      console.error(`[${webhookId}] Invalid signature`);
      return NextResponse.json({ status: 'error', message: 'Invalid signature' }, { status: 400 });
    }

    // Handle Paystack events
    switch (event.event) {
      case 'charge.success':
        // console.log(`[${webhookId}] Processing charge.success event`);
        
        const result = await handlePaystackWebhook(event, webhookId);
        // console.log(`[${webhookId}] Webhook handler result:`, result);
        
        return result;

      case 'transfer.success':
      case 'transfer.failed':
      case 'transfer.reversed':
        console.log(`[${webhookId}] Processing transfer event: ${event.event}`);
        return handleWithdraw(event, webhookId);

      default:
        console.log(`[${webhookId}] Unhandled event type: ${event.event}`);
        return NextResponse.json({ status: 'success', message: 'Webhook received' });
    }
  } catch (error) {
    console.error(`[${webhookId}] Webhook processing error:`, error);
    console.error(`[${webhookId}] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ 
      status: 'error', 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    const logEntry = {
      event: 'PAYSTACK_WEBHOOK_END',
      webhookId: webhookId,
      timestamp: new Date().toISOString(),
    };
    console.info(JSON.stringify(logEntry));
};
};






async function handleKopokopoWebhook(data: any, webhookId: string) {
  console.log(`[${webhookId}] Processing Kopokopo webhook:`, data);

  const { id, type, attributes } = data;
  const { metadata, status, event } = attributes;

  if (!metadata?.requestId) {
    console.error(`[${webhookId}] No requestId in metadata`);
    return NextResponse.json({ 
      status: "error", 
      message: "No requestId in metadata" 
    }, { status: 400 });
  }

  try {
    // Find the pending donation
    const pendingDonation = await prisma.donation.findFirst({
      where: {
        requestId: metadata.requestId,
        status: PaymentStatus.PENDING
      },
      include: {
        User: true,
        Request: true
      }
    });

    if (!pendingDonation) {
      console.error(`[${webhookId}] No pending donation found for requestId: ${metadata.requestId}`);
      return NextResponse.json({ 
        status: "error", 
        message: "No pending donation found" 
      }, { status: 404 });
    }

    // Determine payment status based on Kopokopo response
    const paymentStatus = status === 'Failed' ? PaymentStatus.FAILED : PaymentStatus.COMPLETED;
    const resultDesc = event?.errors || event?.type || 'Kopokopo Payment';

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        amount: pendingDonation.amount,
        paymentMethod: PaymentMethod.MPESA,
        status: paymentStatus,
        checkoutRequestId: id,
        merchantRequestId: metadata.customerId,
        resultCode: status,
        resultDesc: resultDesc,
        currency: 'KES',
        userId: pendingDonation.userId,
        requestId: metadata.requestId,
        donationId: pendingDonation.id,
        userts: new Date(attributes.initiation_time),
        transactionDate: new Date()
      }
    });

    console.log(`[${webhookId}] Created payment record: ${payment.id} with status: ${paymentStatus}`);

    // Update donation status
    const result = await updateDonationStatus(
      id,
      paymentStatus,
      id
    );

    if (result.success) {
      console.log(`[${webhookId}] Payment processed: ${id} with status: ${paymentStatus}`);
      return NextResponse.json({ 
        status: "success", 
        message: `Payment processed with status: ${paymentStatus}` 
      });
    } else {
      console.warn(`[${webhookId}] Payment status update failed:`, result.error);
      return NextResponse.json({ 
        status: "error", 
        message: "Failed to update payment status",
        error: result.error
      });
    }

  } catch (error) {
    console.error(`[${webhookId}] Error processing Kopokopo payment:`, error);
    return NextResponse.json({ 
      status: "error", 
      message: "Error processing payment",
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}




async function handleWithdraw(event: any, webhookId: string) {
  console.log(`[${webhookId}] Handling withdrawal event:`, event.event);

  try {
    const transferData = event.data;

    switch (event.event) {
      case 'transfer.success':
        console.log(`[${webhookId}] Transfer Successful:`, transferData);
        // Update database to mark transfer as successful
        await updateTransferStatus(transferData.reference, 'success');
        break;

      case 'transfer.failed':
        console.log(`[${webhookId}] Transfer Failed:`, transferData);
        // Update database to mark transfer as failed
        await updateTransferStatus(transferData.reference, 'failed', transferData.reason);
        break;

      case 'transfer.reversed':
        console.log(`[${webhookId}] Transfer Reversed:`, transferData);
        // Update database to mark transfer as reversed
        await updateTransferStatus(transferData.reference, 'reversed');
        break;

      default:
        console.log(`[${webhookId}] Unhandled withdrawal event:`, event.event);
    }

    return NextResponse.json({ status: 'success', message: 'Withdrawal event handled' });
  } catch (error) {
    console.error(`[${webhookId}] Error handling withdrawal event:`, error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to handle withdrawal event',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function updateTransferStatus(reference: string, status: string, reason?: string) {
  // Update your database with the transfer status
  // Example using Prisma:
  await prisma.payment.update({
    where: { id: reference },
    data: { status: status as PaymentStatus },
  });
};





// async function handlePaystackWebhook(event: any, webhookId: string) {
//   const reference = event.data.reference;
//   const metadata = event.data.metadata || {};
//   const amount = event.data.amount / 100; // Convert from kobo to KES
//   const customerEmail = event.data.customer.email;
//   const requestId = metadata.request_id || metadata.requestId; // Handle both formats
//   const paidAt = event.data.paid_at;

 
//   console.log(`[${webhookId}] ============ PAYSTACK TRANSACTION START ============`);
//   console.log(`[${webhookId}] Transaction Details:`, {
//     reference,
//     amount,
//     currency: event.data.currency,
//     metadata,
//     customer: event.data.customer,
//     paidAt,
//     requestId
//   });

//   // Check in-memory cache first
//   if (processedReferences.has(reference)) {
//     console.log(`[${webhookId}] Payment already processed (in-memory): ${reference}`);
//     return NextResponse.json({ status: "success", message: "Payment already processed" });
//   }

//   try {
//     // Get user ID from email
//     console.log(`[${webhookId}] Fetching user ID for email: ${customerEmail}`);
//     const user = await prisma.user.findUnique({
//       where: { email: customerEmail },
//       select: { id: true }
//     });

//     if (!user) {
//       console.error(`[${webhookId}] User not found for email: ${customerEmail}`);
//       throw new Error('User not found');
//     }

//     console.log(`[${webhookId}] Found user:`, user);

//     try {
//       // First transaction: Create payment and donation
//       const { payment, donation } = await prisma.$transaction(async (tx) => {
//         const payment = await tx.payment.create({
//           data: {
//             amount,
//             paymentMethod: PaymentMethod.PAYSTACK,
//             status: PaymentStatus.COMPLETED,
//             merchantRequestId: reference,
//             resultCode: "00",
//             resultDesc: "Success",
//             sender: { connect: { id: user.id } },
//             request: { connect: { id: requestId } },
//             userts: new Date(paidAt)
//           }
//         });
//         console.log(`[${webhookId}] Payment created:`, payment);

//         const donation = await tx.donation.create({
//           data: {
//             userId: user.id,
//             requestId,
//             amount,
//             payment: { connect: { id: payment.id } },
//             status: PaymentStatus.COMPLETED,
//             invoice: reference
//           }
//         });
//         console.log(`[${webhookId}] Donation created:`, donation);

//         return { payment, donation };
//       });

//       // Second transaction: Update request and wallet
//       if (requestId) {
//         const request = await prisma.request.findUnique({
//           where: { id: requestId },
//           include: { User: true }
//         });

//         if (!request?.User) {
//           throw new Error('Request or user not found');
//         }

//         await prisma.$transaction([
//           prisma.request.update({
//             where: { id: requestId },
//             data: { status: 'PAID' }
//           }),
//           prisma.wallet.upsert({
//             where: { userId: request.User.id },
//             create: { userId: request.User.id, balance: amount },
//             update: { balance: { increment: amount } }
//           }),
//           prisma.transaction.create({
//             data: {
//               amount,
//               giver: { connect: { id: user.id } },
//               receiver: { connect: { id: request.User.id } }
//             }
//           })
//         ]);
//         console.log(`[${webhookId}] Updated request status and wallet`);
//       }

//       // Third transaction: Create points and update user stats
//       const [points, updatedUser] = await prisma.$transaction([
//         prisma.points.create({
//           data: {
//             user: { connect: { id: user.id } },
//             amount: 1, // Always award 1 point per donation
//             payment: { connect: { id: payment.id } }
//           }
//         }),
//         prisma.user.update({
//           where: { id: user.id },
//           data: {
//             totalDonated: { increment: amount },
//             donationCount: { increment: 1 }
//           }
//         })
//       ]);

//       console.log(`[${webhookId}] Created points and updated user stats:`, {
//         points,
//         userStats: {
//           totalDonated: updatedUser.totalDonated,
//           donationCount: updatedUser.donationCount
//         }
//       });

//       // Add reference to processed set
//       processedReferences.add(reference);

//       return NextResponse.json({
//         status: "success",
//         message: "Payment processed successfully",
//         data: {
//           paymentId: payment.id,
//           pointsId: points.id,
//           reference,
//           transactionType: requestId ? 'donation' : 'wallet_deposit'
//         }
//       });

//     } catch (error) {
//       console.error(`[${webhookId}] Error processing transaction:`, error);
//       console.error(`[${webhookId}] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
//       return NextResponse.json(
//         { 
//           status: 'error',
//           message: 'Failed to process transaction',
//           error: error instanceof Error ? error.message : 'Unknown error'
//         },
//         { status: 500 }
//       );
//     }
//   } catch (error) {
//     console.error(`[${webhookId}] Error processing transaction:`, error);
//     console.error(`[${webhookId}] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
//     return NextResponse.json(
//       { 
//         status: 'error',
//         message: 'Failed to process transaction',
//         error: error instanceof Error ? error.message : 'Unknown error'
//       },
//       { status: 500 }
//     );
//   }
// }




////////////////////////////////////////LAAAAAAAAAAAAAAAAASSSSSSSSSSSSSSSSSSSSSSTTTTTTTTTTTTTTTTTTTTTTTTBBBBBBBBBBBBBBBBBBBBBBBBIIIIIIIIIIIIIIIIIIIIIIIIIIIITTTTTTTTTTTTTTTTT





// const processedReferences = new Set<string>();


// async function handlePaystackWebhook(event: any, webhookId: string) {
//   const reference = event.data.reference;
//   const metadata = event.data.metadata || {};
//   const amount = event.data.amount / 100; // Convert from kobo to KES
//   const customerEmail = event.data.customer.email;
//   const requestId = metadata.request_id || metadata.requestId; // Handle both formats
//   const paidAt = event.data.paid_at;
//   const transactionType = metadata.type; // 'donation' or 'deposit'
//   console.log("its here: deposittttttttttttttttttttttttttttttttttttttttttttttttttt")
//   console.log(transactionType, 'leo ni leoooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo[o')

//   console.log(`[${webhookId}] ============ PAYSTACK TRANSACTION START ============`);
//   console.log(`[${webhookId}] Transaction Details:`, {
//     reference,
//     amount,
//     currency: event.data.currency,
//     metadata,
//     customer: event.data.customer,
//     paidAt,
//     requestId,
//     transactionType,
//   });

//   // Check in-memory cache first
//   if (processedReferences.has(reference)) {
//     console.log(`[${webhookId}] Payment already processed (in-memory): ${reference}`);
//     return NextResponse.json({ status: "success", message: "Payment already processed" });
//   }

//   try {
//     // Get user ID from email
//     console.log(`[${webhookId}] Fetching user ID for email: ${customerEmail}`);
//     const user = await prisma.user.findUnique({
//       where: { email: customerEmail },
//       select: { id: true },
//     });

//     if (!user) {
//       console.error(`[${webhookId}] User not found for email: ${customerEmail}`);
//       throw new Error('User not found');
//     }

//     console.log(`[${webhookId}] Found user:`, user);

//     // Handle deposits
//     if (transactionType === 'deposit') {
//       console.log(`[${webhookId}] Processing deposit for user:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::: ${user.id}`);
    
//       // Update the user's deposit wallet balance
//       const depositWallet = await prisma.depositWallet.upsert({
//         where: { userId: user.id },
//         create: {
//           userId: user.id,
//           balance: amount, // Set initial balance for new wallets
//           name: "Donation Pool", // Default name
//         },
//         update: {
//           balance: { increment: amount }, // Increment balance for existing wallets
//         },
//       });
    
//       console.log(`[${webhookId}] Updated deposit wallet balance:`, depositWallet);
    
//       // Add reference to processed set
//       processedReferences.add(reference);
    
//       return NextResponse.json({
//         status: "success",
//         message: "Deposit processed successfully",
//         data: {
//           depositWalletId: depositWallet.id,
//           newBalance: depositWallet.balance,
//           reference,
//         },
//       });
//     }

//     // Handle donations
//     if (transactionType === 'donation') {
//       console.log(`[${webhookId}] Processing donation for request: ${requestId}`);

//       // First transaction: Create payment and donation
//       const { payment, donation } = await prisma.$transaction(async (tx) => {
//         const payment = await tx.payment.create({
//           data: {
//             amount,
//             paymentMethod: PaymentMethod.PAYSTACK,
//             status: PaymentStatus.COMPLETED,
//             merchantRequestId: reference,
//             resultCode: "00",
//             resultDesc: "Success",
//             sender: { connect: { id: user.id } },
//             request: { connect: { id: requestId } },
//             userts: new Date(paidAt),
//           },
//         });
//         console.log(`[${webhookId}] Payment created:`, payment);

//         const donation = await tx.donation.create({
//           data: {
//             userId: user.id,
//             requestId,
//             amount,
//             payment: { connect: { id: payment.id } },
//             status: PaymentStatus.COMPLETED,
//             invoice: reference,
//           },
//         });
//         console.log(`[${webhookId}] Donation created:`, donation);

//         return { payment, donation };
//       });

//       // Second transaction: Update request and wallet
//       if (requestId) {
//         const request = await prisma.request.findUnique({
//           where: { id: requestId },
//           include: { User: true },
//         });

//         if (!request?.User) {
//           throw new Error('Request or user not found');
//         }

//         await prisma.$transaction([
//           prisma.request.update({
//             where: { id: requestId },
//             data: { status: 'PAID' },
//           }),
//           prisma.wallet.upsert({
//             where: { userId: request.User.id },
//             create: { userId: request.User.id, balance: amount },
//             update: { balance: { increment: amount } },
//           }),
//           prisma.transaction.create({
//             data: {
//               amount,
//               giver: { connect: { id: user.id } },
//               receiver: { connect: { id: request.User.id } },
//             },
//           }),
//         ]);
//         console.log(`[${webhookId}] Updated request status and wallet`);
//       }

//       // Third transaction: Create points and update user stats
//       const [points, updatedUser] = await prisma.$transaction([
//         prisma.points.create({
//           data: {
//             user: { connect: { id: user.id } },
//             amount: 1, // Always award 1 point per donation
//             payment: { connect: { id: payment.id } },
//           },
//         }),
//         prisma.user.update({
//           where: { id: user.id },
//           data: {
//             totalDonated: { increment: amount },
//             donationCount: { increment: 1 },
//           },
//         }),
//       ]);

//       console.log(`[${webhookId}] Created points and updated user stats:`, {
//         points,
//         userStats: {
//           totalDonated: updatedUser.totalDonated,
//           donationCount: updatedUser.donationCount,
//         },
//       });

//       // Add reference to processed set
//       processedReferences.add(reference);

//       return NextResponse.json({
//         status: "success",
//         message: "Donation processed successfully",
//         data: {
//           paymentId: payment.id,
//           pointsId: points.id,
//           reference,
//         },
//       });
//     }

//     // If transaction type is neither 'deposit' nor 'donation'
//     console.error(`[${webhookId}] Unknown transaction type: ${transactionType}`);
//     return NextResponse.json(
//       { status: "error", message: "Unknown transaction type" },
//       { status: 400 }
//     );
//   } catch (error) {
//     console.error(`[${webhookId}] Error processing transaction:`, error);
//     console.error(`[${webhookId}] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
//     return NextResponse.json(
//       {
//         status: "error",
//         message: "Failed to process transaction",
//         error: error instanceof Error ? error.message : "Unknown error",
//       },
//       { status: 500 }
//     );
//   }
// };




// export async function POST(req: Request) {
//   const webhookId = crypto.randomBytes(16).toString('hex');
  
//   // Immediate logging to verify webhook reception
//   console.log('========================');
//   console.log('WEBHOOK RECEIVED - RAW');
//   console.log('Timestamp:', new Date().toISOString());
//   console.log('Method:', req.method);
//   console.log('URL:', req.url);
//   console.log('Headers:', Object.fromEntries(req.headers.entries()));
//   console.log('========================');

//   console.log(`[${webhookId}] ============ PAYSTACK WEBHOOK START ============`);
//   console.log(`[${webhookId}] Webhook received at ${new Date().toISOString()}`);

//   try {
//     const rawBody = await req.text();
//     // Log the raw body immediately
//     console.log('Raw webhook body received::::::::::::::::::::::::::::', rawBody);
//     console.log('Content length:', rawBody.length);
    
//     console.log(`[${webhookId}] Headers:`, {
//       signature: req.headers.get('x-paystack-signature'),
//       contentType: req.headers.get('content-type'),
//       userAgent: req.headers.get('user-agent')
//     });

//     let event: any;
//     try {
//       event = JSON.parse(rawBody);
//       console.log(`[${webhookId}] Parsed event:`, JSON.stringify(event, null, 2));
//       console.log(`[${webhookId}] Event type:`, event.event);
//       console.log(`[${webhookId}] Data:`, {
//         reference: event.data?.reference,
//         amount: event.data?.amount,
//         metadata: event.data?.metadata,
//         customer: event.data?.customer
//       });

      
     
//     } catch (error) {
//       console.error(`[${webhookId}] Error parsing JSON:`, error);
//       return NextResponse.json({ status: 'error', message: 'Invalid JSON' }, { status: 400 });
//     }

//     // Check if it's a Kopokopo webhook
//     if (event.data?.type === 'incoming_payment') {
//       console.log(`[${webhookId}] Detected Kopokopo webhook`);
//       return handleKopokopoWebhook(event.data, webhookId);
//     }

//     // Otherwise, treat it as a Paystack webhook
//     const secretKey = process.env.PAYSTACK_SECRET_KEY;
//     const sig = req.headers.get('x-paystack-signature');

//     if (!secretKey) {
//       console.error(`[${webhookId}] Missing PAYSTACK_SECRET_KEY environment variable`);
//       return NextResponse.json({ status: 'error', message: 'Server configuration error' }, { status: 500 });
//     }

//     if (!sig) {
//       console.error(`[${webhookId}] Missing x-paystack-signature header`);
//       return NextResponse.json({ status: 'error', message: 'Missing signature header' }, { status: 400 });
//     }

//     const computedSignature = crypto
//       .createHmac('sha512', secretKey)
//       .update(rawBody)
//       .digest('hex');

//     console.log(`[${webhookId}] Signature verification:`, {
//       received: sig,
//       computed: computedSignature,
//       match: sig === computedSignature
//     });

//     if (sig !== computedSignature) {
//       console.error(`[${webhookId}] Invalid signature`);
//       return NextResponse.json({ status: 'error', message: 'Invalid signature' }, { status: 400 });
//     }

//     // Handle Paystack events
//     switch (event.event) {
//       case 'charge.success':
//         console.log(`[${webhookId}] Processing charge.success event`);
        
//         const result = await handlePaystackWebhook(event, webhookId);
//         console.log(`[${webhookId}] Webhook handler result:`, result);
        
//         return result;

//       case 'transfer.success':
//       case 'transfer.failed':
//       case 'transfer.reversed':
//         console.log(`[${webhookId}] Processing transfer event: ${event.event}`);
//         return handleWithdraw(event, webhookId);

//       default:
//         console.log(`[${webhookId}] Unhandled event type: ${event.event}`);
//         return NextResponse.json({ status: 'success', message: 'Webhook received' });
//     }
//   } catch (error) {
//     console.error(`[${webhookId}] Webhook processing error:`, error);
//     console.error(`[${webhookId}] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
//     return NextResponse.json({ 
//       status: 'error', 
//       message: 'Internal server error',
//       error: error instanceof Error ? error.message : 'Unknown error'
//     }, { status: 500 });
//   } finally {
//     console.log(`[${webhookId}] ============ PAYSTACK WEBHOOK END ============`);
//   }
// };