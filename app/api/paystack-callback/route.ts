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
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?error=missing_reference`);
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
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?error=verification_failed&reference=${reference}`);
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
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?error=donation_not_found&reference=${reference}`);
    }

    // Redirect to root domain with success message
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}?success=true&message=Thank you for your donation!`
    );

  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?error=server_error`);
  }
}
