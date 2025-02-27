import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message, mobile } = await req.json();

    // Validate environment variables
    const apiKey = process.env.SMS_API_KEY;
    const partnerId = process.env.SMS_PARTNER_ID;
    const senderId = process.env.SMS_SENDER_ID;

    if (!apiKey || !partnerId || !senderId) {
      console.error('Missing SMS configuration:', {
        hasApiKey: !!apiKey,
        hasPartnerId: !!partnerId,
        hasSenderId: !!senderId
      });
      return NextResponse.json(
        { error: 'SMS service is not properly configured' },
        { status: 500 }
      );
    }

    // Validate input
    if (!message || !mobile) {
      return NextResponse.json(
        { error: 'Message and mobile number are required' },
        { status: 400 }
      );
    }

    // Send SMS using the service
    const requestBody = {
      apikey: apiKey,
      partnerID: partnerId,
      message,
      shortcode: senderId,
      mobile: mobile.replace(/[^0-9]/g, '') // Clean the mobile number to only contain digits
    };

    console.log('SMS Request Body:', {
      ...requestBody,
      apikey: '[REDACTED]' // Don't log the API key
    });

    const response = await fetch('https://sms.textsms.co.ke/api/services/sendsms/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('SMS Response Status:', response.status);
    const data = await response.json();
    
    // Log response without sensitive data
    console.log('SMS Response Body:', {
      ...data,
      apikey: data.apikey ? '[REDACTED]' : undefined
    });
    
    if (!response.ok) {
      console.error("SMS Request was not successful");
      if (data.error) {
        console.error('TextSMS Error:', data.error);
        return NextResponse.json(
          { error: 'Failed to send SMS', details: data.error },
          { status: response.status || 500 }
        );
      } else {
        return NextResponse.json(
          { error: 'Failed to send SMS, unknown error from TextSMS' },
          { status: response.status || 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'SMS sent successfully',
      data: {
        ...data,
        apikey: undefined // Remove sensitive data from response
      }
    });
  } catch (error: any) {
    console.error('SMS sending error:', error);
    console.error('SMS sending error message:', error.message);
    return NextResponse.json(
      { error: 'Failed to send SMS', details: error.message },
      { status: 500 }
    );
  }
}
