import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // Get the payment from the database with related donation
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        donation: true
      }
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // If payment is already completed, return success immediately
    if (payment.status === 'COMPLETED') {
      return NextResponse.json({
        status: 'SUCCESS',
        message: 'Payment already completed',
        isCompleted: true
      });
    }

    // If payment has failed, return failed status
    if (payment.status === 'FAILED') {
      return NextResponse.json({
        status: 'FAILED',
        message: 'Payment failed',
        isCompleted: true
      });
    }

    // Return current payment status
    return NextResponse.json({
      status: payment.status,
      message: 'Payment status retrieved successfully',
      isCompleted: false
    });

  } catch (error) {
    console.error('Error checking payment status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check payment status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
