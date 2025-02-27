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
  const requestId = event.data.metadata?.request_id;
  const customerId = event.data.metadata?.userId;
  const amount = event.data.amount / 100; // Convert from kobo to KES

  console.log(`[${webhookId}] Processing Paystack charge.success for reference: ${reference}, requestId: ${requestId}, customerId: ${customerId}`);

  // Check in-memory cache first
  if (processedReferences.has(reference)) {
    console.log(`[${webhookId}] Payment already processed (in-memory): ${reference}`);
    return NextResponse.json({ status: "success", message: "Payment already processed" });
  }

  try {
    // Use a transaction to ensure atomicity and prevent duplicate records
    const result = await prisma.$transaction(async (prisma) => {
      // Check for existing completed payment or donation
      const [existingPayment, existingDonation] = await Promise.all([
        prisma.payment.findFirst({
          where: {
            OR: [
              { merchantRequestId: reference },
              { checkoutRequestId: reference }
            ],
            status: PaymentStatus.COMPLETED
          }
        }),
        prisma.donation.findFirst({
          where: {
            invoice: reference,
            status: PaymentStatus.COMPLETED
          }
        })
      ]);

      if (existingPayment || existingDonation) {
        console.log(`[${webhookId}] Payment/Donation already processed: ${reference}`);
        return { status: "already_processed", payment: existingPayment, donation: existingDonation };
      }

      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          merchantRequestId: reference,
          checkoutRequestId: reference,
          amount: amount,
          paymentMethod: PaymentMethod.PAYSTACK,
          status: PaymentStatus.COMPLETED,
          resultCode: "SUCCESS",
          resultDesc: "Paystack payment successful",
          currency: event.data.currency,
          userId: customerId,
          requestId: requestId,
          userts: new Date(event.data.paid_at),
          transactionDate: new Date()
        }
      });

      // Create donation record
      const donation = await prisma.donation.create({
        data: {
          userId: customerId,
          requestId: requestId,
          amount: amount,
          payment: { connect: { id: payment.id } },
          status: PaymentStatus.COMPLETED,
          invoice: reference
        }
      });

      // Update request status
      await prisma.request.update({
        where: { id: requestId },
        data: { status: 'PAID' }
      });

      // Update or create wallet
      const wallet = await prisma.wallet.upsert({
        where: { userId: customerId },
        update: { balance: { increment: amount } },
        create: { userId: customerId, balance: amount }
      });

      // Create transaction record
      await prisma.transaction.create({
        data: {
          amount: amount,
          giver: { connect: { id: customerId } },
          receiver: { connect: { id: customerId } }
        }
      });

      // Create points for the user (1 point per 50 KES)
      const pointsEarned = Math.floor(amount / 50);
      await prisma.points.create({
        data: {
          user: { connect: { id: customerId } },
          amount: pointsEarned,
          payment: { connect: { id: payment.id } }
        }
      });

      // Create notification
      await prisma.notification.create({
        data: {
          recipient: { connect: { id: customerId } },
          issuer: { connect: { id: customerId } },
          type: 'PAYMENT_COMPLETED',
          title: 'Payment Successful',
          content: `Your payment of ${event.data.currency} ${amount} has been processed successfully.`,
          read: false
        }
      });

      // Update user stats atomically
      await prisma.user.update({
        where: { id: customerId },
        data: {
          totalDonated: { increment: amount },
          donationCount: { increment: 1 }
        }
      });

      return { status: "success", payment, donation, wallet };
    });

    // Add to processed references cache only if new payment was created
    if (result.status === "success") {
      processedReferences.add(reference);
    }

    return NextResponse.json({
      status: "success",
      message: result.status === "already_processed" ? "Payment already processed" : "Payment processed successfully",
      data: result
    });

  } catch (error) {
    console.error(`[${webhookId}] Error processing payment:`, error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to process payment",
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

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

// export async function POST(req: Request) {
//   const webhookId = crypto.randomBytes(16).toString("hex");
//   console.log(`[${webhookId}] Webhook received at ${new Date().toISOString()}`);

//   try {
//     const rawBody = await req.text();
//     console.log(`[${webhookId}] Raw webhook body:`, rawBody);

//     let event: any;
//     try {
//       event = JSON.parse(rawBody);
//     } catch (error) {
//       console.error(`[${webhookId}] Error parsing JSON:`, error);
//       return NextResponse.json({ status: "error", message: "Invalid JSON" }, { status: 400 });
//     }

//     // Check if it's a Kopokopo webhook
//     if (event.data?.type === 'incoming_payment') {
//       return handleKopokopoWebhook(event.data, webhookId);
//     }

//     // Otherwise, treat it as a Paystack webhook
//     const secretKey = process.env.PAYSTACK_SECRET_KEY;
//     const sig = req.headers.get("x-paystack-signature");

//     if (!secretKey || !sig) {
//       console.error(`[${webhookId}] Missing secret key or signature`);
//       return NextResponse.json({ status: "error", message: "Missing secret key or signature" }, { status: 400 });
//     }

//     const computedSignature = crypto
//       .createHmac("sha512", secretKey)
//       .update(rawBody)
//       .digest("hex");

//     if (sig !== computedSignature) {
//       console.error(`[${webhookId}] Invalid signature`);
//       return NextResponse.json({ status: "error", message: "Invalid signature" }, { status: 400 });
//     }

//     // Handle other event types if needed
//     console.log(`[${webhookId}] Unhandled event type: ${event.event}`);
//     return NextResponse.json({ status: "success", message: "Webhook received" });

//   } catch (error) {
//     console.error(`[${webhookId}] Webhook processing error:`, error);
//     return NextResponse.json({ 
//       status: "error", 
//       message: "Internal server error",
//       error: error instanceof Error ? error.message : 'Unknown error'
//     }, { status: 500 });
//   }
// }


export async function POST(req: Request) {
  const webhookId = crypto.randomBytes(16).toString('hex');
  console.log(`[${webhookId}] Webhook received at ${new Date().toISOString()}`);

  try {
    const rawBody = await req.text();
    console.log(`[${webhookId}] Raw webhook body:`, rawBody);

    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch (error) {
      console.error(`[${webhookId}] Error parsing JSON:`, error);
      return NextResponse.json({ status: 'error', message: 'Invalid JSON' }, { status: 400 });
    }

    // Check if it's a Kopokopo webhook
    if (event.data?.type === 'incoming_payment') {
      return handleKopokopoWebhook(event.data, webhookId);
    }

    // Otherwise, treat it as a Paystack webhook
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const sig = req.headers.get('x-paystack-signature');

    if (!secretKey || !sig) {
      console.error(`[${webhookId}] Missing secret key or signature`);
      return NextResponse.json({ status: 'error', message: 'Missing secret key or signature' }, { status: 400 });
    }

    const computedSignature = crypto
      .createHmac('sha512', secretKey)
      .update(rawBody)
      .digest('hex');

    if (sig !== computedSignature) {
      console.error(`[${webhookId}] Invalid signature`);
      return NextResponse.json({ status: 'error', message: 'Invalid signature' }, { status: 400 });
    }

    // Handle Paystack events
    switch (event.event) {
      case 'charge.success':
        return handlePaystackWebhook(event, webhookId);

      case 'transfer.success':
      case 'transfer.failed':
      case 'transfer.reversed':
        return handleWithdraw(event, webhookId);

      default:
        console.log(`[${webhookId}] Unhandled event type: ${event.event}`);
        return NextResponse.json({ status: 'success', message: 'Webhook received' });
    }
  } catch (error) {
    console.error(`[${webhookId}] Webhook processing error:`, error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
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
//   const requestId = event.data.metadata?.request_id;
//   const customerId = event.data.metadata?.userId;

//   console.log(event.data.amount,"this is the data///////////////////////////////////////////////////////////////////////////::::::::::::::::::::::::::::::::")
  
//   console.log(`[${webhookId}] Processing Paystack charge.success for reference: ${reference}, requestId: ${requestId}, customerId: ${customerId}`);

//   // Check in-memory cache first
//   if (processedReferences.has(reference)) {
//     console.log(`[${webhookId}] Payment already processed (in-memory): ${reference}`);
//     return NextResponse.json({ status: "success", message: "Payment already processed" });
//   }

//   try {
//     // Find the request and associated user (receiver)
//     const request = await prisma.request.findUnique({
//       where: { id: requestId },
//       include: {
//         User: true,
//         Community: true
//       }
//     });

//     if (!request) {
//       console.error(`[${webhookId}] Request not found for requestId: ${requestId}`);
//       return NextResponse.json({ 
//         status: "error", 
//         message: "Request not found",
//         details: `Reference: ${reference}, RequestId: ${requestId}`
//       }, { status: 404 });
//     }

//     // Find giver using multiple methods
//     let giver = null;

//     // 1. Try to find by customerId from metadata (Kinde ID)
//     if (customerId) {
//       giver = await prisma.user.findUnique({ 
//         where: { id: customerId }
//       });
//       console.log(`[${webhookId}] Found user by Kinde ID:`, giver?.id);
//     }

//     // 2. If not found, try to find by email
//     if (!giver && event.data.customer?.email) {
//       giver = await prisma.user.findFirst({ 
//         where: { email: event.data.customer.email }
//       });
//       console.log(`[${webhookId}] Found user by email:`, giver?.id);
//     }

//     // 3. If still not found, create a new user with available data
//     if (!giver) {
//       // Try to get Kinde user data if customerId exists
//       let kindeUserData = null;
//       if (customerId) {
//         const { getUser } = getKindeServerSession();
//         kindeUserData = await getUser();
//       }

//       giver = await prisma.user.create({
//         data: {
//           id: customerId || crypto.randomUUID(),
//           email: event.data.customer?.email || '',
//           firstName: kindeUserData?.given_name || event.data.customer?.first_name || '',
//           lastName: kindeUserData?.family_name || event.data.customer?.last_name || '',
//           imageUrl: kindeUserData?.picture || '',
//           userName: `user_${Date.now()}`,
//           level: 1,
//           totalDonated: event.data.amount / 100, // Convert from kobo to KES
//           donationCount: 1
//         }
//       });
//       console.log(`[${webhookId}] Created new user:`, giver.id);
//     }

//     // Create payment record
//     const payment = await prisma.payment.create({
//       data: {
//         userId: giver.id,
//         amount: event.data.amount / 100, // Convert from kobo to KES
//         paymentMethod: PaymentMethod.PAYSTACK,
//         status: PaymentStatus.COMPLETED,
//         checkoutRequestId: reference,
//         merchantRequestId: event.data.id.toString(),
//         resultCode: event.data.status,
//         resultDesc: "Success",
//         currency: event.data.currency,
//         requestId: requestId,
//         userts: new Date(event.data.paid_at),
//         transactionDate: new Date()
//       }
//     });

//     console.log(`[${webhookId}] Created payment record: ${payment.id}`);

//     // Create donation record
//     const donation = await prisma.donation.create({
//       data: {
//         userId: giver.id,
//         requestId: requestId,
//         amount: event.data.amount / 100,
//         payment: { connect: { id: payment.id } },
//         status: PaymentStatus.COMPLETED,
//         invoice: reference
//       }
//     });

//     console.log(`[${webhookId}] Created donation record: ${donation.id}`);

//     // Update receiver's wallet if this is a donation to a request
//     if (request?.User) {
//       await handleDonationTransaction(
//         giver.id,
//         request.User.id,
//         event.data.amount / 100,
//         payment.id
//       );
//       console.log(`[${webhookId}] Donation transaction processed for payment ${payment.id}`);
//     }

//     // Calculate points (1 point per 50 KES, minimum 1 point)
//     const amountInKES = event.data.amount / 100; // Convert from kobo to KES
//     const pointsEarned = Math.max(1, Math.floor(amountInKES / 50));
//     console.log(`[${webhookId}] Points calculation:`, {
//       originalAmount: event.data.amount,
//       amountInKES,
//       pointsEarned,
//       calculationDetails: `${amountInKES} KES / 50 = ${pointsEarned} points (minimum 1 point)`
//     });

//     // Create points record
//     const points = await prisma.points.create({
//       data: { 
//         userId: giver.id, 
//         amount: pointsEarned,
//         paymentId: payment.id 
//       }
//     });

//     console.log(`[${webhookId}] Created points record:`, {
//       userId: giver.id,
//       pointsEarned,
//       paymentId: payment.id,
//       pointsRecordId: points.id
//     });

//     // Calculate new level based on total points
//     const userPoints = await prisma.points.findMany({
//       where: { userId: giver.id }
//     });
//     const totalPoints = userPoints.reduce((sum, p) => sum + p.amount, 0);
//     const newLevel = calculateLevel(totalPoints);

//     // Update user profile with new stats
//     await prisma.user.update({
//       where: { id: giver.id },
//       data: {
//         level: newLevel,
//         totalDonated: { increment: event.data.amount / 100 },
//         donationCount: { increment: 1 }
//       }
//     });

//     // Create notification for request creator
//     await prisma.notification.create({
//       data: {
//         recipientId: request.userId,
//         issuerId: giver.id,
//         title: 'New Donation Received! 🎉',
//         content: `${giver.firstName || 'Someone'} donated KES ${event.data.amount / 100} to your request. They earned ${pointsEarned} points and are now at Level ${newLevel}!`,
//         type: 'DONATION',
//         requestId: requestId,
//         donationId: donation.id
//       }
//     });

//     // Create notification for the donor
//     await prisma.notification.create({
//       data: {
//         recipientId: giver.id,
//         issuerId: request.userId,
//         title: 'Thank You for Your Donation! ',
//         content: `Your donation of KES ${event.data.amount / 100} was successful. You earned ${pointsEarned} points and are now at Level ${newLevel}. Keep making a difference!`,
//         type: 'PAYMENT_COMPLETED',
//         requestId: requestId,
//         donationId: donation.id
//       }
//     });

//     // Check if request is fully funded
//     const totalDonations = await prisma.donation.aggregate({
//       where: {
//         requestId: requestId,
//         status: PaymentStatus.COMPLETED
//       },
//       _sum: {
//         amount: true
//       }
//     });

//     if (request.amount && totalDonations._sum.amount && totalDonations._sum.amount >= request.amount) {
//       await prisma.request.update({
//         where: { id: requestId },
//         data: { status: 'FUNDED' }
//       });
      
//       // Create notification for request completion
//       await prisma.notification.create({
//         data: {
//           recipientId: request.userId,
//           issuerId: giver.id,
//           title: 'Fundraising Goal Reached! ',
//           content: `Congratulations! Your request has reached its fundraising goal of KES ${request.amount}. Total amount raised: KES ${totalDonations._sum.amount}`,
//           type: 'PAYMENT_RECEIVED',
//           requestId: requestId,
//           donationId: donation.id
//         }
//       });
//     }

//     // Update community statistics if applicable
//     if (request.Community?.id) {
//       await prisma.community.update({
//         where: { id: request.Community.id },
//         data: {
//           totalDonations: { increment: event.data.amount / 100 }
//         }
//       });
//     }

//     // Add to processed references
//     processedReferences.add(reference);

//     return NextResponse.json({ 
//       status: "success", 
//       message: "Payment processed successfully",
//       data: {
//         paymentId: payment.id,
//         donationId: donation.id,
//         pointsEarned,
//         newLevel
//       }
//     });

//   } catch (error) {
//     console.error(`[${webhookId}] Error processing Paystack payment:`, error);
//     return NextResponse.json({ 
//       status: "error", 
//       message: "Error processing payment",
//       error: error instanceof Error ? error.message : 'Unknown error'
//     }, { status: 500 });
//   }
// }