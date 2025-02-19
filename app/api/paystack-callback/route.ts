import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { PaymentMethod, PaymentStatus } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get('reference');
    const trxref = searchParams.get('trxref');

    if (!reference) {
      console.error('No reference found in callback');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?error=missing_reference`);
    }

    // Extract requestId from reference (format: requestId_timestamp)
    const requestId = reference.split('_')[0];

    if (!requestId) {
      console.error('Could not extract requestId from reference:', reference);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?error=invalid_reference`);
    }

    // Verify payment status with Paystack
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

    // Get the request to find the user
    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: { User: true }
    });

    if (!request) {
      console.error('Request not found:', requestId);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?error=request_not_found`);
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId: request.userId,
        amount: verifyData.data.amount / 100, // Convert from smallest currency unit
        status: PaymentStatus.COMPLETED,
        paymentMethod: PaymentMethod.PAYSTACK,
        mpesaReceiptNumber: reference,
        currency: verifyData.data.currency,
        requestId: requestId,
        userts: new Date(),
      },
    });

    // Create donation record
    await prisma.donation.create({
      data: {
        userId: request.userId,
        requestId: requestId,
        amount: verifyData.data.amount / 100,
        payment: { connect: { id: payment.id } },
        status: "COMPLETED",
        invoice: reference,
      },
    });

    // Redirect to success page
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?success=true&reference=${reference}`);

  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?error=server_error`);
  }
}
