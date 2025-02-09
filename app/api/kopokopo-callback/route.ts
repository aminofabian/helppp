import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';

export async function POST(request: Request) {
  try {
    const callbackData = await request.json();
    console.log('Received Kopokopo callback:', callbackData);

    // Extract the event type and payment data
    const { event: { type }, data } = callbackData;

    if (type === 'payment_request.processed') {
      const { metadata, status, reference } = data;
      const requestId = metadata.customerId;

      // Find the payment by reference
      const payment = await prisma.payment.findFirst({
        where: {
          merchantRequestId: reference
        }
      });

      if (!payment) {
        console.error('Payment not found for reference:', reference);
        return NextResponse.json({ 
          status: 'error',
          message: 'Payment not found' 
        }, { status: 404 });
      }

      // Update the payment record
      await prisma.payment.update({
        where: {
          id: payment.id // Using the payment ID we found
        },
        data: {
          resultCode: status === 'SUCCESS' ? '0' : '1',
          resultDesc: status,
          mpesaReceiptNumber: data.payment_reference || '',
          transactionDate: new Date()
        }
      });

      // If payment was successful, update the request status
      if (status === 'SUCCESS') {
        await prisma.request.update({
          where: { id: requestId },
          data: {
            status: 'PAID'
          }
        });
      }

      return NextResponse.json({ 
        status: 'success',
        message: 'Callback processed successfully' 
      });
    }

    // Handle other event types if needed
    return NextResponse.json({ 
      status: 'success',
      message: 'Event type not handled' 
    });

  } catch (error) {
    console.error('Error processing Kopokopo callback:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Error processing callback',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 