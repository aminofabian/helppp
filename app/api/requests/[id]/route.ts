import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const requestItem = await prisma.request.findUnique({
      where: { id: params.id },
      select: {
        title: true,
        createdAt: true,
        updatedAt: true,
        textContent: true,
        deadline: true,
        id: true,
        imageString: true,
        pointsUsed: true,
        Vote: true,
        Comment: {
          select: {
            id: true,
            text: true,
          },
        },
        User: {
          select: {
            userName: true,
            id: true,
          },
        },
        communityName: true,
        amount: true,
      },
    });

    if (!requestItem) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    return NextResponse.json(requestItem);
  } catch (error) {
    console.error("Error fetching request:", error);
    return NextResponse.json({ error: "Failed to fetch request" }, { status: 500 });
  }
}
