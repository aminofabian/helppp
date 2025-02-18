import { NextResponse } from 'next/server';
import axios from 'axios';
import prisma from '@/app/lib/db';

export async function POST(request: Request) {
  try {
    const { requestId, amount, phoneNumber } = await request.json();
    console.log('Received till payment request:', { requestId, amount, phoneNumber });

    // Obtain access token
    console.log('Obtaining access token...');
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
    const accessToken = tokenResponse.data.access_token;
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
        customer_id: requestId,
        reference: requestId,
        notes: 'Payment for request'
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

    // Initiate payment
    console.log('Initiating payment with Kopokopo...', paymentData);
    try {
      const paymentResponse = await axios.post(
        `${process.env.KOPOKOPO_BASE_URL}/api/v1/incoming_payments`,
        paymentData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
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
            paymentMethod: 'MPESA',
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
          error_message: paymentError.response.data.error_message || 'Too many requests. Please try again later.'
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