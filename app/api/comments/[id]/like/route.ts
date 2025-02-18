import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const commentId = params.id;
    const reactions = await prisma.$queryRaw<Array<{ id: string, isLike: boolean }>>`
      SELECT id, "isLike"
      FROM "commentreaction"
      WHERE "commentId" = ${commentId}
      AND "userId" = ${user.id}
      LIMIT 1
    `;

    const existingReaction = reactions[0];

    if (existingReaction) {
      // Toggle the reaction
      await prisma.$executeRaw`
        UPDATE "commentreaction"
        SET "isLike" = ${!existingReaction.isLike}
        WHERE id = ${existingReaction.id}
      `;
    } else {
      // Create new reaction
      await prisma.$executeRaw`
        INSERT INTO "commentreaction" ("id", "commentId", "userId", "isLike", "createdAt")
        VALUES (${crypto.randomUUID()}, ${commentId}, ${user.id}, ${true}, ${new Date()})
      `;
    }

    // Get updated reaction count
    const countResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM "commentreaction"
      WHERE "commentId" = ${commentId}
      AND "isLike" = true
    `;

    const count = countResult[0]?.count ?? BigInt(0);

    return NextResponse.json({ success: true, reactionCount: Number(count) });
  } catch (error) {
    console.error('Error handling comment reaction:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
