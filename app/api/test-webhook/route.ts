import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  console.log('Test webhook received at:', new Date().toISOString());
  
  try {
    const rawBody = await req.text();
    console.log('Headers:', {
      signature: req.headers.get('x-paystack-signature'),
      contentType: req.headers.get('content-type'),
      userAgent: req.headers.get('user-agent')
    });
    console.log('Body:', rawBody);
    
    return NextResponse.json({ status: 'success', message: 'Test webhook received' });
  } catch (error) {
    console.error('Test webhook error:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: 'Error processing test webhook',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 