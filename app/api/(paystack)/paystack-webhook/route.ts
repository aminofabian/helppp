import { NextResponse } from "next/server";
import crypto from "crypto";

// This endpoint is deprecated - all webhook processing happens in /api/webhook
export async function POST(req: Request) {
  const webhookId = crypto.randomBytes(16).toString('hex');
  console.log(`[${webhookId}] Deprecated webhook endpoint called - request will be ignored`);
  return NextResponse.json(
    { message: "This endpoint is deprecated" },
    { status: 410 }
  );
}
