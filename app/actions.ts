'use server';

import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextResponse } from 'next/server';
import { redirect } from "next/navigation";
import prisma from "./lib/db";
import { Prisma, TypeOfVote, NotificationType, PaymentMethod } from "@prisma/client";
import { JSONContent } from "@tiptap/react";
import { revalidatePath } from "next/cache";
import { mpesa } from './mpesaone/mpesa';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { calculateLevel } from "@/app/lib/levelCalculator";







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


export async function createRequest(formData: FormData) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) {
    return redirect('/api/auth/login');
  }

  const title = formData.get('title') as string;
  const imageUrl = formData.get('imageUrl') as string | null;
  const amount = Number(formData.get('amount'));
  const pointsUsed = Number(formData.get('pointsUsed'));
  const deadlineString = formData.get('deadline') as string;
  const jsonContent = JSON.parse(formData.get('jsonContent') as string);

  const deadline = new Date(deadlineString);
  if (isNaN(deadline.getTime())) {
    // Handle invalid date
    return redirect('/invalid-date');
  }

  const isoDateString = deadline.toISOString();
  const communityName = formData.get('communityName') as string;

  const community = await prisma.community.findUnique({
    where: { name: communityName },
  });

  if (!community) {
    return redirect('/community-not-found');
  }

  try {
    const data = await prisma.request.create({
      data: {
        title: title,
        imageString: imageUrl ?? undefined,
        amount: amount,
        pointsUsed: pointsUsed, // Make sure this line is included
        Community: { connect: { id: community.id } },
        User: { connect: { id: user.id } },
        textContent: jsonContent,
        deadline: isoDateString,
      },
    });
    return redirect(`/request/${data.id}`);
  } catch (e) {
    console.error(e);
    throw e;
  }
}

export async function handleVote(formData: FormData) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    if (!user) {
      console.log("User not authenticated");
      return redirect('/api/auth/login');
    }

    const requestId = formData.get('requestId') as string;
    const voteDirection = formData.get('voteDirection') as TypeOfVote;

    console.log(`Vote attempt: requestId=${requestId}, direction=${voteDirection}, userId=${user.id}`);

    const vote = await prisma.vote.findFirst({
      where: {
        requestId: requestId,
        userId: user.id,
      },
    });

    console.log("Existing vote:", vote);

    const request = await prisma.request.findUnique({ where: { id: requestId } });
    console.log("Request:", request);

    if (!request) {
      console.log("Request not found");
      return;
    }

    if (vote) {
      if (vote.voteType === voteDirection) {
        await prisma.vote.delete({
          where: {
            id: vote.id
          },
        });
        console.log("Vote deleted");
      } else {
        await prisma.vote.update({
          where: {
            id: vote.id
          },
          data: {
            voteType: voteDirection,
          }
        });
        console.log("Vote updated");
      }
    } else {
      await prisma.vote.create({
        data: {
          voteType: voteDirection,
          userId: user.id,
          requestId: requestId
        }
      });
      console.log("New vote created");
    }

    // Create or update notification for all vote actions
    if (request.userId !== user.id) {
      await createNotification(
        'LIKE',
        request.userId,
        user.id,
        requestId
      );
      console.log("Notification created/updated");
    } else {
      console.log("Notification not created: user voted on their own request");
    }

    console.log("Revalidating path");
    revalidatePath('/');
  } catch (error) {
    console.error("Error in handleVote:", error);
  }
}

export async function createComment(formData: FormData) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user) {
    return redirect('/api/auth/login')
  }
  const comment = formData.get('comment') as string;
  const requestId = formData.get('requestId') as string;

  const data = await prisma.comment.create({
    data: {
      text: comment,
      userId: user.id,
      requestId: requestId,
    }

  })
  revalidatePath(`/request/${requestId}`)
}

export async function handleMpesa(formData: FormData) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user) {
    return redirect('/api/auth/login');
  }

  const amount = Number(formData.get('amount'));
  const phoneNumber = formData.get('phoneNumber') as string;
  const requestId = formData.get('requestId') as string;
  const invoice: string = crypto.createHash('sha256').update(`fitri${Date.now()}${Math.floor(Math.random() * 1000000)}${uuidv4()}`).digest('hex').substring(0, 10).toUpperCase();

  try {
    // Call the M-Pesa API to initiate the payment
    const response = await mpesa(phoneNumber, amount, invoice);

    // Handle the response from M-Pesa
    if (response.ResponseCode === "0") {
      // Payment was initiated successfully
      await prisma.donation.create({
        data: {
          amount: amount,
          userId: user.id,
          phoneNumber: phoneNumber,
          requestId: requestId,
          invoice: invoice,
          status: 'Pending', 
        },
      });
      console.log(response, 'this is the rspone')
      console.log(response.CheckoutRequestID, 'eeh vile umezoea')
      return { success: true, message: 'Payment initiated successfully', response };
    } else {
      // Payment initiation failed
      console.error('M-Pesa payment failed:', response.ResponseDescription);
      return { success: false, message: response.ResponseDescription };
    }
  } catch (error) {
    // Handle any errors that occur during the payment process
    console.error('Error processing M-Pesa payment:', error);
    return { success: false, message: 'An error occurred while processing the payment' };
  }
}

async function createNotification(type: NotificationType, recipientId: string, issuerId: string, requestId?: string) {
  try {
    console.log("Creating notification:", { type, recipientId, issuerId, requestId });
    const notification = await prisma.notification.create({
      data: {
        type,
        title: '',
        content: '',
        recipientId,
        issuerId,
        requestId,
      },
    });
    console.log("Notification created:", notification);
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}




export async function handlePayPalPayment(formData: FormData) {
  const USD_TO_KES = 129.00; // Temporary conversion rate
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user) {
    return redirect('/api/auth/login');
  }

  const paymentId = formData.get('id') as string;
  const amount = parseFloat(formData.get('amount') as string);
  const createTime = formData.get('create_time') as string;
  const payerEmail = formData.get('payer_email') as string;
  const payerName = formData.get('payer_name') as string;
  const requestId = formData.get('requestId') as string;
  const currency = 'USD'; // Currently hardcoded
  const amountKES = currency === "USD" ? amount * USD_TO_KES : amount; // Convert to KES
  const invoiceId = `PAYPAL_${paymentId}`;

  try {
    const userEmail = user.email;
    if (!userEmail) {
      return { success: false, message: "User email not found" };
    }

    const giver = await prisma.user.findUnique({ where: { email: userEmail.toLowerCase() } });
    if (!giver) {
      return { success: false, message: "User not found" };
    }

    const request = await prisma.request.findUnique({ where: { id: requestId }, include: { User: true } });
    if (!request) {
      return { success: false, message: "Request not found" };
    }

    const receiver = await prisma.user.findUnique({ where: { id: request.userId } });
    if (!receiver) {
      return { success: false, message: "Receiver not found" };
    }

    const payment = await prisma.payment.create({
      data: {
        id: paymentId,
        userId: giver.id,
        amount: amountKES,
        requestId: requestId,
        status: "COMPLETED",
        paymentMethod: PaymentMethod.PAYPAL,
        createdAt: new Date(createTime),
        updatedAt: new Date(),
        currency: "KES",
        mpesaReceiptNumber: invoiceId,
        userts: new Date(),
      },
    });

    const pointsEarned = Math.floor(amountKES / 50);
    await prisma.points.create({ data: { userId: giver.id, amount: pointsEarned, paymentId: payment.id } });

    const totalPoints = await prisma.points.aggregate({ where: { userId: giver.id }, _sum: { amount: true } });
    const newLevel = calculateLevel(totalPoints._sum.amount || 0);
    await prisma.user.update({ where: { id: giver.id }, data: { level: newLevel } });

    const updatedRequest = await prisma.request.update({
      where: { id: requestId },
      data: { amount: { increment: amountKES } },
    });

    if (updatedRequest.amount >= updatedRequest.pointsUsed) {
      await prisma.request.update({ where: { id: requestId }, data: { status: "FUNDED" } });
    }

    await prisma.transaction.create({ data: { giverId: giver.id, receiverId: receiver.id, amount: amountKES } });

    let receiverWallet = await prisma.wallet.findUnique({ where: { userId: receiver.id } });
    if (!receiverWallet) {
      receiverWallet = await prisma.wallet.create({ data: { userId: receiver.id, balance: amountKES } });
    } else {
      await prisma.wallet.update({
        where: { userId: receiver.id },
        data: { balance: { increment: amountKES } },
      });
    }
    console.log({ success: true, message: 'Payment processed successfully', payment })

    return { success: true, message: 'Payment processed successfully', payment };
  } catch (error) {
    console.error('Error processing PayPal payment:', error);
    return { success: false, message: 'An error occurred while processing the PayPal payment' };
  }
}













export async function handleTillPayment(formData: FormData) {
  try {
    const amount = formData.get('amount');
    const requestId = formData.get('requestId');
    const phoneNumber = formData.get('phoneNumber');

    if (!amount || !requestId || !phoneNumber) {
      return { success: false, message: 'Missing required fields' };
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fitrii.com';
    const response = await fetch(`${baseUrl}/api/initiate-till-payment`, {
      method: 'POST',
      body: JSON.stringify({
        amount: parseFloat(amount.toString()),
        requestId,
        phoneNumber: phoneNumber.toString(),
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in handleTillPayment:', error);
    return {
      success: false,
      message: 'Failed to process Till payment',
    };
  }
}
