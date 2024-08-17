import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

export async function POST(req: Request) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { requestId, voteDirection } = await req.json();

  try {
    const vote = await prisma.vote.findFirst({
      where: {
        requestId: requestId,
        userId: user.id,
      },
    });

    if (vote) {
      if (vote.voteType === voteDirection) {
        await prisma.vote.delete({
          where: { id: vote.id },
        });
      } else {
        await prisma.vote.update({
          where: { id: vote.id },
          data: { voteType: voteDirection },
        });
      }
    } else {
      await prisma.vote.create({
        data: {
          voteType: voteDirection,
          userId: user.id,
          requestId: requestId
        }
      });
    }

    const updatedRequest = await prisma.request.findUnique({
      where: { id: requestId },
      include: { Vote: true },
    });

    const voteCount1 = updatedRequest?.Vote.filter(v => v.voteType === 'LOVE').length;
    const voteCount2 = updatedRequest?.Vote.filter(v => v.voteType === 'SUSPISION').length;

    return NextResponse.json({ voteCount1, voteCount2 });
  } catch (error) {
    console.error('Error handling vote:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}