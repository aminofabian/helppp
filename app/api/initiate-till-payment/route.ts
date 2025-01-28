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

    // Initiate till payment
    console.log('Initiating till payment with Kopokopo...');
    try {
      const paymentResponse = await axios.post(
        `${process.env.KOPOKOPO_BASE_URL}/api/v1/incoming_payments`,
        {
          payment_channel: 'Till',
          till_number: process.env.KOPOKOPO_TILL_NUMBER,
          subscriber: {
            phone_number: phoneNumber,
          },
          amount: {
            currency: 'KES',
            value: amount,
          },
          metadata: {
            request_id: requestId,
          },
          _links: {
            callback_url: `${request.headers.get('origin')}/api/kopokopo-callback`,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );
      console.log('Till payment initiated with Kopokopo:', paymentResponse.data);

      // Update database records
      console.log('Updating order and creating payment record in database...');
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
            merchantRequestID: paymentResponse.data.merchantRequestID || '',
            checkoutRequestID: paymentResponse.data.checkoutRequestID || '',
            resultCode: 'PENDING',
            resultDesc: 'Till payment initiated',
            userts: new Date(),
            paymentMethod: 'MPESA',
            phoneNumber: phoneNumber,
            userId: requestId, // This needs to be the actual user ID
          },
        });
      });
      console.log('Order updated and payment record created in database');

      return NextResponse.json({ 
        success: true, 
        message: 'Till payment initiated successfully',
        data: paymentResponse.data 
      });
    } catch (paymentError: any) {
      if (paymentError.response && paymentError.response.status === 429) {
        console.log('Received 429 error from Kopokopo:', paymentError.response.data);
        return NextResponse.json({ 
          success: false, 
          error_code: 429, 
          error_message: paymentError.response.data.error_message || 'Too many requests. Please try again later.'
        }, { status: 429 });
      }
      throw paymentError;
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