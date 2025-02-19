import { NextResponse } from 'next/server';
import axios from 'axios';
import prisma from '@/app/lib/db';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

// Utility function to wait
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Function to get access token with retry logic
async function getAccessToken(retryCount = 0): Promise<string> {
  try {
    const tokenResponse = await axios.post(
      `${process.env.KOPOKOPO_BASE_URL}/oauth/token`,
      {
        grant_type: 'client_credentials',
      },
      {
        auth: {
          username: process.env.KOPOKOPO_CLIENT_ID!,
          password: process.env.KOPOKOPO_CLIENT_SECRET!,
        },
      }
    );
    return tokenResponse.data.access_token;
  } catch (error: any) {
    if (error.response?.status === 429 && retryCount < 3) {
      // Wait for exponential backoff time before retrying
      const waitTime = Math.pow(2, retryCount) * 1000;
      console.log(`Rate limited, waiting ${waitTime}ms before retry ${retryCount + 1}`);
      await wait(waitTime);
      return getAccessToken(retryCount + 1);
    }
    throw error;
  }
};



// import K2 from "k2-connect-node";

// const options = {
//   clientId: process.env.KOPOKOPO_CLIENT_ID!,
//   clientSecret: process.env.KOPOKOPO_CLIENT_SECRET!,
//   apiKey: process.env.KOPOKOPO_API_KEY!,
//   baseUrl: process.env.KOPOKOPO_BASE_URL! || "https://sandbox.kopokopo.com",
// };

// const TokenService = K2(options).TokenService;

// export async function getAccessToken(): Promise<string> {
//   try {
//     const response = await TokenService.getToken();
//     console.log("Access Token Response:", response);
//     return response.access_token;
//   } catch (error) {
//     console.error("Error obtaining access token:", error);
//     throw new Error("Failed to obtain Kopo Kopo access token");
//   }
// }

// Function to initiate payment with retry logic
async function initiatePayment(paymentData: any, accessToken: string, retryCount = 0) {
  try {
    return await axios.post(
      `${process.env.KOPOKOPO_BASE_URL}/api/v1/incoming_payments`,
      paymentData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
  } catch (error: any) {
    if (error.response?.status === 429 && retryCount < 3) {
      const waitTime = Math.pow(2, retryCount) * 1000;
      console.log(`Rate limited, waiting ${waitTime}ms before retry ${retryCount + 1}`);
      await wait(waitTime);
      return initiatePayment(paymentData, accessToken, retryCount + 1);
    }
    throw error;
  }
}



// export async function POST(request: Request) {
//   try {
//     const { phoneNumber, amount } = await request.json();
//     console.log("Initiating payment for:", { phoneNumber, amount });

//     const accessToken = await getAccessToken();
//     const callbackUrl = process.env.KOPOKOPO_CALLBACK_URL!;
//     const tillNumber = process.env.KOPOKOPO_TILL_NUMBER!;

//     const payload = {
//       payment_channel: "M-PESA STK Push",
//       till_number: tillNumber,
//       subscriber: {
//         first_name: "Customer",
//         last_name: "User",
//         phone_number: phoneNumber,
//       },
//       amount: {
//         currency: "KES",
//         value: amount,
//       },
//       metadata: { reference: phoneNumber },
//       _links: { callback_url: callbackUrl },
//     };

//     const response = await axios.post(
//       `${process.env.KOPOKOPO_BASE_URL}/api/v1/incoming_payments`,
//       payload,
//       { headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" } }
//     );

//     console.log("Payment Response:", response.data);
//     return NextResponse.json({ success: true, data: response.data });
//   } catch (error: any) {
//     console.error("Error in payment:", error.response?.data || error);
//     return NextResponse.json({ success: false, message: error.message }, { status: 500 });
//   }
// }


export async function POST(request: Request) {
  try {
    const { requestId, amount, phoneNumber } = await request.json();
    console.log('Received till payment request:', { requestId, amount, phoneNumber });
    console.warn('Received till payment request:', { requestId, amount, phoneNumber });


    // Get access token with retry logic
    console.log('Obtaining access token..........................:.:.');
    const accessToken = await getAccessToken();
    console.log('Access token obtained///////////////////////', accessToken);

    // Prepare payment request
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://fitrii.com';
    const callbackUrl = `${baseUrl}/api/kopokopo-callback`;
    
    console.log('Using callback URL::::::::::::::::::::::::::::::::::::::::::;', callbackUrl);
    
    const paymentData = {
      payment_channel: 'M-PESA STK Push',
      till_number: process.env.KOPOKOPO_TILL_NUMBER,
      subscriber: {
        first_name: 'Customer',
        last_name: 'Name',
        phone_number: phoneNumber,
      },
      amount: {
        currency: 'KES',
        value: amount,
      },
      metadata: {
        requestId: requestId,
        customerId: requestId,
      },
      _links: {
        callback_url: callbackUrl
      }
    };

    // Log the complete configuration
    console.log('Kopokopo Configuration:', {
      baseUrl: process.env.KOPOKOPO_BASE_URL?.replace(/\/$/, ''),
      tillNumber: process.env.KOPOKOPO_TILL_NUMBER,
      callbackUrl
    });

    // Initiate payment with retry logic
    console.log('Initiating payment with Kopokopo...', paymentData);
    try {
      const paymentResponse = await initiatePayment(paymentData, accessToken);
      console.log('Payment initiated with Kopokopo:', paymentResponse.data);

      // Update database records
      console.log('Updating request and creating payment record in database...');
      await prisma.$transaction(async (prisma) => {
        await prisma.request.update({
          where: { id: requestId },
          data: {
            status: 'PENDING',
          },
        });

        await prisma.payment.create({
          data: {
            requestId: requestId,
            amount: parseFloat(amount),
            merchantRequestId: paymentResponse.data.id || '',
            checkoutRequestId: paymentResponse.data.id || '',
            resultCode: 'PENDING',
            resultDesc: 'Till payment initiated',
            userts: new Date(),
            paymentMethod: PaymentMethod.MPESA,
            status: PaymentStatus.PENDING,
            phoneNumber: phoneNumber,
            userId: requestId, // This needs to be the actual user ID
          },
        });
      });
      console.log('Request updated and payment record created in database');

      return NextResponse.json({ 
        success: true, 
        message: 'Payment initiated successfully',
        data: paymentResponse.data 
      });
    } catch (paymentError: any) {
      console.error('Payment error details:', paymentError?.response?.data || paymentError);
      if (paymentError.response?.status === 429) {
        return NextResponse.json({ 
          success: false, 
          error_code: 429, 
          error_message: 'Too many requests. Please wait a moment and try again.'
        }, { status: 429 });
      }
      return NextResponse.json({ 
        success: false, 
        message: 'Error initiating payment', 
        error: paymentError.response?.data?.message || paymentError.message || 'Unknown error occurred'
      }, { status: 500 });
    }
  } catch (error: unknown) {
    console.error('Error initiating till payment:', error);
    
    let errorMessage = 'An unknown error occurred';
    let statusCode = 500;
    if (axios.isAxiosError(error) && error.response) {
      errorMessage = error.response.data.error_message || 'An error occurred with the payment provider';
      statusCode = error.response.status;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { success: false, message: 'Error initiating till payment', error: errorMessage },
      { status: statusCode }
    );
  }
}