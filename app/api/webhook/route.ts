import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/app/lib/db";
import { PaymentMethod } from "@prisma/client";
import { calculateLevel } from "@/app/lib/levelCalculator";


export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    // console.log(rawBody, 'this is the raw body...');
    const signature = req.headers.get("x-paystack-signature");

    // Verify Paystack webhook authenticity
    const hash = crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
      .update(rawBody)
      .digest("hex");

    if (hash !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    console.log("Webhook Data Received:", JSON.stringify(event, null, 2));

    if (event.event === "charge.success") {
      // console.log(`Payment successful for ${event.data.amount / 100} KES`);
      
      const email = event.data.customer.email?.toLowerCase().trim();
      const amount = event.data.amount / 100; // Convert from kobo to KES
      const reference = event.data.reference;
      const currency = event.data.currency;
      const requestId = event.data.metadata?.requestId;
      
      if (!email || !requestId) {
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
      const request = await prisma.request.findUnique({ where: { id: requestId }, include: { User: true } });
      if (!request) {
        console.error("Request not found for requestId:", requestId);
        return NextResponse.json({ message: "Request not found" }, { status: 404 });
      }

      const receiver = await prisma.user.findUnique({ where: { id: request.userId } });
      if (!receiver) {
        console.error("Receiver user not found for userId:", request.userId);
        return NextResponse.json({ message: "Receiver user not found" }, { status: 404 });
      }
      // console.log("Receiver found:", receiver.id);


      // Store payment record
      const payment = await prisma.payment.create({
        data: {
          userId: giver.id,
          amount: amount,
          status: "COMPLETED",
          paymentMethod: PaymentMethod.PAYSTACK,
          createdAt: new Date(),
          updatedAt: new Date(),
          mpesaReceiptNumber: reference,
          currency: currency,
          userts: new Date(),
          requestId: requestId,
        },
      });
      // console.log(`Payment recorded successfully for user: ${giver.id} and requestId: ${requestId}`);

      // Update user points
      const pointsEarned = Math.floor(amount / 50);
      await prisma.points.create({
        data: { userId: giver.id, amount: pointsEarned, paymentId: payment.id }
      });

      const totalPoints = await prisma.points.aggregate({ where: { userId: giver.id }, _sum: { amount: true } });
      const newLevel = calculateLevel(totalPoints._sum.amount || 0);
      await prisma.user.update({ where: { id: giver.id }, data: { level: newLevel } });

      // Update request status
      const updatedRequest = await prisma.request.update({
        where: { id: requestId },
        data: { amount: { increment: amount } }
      });
      if (updatedRequest.amount >= updatedRequest.pointsUsed) {
        await prisma.request.update({ where: { id: requestId }, data: { status: "FUNDED" } });
      }

      // Create a transaction record
      await prisma.transaction.create({
        data: {
          giverId: giver.id,
          receiverId: receiver.id,
          amount: amount,
        },
      });
      // console.log(`Transaction recorded: Giver ${giver.id} -> Receiver ${receiver.id}`);


      let receiverWallet = await prisma.wallet.findUnique({ 
        where: { userId: receiver.id } 
      });
      
      if (!receiverWallet) {
        receiverWallet = await prisma.wallet.create({
          data: { userId: receiver.id, balance: amount } // Initialize with payment amount
        });
        // console.log(`New wallet created for receiver with initial funding: ${receiver.id}`);
      } else {
        await prisma.wallet.update({
          where: { userId: receiver.id },
          data: { balance: { increment: amount } },
        });
        // console.log(`Receiver's wallet updated: ${receiver.id}, Amount added: ${amount}`);

      return NextResponse.json({ message: "Payment and transaction recorded successfully" }, { status: 200 });
      }

    }

    // console.log("Unhandled event type:", event.event);
    return NextResponse.json({ message: "Webhook received" }, { status: 200 });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}