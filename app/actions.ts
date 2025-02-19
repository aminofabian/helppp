'use server';

import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextResponse } from 'next/server';
import { redirect } from "next/navigation";
import prisma from "./lib/db";
import { Prisma, TypeOfVote, NotificationType, PaymentMethod, PaymentStatus } from "@prisma/client";
import { JSONContent } from "@tiptap/react";
import { revalidatePath } from "next/cache";
import { mpesa } from './mpesaone/mpesa';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { calculateLevel } from "@/app/lib/levelCalculator";
import axios from 'axios';

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
        pointsUsed: pointsUsed,
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

    if (request.userId !== user.id) {
      await createNotification(
        'LIKE',
        request.userId,
        user.id,
        requestId
      );
    }

    revalidatePath('/request/[id]');
  } catch (error) {
    console.error("Error in handleVote:", error);
    throw error;
  }
}

export async function createComment(data: { comment: string; requestId: string }) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user) {
    throw new Error('Authentication required');
  }

  if (!data.comment || !data.requestId) {
    throw new Error('Comment and request ID are required');
  }

  try {
    const comment = await prisma.comment.create({
      data: {
        text: data.comment,
        userId: user.id,
        requestId: data.requestId,
      }
    });

    revalidatePath(`/request/${data.requestId}`);
    return comment;
  } catch (error) {
    console.error('Error creating comment:', error);
    throw new Error('Failed to create comment');
  }
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
  console.log(amount, requestId, 'iddddeee..ejrkeh')

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
    let title = '';
    let content = '';

    switch (type) {
      case NotificationType.PAYMENT_RECEIVED:
        title = 'Payment Received';
        content = 'You have received a new payment on your request.';
        break;
      case NotificationType.PAYMENT_COMPLETED:
        title = 'Payment Completed';
        content = 'Your payment has been completed successfully.';
        break;
      case NotificationType.PAYMENT_SENT:
        title = 'Payment Sent';
        content = 'Your payment has been sent successfully.';
        break;
      case NotificationType.DONATION:
        title = 'New Donation';
        content = 'Someone has made a donation to your request.';
        break;
      case NotificationType.COMMENT:
        title = 'New Comment';
        content = 'Someone has commented on your request.';
        break;
      case NotificationType.LIKE:
        title = 'New Like';
        content = 'Someone has liked your request.';
        break;
      case NotificationType.NEWREQUEST:
        title = 'New Request';
        content = 'A new request has been created.';
        break;
      case NotificationType.JOIN:
        title = 'New Member';
        content = 'Someone has joined your community.';
        break;
      case NotificationType.FOLLOW:
        title = 'New Follower';
        content = 'Someone has started following you.';
        break;
      default:
        title = 'New Notification';
        content = 'You have a new notification.';
    }

    await prisma.notification.create({
      data: {
        type,
        recipientId,
        issuerId,
        requestId,
        title,
        content,
      },
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
}

export async function handlePayPalPayment(formData: FormData) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user) {
    return redirect('/api/auth/login');
  }

  const amount = Number(formData.get('amount'));
  const requestId = formData.get('requestId') as string;

  try {
    const payment = await prisma.payment.create({
      data: {
        amount,
        paymentMethod: PaymentMethod.PAYPAL,
        status: PaymentStatus.PENDING,
        userId: user.id,
        requestId,
        userts: new Date(),
      },
    });

    return payment;
  } catch (error) {
    console.error("Error in handlePayPalPayment:", error);
    throw error;
  }
}



interface PaymentResponse {
  success: boolean;
  message: string;
  transactionId?: string;
  paymentId?: string;
  status?: string;

}

/**
 * Handles the till payment processing
 * @param formData - Form data containing payment details
 * @returns Payment record with response data
 * @throws Error if validation fails or payment processing fails
 */
export async function handleTillPayment(formData: FormData): Promise<PaymentResponse> {
  // Authentication check
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user) {
    return redirect('/api/auth/login');
  }

  // Data extraction and validation
  const amount = Number(formData.get('amount'));
  const requestId = formData.get('requestId') as string;
  const phoneNumber = formData.get('phoneNumber') as string;

  validatePaymentData(amount, requestId, phoneNumber);

  try {
    // Create payment record
    const payment = await createPaymentRecord(amount, requestId, phoneNumber, user.id);

    // Initiate payment
    const response = await initiatePayment(requestId, amount, phoneNumber);

    return {
      success: true,
      message: 'Payment initiated successfully',
      transactionId: response.data.transactionId,
    //   status: 'PENDING',
    //  paymentId: payment.id
    };
  } catch (error) {
    handlePaymentError(error);
  }
}

/**
 * Validates the payment data
 * @throws Error if validation fails
 */
function validatePaymentData(amount: number, requestId: string, phoneNumber: string): void {
  if (!amount || amount <= 0 || isNaN(amount)) {
    throw new Error('Invalid amount. It must be a positive number.');
  }

  if (!requestId) {
    throw new Error('Request ID is required.');
  }

  if (!phoneNumber || !/^\d{10,13}$/.test(phoneNumber)) {
    throw new Error('Invalid phone number format. Must be 10-13 digits.');
  }
}

/**
 * Creates a payment record in the database
 * @returns The created payment record
 */
async function createPaymentRecord(
  amount: number,
  requestId: string,
  phoneNumber: string,
  userId: string
) {
  return await prisma.payment.create({
    data: {
      amount,
      paymentMethod: PaymentMethod.MPESA,
      status: PaymentStatus.PENDING,
      userId,
      requestId,
      phoneNumber,
      userts: new Date(),
    },
  });
}

/**
 * Initiates the payment with the payment provider
 * @returns The payment provider's response
 * @throws AxiosError if the API call fails
 */

async function initiatePayment(requestId: string, amount: number, phoneNumber: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fitrii.com';

  try {
    const response = await axios.post<PaymentResponse>(
      `${baseUrl}/api/initiate-till-payment`,
      { requestId, amount, phoneNumber },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      }
    );
    console.log(response, 'resposnee.:.')
    return response;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ETIMEDOUT') {
        console.error('Payment request timed out.');
        throw new Error('Payment request timed out. Please try again.');
      }
      if (error.code === 'ECONNREFUSED') {
        console.error('Connection refused.');
        throw new Error('Payment service is unavailable. Please try later.');
      }
    }
    console.error('Payment initiation failed:', error);
    throw new Error(error.message || 'Failed to process payment request.');
  }
}

// async function initiatePayment(requestId: string, amount: number, phoneNumber: string) {
//   const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fitrii.com';

//   try {
//     const response = await axios.post<PaymentResponse>(
//       `${baseUrl}/api/initiate-till-payment`,
//       { requestId, amount, phoneNumber },
//       {
//         headers: { 'Content-Type': 'application/json' },
//         timeout: 3000, // 15-second timeout
//       }
//     );

//     return response;
//   } catch (error) {
//     console.error('Payment initiation failed:', error);
//     throw error;
//   }
// }

/**
 * Handles payment processing errors
 * @throws Error with a user-friendly message
 */
function handlePaymentError(error: unknown): never {
  console.error('Error in handleTillPayment:', error);

  if (axios.isAxiosError(error)) {
    console.error('Axios Error Details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    const errorMessage = error.response?.data?.message || 'Failed to process payment request.';
    throw new Error(errorMessage);
  }

  if (error instanceof Error) {
    throw new Error(error.message);
  }

  throw new Error('Unexpected error while processing the payment.');
}

// export async function handleTillPayment(formData: FormData) {
//   const { getUser } = getKindeServerSession();
//   const user = await getUser();

//   if (!user) {
//     return redirect('/api/auth/login');
//   }

//   // Extract form values safely
//   const amount = Number(formData.get('amount'));
//   const requestId = formData.get('requestId')?.toString().trim();
//   const phoneNumber = formData.get('phoneNumber')?.toString().trim();

//   // Input validation
//   if (isNaN(amount) || amount <= 0) {
//     throw new Error('Invalid amount. It must be a positive number.');
//   }
//   if (!requestId) {
//     throw new Error('Request ID is required.');
//   }
//   if (!phoneNumber || !/^\d{10,13}$/.test(phoneNumber)) {
//     throw new Error('Invalid phone number format. Must be 10-13 digits.');
//   }

//   console.log('🔹 Processing Payment:', { amount, requestId, phoneNumber });

//   try {
//     // Create a payment record
//     const payment = await prisma.payment.create({
//       data: {
//         amount,
//         paymentMethod: PaymentMethod.MPESA,
//         status: PaymentStatus.PENDING,
//         userId: user.id,
//         requestId,
//         phoneNumber,
//         userts: new Date(),
//       },
//     });

//     // Define API base URL
//     const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fitrii.com';

//     console.log('📡 Initiating Till Payment API Call...');

//     // Make API call to initiate payment
//     const response = await axios.post(
//       `${baseUrl}/api/initiate-till-payment`,
//       { requestId, amount, phoneNumber },
//       {
//         headers: { 'Content-Type': 'application/json' },
//         timeout: 15000, // 15-second timeout to prevent request hanging
//       }
//     );

//     console.log('✅ Payment Initiation Successful:', response.data);

//     return { ...payment, ...response.data };
//   } catch (error: any) {
//     console.error('❌ Error in handleTillPayment:', error);

//     if (axios.isAxiosError(error)) {
//       console.error('🛑 Axios Error:', error.response?.data || error.message);
//       throw new Error(error.response?.data?.message || 'Failed to process payment request.');
//     }

//     // Handle specific network errors
//     if (error.code === 'ETIMEDOUT') {
//       throw new Error('Payment request timed out. Please try again.');
//     }
//     if (error.code === 'ECONNREFUSED') {
//       throw new Error('Payment service is unavailable. Please try again later.');
//     }

//     throw new Error('Unexpected error while processing the payment.');
//   }
// }

// export async function handleTillPayment(formData: FormData) {
//   const { getUser } = getKindeServerSession();
//   const user = await getUser();

//   if (!user) {
//     return redirect('/api/auth/login');
//   }

//   // Extract and validate form data
//   const amount = Number(formData.get('amount'));
//   const requestId = formData.get('requestId') as string;
//   const phoneNumber = formData.get('phoneNumber') as string;

//   if (!amount || amount <= 0 || isNaN(amount)) {
//     throw new Error('Invalid amount. It must be a positive number.');
//   }
//   if (!requestId) {
//     throw new Error('Request ID is required.');
//   }
//   if (!phoneNumber || !/^\d{10,13}$/.test(phoneNumber)) {
//     throw new Error('Invalid phone number format.');
//   }

//   console.log('/////////////////////////////////////////////////////////////////:::::::::::::::::::::::::::::::::::::::::::::::',`Processing payment - Amount: ${amount}, Request ID: ${requestId}, Phone: ${phoneNumber}`);

//   try {
//     // Create a payment record in the database
//     const payment = await prisma.payment.create({
//       data: {
//         amount,
//         paymentMethod: PaymentMethod.MPESA,
//         status: PaymentStatus.PENDING,
//         userId: user.id,
//         requestId,
//         phoneNumber,
//         userts: new Date(),
//       },
//     });

//     // Define API base URL
//     const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fitrii.com';

//     // Send payment initiation request
//     const response = await axios.post(
//       `${baseUrl}/api/initiate-till-payment`,
//       { requestId, amount, phoneNumber },
//       {
//         headers: { 'Content-Type': 'application/json' },
//         timeout: 15000, // 15-second timeout to prevent request hanging
//       }
//     );

//     console.log(`Payment initiation response:`, response.data);

//     return { ...payment, ...response.data };
//   } catch (error) {
//     console.error('Error in handleTillPayment:', error);

//     if (axios.isAxiosError(error)) {
//       console.error('Axios Error Response:', error.response?.data);
//       console.error('Axios Error Config:', error.config);
//       throw new Error(error.response?.data?.message || 'Failed to process payment request.');
//     }

//     throw new Error('Unexpected error while processing the payment.');
//   }
// }
// export async function handleTillPayment(formData: FormData) {
//   const { getUser } = getKindeServerSession();
//   const user = await getUser();

//   if (!user) {
//     return redirect('/api/auth/login');
//   }

//   const amount = Number(formData.get('amount'));
//   const requestId = formData.get('requestId') as string;
//   const phoneNumber = formData.get('phoneNumber') as string;
//   console.log(amount, requestId, phoneNumber, 'HEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEY');

//   try {
//     // First create the payment record
//     const payment = await prisma.payment.create({
//       data: {
//         amount,
//         paymentMethod: PaymentMethod.MPESA,
//         status: PaymentStatus.PENDING,
//         userId: user.id,
//         requestId,
//         phoneNumber,
//         userts: new Date(),
//       },
//     });

//     const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fitrii.com';
//     // Then initiate the till payment
//     const response = await axios.post(
//       `${baseUrl}/api/initiate-till-payment`,
//       {
//         requestId,
//         amount,
//         phoneNumber,
//       },
//       {
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       }
//     );
//     console.log()

//     return { ...payment, ...response.data };
//   } catch (error) {
//     console.error("Error in handleTillPayment:", error);
//     if (axios.isAxiosError(error)) {
//       throw new Error(error.response?.data?.message || error.message);
//     }
//     throw error;
//   }
// }
