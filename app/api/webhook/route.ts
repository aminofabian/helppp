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
  const transactionType = metadata.type || '';
  const paidAt = event.data.paid_at;
  const requestId = metadata.requestId;

  console.log(`[${webhookId}] ============ PAYSTACK TRANSACTION START ============`);
  console.log(`[${webhookId}] Transaction Details:`, {
    reference,
    amount,
    currency: event.data.currency,
    metadata,
    customer: event.data.customer,
    paidAt,
    transactionType,
    requestId
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
      throw new Error('User not found');
    }

    // Start a transaction
    const result = await prisma.$transaction(async (tx) => {
      let payment;

      if (transactionType === 'wallet_deposit') {
        // Handle wallet deposit
        console.log(`[${webhookId}] Processing wallet deposit`);
        const wallet = await tx.wallet.upsert({
          where: { userId: user.id },
          update: { balance: { increment: amount } },
          create: { userId: user.id, balance: amount }
        });

        payment = await tx.payment.create({
          data: {
            amount,
            paymentMethod: PaymentMethod.PAYSTACK,
            status: PaymentStatus.COMPLETED,
            merchantRequestId: reference,
            resultCode: "00",
            resultDesc: "Success",
            sender: { connect: { id: user.id } },
            userts: new Date(paidAt)
          }
        });

        await tx.transaction.create({
          data: {
            amount,
            giver: { connect: { id: user.id } },
            receiver: { connect: { id: user.id } }
          }
        });
      } else if (requestId) {
        // Handle donation
        console.log(`[${webhookId}] Processing donation for request: ${requestId}`);
        
        // Get request details
        const request = await tx.request.findUnique({
          where: { id: requestId },
          include: { User: true }
        });

        if (!request) {
          throw new Error('Request not found');
        }

        payment = await tx.payment.create({
          data: {
            amount,
            paymentMethod: PaymentMethod.PAYSTACK,
            status: PaymentStatus.COMPLETED,
            merchantRequestId: reference,
            resultCode: "00",
            resultDesc: "Success",
            sender: { connect: { id: user.id } },
            requestId,
            userts: new Date(paidAt)
          }
        });

        // Create donation record
        const donation = await tx.donation.create({
          data: {
            userId: user.id,
            requestId,
            amount,
            payment: { connect: { id: payment.id } },
            status: PaymentStatus.COMPLETED,
            invoice: reference
          }
        });

        // Update request status
        await tx.request.update({
          where: { id: requestId },
          data: { status: 'PAID' }
        });

        // Update receiver's wallet
        await tx.wallet.upsert({
          where: { userId: request.userId },
          create: { userId: request.userId, balance: amount },
          update: { balance: { increment: amount } }
        });

        // Create transaction record
        await tx.transaction.create({
          data: {
            amount,
            giver: { connect: { id: user.id } },
            receiver: { connect: { id: request.userId } }
          }
        });
      } else {
        throw new Error('Invalid transaction type: neither wallet deposit nor donation');
      }

      // Create points (1 point per transaction)
      console.log(`[${webhookId}] Creating points for user: ${user.id}`);
      const points = await tx.points.create({
        data: {
          user: { connect: { id: user.id } },
          amount: 1,
          payment: { connect: { id: payment.id } }
        }
      });

      // Update user stats
      await tx.user.update({
        where: { id: user.id },
        data: {
          totalDonated: { increment: amount },
          donationCount: { increment: 1 }
        }
      });

      // Add reference to processed set
      processedReferences.add(reference);

      return { payment, points };
    });

    console.log(`[${webhookId}] Transaction processed successfully:`, {
      paymentId: result.payment.id,
      pointsId: result.points.id,
      reference
    });

    return NextResponse.json({
      status: "success",
      message: "Payment processed successfully"
    });

  } catch (error) {
    console.error(`[${webhookId}] Error processing transaction:`, error);
    return NextResponse.json(
      { error: 'Failed to process transaction' },
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