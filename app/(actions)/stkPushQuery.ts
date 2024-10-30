"use server";
 
import axios from "axios";
 
export const stkPushQuery = async (reqId: string) => {
    console.log('are you here', reqId)
  const MPESA_BASE_URL = 'https://api.safaricom.co.ke'
    
 
  try {
    //generate token
    const auth: string = Buffer.from(
      `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
    ).toString("base64");
 
    const resp = await axios.get(
      `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          authorization: `Basic ${auth}`,
        },
      }
    );
 
    const token = resp.data.access_token;
    console.log(token, 'working token')
 
    const date = new Date();
    const timestamp =
      date.getFullYear() +
      ("0" + (date.getMonth() + 1)).slice(-2) +
      ("0" + date.getDate()).slice(-2) +
      ("0" + date.getHours()).slice(-2) +
      ("0" + date.getMinutes()).slice(-2) +
      ("0" + date.getSeconds()).slice(-2);
 
    const password: string = Buffer.from(
      process.env.MPESA_SHORTCODE! + process.env.MPESA_PASSKEY + timestamp
    ).toString("base64"); 
 console.log('password', process.env.MPESA_PASSKEY, 'passkey',process.env.MPESA_SHORTCODE! )
    const response = await axios.post(
      `${MPESA_BASE_URL}/mpesa/stkpushquery/v1/query`,
      {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: reqId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log(response, 'sa tutashinda hapa!!!')
    console.log(response.data, 'hii ndo data waseee')
    return { data: response.data };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error };
    }
 
    const unknownError = error as any;
    unknownError.message = "something wrong happened";
    return { error: unknownError };
  }
};