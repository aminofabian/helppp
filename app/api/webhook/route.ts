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

      try {
        // Find the pending donation first
        const pendingDonation = await prisma.donation.findFirst({
          where: {
            requestId: requestId,
            status: PaymentStatus.PENDING
          },
          include: {
            User: true,
            Request: true
          }
        });

        if (!pendingDonation) {
          throw new Error(`No pending donation found for requestId: ${requestId}`);
        }

        console.log(`[${webhookId}] Found pending donation:`, pendingDonation.id);

        // Update donation status first
        const updatedDonation = await prisma.donation.update({
          where: { id: pendingDonation.id },
          data: {
            status: PaymentStatus.COMPLETED,
            transactionDate: new Date(),
            invoice: reference // Set the Paystack reference as invoice
          }
        });

        console.log(`[${webhookId}] Updated donation status:`, updatedDonation.id);

        // Then create the payment record
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
            userId: pendingDonation.userId,
            requestId: requestId,
            donationId: pendingDonation.id,
            userts: new Date(event.data.paid_at),
            transactionDate: new Date()
          }
        });

        console.log(`[${webhookId}] Created payment record: ${payment.id}`);

        // Update request amount
        if (pendingDonation.Request) {
          await prisma.request.update({
            where: { id: pendingDonation.Request.id },
            data: {
              amount: {
                increment: event.data.amount / 100 // Convert from kobo to KES
              }
            }
          });
          console.log(`[${webhookId}] Updated request amount`);
        }

        // Process the donation update through the handler for points and notifications
        const result = await updateDonationStatus(
          reference, // Use Paystack reference
          PaymentStatus.COMPLETED,
          event.data.reference // Use Paystack reference as receipt number
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