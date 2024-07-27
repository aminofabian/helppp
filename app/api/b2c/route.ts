// app/api/b2c/route.ts
import { NextResponse } from 'next/server';
import axios from 'axios';

// Check for required environment variables
const requiredEnvVars = [
  'MPESA_CONSUMER_KEY',
  'MPESA_CONSUMER_SECRET',
  'MPESA_SHORTCODE',
  'MPESA_PASSKEY',
  'MPESA_CALLBACK_URL',
  'MPESA_INITIATOR_NAME',
  'MPESA_INITIATOR_PASSWORD',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const mpesaConfig = {
  consumerKey: process.env.MPESA_CONSUMER_KEY!,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET!,
  shortcode: process.env.B2C_SHORTCODE!,
  passkey: process.env.MPESA_PASSKEY!,
  callbackUrl: process.env.MPESA_CALLBACK_URL!,
  initiatorName: process.env.MPESA_INITIATOR_NAME!,
  initiatorPassword: process.env.MPESA_INITIATOR_PASSWORD!,
};

const generateToken = async () => {
  try {
    const { consumerKey, consumerSecret } = mpesaConfig;
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    console.log('Attempting to generate token...');
    const response = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    console.log('Token generation response:', response.data);

    if (!response.data || !response.data.access_token) {
      throw new Error('Access token not received');
    }

    return response.data.access_token;
  } catch (error) {
    console.error('Error generating token:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      console.error('Response headers:', error.response?.headers);
    }
    throw error;
  }
};


export async function POST(request: Request) {
  try {
    const { amount, phoneNumber } = await request.json();
    console.log('Received request:', { amount, phoneNumber });

    // Format the phone number
    let formattedPhoneNumber = phoneNumber.replace(/^0/, '254').replace(/[^0-9]/g, '');
    if (!formattedPhoneNumber.startsWith('254')) {
      formattedPhoneNumber = '254' + formattedPhoneNumber;
    }
    console.log('Formatted phone number:', formattedPhoneNumber);

    const accessToken = await generateToken();
    console.log('Generated access token:', accessToken);

    const url = 'https://sandbox.safaricom.co.ke/mpesa/b2c/v3/paymentrequest';

    const payload = {
      InitiatorName: mpesaConfig.initiatorName,
      SecurityCredential: Buffer.from(mpesaConfig.initiatorPassword).toString('base64'),
      CommandID: 'BusinessPayment',
      Amount: amount,
      PartyA: mpesaConfig.shortcode,
      PartyB: formattedPhoneNumber,
      Remarks: 'B2C Payment',
      QueueTimeOutURL: `${mpesaConfig.callbackUrl}/b2c-timeout`,
      ResultURL: `${mpesaConfig.callbackUrl}/b2c-result`,
      Occassion: 'B2C Payment',
    };

    console.log('Sending payload:', payload);

    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('M-Pesa API response:', response.data);

    return NextResponse.json(response.data);
  } catch (error) {
    // ... error handling (keep as before)
  }
}

