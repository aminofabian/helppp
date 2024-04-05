'use server';

import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import prisma from "./lib/db";
import { Prisma } from "@prisma/client";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

export async function updateUsername(prevState: any, formData: FormData) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) {
    return redirect('/api/auth/login');
  }
  const username = formData.get('username') as string;
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
          message: 'The usename is already in use. Please choose another username ⚡ ',
          status: 'error'
        }

    }
  }
}