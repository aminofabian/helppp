import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message, mobile } = await req.json();

    // Send SMS using the service
    const response = await fetch('https://sms.textsms.co.ke/api/services/sendsms/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apikey: process.env.NEXT_PUBLIC_SMS_API_KEY,
        partnerID: process.env.NEXT_PUBLIC_SMS_PARTNER_ID,
        message,
        shortcode: process.env.NEXT_PUBLIC_SMS_SENDER_ID,
        mobile
      })
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('SMS sending error:', error);
    return NextResponse.json(
      { error: 'Failed to send SMS' },
      { status: 500 }
    );
  }
}