import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message, mobile } = await req.json();

    // Send SMS using the service
    const requestBody = {
      apikey: process.env.NEXT_PUBLIC_SMS_API_KEY,
      partnerID: process.env.NEXT_PUBLIC_SMS_PARTNER_ID,
      message,
      shortcode: process.env.NEXT_PUBLIC_SMS_SENDER_ID,
      mobile
    };
    console.log('SMS Request Body:', JSON.stringify(requestBody));
    const response = await fetch('https://sms.textsms.co.ke/api/services/sendsms/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('SMS Response Status:', response.status);
    console.log('SMS Response Headers:', response.headers);
    const data = await response.json();
    console.log('SMS Response Body:', data);
    
    if (!response.ok) {
      console.error("Request was not successful");
      // Check for error details in the data object
      if (data.error) {
        console.error('TextSMS Error:', data.error);
        return NextResponse.json(
          { error: 'Failed to send SMS', details: data.error }, // Include TextSMS error details
          { status: response.status || 500 }
        );
      } else {
        return NextResponse.json(
          { error: 'Failed to send SMS, unknown error from TextSMS' }, // Include TextSMS error details
          { status: response.status || 500 }
        );
      }
    }
    return NextResponse.json(data);
  } catch (error: any) { // Cast error to any to be able to get message
    console.error('SMS sending error:', error);
    console.error('SMS sending error message:', error.message); // Show the error message
    return NextResponse.json(
      { error: 'Failed to send SMS', details: error.message }, // Return the error message
      { status: 500 }
    );
  }
}
