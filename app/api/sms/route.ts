import { NextResponse } from 'next/server';

async function sendSMS(apiKey: string, partnerId: string, senderId: string, message: string, mobile: string) {
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
    throw new Error(data.error || 'Failed to send SMS');
  }

  return data;
}

export async function POST(req: Request) {
  try {
    const { message, mobile, sendConfirmation = false, amount = null } = await req.json();

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

    // Send the initial SMS
    const mainResult = await sendSMS(apiKey, partnerId, senderId, message, mobile);

    // If confirmation message is requested, send it
    let confirmationResult = null;
    if (sendConfirmation) {
      const formattedAmount = amount ? `KES ${Number(amount).toLocaleString()}` : 'your requested amount';
      const confirmationMessage = `You've withdrawn ${formattedAmount}. We're processing your transaction. For any delays, please contact us via:\nEmail: support@fitrii.com\nPhone: +254714282874 (Call/Text/WhatsApp)`;
      try {
        confirmationResult = await sendSMS(apiKey, partnerId, senderId, confirmationMessage, mobile);
      } catch (error) {
        console.error('Failed to send confirmation SMS:', error);
        // We don't throw here as the main message was sent successfully
      }
    }

    return NextResponse.json({
      success: true,
      message: 'SMS sent successfully',
      data: {
        main: { ...mainResult, apikey: undefined },
        confirmation: confirmationResult ? { ...confirmationResult, apikey: undefined } : null
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
