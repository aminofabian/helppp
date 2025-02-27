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
  const metadata = event.data.metadata;
  const amount = event.data.amount / 100; // Convert from kobo to KES
  const customerEmail = event.data.customer.email;
  const transactionType = metadata?.type || '';

  console.log(`[${webhookId}] ============ PAYSTACK TRANSACTION START ============`);
  console.log(`[${webhookId}] Transaction Details:`, {
    reference,
    amount,
    currency: event.data.currency,
    metadata,
    customer: event.data.customer,
    paidAt: event.data.paid_at,
    transactionType
  });

  // Check in-memory cache first
  if (processedReferences.has(reference)) {
    console.log(`[${webhookId}] Payment already processed (in-memory): ${reference}`);
    return NextResponse.json({ status: "success", message: "Payment already processed" });
  }

  try {
    // Get user ID from email
    console.log(`[${webhookId}] Fetching user ID for email: ${customerEmail}`);
    const user = await prisma.user.findUnique({
      where: { email: customerEmail },
      select: { id: true }
    });

    if (!user) {
      console.error(`[${webhookId}] User not found for email: ${customerEmail}`);
      return NextResponse.json({ 
        status: "error", 
        message: "User not found" 
      }, { status: 404 });
    }

    const userId = user.id;
    console.log(`[${webhookId}] Found user ID: ${userId}`);

    // Handle wallet deposits
    if (transactionType === 'deposit' || transactionType === 'wallet_deposit') {
      console.log(`[${webhookId}] Processing ${transactionType} transaction...`);
      
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
          sender: {
            connect: {
              email: customerEmail
            }
          },
          userts: new Date(event.data.paid_at),
          transactionDate: new Date()
        }
      });

      // Update the appropriate wallet
      if (transactionType === 'deposit') {
        await prisma.depositWallet.upsert({
          where: { userId: userId },
          update: { balance: { increment: amount } },
          create: { userId: userId, balance: amount }
        });
        console.log(`[${webhookId}] Updated deposit wallet balance for user ${userId}`);
      } else {
        await prisma.wallet.upsert({
          where: { userId: userId },
          update: { balance: { increment: amount } },
          create: { userId: userId, balance: amount }
        });
        console.log(`[${webhookId}] Updated regular wallet balance for user ${userId}`);
      }

      // Create points for the deposit
      const pointsEarned = Math.floor(amount);
      if (pointsEarned > 0) {
        await prisma.points.create({
          data: {
            amount: pointsEarned,
            userId: userId,
            paymentId: payment.id
          }
        });
        console.log(`[${webhookId}] Created ${pointsEarned} points for wallet deposit`);
      }

      // Create notification
      await prisma.notification.create({
        data: {
          recipient: { connect: { id: userId } },
          issuer: { connect: { id: userId } },
          type: 'PAYMENT_COMPLETED',
          title: 'Wallet Deposit Successful',
          content: `Your deposit of ${event.data.currency} ${amount} has been processed successfully.`,
          read: false
        }
      });

      // Add to processed references cache
      processedReferences.add(reference);

      return NextResponse.json({
        status: "success",
        message: "Wallet deposit processed successfully",
        data: { payment }
      });
    }

    // Check for existing records before transaction
    console.log(`[${webhookId}] Checking for existing records...`);
    const preCheck = await Promise.all([
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
    console.log(`[${webhookId}] Pre-check results:`, {
      existingPayment: preCheck[0] ? 'Found' : 'Not found',
      existingDonation: preCheck[1] ? 'Found' : 'Not found'
    });

    // Use a transaction for critical operations only
    console.log(`[${webhookId}] Starting critical operations transaction...`);
    const result = await prisma.$transaction(async (prisma) => {
      // Check for existing completed payment or donation
      if (preCheck[0] || preCheck[1]) {
        console.log(`[${webhookId}] Payment/Donation already processed: ${reference}`);
        return { status: "already_processed", payment: preCheck[0], donation: preCheck[1] };
      }

      // Add logging for each operation
      console.log(`[${webhookId}] Creating payment record...`);
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
          sender: {
            connect: {
              email: event.data.customer.email
            }
          },
          request: {
            connect: {
              id: metadata.request_id
            }
          },
          userts: new Date(event.data.paid_at),
          transactionDate: new Date()
        }
      });
      console.log(`[${webhookId}] Payment record created:`, payment.id);

      console.log(`[${webhookId}] Creating donation record...`);
      const donation = await prisma.donation.create({
        data: {
          User: {
            connect: {
              email: event.data.customer.email
            }
          },
          Request: {
            connect: {
              id: metadata.request_id
            }
          },
          amount: amount,
          payment: {
            connect: {
              id: payment.id
            }
          },
          status: PaymentStatus.COMPLETED,
          invoice: reference,
          transactionDate: new Date(event.data.paid_at)
        }
      });
      console.log(`[${webhookId}] Donation record created:`, donation.id);

      // Update request status
      await prisma.request.update({
        where: { id: metadata.request_id },
        data: { status: 'PAID' }
      });

      return { status: "success", payment, donation };
    });

    // Process non-critical operations separately
    if (result.status === "success" && result.payment) {
      console.log(`[${webhookId}] Processing non-critical operations...`);
      try {
        // Create transaction record
        await prisma.transaction.create({
          data: {
            amount: amount,
            giver: { connect: { id: userId } },
            receiver: { connect: { id: userId } }
          }
        });

        // Create notification
        await prisma.notification.create({
          data: {
            recipient: { connect: { id: userId } },
            issuer: { connect: { id: userId } },
            type: 'PAYMENT_COMPLETED',
            title: 'Payment Successful',
            content: `Your payment of ${event.data.currency} ${amount} has been processed successfully.`,
            read: false
          }
        });

        // Update user stats atomically
        await prisma.user.update({
          where: { id: userId },
          data: {
            totalDonated: { increment: amount },
            donationCount: { increment: 1 }
          }
        });

        console.log(`[${webhookId}] Non-critical operations completed successfully`);
      } catch (error) {
        // Log but don't fail the webhook for non-critical operations
        console.error(`[${webhookId}] Error in non-critical operations:`, error);
      }
    }

    console.log(`[${webhookId}] Transaction completed successfully:`, {
      paymentId: result.payment?.id,
      donationId: result.donation?.id
    });

    // Add to processed references cache
    if (result.status === "success") {
      processedReferences.add(reference);
      console.log(`[${webhookId}] Added reference to processed cache:`, reference);
    }

    console.log(`[${webhookId}] ============ PAYSTACK TRANSACTION END ============`);
    return NextResponse.json({
      status: "success",
      message: result.status === "already_processed" ? "Payment already processed" : "Payment processed successfully",
      data: result
    });

  } catch (error) {
    console.error(`[${webhookId}] Transaction error:`, error);
    console.error(`[${webhookId}] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
    console.error(`[${webhookId}] ============ PAYSTACK TRANSACTION ERROR ============`);
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

export async function POST(req: Request) {
  const webhookId = crypto.randomBytes(16).toString('hex');
  
  // Immediate logging to verify webhook reception
  console.log('========================');
  console.log('WEBHOOK RECEIVED - RAW');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));
  console.log('========================');

  console.log(`[${webhookId}] ============ PAYSTACK WEBHOOK START ============`);
  console.log(`[${webhookId}] Webhook received at ${new Date().toISOString()}`);

  try {
    const rawBody = await req.text();
    // Log the raw body immediately
    console.log('Raw webhook body received:', rawBody);
    
    console.log(`[${webhookId}] Headers:`, {
      signature: req.headers.get('x-paystack-signature'),
      contentType: req.headers.get('content-type'),
      userAgent: req.headers.get('user-agent')
    });

    let event: any;
    try {
      event = JSON.parse(rawBody);
      console.log(`[${webhookId}] Parsed event:`, JSON.stringify(event, null, 2));
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

    console.log(`[${webhookId}] Signature verification:`, {
      received: sig,
      computed: computedSignature,
      match: sig === computedSignature
    });

    if (sig !== computedSignature) {
      console.error(`[${webhookId}] Invalid signature`);
      return NextResponse.json({ status: 'error', message: 'Invalid signature' }, { status: 400 });
    }

    // Handle Paystack events
    switch (event.event) {
      case 'charge.success':
        console.log(`[${webhookId}] Processing charge.success event`);
        return handlePaystackWebhook(event, webhookId);

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
    console.log(`[${webhookId}] ============ PAYSTACK WEBHOOK END ============`);
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