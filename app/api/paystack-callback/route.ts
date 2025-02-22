import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get('reference');
    const status = searchParams.get('status');

    // Just handle the redirect based on the status
    if (status === 'success') {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}?success=true&message=Payment processing. You will be notified once confirmed.`
      );
    } else {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}?error=payment_failed&message=Payment was not successful`
      );
    }
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?error=server_error`);
  }
}
