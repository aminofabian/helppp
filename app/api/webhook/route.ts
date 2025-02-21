import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/app/lib/db";
import { PaymentMethod, PaymentStatus } from "@prisma/client";
import { calculateLevel } from "@/app/lib/levelCalculator";

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

      // Check database for existing payment or donation
      const [existingPayment, existingDonation] = await Promise.all([
        prisma.payment.findFirst({
          where: {
            OR: [
              { checkoutRequestId: reference },
              { mpesaReceiptNumber: reference },
            ],
          },
        }),
        prisma.donation.findFirst({
          where: { invoice: reference },
        }),
      ]);

      if (existingPayment || existingDonation) {
        console.log(`[${webhookId}] Payment already processed (database): ${reference}`);
        processedReferences.add(reference); // Add to memory cache
        return NextResponse.json({ status: "success", message: "Payment already processed" });
      }

      // Add to memory cache before processing
      processedReferences.add(reference);

      // Process the payment in a transaction to ensure atomicity
      const result = await prisma.$transaction(async (prisma) => {
        console.log(`[${webhookId}] Starting payment processing in transaction`);

        const email = event.data.customer.email?.toLowerCase().trim();
        const amount = event.data.amount; // KES amount (no division needed)
        const currency = event.data.currency;
        const requestId = event.data.metadata?.custom_fields?.find(
          (field: { variable_name: string; value: string }) =>
            field.variable_name === "request_id"
        )?.value;

        console.log("Extracted data:", {
          email,
          amount,
          reference,
          currency,
          requestId,
        });

        if (!email || !requestId) {
          console.error("Missing required data:", { email, requestId });
          return NextResponse.json({ message: "Email or requestId missing" }, { status: 400 });
        }

        // Find user by email (Giver)
        const giver = await prisma.user.findUnique({ where: { email } });
        if (!giver) {
          console.error("User not found for email:", email);
          return NextResponse.json({ message: "User not found" }, { status: 404 });
        }
        console.log("Giver found:", giver.id);

        // Fetch receiver from the requestId
        const request = await prisma.request.findUnique({
          where: { id: requestId },
          include: { User: true },
        });
        if (!request) {
          console.error("Request not found for requestId:", requestId);
          return NextResponse.json({ message: "Request not found" }, { status: 404 });
        }

        const receiver = await prisma.user.findUnique({ where: { id: request.userId } });
        if (!receiver) {
          console.error("Receiver user not found for userId:", request.userId);
          return NextResponse.json({ message: "Receiver user not found" }, { status: 404 });
        }
        console.log("Receiver found:", receiver.id);

        // Store payment record
        const payment = await prisma.payment.create({
          data: {
            userId: giver.id,
            amount: amount,
            status: PaymentStatus.COMPLETED,
            paymentMethod: PaymentMethod.PAYSTACK,
            mpesaReceiptNumber: reference,
            currency: currency,
            requestId: requestId,
            userts: new Date(),
          },
        });
        console.log(`Payment recorded successfully for user: ${giver.id} and requestId: ${requestId}`);

        // Create a donation record
        const donation = await prisma.donation.create({
          data: {
            userId: giver.id,
            requestId: requestId,
            amount: amount,
            payment: { connect: { id: payment.id } },
            status: "COMPLETED",
            invoice: reference,
          },
        });
        console.log(`Donation recorded successfully: ${donation.id}`);

        // Update user points
        const pointsEarned = Math.floor(amount / 50);
        await prisma.points.create({
          data: { userId: giver.id, amount: pointsEarned, paymentId: payment.id },
        });

        const totalPoints = await prisma.points.aggregate({
          where: { userId: giver.id },
          _sum: { amount: true },
        });
        const newLevel = calculateLevel(totalPoints._sum.amount || 0);
        await prisma.user.update({
          where: { id: giver.id },
          data: { level: newLevel },
        });

        // Create a transaction record
        await prisma.transaction.create({
          data: {
            giverId: giver.id,
            receiverId: receiver.id,
            amount: amount,
          },
        });
        console.log(`Transaction recorded: Giver ${giver.id} -> Receiver ${receiver.id}`);

        // Update receiver's wallet
        let receiverWallet = await prisma.wallet.findUnique({
          where: { userId: receiver.id },
        });

        if (!receiverWallet) {
          receiverWallet = await prisma.wallet.create({
            data: { userId: receiver.id, balance: amount },
          });
          console.log(`New wallet created for receiver with initial funding: ${receiver.id}`);
        } else {
          await prisma.wallet.update({
            where: { userId: receiver.id },
            data: { balance: { increment: amount } },
          });
          console.log(`Receiver's wallet updated: ${receiver.id}, Amount added: ${amount}`);
        }

        console.log(`[${webhookId}] Transaction completed successfully`);
        return { success: true };
      });

      console.log(`[${webhookId}] Webhook processing completed`);
      return NextResponse.json({ status: "success", message: "Payment processed successfully" });
    }

    console.log(`[${webhookId}] Unhandled event type:`, event.event);
    return NextResponse.json({ status: "success", message: "Unhandled event type" });
  } catch (error: any) {
    console.error(`[${webhookId}] Error processing webhook:`, error);
    // Don't remove from processedReferences on error to prevent duplicate processing
    return NextResponse.json({ status: "error", message: "Server error" }, { status: 500 });
  }
}