import { NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/app/lib/db";
import { PaymentStatus } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount, requestId, email } = await req.json();

    if (!amount || !requestId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create the donation record
    const donation = await prisma.donation.create({
      data: {
        amount,
        requestId,
        userId: user.id,
        status: PaymentStatus.PENDING,
        invoice: `${requestId}_${Date.now()}`, // Generate a unique invoice number
        createdAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, donation });
  } catch (error) {
    console.error("Error creating donation:", error);
    return NextResponse.json(
      { error: "Failed to create donation" },
      { status: 500 }
    );
  }
} 