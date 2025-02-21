import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { PaymentStatus } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get('reference');
    const trxref = searchParams.get('trxref');

    console.log('Callback received:', { reference, trxref });

    if (!reference) {
      console.error('No reference found in callback');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/payment?error=missing_reference`);
    }

    // Verify payment status with Paystack
    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const verifyData = await verifyResponse.json();
    console.log('Verification response:', verifyData);

    if (!verifyResponse.ok || !verifyData.status || verifyData.data.status !== 'success') {
      console.error('Payment verification failed:', verifyData);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/payment?error=verification_failed&reference=${reference}`);
    }

    // Find the most recent pending donation
    const donation = await prisma.donation.findFirst({
      where: {
        OR: [
          { invoice: reference },
          { status: PaymentStatus.PENDING }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!donation) {
      console.error('No pending donation found for reference:', reference);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/payment?error=donation_not_found&reference=${reference}`);
    }

    // Redirect to success page - actual payment processing happens in webhook
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/payment?success=true&reference=${reference}&request=${donation.requestId}`
    );

  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/payment?error=server_error`);
  }
}
