'use server';

import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import prisma from "./lib/db";
import { Prisma, TypeOfVote } from "@prisma/client";
import { JSONContent } from "@tiptap/react";
import { revalidatePath } from "next/cache";

export async function updateUsername(prevState: any, formData: FormData) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) {
    return redirect('/api/auth/login');
  }
  const username = (formData.get('username') || '').toString().toLowerCase().replace(/\s+/g, '_');
  try {
    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        userName: username,
      },


    });
    return {
      message: 'Your username has been successfully updated',
      status: 'green'

    }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002')
        return {
          message: 'The usename is already in use. Please choose another username ! ',
          status: 'error'
        }
    }
    throw e;
  }
}

export async function createCommunity(prevState: any, formData: FormData) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user) {
    return redirect('/api/auth/login');
  }

  try {
    const name = (formData.get('name') || '').toString().toLowerCase().replace(/\s+/g, '_');
    const data = await prisma.community.create({
      data: {
        name: name,
        userId: user.id,

      }
    });

    return redirect('/c/' + data.name);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') {
        return {
          message: 'Oops!!!! A Community with that name already exists. Please choose another name!',
          status: 'error'
        }

      }

    }

    throw e;
  }
}

export async function updateCommunityDescription(prevState: any, formData: FormData) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) {
    return redirect('/api/auth/login');
  }

  try {
    const communityName = formData.get('communityName') as string;
    const description = formData.get('description') as string;
    await prisma.community.update({
      where: {
        name: communityName,
      },
      data: {
        description: description,
      }
    })

    return {
      message: 'Your description has been successfully updated ✓✓✓✓✓',
      status: 'green'
    }


  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e) {
        return {
          message: 'Oops!!!! Something is Definetely Not Right... Drop Us a Message and We Would Look at It Asap ⚡⚡⚡⚡⚡⚡',
          status: 'error',
        }
      }
    }



  }

}


export async function createRequest({ jsonContent }: { jsonContent: JSONContent | null }, formData: FormData) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) {
    return redirect('/api/auth/login');
  }

  const title = formData.get('title') as string;
  const imageUrl = formData.get('imageUrl') as string | null;
  const amount = Number(formData.get('amount'));
  const pointsUsed = Number(amount) / 40;
  const deadlineString = formData.get('deadline') as string;
  const deadline = new Date(deadlineString);
  if (!isNaN(deadline.getTime())) {
    const isoDateString = deadline.toISOString();


    const community = await prisma.community.findUnique({
      where: {
        name: formData.get('communityName') as string,
      },
    });

    if (!community) {
      return redirect('/community-not-found');
    }

    try {
      await prisma.request.create({
        data: {
          title: title,
          imageString: imageUrl ?? undefined,
          amount: amount,
          pointsUsed: pointsUsed,
          Community: { connect: { id: community.id } },
          User: { connect: { id: user.id } },
          textContent: jsonContent ?? undefined,
          deadline: isoDateString,
        },
      });
      return redirect('/')
    } catch (e) {
      throw e;
    }
  }
}

export async function handleVote(formData: FormData) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) {
    return redirect('/api/auth/login');
  }

  const requestId = formData.get('requestId') as string;
  const voteDirection = formData.get('voteDirection') as TypeOfVote;

  const vote = await prisma.vote.findFirst({
    where: {
      requestId: requestId,
      userId: user.id,
    },
  });

  if (vote) {
    if (vote.voteType === voteDirection) {
      await prisma.vote.delete({
        where: {
          id: vote.id
        },
      });
      return revalidatePath('/');
    } else {
      await prisma.vote.update({
        where: {
          id: vote.id
        },
        data: {
          voteType: voteDirection,
        }
      });
      return revalidatePath('/');
    }
  } else {
    await prisma.vote.create({
      data: {
        voteType: voteDirection,
        userId: user.id,
        requestId: requestId
      }
    });
    return revalidatePath('/');
  }
}

