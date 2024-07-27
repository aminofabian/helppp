// app/api/mpesa-callback/route.ts

import { NextResponse } from 'next/server';
import { processMpesaCallback } from '@/app/(actions)/processMpesaCallback';

interface CallbackMetadataItem {
  Name: string;
  Value: string | number;
}



export interface CallbackData {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: number;
  ResultDesc: string;
  amount: number; // Type 'Float' is not a valid TypeScript type. Use 'number' instead.
  phoneNumber?: string; // Optional field based on the schema
  mpesaReceiptNumber?: string; // Optional field based on the schema
  transactionDate?: Date; // Use 'Date' for DateTime types in TypeScript
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

    const callbackData: CallbackData = body.Body.stkCallback;
    console.log('Callback data:', JSON.stringify(callbackData, null, 2));

    if (callbackData.ResultCode !== 0) {
      console.log('Payment failed:', callbackData.ResultDesc);
      return NextResponse.json({ ResultCode: callbackData.ResultCode, ResultDesc: callbackData.ResultDesc });
    }

    const result = await processMpesaCallback(callbackData);

    if (result.success) {
      console.log('Payment processed successfully');
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    } else {
      throw new Error('Transaction failed');
    }
  } catch (error) {
    console.error('Unexpected error in M-Pesa callback:', error);
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Internal Server Error" }, { status: 500 });
  }
}