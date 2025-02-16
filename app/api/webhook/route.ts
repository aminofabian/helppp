import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    console.log(rawBody, 'this is the raw body...')
    const signature = req.headers.get("x-paystack-signature");

    // Verify Paystack webhook authenticity
    const hash = crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
      .update(rawBody)
      .digest("hex");

    if (hash !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    console.log("Webhook Data Received:", JSON.stringify(event, null, 2));

    if (event.event === "charge.success") {
      console.log(`Payment successful for ${event.data.amount / 100} KES`);

      // Extract necessary data
      const email = event.data.customer.email?.toLowerCase().trim();
      const amount = event.data.amount / 100; // Convert from kobo to KES
      const reference = event.data.reference;
      const currency = event.data.currency;
      const paymentMethod = "PAYSTACK";
      const requestId = event.data.metadata?.requestId; // ✅ Extract requestId

      if (!email) {
        return NextResponse.json({ message: "No email provided" }, { status: 400 });
      }
      if (!requestId) {
        return NextResponse.json({ message: "No requestId provided" }, { status: 400 });
      }

      // Find user by email
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        console.error("User not found for email:", email);
        return NextResponse.json({ message: "User not found" }, { status: 404 });
      }

      console.log("User found:", user.id);

      // Store payment record (linking to requestId)
      const payment = await prisma.payment.create({
        data: {
          userId: user.id,
          amount: amount,
          status: "COMPLETED",
          paymentMethod: paymentMethod,
          createdAt: new Date(),
          updatedAt: new Date(),
          mpesaReceiptNumber: reference,
          currency: currency,
          userts: new Date(),
          requestId: requestId, // ✅ Store requestId with the payment
        },
      });

      console.log(`Payment recorded successfully for user: ${user.id} and requestId: ${requestId}`);

      return NextResponse.json({ message: "Payment recorded successfully" }, { status: 200 });
    }

    console.log("Unhandled event type:", event.event);
    return NextResponse.json({ message: "Webhook received" }, { status: 200 });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}


// import { NextResponse } from "next/server";
// import prisma from "@/app/lib/db";
// import crypto from "crypto";

// export async function POST(req: Request) {
//   try {
//     const rawBody = await req.text();
//     const signature = req.headers.get("x-paystack-signature");

//     // Verify Paystack webhook authenticity
//     const hash = crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
//       .update(rawBody)
//       .digest("hex");

//     if (hash !== signature) {
//       return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
//     }

//     const event = JSON.parse(rawBody);
//     console.log("Webhook Data Received:", JSON.stringify(event, null, 2));

//     if (event.event === "charge.success") {
//       console.log(`Payment successful for ${event.data.amount / 100} KES`);

//       // Extract necessary data
//       const email = event.data.customer.email?.toLowerCase().trim();
//       if (!email) {
//         return NextResponse.json({ message: "No email provided" }, { status: 400 });
//       }

//       const amount = event.data.amount / 100; // Convert from kobo to KES
//       const reference = event.data.reference;
//       const currency = event.data.currency;
//       const paymentMethod = "PAYSTACK";

//       // Find user by email
//       const user = await prisma.user.findUnique({ where: { email } });
//       if (!user) {
//         console.error("User not found for email:", email);
//         return NextResponse.json({ message: "User not found" }, { status: 404 });
//       }

//       console.log("User found:", user.id);

//       // Store payment record (without updating wallet)
//       const payment = await prisma.payment.create({
//         data: {
//           userId: user.id,
//           amount: amount,
//           status: "COMPLETED",
//           paymentMethod: paymentMethod,
//           createdAt: new Date(),
//           updatedAt: new Date(),
//           mpesaReceiptNumber: reference,
//           currency: currency,
//           userts: new Date(),
//         },
//       });

//       console.log(`Payment recorded successfully for user: ${user.id}`);

//       return NextResponse.json({ message: "Payment recorded successfully" }, { status: 200 });
//     }

//     console.log("Unhandled event type:", event.event);
//     return NextResponse.json({ message: "Webhook received" }, { status: 200 });
//   } catch (error: any) {
//     console.error("Webhook processing error:", error);
//     return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
//   }
// }
// import { NextResponse } from "next/server";
// import prisma from "@/app/lib/db";
// import crypto from "crypto";

// export async function POST(req: Request) {
//   try {
//     const rawBody = await req.text(); // Read webhook body
//     const signature = req.headers.get("x-paystack-signature"); // Paystack signature

//     // Verify Paystack webhook authenticity
//     const hash = crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
//       .update(rawBody)
//       .digest("hex");

//     if (hash !== signature) {
//       return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
//     }

//     const event = JSON.parse(rawBody); // Convert to JSON
//     console.log("Webhook Data Received:", JSON.stringify(event, null, 2));

//     if (event.event === "charge.success") {
//       console.log(`Payment successful for ${event.data.amount / 100} KES`);

//       // Extract necessary data
//       const email = event.data.customer.email;
//       if (!email) {
//         return NextResponse.json({ message: "No email provided" }, { status: 400 });
//       }
//       const amount = event.data.amount / 100; // Convert from kobo to KES
//       const reference = event.data.reference;
//       const currency = event.data.currency;
//       const paymentMethod = "PAYSTACK";

    
//     // Normalize email
//     const normalizedEmail = email.toLowerCase().trim();
//     console.log("Exact query being run:", {
//       email: normalizedEmail,
//       originalEmail: email
//     });

//     // Find user by email
//     const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
//     if (!user) {
//       console.error("User not found for email:", normalizedEmail);
//       return NextResponse.json({ message: "User not found" }, { status: 404 });
//     }

//     console.log("User found: what did you found...", user?.id);
    
//     // Check if wallet exists
//     let wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });

//     // Create wallet if it doesn't exist
//     if (!wallet) {
//       console.log("Creating new wallet for user:", user.id);
//       wallet = await prisma.wallet.create({
//         data: { userId: user.id, balance: 0 },
//       });
//     }


//       // Store payment in Payment table
//       const payment = await prisma.payment.create({
//         data: {
//           userId: user.id,
//           amount: amount,
//           status: "COMPLETED",
//           paymentMethod: paymentMethod,
//           createdAt: new Date(),
//           updatedAt: new Date(),
//           mpesaReceiptNumber: reference, // Store reference
//           currency: currency,
//           userts: new Date(),
//         },
//       });

//       // Update wallet balance (credit the amount)
//       await prisma.wallet.update({
//         where: { userId: user.id },
//         data: {
//           balance: wallet.balance + amount, // Credit user's wallet
//           updatedAt: new Date(),
//         },
//       });

//       console.log(`Wallet credited with ${amount} KES for user: ${user.id}`);

//       return NextResponse.json({ message: "Payment recorded and wallet updated" }, { status: 200 });
//     } else {
//       console.log("Unhandled event type:", event.event);
//     }

//     return NextResponse.json({ message: "Webhook received" }, { status: 200 });

//   } catch (error: any) {
//     console.error("Webhook processing error:", error);
//     return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
//   }
// }



// import { NextResponse } from "next/server";
// import crypto from "crypto";
// import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

// const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// export async function POST(req: Request) {
//   try {

//     // const { getUser } = getKindeServerSession();
//     // const user = await getUser();
//     // const userId = user?.id;
//     // console.log(userId, 'this is tobias user id...')

//     // if (!userId) {
//     //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     // }
    
//     const rawBody = await req.text(); // read data
//     const signature = req.headers.get("x-paystack-signature"); // Paystack signature

//     // authenticity
//     const hash = crypto.createHmac("sha512", PAYSTACK_SECRET_KEY!)
//       .update(rawBody)
//       .digest("hex");

//     if (hash !== signature) {
//       return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
//     }

//     const event = JSON.parse(rawBody); // to JSON
//     console.log("Webhook Data Received:", JSON.stringify(event, null, 2));

//     // if success
//     if (event.event === "charge.success") {
//       console.log(`Payment successful for ${event.data.amount} NGN`);

//       // Extract details
//       const email = event.data.customer.email;
//       const amount = event.data.amount / 100; 
//       const reference = event.data.reference;


//     //   console.log("Extracted Data:");
//     //   console.log(`Email: ${email}`);
//     //   console.log(`Amount: ${amount} NGN`);
//     //   console.log(` Reference: ${reference}`);

//     } else {
//       console.log("Unhandled event type:", event.event);
//     }

//     return NextResponse.json({ message: "Webhook received" }, { status: 200 });

//   } catch (error: any) {
//     console.error("Webhook processing error:", error);
//     return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
//   }
// }

