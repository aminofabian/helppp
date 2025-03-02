import { NextResponse } from "next/server";
import prisma from '@/app/lib/db';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

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

export async function POST(req: Request) {
  try {
    const event = await req.json();
    
    // Verify the event is a successful charge
    if (event.event !== 'charge.success') {
      return NextResponse.json({ message: 'Event not handled' }, { status: 200 });
    }

    const { data } = event;
    const { metadata, amount, reference, customer } = data;

    // Verify this is a wallet deposit
    if (metadata?.type !== 'wallet_deposit') {
      return NextResponse.json({ message: 'Not a wallet deposit' }, { status: 200 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: customer.email }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Start a transaction to update wallet and create records
    const result = await prisma.$transaction(async (tx) => {
      // Update or create wallet
      const wallet = await tx.wallet.upsert({
        where: { userId: user.id },
        update: {
          balance: {
            increment: amount / 100 // Convert from kobo to KES
          }
        },
        create: {
          userId: user.id,
          balance: amount / 100
        }
      });

      // Create payment record
      const payment = await tx.payment.create({
        data: {
          amount: amount / 100,
          userts: new Date(),
          paymentMethod: PaymentMethod.PAYSTACK,
          status: PaymentStatus.COMPLETED,
          merchantRequestId: reference,
          resultCode: "00",
          resultDesc: "Success",
          sender: { connect: { id: user.id } }
        }
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          amount: amount / 100,
          giver: { connect: { id: user.id } },
          receiver: { connect: { id: user.id } }
        }
      });

      // Create points - 1 point per donation
      const pointsEarned = 1;
      await tx.points.create({
        data: {
          user: { connect: { id: user.id } },
          amount: pointsEarned,
          payment: { connect: { id: payment.id } }
        }
      });

      return { wallet, payment };
    });

    // Trigger revalidation
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/revalidate-donation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: user.id }),
    });

    return NextResponse.json({
      success: true,
      message: 'Wallet updated successfully',
      newBalance: result.wallet.balance
    });

  } catch (error) {
    console.error('Error processing Paystack webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}







// import { NextResponse } from "next/server";
// import prisma from '@/app/lib/db';
// import { PaymentMethod, PaymentStatus } from '@prisma/client';

// export async function GET(req: Request) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const reference = searchParams.get('reference');
//     const status = searchParams.get('status');

//     // Just handle the redirect based on the status
//     if (status === 'success') {
//       return NextResponse.redirect(
//         `${process.env.NEXT_PUBLIC_APP_URL}?success=true&message=Payment processing. You will be notified once confirmed.`
//       );
//     } else {
//       return NextResponse.redirect(
//         `${process.env.NEXT_PUBLIC_APP_URL}?error=payment_failed&message=Payment was not successful`
//       );
//     }
//   } catch (error) {
//     console.error('Callback error:', error);
//     return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?error=server_error`);
//   }
// }

// export async function POST(req: Request) {
//   try {
//     const event = await req.json();
//     console.log('Paystack webhook event:', event);

//     // Verify the event is a successful charge
//     if (event.event !== 'charge.success') {
//       return NextResponse.json({ message: 'Event not handled' }, { status: 200 });
//     }

//     const { data } = event;
//     const { metadata, amount, reference, customer } = data;

//     // Verify this is a wallet deposit
//     if (metadata?.type !== 'wallet_deposit') {
//       return NextResponse.json({ message: 'Not a wallet deposit' }, { status: 200 });
//     }

//     // Find user by email
//     const user = await prisma.user.findUnique({
//       where: { email: customer.email }
//     });

//     if (!user) {
//       throw new Error('User not found');
//     }

//     // Start a transaction to update wallet and create records
//     const result = await prisma.$transaction(async (tx) => {
//       // Update or create wallet
//       const wallet = await tx.wallet.upsert({
//         where: { userId: user.id },
//         update: {
//           balance: {
//             increment: amount / 100 // Convert from kobo to KES
//           }
//         },
//         create: {
//           userId: user.id,
//           balance: amount / 100
//         }
//       });

//       // Create payment record
//       const payment = await tx.payment.create({
//         data: {
//           amount: amount / 100,
//           userts: new Date(),
//           paymentMethod: PaymentMethod.PAYSTACK,
//           status: PaymentStatus.COMPLETED,
//           merchantRequestId: reference,
//           resultCode: "00",
//           resultDesc: "Success",
//           sender: { connect: { id: user.id } }
//         }
//       });

//       // Create transaction record
//       await tx.transaction.create({
//         data: {
//           amount: amount / 100,
//           giver: { connect: { id: user.id } },
//           receiver: { connect: { id: user.id } }
//         }
//       });

//       // Create points - 1 point per donation
//       const pointsEarned = 1;
//       await tx.points.create({
//         data: {
//           user: { connect: { id: user.id } },
//           amount: pointsEarned,
//           payment: { connect: { id: payment.id } }
//         }
//       });

//       return { wallet, payment };
//     });

//     // Trigger revalidation
//     await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/revalidate-donation`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ userId: user.id }),
//     });

//     return NextResponse.json({
//       success: true,
//       message: 'Wallet updated successfully',
//       newBalance: result.wallet.balance
//     });

//   } catch (error) {
//     console.error('Error processing Paystack webhook:', error);
//     return NextResponse.json(
//       { error: 'Failed to process webhook' },
//       { status: 500 }
//     );
//   }
// }
