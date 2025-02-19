import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import crypto from 'crypto';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { calculateLevel } from '@/app/lib/levelCalculator';

// Validate Kopokopo webhook signature
function validateWebhookSignature(body: string, signature: string | null, clientSecret: string): boolean {
  if (!signature) {
    console.log('No signature provided');
    return false;
  }
  console.log('Validating signature:', { signature, clientSecret: clientSecret.substring(0, 4) + '...' });
  const hmac = crypto.createHmac('sha256', clientSecret);
  const calculatedSignature = hmac.update(body).digest('hex');
  console.log('Calculated signature:', calculatedSignature);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(calculatedSignature)
  );
}

export async function POST(request: Request) {
  console.log('=================== KOPOKOPO WEBHOOK START ===================');
  const timestamp = new Date().toISOString();
  console.log(`Webhook received at: ${timestamp}`);
  
  try {
    // Get the raw body and parse it
    const rawBody = await request.text();
    console.log('Raw webhook body:', rawBody);
    
    const headersList = request.headers;
    const signature = headersList.get('X-KopoKopo-Signature');
    
    // Log all headers for debugging
    console.log('Request headers:', {
      signature: signature ? signature.substring(0, 10) + '...' : 'missing',
      contentType: headersList.get('content-type'),
      userAgent: headersList.get('user-agent'),
    });

    if (!signature) {
      console.error('Missing Kopokopo signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const clientSecret = process.env.KOPOKOPO_CLIENT_SECRET;
    if (!clientSecret) {
      console.error('Missing KOPOKOPO_CLIENT_SECRET environment variable');
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }

    // Validate signature
    const isValid = validateWebhookSignature(rawBody, signature, clientSecret);
    console.log('Signature validation result:', isValid);

    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse the webhook body
    const webhookData = JSON.parse(rawBody);
    console.log('Parsed webhook data:', webhookData);

    // Extract payment details
    const { metadata, status } = webhookData;
    console.log('Payment details:', { metadata, status });

    const { topic, event } = webhookData;
    console.log('Event details:', { topic, eventType: event?.type });

    // Handle different event types
    if (topic === 'buygoods_transaction_received') {
      return handleBuyGoodsTransaction(event);
    }

    console.log('Unhandled topic:', topic);
    return NextResponse.json({ 
      status: 'success',
      message: 'Event type not handled' 
    });
    
  } catch (error) {
    console.error('Error processing Kopokopo callback:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Error processing callback',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    console.log('=================== KOPOKOPO WEBHOOK END ===================');
  }
}

async function handleBuyGoodsTransaction(event: any) {
  console.log('Processing buygoods transaction - START');
  const { type, resource } = event;
  console.log('Transaction details:', { 
    type, 
    reference: resource?.reference,
    status: resource?.status,
    amount: resource?.amount,
    metadata: resource?.metadata 
  });

  // Find the payment by merchantRequestId
  const payment = await prisma.payment.findFirst({
    where: {
      OR: [
        { merchantRequestId: resource.reference },
        { checkoutRequestId: resource.reference }
      ]
    }
  });

  console.log('Payment lookup result:', payment ? 'Found' : 'Not found', 
    payment ? `(ID: ${payment.id})` : `(Reference: ${resource.reference})`);

  if (!payment) {
    console.log('Payment not found, checking metadata');
    // Try to find the request ID from the metadata
    const requestId = resource.metadata?.requestId;
    console.log('Metadata requestId:', requestId);
    
    if (requestId) {
      // Create a new payment record if we can find the request
      const request = await prisma.request.findUnique({
        where: { id: requestId },
        include: { User: true }
      });

      console.log('Request lookup result:', request ? 'Found' : 'Not found',
        request ? `(ID: ${request.id})` : `(RequestID: ${requestId})`);

      if (request) {
        const newPayment = await prisma.payment.create({
          data: {
            requestId: requestId,
            userId: request.userId,
            amount: parseFloat(resource.amount),
            merchantRequestId: resource.reference,
            resultCode: resource.status === 'Received' ? '0' : '1',
            resultDesc: resource.status,
            mpesaReceiptNumber: resource.reference,
            transactionDate: new Date(resource.origination_time),
            paymentMethod: PaymentMethod.MPESA,
            status: resource.status === 'Received' ? PaymentStatus.COMPLETED : PaymentStatus.FAILED,
            phoneNumber: resource.sender_phone_number,
            userts: new Date(),
          }
        });
        console.log('Created new payment record:', JSON.stringify(newPayment, null, 2));
        
        if (resource.status === 'Received') {
          console.log('Payment received, processing successful payment');
          await handleSuccessfulPayment(newPayment, request);
        }
        
        return NextResponse.json({ 
          status: 'success',
          message: 'New payment record created and processed' 
        });
      }
    }
    
    console.log('Could not process payment - no matching request found');
    return NextResponse.json({ 
      status: 'error',
      message: 'Payment not found' 
    }, { status: 404 });
  }

  console.log('Found existing payment record:', JSON.stringify(payment, null, 2));

  // Update the payment record
  const updatedPayment = await prisma.payment.update({
    where: {
      id: payment.id
    },
    data: {
      resultCode: resource.status === 'Received' ? '0' : '1',
      resultDesc: resource.status,
      mpesaReceiptNumber: resource.reference,
      transactionDate: new Date(resource.origination_time),
      status: resource.status === 'Received' ? PaymentStatus.COMPLETED : PaymentStatus.FAILED
    }
  });
  console.log('Updated payment record:', JSON.stringify(updatedPayment, null, 2));

  // If payment was successful, update the request status and create donation
  if (resource.status === 'Received') {
    console.log('Payment received, processing successful payment');
    await handleSuccessfulPayment(updatedPayment);
  }

  console.log('Processing buygoods transaction - END');
  return NextResponse.json({ 
    status: 'success',
    message: 'Transaction processed successfully' 
  });
}

async function handleSuccessfulPayment(payment: any, request?: any) {
  try {
    // Create a donation record
    const donation = await prisma.donation.create({
      data: {
        userId: payment.userId!,
        requestId: payment.requestId!,
        amount: payment.amount,
        payment: { connect: { id: payment.id } },
        status: "COMPLETED",
        invoice: payment.mpesaReceiptNumber || payment.merchantRequestId,
      },
    });
    console.log(`Donation recorded successfully: ${donation.id}`);

    // Emit payment success event
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/payment-events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'payment_success',
        paymentId: payment.id,
      }),
    });

    if (!res.ok) {
      console.error('Failed to emit payment success event');
    }

    // Update request status
    const updatedRequest = await prisma.request.update({
      where: { id: payment.requestId! },
      data: {
        status: 'PAID'
      }
    });
    console.log('Updated request status:', JSON.stringify(updatedRequest, null, 2));

    // Update user points
    const pointsEarned = Math.floor(payment.amount / 50);
    await prisma.points.create({
      data: { userId: payment.userId!, amount: pointsEarned, paymentId: payment.id }
    });

    const totalPoints = await prisma.points.aggregate({ 
      where: { userId: payment.userId! }, 
      _sum: { amount: true } 
    });
    const newLevel = calculateLevel(totalPoints._sum.amount || 0);
    await prisma.user.update({ 
      where: { id: payment.userId! }, 
      data: { level: newLevel } 
    });

    // Get receiver from the request if not provided
    if (!request) {
      request = await prisma.request.findUnique({
        where: { id: payment.requestId! },
        include: { User: true }
      });
    }

    if (request?.User) {
      // Create a transaction record
      await prisma.transaction.create({
        data: {
          giverId: payment.userId!,
          receiverId: request.User.id,
          amount: payment.amount,
        },
      });
      console.log(`Transaction recorded: Giver ${payment.userId} -> Receiver ${request.User.id}`);

      // Update receiver's wallet
      let receiverWallet = await prisma.wallet.findUnique({ 
        where: { userId: request.User.id } 
      });

      if (!receiverWallet) {
        receiverWallet = await prisma.wallet.create({
          data: { userId: request.User.id, balance: payment.amount }
        });
        console.log(`New wallet created for receiver with initial funding: ${request.User.id}`);
      } else {
        await prisma.wallet.update({
          where: { userId: request.User.id },
          data: { balance: { increment: payment.amount } },
        });
        console.log(`Receiver's wallet updated: ${request.User.id}, Amount added: ${payment.amount}`);
      }
    }
  } catch (error) {
    console.error('Error processing successful payment:', error);
  }
}