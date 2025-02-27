import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const response = await fetch('https://api.paystack.co/integration/webhook', {
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    return NextResponse.json({
      message: 'Current webhook configuration',
      config: data,
      expectedUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook`,
      isCorrect: data.data?.webhook_url === `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook`
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to verify webhook URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 