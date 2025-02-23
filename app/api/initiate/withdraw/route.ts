import { NextRequest, NextResponse } from "next/server";
import { paystackRequest } from "../pastack";

export async function POST(req: NextRequest) {
  try {
    const { mpesaNumber, amount } = await req.json();

    console.log("Raw M-Pesa Number:", mpesaNumber, "Amount:", amount);

    if (!amount || !mpesaNumber) {
      return NextResponse.json({ error: "Amount and M-Pesa number are required" }, { status: 400 });
    }

    // // ✅ Ensure correct number format
    // let formattedNumber = mpesaNumber.trim();
    // if (formattedNumber.startsWith("+254")) {
    //   formattedNumber = formattedNumber.replace("+", ""); // Remove "+"
    // } else if (formattedNumber.startsWith("07")) {
    //   formattedNumber = "254" + formattedNumber.substring(1); // Convert 07XXXXXXX → 2547XXXXXXX
    // } else if (!formattedNumber.startsWith("2547")) {
    //   return NextResponse.json({ error: "Invalid M-Pesa number format" }, { status: 400 });
    // }

    // console.log("Formatted M-Pesa Number:", formattedNumber);

    // ✅ Step 1: Create Transfer Recipient
    const recipient = await paystackRequest("transferrecipient", "POST", {
      type: "mobile_money",
      name: "Donee",
      account_number: mpesaNumber, // Ensure correct format
      bank_code: "MPESA",
      currency: "KES",
    });

    if (!recipient.status) {
      console.log("Recipient Error:", recipient);
      return NextResponse.json({ error: recipient.message }, { status: 400 });
    }

    const recipientCode = recipient.data.recipient_code;

    // ✅ Step 2: Initiate Transfer
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
