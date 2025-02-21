import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get('reference');
    const trxref = searchParams.get('trxref');

    if (!reference) {
      console.error('No reference found in callback');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?error=missing_reference`);
    }

    // Verify payment status with Paystack just to confirm it's valid
    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const verifyData = await verifyResponse.json();

    if (!verifyResponse.ok || !verifyData.status) {
      console.error('Payment verification failed:', verifyData);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?error=verification_failed`);
    }

    // Redirect to success page - actual payment processing happens in webhook
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?success=true&reference=${reference}`);

  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?error=server_error`);
  }
}
