import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    const userId = user?.id;

    console.log(userId, "this is tobias user id...");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, amount, requestId } = await req.json(); // ✅ Include requestId

    if (!email || !amount || !requestId) {
      console.log(email, amount,requestId, 'none of those are empty...')
      return NextResponse.json(
        { error: "Email, amount, and requestId are required" },
        { status: 400 }
      );
    }

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amount * 100, // Convert to kobo (Paystack requirement)
        callback_url: process.env.NEXT_PUBLIC_PAYSTACK_CALLBACK_URL || "https://fitrii.com",
        metadata: { requestId, userId }, // Attach requestId & userId in metadata
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || "Failed to initialize transaction");
    }

    console.log(data, "successful...");
    return NextResponse.json({ data }, { status: 200 });

  } catch (error: any) {
    console.error("Paystack API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
// import { NextResponse } from "next/server";

// export async function POST(req: Request) {

//   try {

//     const { getUser } = getKindeServerSession();
//     const user = await getUser();
//     const userId = user?.id;
//     console.log(userId, 'this is tobias user id...')

//     if (!userId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }
//     const { email, amount } = await req.json();

//     if (!email || !amount) {
//       return NextResponse.json({ error: "Email and amount are required" }, { status: 400 });
//     }

//     const response = await fetch("https://api.paystack.co/transaction/initialize", {
//       method: "POST",
//       headers: {
//         "Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         email,
//         amount: amount * 100, // Convert to kobo
//         callback_url: process.env.NEXT_PUBLIC_PAYSTACK_CALLBACK_URL || "https://fitrii.com",
//       }),
//     });
//     // https://fitrii.com/
//     const data = await response.json();
//     console.log(data, 'succesful...')

//     if (!response.ok) {
//       throw new Error(data?.message || "Failed to initialize transaction");
//     }

//     console.log(data, 'succesful...')
//     return NextResponse.json({ data }, { status: 200 });

//   } catch (error: any) {
//     console.error("Paystack API Error:", error);
//     return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
//   }
// }


// // pages/api/initiate.ts
// import { NextResponse } from "next/server";

// export async function POST(req: Request) {
//   try {
//     const { email, amount } = await req.json();

//     if (!email || !amount) {
//       return NextResponse.json({ error: "Email and amount are required" }, { status: 400 });
//     }

//     const response = await fetch("https://api.paystack.co/transaction/initialize", {
//       method: "POST",
//       headers: {
//         "Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         email,
//         amount: amount * 100, // Convert to kobo
//         callback_url: process.env.NEXT_PUBLIC_PAYSTACK_CALLBACK_URL || "http://localhost:3000/callback",
//       }),
//     });

//     const data = await response.json();

//     if (!response.ok) {
//       throw new Error(data?.message || "Failed to initialize transaction");
//     }

//     return NextResponse.json({ data }, { status: 200 });

//   } catch (error: any) {
//     console.error("Paystack API Error:", error);
//     return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
//   }
// }

// import { NextResponse } from 'next/server';
// import axios, { AxiosError } from 'axios';

// interface PaystackErrorResponse {
//   message: string;
// }

// export async function POST(request: Request) {
//   const { amount, email, phoneNumber } = await request.json();

//   // Format the phone number
//   const formattedPhoneNumber = formatPhoneNumber(phoneNumber);

//   try {
//     const response = await axios.post('https://api.paystack.co/charge', {
//       email,
//       amount: amount * 100, // Convert to cents
//       currency: 'KES',
//       mobile_money: {
//         phone: formattedPhoneNumber,
//         provider: 'mpesa'
//       }
//     }, {
//       headers: {
//         Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
//         'Content-Type': 'application/json'
//       }
//     });

//     return NextResponse.json(response.data);
//   } catch (error) {
//     const axiosError = error as AxiosError<PaystackErrorResponse>;
//     console.error('Paystack API error:', axiosError.response?.data || axiosError.message);
//     return NextResponse.json({
//       status: false,
//       message: axiosError.response?.data?.message || 'Error initiating payment'
//     }, { status: 500 });
//   }
// }

// function formatPhoneNumber(phoneNumber: string): string {
//   // Remove any non-digit characters
//   let cleaned = phoneNumber.replace(/\D/g, '');

//   // Ensure the number starts with 254 (Kenya's country code)
//   if (cleaned.startsWith('0')) {
//     cleaned = '254' + cleaned.slice(1);
//   } else if (!cleaned.startsWith('254')) {
//     cleaned = '254' + cleaned;
//   }

//   // Ensure the number is exactly 12 digits long (254 + 9 digits)
//   if (cleaned.length !== 12) {
//     cleaned = '254' + cleaned.slice(-9);
//   }

//   return `+${cleaned}`;
// }