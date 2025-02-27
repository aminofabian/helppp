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
    const { 
      amount = null,
      mobile,
      userName = 'User',
      isSuccessful = false,
      mpesaNumber = null
    } = await req.json();

    // Debug: Log all environment variables (redacted)
    console.log('Environment Variables Status:', {
      SMS_API_KEY: process.env.SMS_API_KEY ? 'Set' : 'Not Set',
      SMS_PARTNER_ID: process.env.SMS_PARTNER_ID ? 'Set' : 'Not Set',
      SMS_SENDER_ID: process.env.SMS_SENDER_ID ? 'Set' : 'Not Set',
      ADMIN_PHONE_NUMBER: process.env.ADMIN_PHONE_NUMBER || '254714282874 (default)'
    });

    // Validate environment variables
    const apiKey = process.env.SMS_API_KEY;
    const partnerId = process.env.SMS_PARTNER_ID;
    const senderId = process.env.SMS_SENDER_ID;
    const adminPhone = process.env.ADMIN_PHONE_NUMBER || '254714282874';

    if (!apiKey || !partnerId || !senderId) {
      console.error('Missing SMS configuration:', {
        hasApiKey: !!apiKey,
        hasPartnerId: !!partnerId,
        hasSenderId: !!senderId,
        envKeys: Object.keys(process.env).filter(key => key.includes('SMS')), // List all SMS-related env vars
      });
      return NextResponse.json(
        { error: 'SMS service is not properly configured', details: {
          missingVariables: {
            SMS_API_KEY: !apiKey,
            SMS_PARTNER_ID: !partnerId,
            SMS_SENDER_ID: !senderId
          }
        }},
        { status: 500 }
      );
    }

    // Validate input
    if (!amount || !mobile) {
      return NextResponse.json(
        { error: 'Amount and mobile number are required' },
        { status: 400 }
      );
    }

    const formattedAmount = `KES ${Number(amount).toLocaleString()}`;
    
    // Prepare messages for both admin and user
    const adminMessage = `Withdrawal Request:\n${userName} has initiated a withdrawal of ${formattedAmount}${mpesaNumber ? ` to M-Pesa number ${mpesaNumber}` : ''}\nStatus: ${isSuccessful ? 'Successful' : 'Pending'}`;
    
    let userMessage;
    if (isSuccessful) {
      userMessage = `Your withdrawal of ${formattedAmount} has been processed successfully. The funds will be sent to your M-Pesa shortly.\n\nNeed help?\n📧 Email: support@fitrii.com\n📞 Phone: +254714282874 (Call/Text/WhatsApp)`;
    } else {
      userMessage = `Your withdrawal request of ${formattedAmount} has been received and is being processed. You'll receive a confirmation once completed.\n\nNeed help?\n📧 Email: support@fitrii.com\n📞 Phone: +254714282874 (Call/Text/WhatsApp)`;
    }

    // Send SMS to admin
    const adminResult = await sendSMS(apiKey, partnerId, senderId, adminMessage, adminPhone);

    // Send SMS to user
    const userResult = await sendSMS(apiKey, partnerId, senderId, userMessage, mobile);

    return NextResponse.json({
      success: true,
      message: 'SMS notifications sent successfully',
      data: {
        admin: { ...adminResult, apikey: undefined },
        user: { ...userResult, apikey: undefined }
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
