import { NextResponse } from 'next/server';
import axios from 'axios';
import prisma from '@/app/lib/db';

async function getAccessToken() {
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
  return tokenResponse.data.access_token;
}

export async function GET() {
  try {
    console.log('Starting transaction polling...');
    const accessToken = await getAccessToken();

    // Get pending payments from the last 24 hours
    const fromTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const toTime = new Date().toISOString();

    const pollingOptions = {
      scope: "company",
      scopeReference: "",
      fromTime,
      toTime,
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/kopokopo-callback`,
    };

    // Initiate polling request
    const pollingResponse = await axios.post(
      `${process.env.KOPOKOPO_BASE_URL}/api/v1/polling`,
      pollingOptions,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    // Get the polling URL from the response
    const pollingUrl = pollingResponse.data.location;
    console.log('Polling initiated, getting status from:', pollingUrl);

    // Get the polling status
    const statusResponse = await axios.get(pollingUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    // Process the transactions
    const transactions = statusResponse.data.data;
    console.log('Retrieved transactions:', transactions);

    // Update payment records in database
    for (const transaction of transactions) {
      const payment = await prisma.payment.findFirst({
        where: {
          merchantRequestId: transaction.reference
        }
      });

      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            resultCode: transaction.status === 'SUCCESS' ? '0' : '1',
            resultDesc: transaction.status,
            mpesaReceiptNumber: transaction.payment_reference || '',
            transactionDate: new Date(transaction.created_at)
          }
        });

        // If payment successful, update request status
        if (transaction.status === 'SUCCESS') {
          await prisma.request.update({
            where: { id: payment.requestId ?? undefined },
            data: {
              status: 'PAID'
            }
          });
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Transactions polled and updated successfully',
      transactionsProcessed: transactions.length
    });

  } catch (error) {
    console.error('Error polling transactions:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error polling transactions',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
