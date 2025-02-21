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

    // Extract requestId from reference (format: requestId_timestamp)
    const [requestId] = reference.split('_');
    console.log('Extracted requestId:', requestId);

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

    // Find the donation
    const donation = await prisma.donation.findFirst({
      where: {
        requestId: requestId,
        status: PaymentStatus.PENDING
      }
    });

    if (!donation) {
      console.error('No pending donation found for requestId:', requestId);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/payment?error=donation_not_found&reference=${reference}`);
    }

    // Redirect to success page - actual payment processing happens in webhook
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/payment?success=true&reference=${reference}&request=${requestId}`
    );

  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/payment?error=server_error`);
  }
}
