// app/api/mpesa-callback/route.ts

import { NextResponse } from 'next/server';
import { PaymentStatus } from '@prisma/client';
import { updateDonationStatus } from '@/app/(actions)/handleDonation';

interface CallbackMetadataItem {
  Name: string;
  Value: string | number;
}

interface CallbackData {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: number;
  ResultDesc: string;
  amount: number;
  phoneNumber?: string;
  mpesaReceiptNumber?: string;
  transactionDate?: Date;
  CallbackMetadata: {
    Item: CallbackMetadataItem[];
  };
}

interface STKCallback {
  stkCallback: CallbackData;
}

interface RequestBody {
  Body: STKCallback;
}

export async function POST(req: Request) {
  console.log('Received M-Pesa callback');
  try {
    const rawBody = await req.text();
    console.log('Raw request body:', rawBody);

    const body: RequestBody = JSON.parse(rawBody);
    console.log('Parsed request body:', JSON.stringify(body, null, 2));

    if (!body?.Body?.stkCallback) {
      console.error('Invalid request body structure');
      return NextResponse.json({ ResultCode: 1, ResultDesc: "Invalid request body structure" }, { status: 400 });
    }

    const callbackData = body.Body.stkCallback;
    const { CheckoutRequestID, ResultCode, CallbackMetadata } = callbackData;

    // Extract metadata values
    const getMetadataValue = (name: string) => {
      const item = CallbackMetadata?.Item?.find((item: CallbackMetadataItem) => item.Name === name);
      return item?.Value;
    };

    const amount = getMetadataValue('Amount');
    const mpesaReceiptNumber = getMetadataValue('MpesaReceiptNumber');
    const transactionDate = getMetadataValue('TransactionDate');
    const phoneNumber = getMetadataValue('PhoneNumber')?.toString();

    // Update donation status based on the result code
    const status = ResultCode === 0 ? PaymentStatus.COMPLETED : PaymentStatus.FAILED;
    
    const result = await updateDonationStatus(
      CheckoutRequestID,
      status,
      {
        mpesaReceiptNumber,
        transactionDate,
        phoneNumber,
        amount,
        ResultCode,
        ResultDesc: callbackData.ResultDesc
      }
    );

    if (!result.success) {
      console.error('Failed to update donation:', result.error);
      return NextResponse.json({ ResultCode: 1, ResultDesc: "Failed to update donation" }, { status: 500 });
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" });
  } catch (error) {
    console.error('Error processing M-Pesa callback:', error);
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Internal server error" }, { status: 500 });
  }
}