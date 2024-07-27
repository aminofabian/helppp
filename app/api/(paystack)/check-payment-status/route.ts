import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get('reference');

  if (!reference) {
    return NextResponse.json({ status: 'error', message: 'Reference is required' }, { status: 400 });
  }

  try {
    const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    const { data } = response.data;

    if (data.status === 'success') {
      return NextResponse.json({ status: 'success', data });
    } else {
      return NextResponse.json({ status: 'pending', message: 'Payment is still pending' });
    }
  } catch (error) {
    console.error('Paystack API error:', error);
    return NextResponse.json({ status: 'error', message: 'Error checking payment status' }, { status: 500 });
  }
}