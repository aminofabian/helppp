import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';

export async function POST(request: Request) {
  try {
    const callbackData = await request.json();
    console.log('Received Kopokopo callback:', JSON.stringify(callbackData, null, 2));

    // Extract the event type and payment data
    const { event: { type }, data } = callbackData;
    console.log('Event type:', type);
    console.log('Payment data:', JSON.stringify(data, null, 2));

    // Handle different event types
    switch (type) {
      case 'payment_request.processed':
        return handleProcessedPayment(data);
      case 'payment_request.failed':
        return handleFailedPayment(data);
      case 'payment_request.created':
        return handleCreatedPayment(data);
      default:
        console.log('Unhandled event type:', type);
        return NextResponse.json({ 
          status: 'success',
          message: 'Event type not handled' 
        });
    }
  } catch (error) {
    console.error('Error processing Kopokopo callback:', error);
    
    // Log the request body for debugging
    try {
      const rawBody = await request.text();
      console.error('Raw callback body:', rawBody);
    } catch (e) {
      console.error('Could not read raw body:', e);
    }
    
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

async function handleProcessedPayment(data: any) {
  const { metadata, status, reference } = data;
  const requestId = metadata.customerId;
  console.log('Processing payment:', { requestId, status, reference });

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

  console.log('Found payment record:', JSON.stringify(payment, null, 2));

  // Update the payment record
  const updatedPayment = await prisma.payment.update({
    where: {
      id: payment.id
    },
    data: {
      resultCode: status === 'SUCCESS' ? '0' : '1',
      resultDesc: status,
      mpesaReceiptNumber: data.payment_reference || '',
      transactionDate: new Date()
    }
  });
  console.log('Updated payment record:', JSON.stringify(updatedPayment, null, 2));

  // If payment was successful, update the request status
  if (status === 'SUCCESS') {
    const updatedRequest = await prisma.request.update({
      where: { id: requestId },
      data: {
        status: 'PAID'
      }
    });
    console.log('Updated request status:', JSON.stringify(updatedRequest, null, 2));
  }

  return NextResponse.json({ 
    status: 'success',
    message: 'Payment processed successfully' 
  });
}

async function handleFailedPayment(data: any) {
  const { metadata, status, reference } = data;
  console.log('Processing failed payment:', { metadata, status, reference });

  const payment = await prisma.payment.findFirst({
    where: {
      merchantRequestId: reference
    }
  });

  if (payment) {
    await prisma.payment.update({
      where: {
        id: payment.id
      },
      data: {
        resultCode: '1',
        resultDesc: status,
        status: 'FAILED'
      }
    });
  }

  return NextResponse.json({ 
    status: 'success',
    message: 'Failed payment processed' 
  });
}

async function handleCreatedPayment(data: any) {
  console.log('Payment request created:', data);
  return NextResponse.json({ 
    status: 'success',
    message: 'Payment request created' 
  });
} 