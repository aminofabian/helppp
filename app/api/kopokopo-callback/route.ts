import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import crypto from 'crypto';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { calculateLevel } from '@/app/lib/levelCalculator';

// Validate Kopokopo webhook signature
function validateWebhookSignature(body: string, signature: string | null, apiKey: string): boolean {
  if (!signature) {
    console.log('No signature provided');
    return false;
  }
  console.log('Validating signature:', { signature, apiKey: apiKey.substring(0, 4) + '...' });
  const hmac = crypto.createHmac('sha256', apiKey);
  const calculatedSignature = hmac.update(body).digest('hex');
  console.log('Calculated signature:', calculatedSignature);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(calculatedSignature)
  );
}

export async function POST(request: Request) {
  console.log('=================== KOPOKOPO WEBHOOK START ===================');
  console.log('Webhook received at:', new Date().toISOString());
  console.log('Request headers:', Object.fromEntries(request.headers));
  
  try {
    // Get the raw body for signature validation
    const rawBody = await request.text();
    console.log('Raw webhook body:', rawBody);
    
    const signature = request.headers.get('X-KopoKopo-Signature');
    const apiKey = process.env.KOPOKOPO_API_KEY;

    console.log('Signature check:', {
      hasSignature: !!signature,
      hasApiKey: !!apiKey,
      signatureValue: signature?.substring(0, 10) + '...'
    });

    if (!signature || !apiKey) {
      console.error('Missing signature or API key');
      return NextResponse.json({ 
        status: 'error',
        message: 'Missing authentication' 
      }, { status: 401 });
    }

    // Validate the webhook signature
    if (!validateWebhookSignature(rawBody, signature, apiKey)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ 
        status: 'error',
        message: 'Invalid signature' 
      }, { status: 401 });
    }

    console.log('Signature verification successful');
    
    // Parse the webhook payload
    const callbackData = JSON.parse(rawBody);
    console.log('Parsed webhook data:', JSON.stringify(callbackData, null, 2));

    const { topic, event } = callbackData;
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
}