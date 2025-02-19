import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST() {
  try {
    // Get access token
    const tokenResponse = await axios.post(
      `${process.env.KOPOKOPO_BASE_URL}/oauth/token`,
      {
        grant_type: 'client_credentials',
      },
      {
        auth: {
          username: process.env.KOPOKOPO_CLIENT_ID!,
          password: process.env.KOPOKOPO_CLIENT_SECRET!,
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // Create webhook subscription
    const subscriptionResponse = await axios.post(
      `${process.env.KOPOKOPO_BASE_URL}/api/v1/webhook_subscriptions`,
      {
        event_type: 'buygoods_transaction_received',
        url: `${process.env.NEXT_PUBLIC_APP_URL}/api/kopokopo-callback`,
        scope: 'till',
        scope_reference: process.env.KOPOKOPO_TILL_NUMBER,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook subscription created successfully',
      data: subscriptionResponse.data 
    });
  } catch (error: any) {
    console.error('Error creating webhook subscription:', error.response?.data || error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error creating webhook subscription',
      error: error.response?.data || error.message 
    }, { status: 500 });
  }
}
