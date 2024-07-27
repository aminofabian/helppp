// app/api/mpesa-callback/b2c-result.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const result = await request.json();
    console.log('B2C Result:', result);

    // Handle the result, e.g., update the database, notify the user, etc.
    // Example:
    // if (result.Result.ResultCode === 0) {
    //   // Transaction was successful
    // } else {
    //   // Transaction failed
    // }

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Error handling B2C result:', error);
    return NextResponse.json({ status: 'error' });
  }
}
