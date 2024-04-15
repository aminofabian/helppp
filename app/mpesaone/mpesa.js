// utils/mpesa.js

import axios from 'axios';

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
    const { data } = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    if (!data.access_token) {
      console.error('Access token not received:', data);
      throw new Error('Access token not received');
    }

    console.log('Access Token:', data.access_token); // Log the access token
    return data.access_token;
  } catch (error) {
    console.error('Error generating token:', error);
    throw error; // Throw the error to handle it elsewhere if needed
  }
};


export const mpesa = async (phoneNumber, amount, reference) => {
  const token = await generateToken();
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3); // Format: YYYYMMDDHHmmss
  const password = Buffer.from(`${mpesaConfig.shortcode}${mpesaConfig.passkey}${timestamp}`).toString('base64');

  const payload = {
    BusinessShortCode: mpesaConfig.shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: amount,
    PartyA: `254${phoneNumber}`,
    PartyB: mpesaConfig.shortcode,
    PhoneNumber: `254${phoneNumber}`,
    CallBackURL: mpesaConfig.callbackUrl.reference,
    AccountReference: reference,
    TransactionDesc: 'Payment for goods/services',
  };

  const { data } = await axios.post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return data;
};
