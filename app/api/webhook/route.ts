import { NextResponse } from "next/server";
import crypto from "crypto";
import { PaymentStatus, PaymentMethod } from "@prisma/client";
import { updateDonationStatus } from "@/app/(actions)/handleDonation";
import { prisma } from "@/app/lib/db";

// Keep track of processed references in memory
const processedReferences = new Set<string>();

export async function POST(req: Request) {
  const webhookId = crypto.randomBytes(16).toString("hex");
  console.log(`[${webhookId}] Webhook received at ${new Date().toISOString()}`);

  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const sig = req.headers.get("x-paystack-signature");

    if (!secretKey || !sig) {
      console.error(`[${webhookId}] Missing secret key or signature`);
      return NextResponse.json({ status: "error", message: "Missing secret key or signature" }, { status: 400 });
    }

    const rawBody = await req.text();
    console.log(`[${webhookId}] Raw webhook body:`, rawBody);

    const computedSignature = crypto
      .createHmac("sha512", secretKey)
      .update(rawBody)
      .digest("hex");

    if (sig !== computedSignature) {
      console.error(`[${webhookId}] Invalid signature`);
      return NextResponse.json({ status: "error", message: "Invalid signature" }, { status: 400 });
    }

    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch (error) {
      console.error(`[${webhookId}] Error parsing JSON:`, error);
      return NextResponse.json({ status: "error", message: "Invalid JSON" }, { status: 400 });
    }

    console.log(`[${webhookId}] Processing event type: ${event.event}`);

    if (event.event === "charge.success") {
      const reference = event.data.reference;
      const [requestId] = reference.split('_'); // Extract requestId from reference
      
      console.log(`[${webhookId}] Processing charge.success for reference: ${reference}, requestId: ${requestId}`);

      // Check in-memory cache first
      if (processedReferences.has(reference)) {
        console.log(`[${webhookId}] Payment already processed (in-memory): ${reference}`);
        return NextResponse.json({ status: "success", message: "Payment already processed" });
      }

      // Check if payment already exists in database
      const existingPayment = await prisma.payment.findFirst({
        where: { checkoutRequestId: reference }
      });

      if (existingPayment) {
        console.log(`[${webhookId}] Payment already exists in database: ${reference}`);
        processedReferences.add(reference);
        return NextResponse.json({ status: "success", message: "Payment already processed" });
      }

      try {
        // First create the payment record
        const payment = await prisma.payment.create({
          data: {
            amount: event.data.amount / 100, // Convert from kobo to KES
            paymentMethod: PaymentMethod.PAYSTACK,
            status: PaymentStatus.COMPLETED,
            checkoutRequestId: reference,
            merchantRequestId: event.data.id.toString(),
            resultCode: event.data.status,
            resultDesc: "Success",
            currency: event.data.currency,
            sender: {
              connect: {
                email: event.data.customer.email
              }
            },
            userts: new Date(event.data.paid_at),
            transactionDate: new Date()
          }
        });

        console.log(`[${webhookId}] Created payment record: ${payment.id}`);

        // Then update the donation status
        const result = await updateDonationStatus(
          reference,
          PaymentStatus.COMPLETED,
          event.data.reference // Using Paystack reference as receipt number
        );

        if (result.success) {
          processedReferences.add(reference);
          console.log(`[${webhookId}] Payment processed successfully: ${reference}`);
          return NextResponse.json({ status: "success", message: "Payment processed" });
        } else {
          throw new Error(result.error ? String(result.error) : 'Failed to update donation status');
        }
      } catch (error) {
        console.error(`[${webhookId}] Error processing payment:`, error);
        return NextResponse.json({ 
          status: "error", 
          message: "Error processing payment",
          error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
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