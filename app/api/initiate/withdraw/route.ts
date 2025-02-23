import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../lib/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { paystackRequest } from "../pastack";

export async function POST(req: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { mpesaNumber, amount } = await req.json();
    
    if (!amount || !mpesaNumber) {
      return NextResponse.json({ error: "Amount and M-Pesa number are required" }, { status: 400 });
    }

    // Format M-Pesa number to required format (254XXXXXXXXX)
    const formattedMpesaNumber = mpesaNumber.startsWith('0') 
      ? '254' + mpesaNumber.substring(1) 
      : mpesaNumber;

    // Check wallet balance
    const wallet = await prisma.wallet.findUnique({
      where: { userId: user.id }
    });

    if (!wallet || wallet.balance < amount) {
      return NextResponse.json({ error: "Insufficient wallet balance" }, { status: 400 });
    }

    // Check Paystack balance
    const balanceResponse = await paystackRequest("balance", "GET");

    if (!balanceResponse.status || !balanceResponse.data.length) {
      return NextResponse.json({ error: "Unable to retrieve Paystack balance" }, { status: 500 });
    }

    const availableBalance = balanceResponse.data[0].balance / 100;
    if (amount > availableBalance) {
      return NextResponse.json({ error: "Insufficient Paystack balance" }, { status: 400 });
    }

    // Create transfer recipient for M-Pesa
    const recipient = await paystackRequest("transferrecipient", "POST", {
      type: "mobile_money",
      name: user.given_name || "User",
      account_number: formattedMpesaNumber,
      bank_code: "MPS",
      currency: "KES",
      description: "Wallet withdrawal to M-Pesa"
    });

    if (!recipient.status) {
      console.log("Recipient Error:", recipient);
      return NextResponse.json({ error: recipient.message || "Failed to create transfer recipient" }, { status: 400 });
    }

    const recipientCode = recipient.data.recipient_code;

    // Initiate transfer
    const transfer = await paystackRequest("transfer", "POST", {
      source: "balance",
      reason: "Wallet withdrawal",
      amount: amount * 100, // Convert to cents
      recipient: recipientCode,
      currency: "KES"
    });

    if (!transfer.status) {
      console.log("Transfer Error:", transfer);
      return NextResponse.json({ error: transfer.message || "Failed to initiate transfer" }, { status: 400 });
    }

    // Update wallet balance
    await prisma.$transaction(async (tx) => {
      // Deduct from wallet
      await tx.wallet.update({
        where: { userId: user.id },
        data: { balance: { decrement: amount } }
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          amount: amount,
          giver: { connect: { id: user.id } },
          receiver: { connect: { id: user.id } }
        }
      });
    });

    return NextResponse.json({
      success: true,
      message: "Withdrawal initiated successfully",
      transfer: transfer.data
    });

  } catch (error: any) {
    console.error("Withdrawal Error:", error);
    return NextResponse.json(
      { error: "Failed to process withdrawal", details: error.message },
      { status: 500 }
    );
  }
}


// import { NextRequest, NextResponse } from "next/server";
// import { paystackRequest } from "../pastack";

// export async function POST(req: NextRequest) {
//   try {
//     const { mpesaNumber, amount } = await req.json();

//     console.log("Raw M-Pesa Number:", mpesaNumber, "Amount:", amount);

//     if (!amount || !mpesaNumber) {
//       return NextResponse.json({ error: "Amount and M-Pesa number are required" }, { status: 400 });
//     }

//     const recipient = await paystackRequest("transferrecipient", "POST", {
//       type: "mobile_money",
//       name: "Donee",
//       account_number: mpesaNumber, 
//       bank_code: "MPESA",
//       currency: "KES",
//     });

//     if (!recipient.status) {
//       console.log("Recipient Error:", recipient);
//       return NextResponse.json({ error: recipient.message }, { status: 400 });
//     }

//     const recipientCode = recipient.data.recipient_code;

//     // ✅ Step 2: Initiate Transfer
//     const transfer = await paystackRequest("transfer", "POST", {
//       source: "balance",
//       reason: "Donee Withdrawal",
//       amount: amount * 100, // Convert to kobo
//       recipient: recipientCode,
//       currency: "KES",
//     });

//     if (!transfer.status) {
//       console.log("Transfer Error:", transfer);
//       return NextResponse.json({ error: transfer.message }, { status: 400 });
//     }

//     return NextResponse.json(
//       { message: "Withdrawal initiated", transfer: transfer.data },
//       { status: 200 }
//     );
//   } catch (error: any) {
//     console.error("Server Error:", error);
//     return NextResponse.json(
//       { error: "Server error", details: error.message || error },
//       { status: 500 }
//     );
//   }
// };











