'use server';

import prisma from '@/app/lib/db';

type CommentWithUser = {
  id: string;
  text: string;
  createdAt: Date;
  userId: string;
  requestId: string;
  User: {
    userName: string;
    imageUrl: string | null;
    email: string;
  };
  userName: string;
  email: string;
  imageUrl: string | null;
  _count: {
    reactions: number;
  };
  reactions: number;
  replies: CommentWithUser[];
};

export async function getRequest(requestId: string) {
  try {
    const data = await prisma.$queryRaw<Array<{
      id: string;
      title: string;
      amount: number;
      textContent: any;
      imageString: string | null;
      createdAt: Date;
      deadline: Date;
      updatedAt: Date;
      pointsUsed: number;
      status: string | null;
      userId: string;
      communityName: string | null;
      communityDescription: string | null;
      communityCreatedAt: Date | null;
      communityCreatorId: string | null;
      userName: string;
      userLevel: number;
      userImageUrl: string | null;
      userEmail: string;
      userFirstName: string;
      userLastName: string;
      funded: number;
      contributors: number;
      comments: Array<{
        id: string;
        text: string;
        createdAt: Date;
        userId: string;
        requestId: string;
        userName: string;
        userImageUrl: string | null;
        userEmail: string;
        parentId: string | null;
        reactionCount: string;
        path: string[];
      }>;
      votes: Array<{
        voteType: string;
      }>;
      donations: Array<{
        id: string;
        amount: number;
        createdAt: Date;
        status: string;
        userId: string;
      }>;
    }>>`
      WITH RECURSIVE comment_tree AS (
        -- Base case: get all top-level comments
        SELECT 
          c.id,
          c.text,
          c."createdAt",
          c."userId",
          c."requestId",
          c."parentId",
          u."userName",
          u."imageUrl" as "userImageUrl",
          u.email as "userEmail",
          1 as level,
          ARRAY[c."createdAt"::text, c.id] as path
        FROM "Comment" c
        LEFT JOIN "users" u ON c."userId" = u.id
        WHERE c."requestId" = ${requestId}
        AND c."parentId" IS NULL

        UNION ALL

        -- Recursive case: get replies
        SELECT 
          c.id,
          c.text,
          c."createdAt",
          c."userId",
          c."requestId",
          c."parentId",
          u."userName",
          u."imageUrl" as "userImageUrl",
          u.email as "userEmail",
          ct.level + 1,
          ct.path || ARRAY[c."createdAt"::text, c.id]
        FROM "Comment" c
        LEFT JOIN "users" u ON c."userId" = u.id
        INNER JOIN comment_tree ct ON ct.id = c."parentId"
        WHERE c."requestId" = ${requestId}
      )
      SELECT 
        r.id,
        r.title,
        r.amount,
        r."textContent",
        r."imageString",
        r."createdAt",
        r.deadline,
        r."updatedAt",
        r."pointsUsed",
        r.status,
        r."userId",
        r."communityName",
        c.description as "communityDescription",
        c."createdAt" as "communityCreatedAt",
        c."creatorId" as "communityCreatorId",
        u."userName",
        u.level as "userLevel",
        u."imageUrl" as "userImageUrl",
        u.email as "userEmail",
        u."firstName" as "userFirstName",
        u."lastName" as "userLastName",
        COALESCE(SUM(d.amount), 0) as funded,
        COUNT(DISTINCT d.id) as contributors,
        COALESCE(
          jsonb_agg(
            DISTINCT jsonb_build_object(
              'id', ct.id,
              'text', ct.text,
              'createdAt', ct."createdAt",
              'userId', ct."userId",
              'requestId', ct."requestId",
              'userName', ct."userName",
              'userImageUrl', ct."userImageUrl",
              'userEmail', ct."userEmail",
              'parentId', ct."parentId",
              'path', ct.path,
              'reactionCount', (
                SELECT COUNT(*)::text
                FROM "CommentReaction" cr
                WHERE cr."commentId" = ct.id
                AND cr."isLike" = true
              )
            )
          ) FILTER (WHERE ct.id IS NOT NULL),
          '[]'::jsonb
        ) as comments,
        COALESCE(
          jsonb_agg(
            DISTINCT jsonb_build_object(
              'voteType', v."voteType"
            )
          ) FILTER (WHERE v.id IS NOT NULL),
          '[]'::jsonb
        ) as votes,
        COALESCE(
          jsonb_agg(
            DISTINCT jsonb_build_object(
              'id', d.id,
              'amount', d.amount,
              'createdAt', d."createdAt",
              'status', d.status,
              'userId', d."userId"
            )
          ) FILTER (WHERE d.id IS NOT NULL),
          '[]'::jsonb
        ) as donations
      FROM "Request" r
      LEFT JOIN "users" u ON r."userId" = u.id
      LEFT JOIN "Community" c ON r."communityName" = c.name
      LEFT JOIN "Donation" d ON r.id = d."requestId"
      LEFT JOIN "votes" v ON r.id = v."requestId"
      LEFT JOIN comment_tree ct ON true
      WHERE r.id = ${requestId}
      GROUP BY 
        r.id,
        r.title,
        r.amount,
        r."textContent",
        r."imageString",
        r."createdAt",
        r.deadline,
        r."updatedAt",
        r."pointsUsed",
        r.status,
        r."userId",
        r."communityName",
        c.name,
        c.description,
        c."createdAt",
        c."creatorId",
        u."userName",
        u.level,
        u."imageUrl",
        u.email,
        u."firstName",
        u."lastName"
    `;

    if (!data?.[0]) return null;

    const request = data[0];
    const comments = request.comments;

    // Sort comments by path to maintain the correct order
    comments.sort((a, b) => {
      for (let i = 0; i < Math.min(a.path.length, b.path.length); i++) {
        if (a.path[i] < b.path[i]) return -1;
        if (a.path[i] > b.path[i]) return 1;
      }
      return a.path.length - b.path.length;
    });

    // Build comment tree
    const commentMap = new Map<string, CommentWithUser>();
    const rootComments: CommentWithUser[] = [];

    // First pass: Create all comment objects and store in map
    comments.forEach((comment: any) => {
      commentMap.set(comment.id, {
        ...comment,
        User: {
          userName: comment.userName,
          imageUrl: comment.userImageUrl,
          email: comment.userEmail
        },
        userName: comment.userName,
        email: comment.userEmail,
        imageUrl: comment.userImageUrl,
        replies: [],
        _count: {
          reactions: parseInt(comment.reactionCount)
        },
        reactions: parseInt(comment.reactionCount)
      });
    });

    // Second pass: Build the tree structure
    comments.forEach((comment: any) => {
      const commentWithReplies = commentMap.get(comment.id);
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.replies.push(commentWithReplies!);
        }
      } else {
        rootComments.push(commentWithReplies!);
      }
    });

    return {
      id: request.id,
      title: request.title,
      amount: request.amount,
      textContent: request.textContent,
      imageString: request.imageString,
      createdAt: request.createdAt,
      deadline: request.deadline,
      updatedAt: request.updatedAt,
      pointsUsed: request.pointsUsed,
      status: request.status,
      userId: request.userId,
      communityName: request.communityName,
      funded: request.funded,
      contributors: request.contributors,
      User: {
        id: request.userId,
        userName: request.userName,
        level: request.userLevel,
        points: [], // We'll need to fetch this separately if needed
        email: request.userEmail,
        firstName: request.userFirstName,
        lastName: request.userLastName,
        requests: [], // We'll need to fetch this separately if needed
      },
      Community: request.communityName ? {
        name: request.communityName,
        description: request.communityDescription,
        createdAt: request.communityCreatedAt!,
        creatorId: request.communityCreatorId,
      } : null,
      Comment: rootComments,
      Vote: request.votes,
      donations: request.donations
    };
  } catch (error) {
    console.error('[REQUEST_GET]', error);
    return null;
  }
}
