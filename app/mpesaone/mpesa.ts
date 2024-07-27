import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import axios from 'axios';
import { redirect } from 'next/navigation';

const mpesaConfig = {
  consumerKey: process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,
  shortcode: process.env.MPESA_SHORTCODE,
  passkey: process.env.MPESA_PASSKEY,
  callbackUrl: process.env.MPESA_CALLBACK_URL,
};

const generateToken = async () => {
  try {
    const { consumerKey, consumerSecret } = mpesaConfig;
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    console.log('Making request to Safaricom API...');
    const response = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    if (!response.data || !response.data.access_token) {
      throw new Error('Access token not received');
    }

    return response.data.access_token;
  } catch (error) {
    console.error('Error generating token:', error);
    if (axios.isAxiosError(error)) {
    }
    throw error;
  }
};


export const mpesa = async (phoneNumber: string, amount: number, reference: string) => {
  const { getUser } = getKindeServerSession();
  const user = await getUser();



  if (!user) {
    return redirect('/api/auth/login');
  }

  const userName: string | null = `${user.given_name} ${user.family_name} (Ref No FIT${reference})`; // Concatenate given name and family name

  try {
    const token = await generateToken();
    console.log('Generated Token:', token);

    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(`${mpesaConfig.shortcode}${mpesaConfig.passkey}${timestamp}`).toString('base64');

    const payload = {
      BusinessShortCode: mpesaConfig.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: `254${phoneNumber.replace(/^0/, '')}`,
      PartyB: mpesaConfig.shortcode,
      PhoneNumber: `254${phoneNumber.replace(/^0/, '')}`,
      CallBackURL: mpesaConfig.callbackUrl,
      AccountReference: userName,
      TransactionDesc: 'Payment for goods/services',
    };

    const { data } = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    ).catch((error) => {
      console.error('Error response from M-Pesa API:', error.response?.data);
      throw error;
    });

    return data;
  } catch (error) {
    console.error('Error processing M-Pesa payment:', error);
    throw error;
  }
};