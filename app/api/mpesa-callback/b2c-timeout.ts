// app/api/mpesa-callback/b2c-timeout.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const timeoutResult = await request.json();
    console.log('B2C Timeout:', timeoutResult);

    // Handle the timeout result, e.g., update the database, notify the user, etc.

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Error handling B2C timeout:', error);
    return NextResponse.json({ status: 'error' });
  }
}
