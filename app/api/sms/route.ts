import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Function to send SMS
async function sendSMS(apiKey: string, partnerId: string, senderId: string, message: string, mobile: string) {
  const requestBody = {
    apikey: apiKey,
    partnerID: partnerId,
    message,
    shortcode: senderId,
    mobile: mobile.replace(/[^0-9]/g, '') // Ensure only digits
  };

  console.log('SMS Request Body:', { ...requestBody, apikey: '[REDACTED]' });

  const response = await fetch('https://sms.textsms.co.ke/api/services/sendsms/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  console.log('SMS Response Status:', response.status);
  const data = await response.json();
  
  if (!response.ok) throw new Error(data.error || 'Failed to send SMS');

  return data;
}

// Function to send Email
async function sendEmail(to: string, subject: string, text: string) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER as string,
      pass: process.env.EMAIL_PASS as string,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER as string,
    to,
    subject,
    text,
  };

  await transporter.sendMail(mailOptions);
}

// API Route Handler
export async function POST(req: Request) {
  try {
    const { 
      amount, 
      mobile, 
      userName = 'User', 
      isSuccessful = false, 
      mpesaNumber, 
      userEmail 
    } = await req.json();

    // Validate required environment variables
    const apiKey = process.env.SMS_API_KEY;
    const partnerId = process.env.SMS_PARTNER_ID;
    const senderId = process.env.SMS_SENDER_ID;
    const adminPhone = process.env.ADMIN_PHONE_NUMBER || '254722522163';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@fitrii.com';

    if (!apiKey || !partnerId || !senderId) {
      return NextResponse.json({ error: 'SMS service is not properly configured' }, { status: 500 });
    }

    if (!amount || !mobile || !userEmail) {
      return NextResponse.json({ error: 'Amount, mobile number, and email are required' }, { status: 400 });
    }

    const formattedAmount = `KES ${Number(amount).toLocaleString()}`;

    // Construct messages for admin and user
    const adminMessage = `Withdrawal Request:\n${userName} has initiated a withdrawal of ${formattedAmount}${mpesaNumber ? ` to M-Pesa number ${mpesaNumber}` : ''}\nStatus: ${isSuccessful ? 'Successful' : 'Pending'}`;
    const adminSubject = `Admin Alert: Withdrawal by ${userName}`;

    const userMessage = isSuccessful
      ? `Your withdrawal of ${formattedAmount} has been processed successfully. The funds will be sent to your M-Pesa shortly.\n\nNeed help?\n📧 Email: support@fitrii.com\n📞 Phone: +254722522163`
      : `Your withdrawal request of ${formattedAmount} has been received and is being processed. You'll receive a confirmation once completed.\n\nNeed help?\n📧 Email: support@fitrii.com\n📞 Phone: +254722522163`;

    const userSubject = `Withdrawal Confirmation: ${formattedAmount}`;

    // Send SMS & Email in parallel
    const smsAdmin = sendSMS(apiKey, partnerId, senderId, adminMessage, adminPhone);
    const smsUser = sendSMS(apiKey, partnerId, senderId, userMessage, mobile);
    const emailAdmin = sendEmail(adminEmail, adminSubject, adminMessage);
    const emailUser = sendEmail(userEmail, userSubject, userMessage);

    await Promise.all([smsAdmin, smsUser, emailAdmin, emailUser]);

    return NextResponse.json({ success: true, message: 'SMS & Email notifications sent successfully' });

  } catch (error: any) {
    console.error('Notification error:', error);
    return NextResponse.json({ error: 'Failed to send notifications', details: error.message }, { status: 500 });
  }
}


// async function sendSMS(apiKey: string, partnerId: string, senderId: string, message: string, mobile: string) {
//   const requestBody = {
//     apikey: apiKey,
//     partnerID: partnerId,
//     message,
//     shortcode: senderId,
//     mobile: mobile.replace(/[^0-9]/g, '') // Clean the mobile number to only contain digits
//   };

//   console.log('SMS Request Body:', {
//     ...requestBody,
//     apikey: '[REDACTED]' // Don't log the API key
//   });

//   const response = await fetch('https://sms.textsms.co.ke/api/services/sendsms/', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify(requestBody),
//   });

//   console.log('SMS Response Status:', response.status);
//   const data = await response.json();
  
//   // Log response without sensitive data
//   console.log('SMS Response Body:', {
//     ...data,
//     apikey: data.apikey ? '[REDACTED]' : undefined
//   });

//   if (!response.ok) {
//     throw new Error(data.error || 'Failed to send SMS');
//   }

//   return data;
// }

// export async function POST(req: Request) {
//   try {
//     const { 
//       amount = null,
//       mobile,
//       userName = 'User',
//       isSuccessful = false,
//       mpesaNumber = null
//     } = await req.json();

//     // Debug: Log all environment variables (redacted)
//     console.log('Environment Variables Status:', {
//       SMS_API_KEY: process.env.SMS_API_KEY ? 'Set' : 'Not Set',
//       SMS_PARTNER_ID: process.env.SMS_PARTNER_ID ? 'Set' : 'Not Set',
//       SMS_SENDER_ID: process.env.SMS_SENDER_ID ? 'Set' : 'Not Set',
//       ADMIN_PHONE_NUMBER: process.env.ADMIN_PHONE_NUMBER || '254722522163 (default)'
//     });

//     // Validate environment variables
//     const apiKey = process.env.SMS_API_KEY;
//     const partnerId = process.env.SMS_PARTNER_ID;
//     const senderId = process.env.SMS_SENDER_ID;
//     const adminPhone = process.env.ADMIN_PHONE_NUMBER || '254722522163';

//     if (!apiKey || !partnerId || !senderId) {
//       console.error('Missing SMS configuration:', {
//         hasApiKey: !!apiKey,
//         hasPartnerId: !!partnerId,
//         hasSenderId: !!senderId,
//         envKeys: Object.keys(process.env).filter(key => key.includes('SMS')), // List all SMS-related env vars
//       });
//       return NextResponse.json(
//         { error: 'SMS service is not properly configured', details: {
//           missingVariables: {
//             SMS_API_KEY: !apiKey,
//             SMS_PARTNER_ID: !partnerId,
//             SMS_SENDER_ID: !senderId
//           }
//         }},
//         { status: 500 }
//       );
//     }

//     // Validate input
//     if (!amount || !mobile) {
//       return NextResponse.json(
//         { error: 'Amount and mobile number are required' },
//         { status: 400 }
//       );
//     }

//     const formattedAmount = `KES ${Number(amount).toLocaleString()}`;
    
//     // Prepare messages for both admin and user
//     const adminMessage = `Withdrawal Request:\n${userName} has initiated a withdrawal of ${formattedAmount}${mpesaNumber ? ` to M-Pesa number ${mpesaNumber}` : ''}\nStatus: ${isSuccessful ? 'Successful' : 'Pending'}`;
    
//     let userMessage;
//     if (isSuccessful) {
//       userMessage = `Your withdrawal of ${formattedAmount} has been processed successfully. The funds will be sent to your M-Pesa shortly.\n\nNeed help?\n📧 Email: support@fitrii.com\n📞 Phone: +254722522163 (Call/Text/WhatsApp)`;
//     } else {
//       userMessage = `Your withdrawal request of ${formattedAmount} has been received and is being processed. You'll receive a confirmation once completed.\n\nNeed help?\n📧 Email: support@fitrii.com\n📞 Phone: +254722522163 (Call/Text/WhatsApp)`;
//     }

//     // Send SMS to admin
//     const adminResult = await sendSMS(apiKey, partnerId, senderId, adminMessage, adminPhone);

//     // Send SMS to user
//     const userResult = await sendSMS(apiKey, partnerId, senderId, userMessage, mobile);

//     return NextResponse.json({
//       success: true,
//       message: 'SMS notifications sent successfully',
//       data: {
//         admin: { ...adminResult, apikey: undefined },
//         user: { ...userResult, apikey: undefined }
//       }
//     });
//   } catch (error: any) {
//     console.error('SMS sending error:', error);
//     console.error('SMS sending error message:', error.message);
//     return NextResponse.json(
//       { error: 'Failed to send SMS', details: error.message },
//       { status: 500 }
//     );
//   }
// }




























// import { NextResponse } from 'next/server';

// async function sendSMS(apiKey: string, partnerId: string, senderId: string, message: string, mobile: string) {
//   const requestBody = {
//     apikey: apiKey,
//     partnerID: partnerId,
//     message,
//     shortcode: senderId,
//     mobile: mobile.replace(/[^0-9]/g, '') // Clean the mobile number to only contain digits
//   };

//   console.log('SMS Request Body:', {
//     ...requestBody,
//     apikey: '[REDACTED]' // Don't log the API key
//   });

//   const response = await fetch('https://sms.textsms.co.ke/api/services/sendsms/', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify(requestBody),
//   });

//   console.log('SMS Response Status:', response.status);
//   const data = await response.json();
  
//   // Log response without sensitive data
//   console.log('SMS Response Body:', {
//     ...data,
//     apikey: data.apikey ? '[REDACTED]' : undefined
//   });

//   if (!response.ok) {
//     throw new Error(data.error || 'Failed to send SMS');
//   }

//   return data;
// }

// export async function POST(req: Request) {
//   try {
//     const { 
//       amount = null,
//       mobile,
//       userName = 'User',
//       isSuccessful = false,
//       mpesaNumber = null
//     } = await req.json();

//     // Debug: Log all environment variables (redacted)
//     console.log('Environment Variables Status:', {
//       SMS_API_KEY: process.env.SMS_API_KEY ? 'Set' : 'Not Set',
//       SMS_PARTNER_ID: process.env.SMS_PARTNER_ID ? 'Set' : 'Not Set',
//       SMS_SENDER_ID: process.env.SMS_SENDER_ID ? 'Set' : 'Not Set',
//       ADMIN_PHONE_NUMBER: process.env.ADMIN_PHONE_NUMBER || '254722522163 (default)'
//     });

//     // Validate environment variables
//     const apiKey = process.env.SMS_API_KEY;
//     const partnerId = process.env.SMS_PARTNER_ID;
//     const senderId = process.env.SMS_SENDER_ID;
//     const adminPhone = process.env.ADMIN_PHONE_NUMBER || '254722522163';

//     if (!apiKey || !partnerId || !senderId) {
//       console.error('Missing SMS configuration:', {
//         hasApiKey: !!apiKey,
//         hasPartnerId: !!partnerId,
//         hasSenderId: !!senderId,
//         envKeys: Object.keys(process.env).filter(key => key.includes('SMS')), // List all SMS-related env vars
//       });
//       return NextResponse.json(
//         { error: 'SMS service is not properly configured', details: {
//           missingVariables: {
//             SMS_API_KEY: !apiKey,
//             SMS_PARTNER_ID: !partnerId,
//             SMS_SENDER_ID: !senderId
//           }
//         }},
//         { status: 500 }
//       );
//     }

//     // Validate input
//     if (!amount || !mobile) {
//       return NextResponse.json(
//         { error: 'Amount and mobile number are required' },
//         { status: 400 }
//       );
//     }

//     const formattedAmount = `KES ${Number(amount).toLocaleString()}`;
    
//     // Prepare messages for both admin and user
//     const adminMessage = `Withdrawal Request:\n${userName} has initiated a withdrawal of ${formattedAmount}${mpesaNumber ? ` to M-Pesa number ${mpesaNumber}` : ''}\nStatus: ${isSuccessful ? 'Successful' : 'Pending'}`;
    
//     let userMessage;
//     if (isSuccessful) {
//       userMessage = `Your withdrawal of ${formattedAmount} has been processed successfully. The funds will be sent to your M-Pesa shortly.\n\nNeed help?\n📧 Email: support@fitrii.com\n📞 Phone: +254722522163 (Call/Text/WhatsApp)`;
//     } else {
//       userMessage = `Your withdrawal request of ${formattedAmount} has been received and is being processed. You'll receive a confirmation once completed.\n\nNeed help?\n📧 Email: support@fitrii.com\n📞 Phone: +254722522163 (Call/Text/WhatsApp)`;
//     }

//     // Send SMS to admin
//     const adminResult = await sendSMS(apiKey, partnerId, senderId, adminMessage, adminPhone);

//     // Send SMS to user
//     const userResult = await sendSMS(apiKey, partnerId, senderId, userMessage, mobile);

//     return NextResponse.json({
//       success: true,
//       message: 'SMS notifications sent successfully',
//       data: {
//         admin: { ...adminResult, apikey: undefined },
//         user: { ...userResult, apikey: undefined }
//       }
//     });
//   } catch (error: any) {
//     console.error('SMS sending error:', error);
//     console.error('SMS sending error message:', error.message);
//     return NextResponse.json(
//       { error: 'Failed to send SMS', details: error.message },
//       { status: 500 }
//     );
//   }
// }
