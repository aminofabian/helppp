import { NextResponse } from "next/server";
import crypto from "crypto";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function POST(req: Request) {
  try {
    const rawBody = await req.text(); // read data
    const signature = req.headers.get("x-paystack-signature"); // Paystack signature

    // authenticity
    const hash = crypto.createHmac("sha512", PAYSTACK_SECRET_KEY!)
      .update(rawBody)
      .digest("hex");

    if (hash !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody); // to JSON
    console.log("Webhook Data Received:", JSON.stringify(event, null, 2));

    // if success
    if (event.event === "charge.success") {
      console.log(`Payment successful for ${event.data.amount} NGN`);

      // Extract details
      const email = event.data.customer.email;
      const amount = event.data.amount / 100; // from kobo to NGN
      const reference = event.data.reference;

      console.log("Extracted Data:");
      console.log(`Email: ${email}`);
      console.log(`Amount: ${amount} NGN`);
      console.log(` Reference: ${reference}`);

    } else {
      console.log("Unhandled event type:", event.event);
    }

    return NextResponse.json({ message: "Webhook received" }, { status: 200 });

  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}

