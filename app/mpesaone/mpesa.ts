import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import axios from 'axios';
import { redirect } from 'next/navigation';

interface MpesaConfig {
  consumerKey: string | undefined;
  consumerSecret: string | undefined;
  shortcode: string | undefined;
  passkey: string | undefined;
  callbackUrl: string | undefined;
  baseUrl: string;
}

const mpesaConfig: MpesaConfig = {
  consumerKey: process.env.MPESA_CONSUMER_KEY?.trim(),
  consumerSecret: process.env.MPESA_CONSUMER_SECRET?.trim(),
  shortcode: process.env.MPESA_SHORTCODE?.trim(),
  passkey: process.env.MPESA_PASSKEY?.trim(),
  callbackUrl: process.env.MPESA_CALLBACK_URL?.trim(),
  baseUrl: (process.env.MPESA_BASE_URL || 'https://api.safaricom.co.ke').trim()
};

const validateConfig = () => {
  const requiredFields = ['consumerKey', 'consumerSecret', 'shortcode', 'passkey', 'callbackUrl', 'baseUrl'] as const;
  const missingFields = requiredFields.filter(field => !mpesaConfig[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required M-Pesa configuration: ${missingFields.join(', ')}`);
  }

  // Validate URL format
  try {
    new URL(mpesaConfig.baseUrl);
  } catch (error) {
    throw new Error('Invalid URL format in M-Pesa configuration');
  }
}

const generateToken = async () => {
  try {
    validateConfig();
    const { consumerKey, consumerSecret, baseUrl } = mpesaConfig;
    
    if (!consumerKey || !consumerSecret) {
      throw new Error('Missing M-Pesa credentials: Please check MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET in your .env file');
    }

    // Debug credential format
    console.log('Credential format check:', {
      keyLength: consumerKey.length,
      secretLength: consumerSecret.length,
      baseUrl
    });

    // Create authorization header exactly as per M-Pesa docs
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    
    const url = `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`;
    console.log('Making request to:', url);

    // Try using node-fetch instead of axios
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('M-Pesa API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText
      });
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('M-Pesa Response:', {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data
    });

    if (!data.access_token) {
      console.error('Unexpected response format:', data);
      throw new Error('Access token not received from M-Pesa API');
    }

    return data.access_token;
  } catch (error) {
    console.error('Token generation error:', error);
    
    if (error instanceof Error) {
      throw new Error(`M-Pesa API Error: ${error.message}`);
    }
    throw error;
  }
};

export const mpesa = async (phoneNumber: string, amount: number, reference: string) => {
  try {
    validateConfig();
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!phoneNumber || !amount || !reference) {
      throw new Error('Missing required parameters: phoneNumber, amount, or reference');
    }

    // Validate phone number format
    const cleanedPhone = phoneNumber.replace(/^0|^254|\+254/, '');
    if (!/^\d{9}$/.test(cleanedPhone)) {
      throw new Error('Invalid phone number format. Please provide a valid Kenyan phone number');
    }

    const ref = `${user.given_name} ${user.family_name} (Ref No FIT${reference})`;

    console.log('Generating M-Pesa access token...');
    const token = await generateToken();
    console.log('Successfully generated access token');

    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(`${mpesaConfig.shortcode}${mpesaConfig.passkey}${timestamp}`).toString('base64');

    if (!mpesaConfig.shortcode || !mpesaConfig.passkey) {
      throw new Error('Missing M-Pesa configuration: shortcode or passkey');
    }

    const payload = {
      BusinessShortCode: mpesaConfig.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: `254${cleanedPhone}`,
      PartyB: mpesaConfig.shortcode,
      PhoneNumber: `254${cleanedPhone}`,
      CallBackURL: mpesaConfig.callbackUrl,
      AccountReference: ref,
      TransactionDesc: 'Payment for goods/services',
    };

    console.log('Initiating M-Pesa STK push with payload:', {
      ...payload,
      PhoneNumber: '254XXXXXXXXX' // Mask the phone number in logs
    });

    const { data } = await axios({
      method: 'POST',
      url: `${mpesaConfig.baseUrl}/mpesa/stkpush/v1/processrequest`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: payload
    });

    console.log('M-Pesa STK push response:', data);
    return data;
  } catch (error) {
    console.error('Error processing M-Pesa payment:', error);
    
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.errorMessage || 
                          error.response?.data?.ResponseDescription || 
                          error.message;
      throw new Error(`M-Pesa payment failed: ${errorMessage}`);
    }
    
    throw error;
  }
};