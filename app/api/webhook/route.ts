import { NextResponse } from "next/server";
import crypto from "crypto";
import { PaymentStatus, PaymentMethod } from "@prisma/client";
import { updateDonationStatus } from "@/app/(actions)/handleDonation";
import { prisma } from "@/app/lib/db";

// Keep track of processed references in memory
const processedReferences = new Set<string>();

async function handlePaystackWebhook(event: any, webhookId: string) {
  const reference = event.data.reference;
  const requestId = event.data.metadata?.request_id;
  
  console.log(`[${webhookId}] Processing Paystack charge.success for reference: ${reference}, requestId: ${requestId}`);

  // Check in-memory cache first
  if (processedReferences.has(reference)) {
    console.log(`[${webhookId}] Payment already processed (in-memory): ${reference}`);
    return NextResponse.json({ status: "success", message: "Payment already processed" });
  }

  try {
    // Find the pending donation by requestId
    const pendingDonation = await prisma.donation.findFirst({
      where: {
        requestId: requestId,
        status: PaymentStatus.PENDING
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        User: true,
        Request: true
      }
    });

    if (!pendingDonation) {
      console.error(`[${webhookId}] No pending donation found for requestId: ${requestId}`);
      return NextResponse.json({ 
        status: "error", 
        message: "No pending donation found",
        details: `Reference: ${reference}, RequestId: ${requestId}`
      }, { status: 404 });
    }

    console.log(`[${webhookId}] Found pending donation:`, pendingDonation.id);

    // Create payment record first
    const payment = await prisma.payment.create({
      data: {
        amount: event.data.amount / 100,
        paymentMethod: PaymentMethod.PAYSTACK,
        status: PaymentStatus.COMPLETED,
        checkoutRequestId: reference,
        merchantRequestId: event.data.id.toString(),
        resultCode: event.data.status,
        resultDesc: "Success",
        currency: event.data.currency,
        userId: pendingDonation.userId,
        requestId: requestId,
        donationId: pendingDonation.id,
        userts: new Date(event.data.paid_at),
        transactionDate: new Date()
      }
    });

    console.log(`[${webhookId}] Created payment record: ${payment.id}`);

    // Process the donation update through the handler for points and notifications
    const result = await updateDonationStatus(
      reference,
      PaymentStatus.COMPLETED,
      event.data.reference
    );

    if (result.success) {
      processedReferences.add(reference);
      console.log(`[${webhookId}] Payment fully processed: ${reference}`);
      return NextResponse.json({ status: "success", message: "Payment processed" });
    } else {
      console.warn(`[${webhookId}] Payment processed but points/notifications failed:`, result.error);
      return NextResponse.json({ status: "partial", message: "Payment processed but some updates failed" });
    }
  } catch (error) {
    console.error(`[${webhookId}] Error processing Paystack payment:`, error);
    return NextResponse.json({ 
      status: "error", 
      message: "Error processing payment",
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
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
  const webhookId = crypto.randomBytes(16).toString("hex");
  console.log(`[${webhookId}] Webhook received at ${new Date().toISOString()}`);

  try {
    const rawBody = await req.text();
    console.log(`[${webhookId}] Raw webhook body:`, rawBody);

    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch (error) {
      console.error(`[${webhookId}] Error parsing JSON:`, error);
      return NextResponse.json({ status: "error", message: "Invalid JSON" }, { status: 400 });
    }

    // Check if it's a Kopokopo webhook
    if (event.data?.type === 'incoming_payment') {
      return handleKopokopoWebhook(event.data, webhookId);
    }

    // Otherwise, treat it as a Paystack webhook
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const sig = req.headers.get("x-paystack-signature");

    if (!secretKey || !sig) {
      console.error(`[${webhookId}] Missing secret key or signature`);
      return NextResponse.json({ status: "error", message: "Missing secret key or signature" }, { status: 400 });
    }

    const computedSignature = crypto
      .createHmac("sha512", secretKey)
      .update(rawBody)
      .digest("hex");

    if (sig !== computedSignature) {
      console.error(`[${webhookId}] Invalid signature`);
      return NextResponse.json({ status: "error", message: "Invalid signature" }, { status: 400 });
    }

    if (event.event === "charge.success") {
      return handlePaystackWebhook(event, webhookId);
    }

    // Handle other event types if needed
    console.log(`[${webhookId}] Unhandled event type: ${event.event}`);
    return NextResponse.json({ status: "success", message: "Webhook received" });

  } catch (error) {
    console.error(`[${webhookId}] Webhook processing error:`, error);
    return NextResponse.json({ 
      status: "error", 
      message: "Internal server error",
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}