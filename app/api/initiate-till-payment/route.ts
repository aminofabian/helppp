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
    const { requestId, amount, phoneNumber, userId } = await request.json();
    console.log('Received till payment request:', { requestId, amount, phoneNumber, userId });
    console.warn('Received till payment request:', { requestId, amount, phoneNumber, userId });

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
        customerId: userId,
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
            userId: userId,
          },
        });
      });
      console.log('Request updated and payment record created in database');

      return NextResponse.json({ 
        success: true, 
        message: 'Payment initiated successfully',
        data: paymentResponse.data 
      });
    } catch (error) {
      console.error('Error initiating payment:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in payment initiation:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to initiate payment',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}