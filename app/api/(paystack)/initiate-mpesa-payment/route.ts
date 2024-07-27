import { NextResponse } from 'next/server';
import axios, { AxiosError } from 'axios';

interface PaystackErrorResponse {
  message: string;
}

export async function POST(request: Request) {
  const { amount, email, phoneNumber } = await request.json();

  // Format the phone number
  const formattedPhoneNumber = formatPhoneNumber(phoneNumber);

  try {
    const response = await axios.post('https://api.paystack.co/charge', {
      email,
      amount: amount * 100, // Convert to cents
      currency: 'KES',
      mobile_money: {
        phone: formattedPhoneNumber,
        provider: 'mpesa'
      }
    }, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return NextResponse.json(response.data);
  } catch (error) {
    const axiosError = error as AxiosError<PaystackErrorResponse>;
    console.error('Paystack API error:', axiosError.response?.data || axiosError.message);
    return NextResponse.json({
      status: false,
      message: axiosError.response?.data?.message || 'Error initiating payment'
    }, { status: 500 });
  }
}

function formatPhoneNumber(phoneNumber: string): string {
  // Remove any non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');

  // Ensure the number starts with 254 (Kenya's country code)
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.slice(1);
  } else if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned;
  }

  // Ensure the number is exactly 12 digits long (254 + 9 digits)
  if (cleaned.length !== 12) {
    cleaned = '254' + cleaned.slice(-9);
  }

  return `+${cleaned}`;
}