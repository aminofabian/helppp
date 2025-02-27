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
    console.log('Withdrawal request:', { mpesaNumber, amount });
    
    if (!amount || !mpesaNumber) {
      return NextResponse.json({ error: "Amount and M-Pesa number are required" }, { status: 400 });
    }

    // Format M-Pesa number to required format (0XXXXXXXXX)
    let formattedMpesaNumber = mpesaNumber.replace(/\D/g, ''); // Remove non-digits
    
    // Convert from international format to local format if needed
    if (formattedMpesaNumber.startsWith('254')) {
      formattedMpesaNumber = '0' + formattedMpesaNumber.substring(3);
    } else if (formattedMpesaNumber.startsWith('7') || formattedMpesaNumber.startsWith('1')) {
      formattedMpesaNumber = '0' + formattedMpesaNumber;
    } else if (!formattedMpesaNumber.startsWith('0')) {
      return NextResponse.json({ error: "Invalid M-Pesa number format" }, { status: 400 });
    }

    // Ensure the number is exactly 10 digits (0 + 9 digits)
    if (formattedMpesaNumber.length !== 10) {
      return NextResponse.json({ error: "Invalid M-Pesa number length" }, { status: 400 });
    }

    console.log('Formatted M-Pesa number:', formattedMpesaNumber);

    // Check wallet balance
    const wallet = await prisma.wallet.findUnique({
      where: { userId: user.id }
    });
    console.log('Wallet balance:', wallet?.balance);

    if (!wallet || wallet.balance < amount) {
      return NextResponse.json({ error: "Insufficient wallet balance" }, { status: 400 });
    }

    // Check Paystack balance
    const balanceResponse = await paystackRequest("balance", "GET");
    console.log('Paystack balance response:', balanceResponse);

    if (!balanceResponse.status || !balanceResponse.data.length) {
      return NextResponse.json({ error: "Unable to retrieve Paystack balance" }, { status: 500 });
    }

    const availableBalance = balanceResponse.data[0].balance / 100;
    if (amount > availableBalance) {
      return NextResponse.json({ error: "Insufficient Paystack balance" }, { status: 400 });
    }

    // Create transfer recipient for M-Pesa
    console.log('Creating transfer recipient with:', {
      type: "mobile_money_kenya",
      name: user.given_name || "User",
      account_number: formattedMpesaNumber,
      bank_code: "MPESA",
      currency: "KES"
    });
    
    const recipient = await paystackRequest("transferrecipient", "POST", {
      type: "mobile_money_kenya",
      name: user.given_name || "User",
      account_number: formattedMpesaNumber,
      bank_code: "MPESA",
      currency: "KES",
      description: "Wallet withdrawal to M-Pesa"
    });
    console.log('Transfer recipient response:', recipient);

    if (!recipient.status) {
      console.log("Recipient Error:", recipient);
      return NextResponse.json({ 
        error: recipient.message || "Failed to create transfer recipient",
        details: recipient.data
      }, { status: 400 });
    }

    const recipientCode = recipient.data.recipient_code;
    console.log('Recipient code:', recipientCode);

    // Initiate transfer
    console.log('Initiating transfer with:', {
      amount: amount * 100,
      recipient: recipientCode,
      currency: "KES"
    });

    try {
      const transfer = await paystackRequest("transfer", "POST", {
        source: "balance",
        reason: "Wallet withdrawal",
        amount: amount * 100, // Convert to cents
        recipient: recipientCode,
        currency: "KES",
        reference: `withdrawal_${Date.now()}_${user.id}`,
        metadata: {
          type: "wallet_withdrawal",
          user_id: user.id,
          mobile_number: formattedMpesaNumber
        }
      });

      if (!transfer.status) {
        console.log("Transfer Error:", transfer);
        
        // Handle specific Paystack errors
        if (transfer.message?.toLowerCase().includes('third party payouts')) {
          return NextResponse.json({ 
            error: "Withdrawals are temporarily unavailable. Please try again later or contact support.",
            details: "Service activation pending",
            code: "TRANSFERS_NOT_ENABLED"
          }, { status: 400 });
        }

        return NextResponse.json({ error: transfer.message || "Failed to initiate transfer" }, { status: 400 });
      }

      // Update wallet balance only if transfer was successful
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

    } catch (transferError: any) {
      console.error("Transfer Error:", transferError);
      
      // Check for transfer restriction errors
      if (transferError.message?.toLowerCase().includes('third party payouts')) {
        return NextResponse.json({ 
          error: "Withdrawals are temporarily unavailable. Please try again later or contact support.",
          details: "Service activation pending",
          code: "TRANSFERS_NOT_ENABLED"
        }, { status: 400 });
      }

      throw transferError; // Re-throw other errors to be caught by the outer catch block
    }

  } catch (error: any) {
    console.error("Withdrawal Error:", error);
    return NextResponse.json(
      { error: "Failed to process withdrawal", details: error.message },
      { status: 500 }
    );
  }
}













