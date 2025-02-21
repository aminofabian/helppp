import { NextResponse } from "next/server";
import crypto from "crypto";
import { PaymentStatus } from "@prisma/client";
import { updateDonationStatus } from "@/app/(actions)/handleDonation";

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

    if (event.event === "charge.success") {
      const reference = event.data.reference;
      console.log(`[${webhookId}] Processing charge.success for reference: ${reference}`);

      // Check in-memory cache first
      if (processedReferences.has(reference)) {
        console.log(`[${webhookId}] Payment already processed (in-memory): ${reference}`);
        return NextResponse.json({ status: "success", message: "Payment already processed" });
      }

      // Update donation status
      const result = await updateDonationStatus(
        reference,
        PaymentStatus.COMPLETED,
        event.data
      );

      if (result.success) {
        // Add to processed references
        processedReferences.add(reference);
        console.log(`[${webhookId}] Payment processed successfully: ${reference}`);
        return NextResponse.json({ status: "success", message: "Payment processed" });
      } else {
        console.error(`[${webhookId}] Error processing payment:`, result.error);
        return NextResponse.json({ status: "error", message: "Error processing payment" }, { status: 500 });
      }
    }

    return NextResponse.json({ status: "success", message: "Webhook received" });
  } catch (error) {
    console.error(`[${webhookId}] Webhook processing error:`, error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}