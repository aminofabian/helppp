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
}

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

export async function POST(request: Request) {
  try {
    const { requestId, amount, phoneNumber } = await request.json();
    console.log('Received till payment request:', { requestId, amount, phoneNumber });

    // Get access token with retry logic
    console.log('Obtaining access token...');
    const accessToken = await getAccessToken();
    console.log('Access token obtained');

    // Prepare payment request
    const baseUrl = process.env.KOPOKOPO_CALLBACK_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://fitrii.com';
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
        callback_url: `${baseUrl}/api/kopokopo-callback`
      }
    };

    // Log the complete configuration
    console.log('Kopokopo Configuration:', {
      baseUrl,
      tillNumber: process.env.KOPOKOPO_TILL_NUMBER,
      callbackUrl: `${baseUrl}/api/kopokopo-callback`
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