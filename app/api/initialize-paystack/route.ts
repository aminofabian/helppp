import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, amount, reference, callback_url, metadata } = body;
    console.log('meta amefikaaaaaaaaaaaaaaaaaa', metadata)

    if (!process.env.PAYSTACK_SECRET_KEY) {
      return NextResponse.json(
        { message: 'Paystack secret key is not configured' },
        { status: 500 }
      );
    }

    // Initialize transaction with Paystack
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100), // Convert KES to cents for Paystack
        reference,
        callback_url,
        channels: ['card', 'mobile_money'],
        metadata,
        currency: 'KES', // Kenyan Shillings
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Paystack initialization failed:', data);
      return NextResponse.json(
        { message: data.message || 'Failed to initialize payment' },
        { status: response.status }
      );
    }

    return NextResponse.json(data.data);
  } catch (error) {
    console.error('Payment initialization error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
