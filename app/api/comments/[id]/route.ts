import { NextResponse } from 'next/server';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from '@/app/lib/db';
import crypto from 'crypto';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { getUser } = await getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { text, parentId } = body;

    if (!text) {
      return new NextResponse("Text is required", { status: 400 });
    }

    // If parentId is provided, verify it exists
    if (parentId) {
      const parentComment = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id
        FROM "comment"
        WHERE id = ${parentId}
        AND "requestId" = ${params.id}
        LIMIT 1
      `;

      if (parentComment.length === 0) {
        return new NextResponse("Parent comment not found", { status: 404 });
      }
    }

    // Create the comment
    await prisma.$executeRaw`
      INSERT INTO "comment" (id, text, "userId", "requestId", "parentId", "createdAt")
      VALUES (${crypto.randomUUID()}, ${text}, ${user.id}, ${params.id}, ${parentId || null}, ${new Date()})
    `;

    // Get the created comment with user info
    const comments = await prisma.$queryRaw<Array<{
      id: string;
      text: string;
      createdAt: Date;
      userId: string;
      userName: string;
      imageUrl: string | null;
      email: string;
    }>>`
      SELECT 
        c.id,
        c.text,
        c."createdAt",
        c."userId",
        u."userName",
        u."imageUrl",
        u.email
      FROM "comment" c
      LEFT JOIN "user" u ON c."userId" = u.id
      WHERE c."requestId" = ${params.id}
      ORDER BY c."createdAt" DESC
      LIMIT 1
    `;

    const comment = comments[0];
    
    if (!comment) {
      return new NextResponse("Failed to create comment", { status: 500 });
    }

    return NextResponse.json({
      id: comment.id,
      text: comment.text,
      createdAt: comment.createdAt,
      User: {
        userName: comment.userName,
        imageUrl: comment.imageUrl,
        email: comment.email
      },
      replies: [],
      _count: {
        reactions: 0
      }
    });
  } catch (error) {
    console.error('[COMMENT_CREATE]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { getUser } = await getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { isLike } = body;

    const reactions = await prisma.$queryRaw<Array<{ id: string, isLike: boolean }>>`
      SELECT id, "isLike"
      FROM "commentreaction"
      WHERE "userId" = ${user.id}
      AND "commentId" = ${params.id}
      LIMIT 1
    `;

    const existingReaction = reactions[0];

    if (existingReaction) {
      if (existingReaction.isLike === isLike) {
        // Remove reaction if clicking the same button
        await prisma.$executeRaw`
          DELETE FROM "commentreaction"
          WHERE id = ${existingReaction.id}
        `;
      } else {
        // Toggle reaction type
        await prisma.$executeRaw`
          UPDATE "commentreaction"
          SET "isLike" = ${isLike}
          WHERE id = ${existingReaction.id}
        `;
      }
    } else {
      // Create new reaction
      await prisma.$executeRaw`
        INSERT INTO "commentreaction" ("id", "commentId", "userId", "isLike", "createdAt")
        VALUES (${crypto.randomUUID()}, ${params.id}, ${user.id}, ${isLike}, ${new Date()})
      `;
    }

    // Get updated reaction count
    const countResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM "commentreaction"
      WHERE "commentId" = ${params.id}
      AND "isLike" = true
    `;

    const count = countResult[0]?.count ?? BigInt(0);

    return NextResponse.json({ success: true, reactionCount: Number(count) });
  } catch (error) {
    console.error('Error handling comment reaction:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
