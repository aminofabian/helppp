import { NextRequest, NextResponse } from "next/server";
import { paystackRequest } from "../paystack";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import crypto from "crypto";
import prisma from "../../../lib/db";

export async function POST(req: NextRequest) {
  try {
    // ✅ Step 1: Get authenticated user
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { mpesaNumber, amount } = await req.json();

    console.log("M-Pesa Number:", mpesaNumber, "Amount:", amount);

    if (!amount || !mpesaNumber) {
      return NextResponse.json({ error: "Amount and M-Pesa number are required" }, { status: 400 });
    }

    // Step 2: Check if user's withdrawal request is valid
    const userRequest = await prisma.request.findFirst({
      where: { userId: user.id },
      select: { amount: true },
    });

    if (!userRequest) {
      return NextResponse.json({ error: "No active request found" }, { status: 404 });
    }

    if (amount > userRequest.amount) {
      return NextResponse.json({ error: "Requested amount exceeds available balance" }, { status: 400 });
    }

    // ✅ Step 3: Check Paystack balance before proceeding
    const balanceResponse = await paystackRequest("balance", "GET");

    if (!balanceResponse.status || !balanceResponse.data.length) {
      return NextResponse.json({ error: "Unable to retrieve Paystack balance" }, { status: 500 });
    }

    const availableBalance = balanceResponse.data[0].balance / 100; // Convert from kobo
    console.log("Paystack Available Balance:", availableBalance);

    if (amount > availableBalance) {
      return NextResponse.json({ error: "Insufficient Paystack balance" }, { status: 400 });
    }

    // ✅ Step 4: Create Transfer Recipient
    const recipient = await paystackRequest("transferrecipient", "POST", {
      type: "mobile_money",
      name: "Donee",
      account_number: mpesaNumber,
      bank_code: "MPESA",
      currency: "KES",
    });

    if (!recipient.status) {
      console.log("Recipient Error:", recipient);
      return NextResponse.json({ error: recipient.message }, { status: 400 });
    }

    const recipientCode = recipient.data.recipient_code;

    // ✅ Step 5: Initiate Transfer
    const transfer = await paystackRequest("transfer", "POST", {
      source: "balance",
      reason: "Donee Withdrawal",
      amount: amount * 100, // Convert to kobo
      recipient: recipientCode,
      currency: "KES",
    });

    if (!transfer.status) {
      console.log("Transfer Error:", transfer);
      return NextResponse.json({ error: transfer.message }, { status: 400 });
    }

    return NextResponse.json(
      { message: "Withdrawal initiated", transfer: transfer.data },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Server Error:", error);
    return NextResponse.json(
      { error: "Server error", details: error.message || error },
      { status: 500 }
    );
  }
}
