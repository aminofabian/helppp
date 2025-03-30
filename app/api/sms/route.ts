import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

// Existing SMS sending function
async function sendSMS(apiKey: string, partnerId: string, senderId: string, message: string, mobile: string) {
  const requestBody = {
    apikey: apiKey,
    partnerID: partnerId,
    message,
    shortcode: senderId,
    mobile: mobile.replace(/[^0-9]/g, '') // Clean the mobile number to only contain digits
  };

  console.log('SMS Request Body:', {
    ...requestBody,
    apikey: '[REDACTED]' // Don't log the API key
  });

  const response = await fetch('https://sms.textsms.co.ke/api/services/sendsms/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  console.log('SMS Response Status:', response.status);
  const data = await response.json();
  
  // Log response without sensitive data
  console.log('SMS Response Body:', {
    ...data,
    apikey: data.apikey ? '[REDACTED]' : undefined
  });

  if (!response.ok) {
    throw new Error(data.error || 'Failed to send SMS');
  }

  return data;
}

// New email sending function using a single Gmail account as mediator
async function sendEmail(
  toEmail: string, 
  subject: string, 
  htmlContent: string, 
  textContent: string,
  replyToEmail: string = 'support@fitrii.com',
  fromName: string = 'Fitrii Support'
) {
  // Get mediator Gmail credentials from environment variables
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD; // App password is more secure for Gmail

  if (!gmailUser || !gmailPass) {
    console.error('Missing Gmail configuration:', {
      hasGmailUser: !!gmailUser,
      hasGmailPass: !!gmailPass,
    });
    throw new Error('Gmail mediator is not properly configured');
  }

  // Create a transporter using Gmail
  const transporter = nodemailer.createTransport({
    service: 'gmail', 
    host: 'smtp.gmail.com',
    secure: false,
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
  });

  // Setup email data with "reply-to" field to direct responses appropriately
  const mailOptions = {
    from: `"${fromName}" <${gmailUser}>`, // Always sent from your Gmail
    to: toEmail,
    replyTo: replyToEmail, // Where replies should go
    subject: subject,
    text: textContent,
    html: htmlContent,
  };

  console.log('Email Request:', {
    from: `"${fromName}" <${gmailUser}>`,
    to: toEmail,
    replyTo: replyToEmail,
    subject: subject,
  });

  // Send the email
  const info = await transporter.sendMail(mailOptions);
  
  console.log('Email Response:', {
    messageId: info.messageId,
    response: info.response,
  });

  return info;
}

export async function POST(req: Request) {
  try {
    // Get authenticated user from Kinde session
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    // Check if user is authenticated
    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const { 
      amount = null,
      mobile,
      isSuccessful = false,
      mpesaNumber = null
    } = await req.json();

    // Use user's information from Kinde
    const userEmail = user.email;
    const userName = user.given_name || user.family_name 
      ? `${user.given_name || ''} ${user.family_name || ''}`.trim() 
      : user.email?.split('@')[0] || 'User';

    // Debug: Log all environment variables (redacted)
    console.log('Environment Variables Status:', {
      SMS_API_KEY: process.env.SMS_API_KEY ? 'Set' : 'Not Set',
      SMS_PARTNER_ID: process.env.SMS_PARTNER_ID ? 'Set' : 'Not Set',
      SMS_SENDER_ID: process.env.SMS_SENDER_ID ? 'Set' : 'Not Set',
      ADMIN_PHONE_NUMBER: process.env.ADMIN_PHONE_NUMBER || '254722522163 (default)',
      GMAIL_USER: process.env.GMAIL_USER ? 'Set' : 'Not Set',
      GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD ? 'Set' : 'Not Set',
    });

    console.log('User Info:', {
      id: user.id,
      email: userEmail,
      name: userName,
    });

    // Validate environment variables for SMS
    const apiKey = process.env.SMS_API_KEY;
    const partnerId = process.env.SMS_PARTNER_ID;
    const senderId = process.env.SMS_SENDER_ID;
    const adminPhone = process.env.ADMIN_PHONE_NUMBER || '254722522163';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@fitrii.com';

    // Check if SMS config is available
    const smsConfigured = !!(apiKey && partnerId && senderId);
    if (!smsConfigured) {
      console.error('Missing SMS configuration:', {
        hasApiKey: !!apiKey,
        hasPartnerId: !!partnerId,
        hasSenderId: !!senderId,
        envKeys: Object.keys(process.env).filter(key => key.includes('SMS')),
      });
    }

    // Check if email config is available
    const emailConfigured = !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
    if (!emailConfigured) {
      console.error('Missing Gmail configuration');
    }

    // If neither SMS nor email is configured, return error
    if (!smsConfigured && !emailConfigured) {
      return NextResponse.json(
        { error: 'Neither SMS nor Gmail service is properly configured' },
        { status: 500 }
      );
    }

    // Validate input
    if (!amount || !mobile) {
      return NextResponse.json(
        { error: 'Amount and mobile number are required' },
        { status: 400 }
      );
    }

    const formattedAmount = `KES ${Number(amount).toLocaleString()}`;
    
    // Prepare messages for both admin and user
    const adminSmsMessage = `Withdrawal Request:\n${userName} has initiated a withdrawal of ${formattedAmount}${mpesaNumber ? ` to M-Pesa number ${mpesaNumber}` : ''}\nStatus: ${isSuccessful ? 'Successful' : 'Pending'}`;
    
    let userSmsMessage;
    if (isSuccessful) {
      userSmsMessage = `Your withdrawal of ${formattedAmount} has been processed successfully. The funds will be sent to your M-Pesa shortly.\n\nNeed help?\n📧 Email: support@fitrii.com\n📞 Phone: +254722522163 (Call/Text/WhatsApp)`;
    } else {
      userSmsMessage = `Your withdrawal request of ${formattedAmount} has been received and is being processed. You'll receive a confirmation once completed.\n\nNeed help?\n📧 Email: support@fitrii.com\n📞 Phone: +254722522163 (Call/Text/WhatsApp)`;
    }

    // Prepare email content (HTML format for better presentation)
    const adminEmailSubject = `Withdrawal Request from ${userName}`;
    const adminEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2 style="color: #333;">Withdrawal Request</h2>
        <p><strong>${userName}</strong> has initiated a withdrawal of <strong>${formattedAmount}</strong>${mpesaNumber ? ` to M-Pesa number <strong>${mpesaNumber}</strong>` : ''}.</p>
        <p><strong>Status:</strong> <span style="color: ${isSuccessful ? 'green' : 'orange'};">${isSuccessful ? 'Successful' : 'Pending'}</span></p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #777; font-size: 14px;">This is an automated notification from the Fitrii system.</p>
      </div>
    `;
    const adminEmailText = `Withdrawal Request:
${userName} has initiated a withdrawal of ${formattedAmount}${mpesaNumber ? ` to M-Pesa number ${mpesaNumber}` : ''}
Status: ${isSuccessful ? 'Successful' : 'Pending'}

This is an automated notification from the Fitrii system.`;

    const userEmailSubject = isSuccessful ? 
      "Your Withdrawal Has Been Processed Successfully" : 
      "Your Withdrawal Request Has Been Received";
    
    const userEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2 style="color: #333;">${isSuccessful ? 'Withdrawal Successful' : 'Withdrawal Request Received'}</h2>
        <p>Hello ${userName},</p>
        <p>${isSuccessful ? 
          `Your withdrawal of <strong>${formattedAmount}</strong> has been processed successfully. The funds will be sent to your M-Pesa shortly.` : 
          `Your withdrawal request of <strong>${formattedAmount}</strong> has been received and is being processed. You'll receive a confirmation once completed.`
        }</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px;">
          <h3 style="margin-top: 0; color: #555;">Need Help?</h3>
          <p>
            <strong>📧 Email:</strong> <a href="mailto:support@fitrii.com">support@fitrii.com</a><br>
            <strong>📞 Phone:</strong> +254722522163 (Call/Text/WhatsApp)
          </p>
        </div>
        <p style="color: #777; font-size: 12px; margin-top: 20px;">This is an automated email from Fitrii. Please do not reply to this email.</p>
      </div>
    `;
    
    const userEmailText = `${isSuccessful ? 'Withdrawal Successful' : 'Withdrawal Request Received'}

Hello ${userName},

${isSuccessful ? 
  `Your withdrawal of ${formattedAmount} has been processed successfully. The funds will be sent to your M-Pesa shortly.` : 
  `Your withdrawal request of ${formattedAmount} has been received and is being processed. You'll receive a confirmation once completed.`
}

Need Help?
📧 Email: support@fitrii.com
📞 Phone: +254722522163 (Call/Text/WhatsApp)

This is an automated email from Fitrii. Please do not reply to this email.`;

    const results: any = {
      sms: { admin: null, user: null },
      email: { admin: null, user: null }
    };

    // Send SMS if configured
    if (smsConfigured) {
      try {
        // Send SMS to admin
        results.sms.admin = await sendSMS(apiKey!, partnerId!, senderId!, adminSmsMessage, adminPhone);

        // Send SMS to user
        results.sms.user = await sendSMS(apiKey!, partnerId!, senderId!, userSmsMessage, mobile);
      } catch (error: any) {
        console.error('SMS sending error:', error.message);
        results.sms.error = error.message;
      }
    }

    // Send Email if configured and user has an email address
    if (emailConfigured) {
      try {
        // Send email to admin
        results.email.admin = await sendEmail(
          adminEmail, 
          adminEmailSubject, 
          adminEmailHtml, 
          adminEmailText,
          adminEmail, // Reply-to goes back to admin
          'Fitrii System' // From name for admin notifications
        );

        // Send email to user if they have an email in their Kinde profile
        if (userEmail) {
          results.email.user = await sendEmail(
            userEmail, 
            userEmailSubject, 
            userEmailHtml, 
            userEmailText,
            'support@fitrii.com', // Reply-to support for user questions
            'Fitrii Support' // From name for customer-facing emails
          );
        } else {
          results.email.user = { skipped: 'User email not available in Kinde profile' };
        }
      } catch (error: any) {
        console.error('Email sending error:', error.message);
        results.email.error = error.message;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Notifications sent successfully',
      data: {
        sms: {
          configured: smsConfigured,
          admin: results.sms.admin ? { ...results.sms.admin, apikey: undefined } : null,
          user: results.sms.user ? { ...results.sms.user, apikey: undefined } : null,
          error: results.sms.error
        },
        email: {
          configured: emailConfigured,
          admin: results.email.admin,
          user: results.email.user,
          error: results.email.error
        }
      }
    });
  } catch (error: any) {
    console.error('Notification sending error:', error);
    console.error('Error message:', error.message);
    return NextResponse.json(
      { error: 'Failed to send notifications', details: error.message },
      { status: 500 }
    );
  }
}




// Function to send SMS
// async function sendSMS(apiKey: string, partnerId: string, senderId: string, message: string, mobile: string) {
//   const requestBody = {
//     apikey: apiKey,
//     partnerID: partnerId,
//     message,
//     shortcode: senderId,
//     mobile: mobile.replace(/[^0-9]/g, '') // Ensure only digits
//   };

//   console.log('SMS Request Body:', { ...requestBody, apikey: '[REDACTED]' });

//   const response = await fetch('https://sms.textsms.co.ke/api/services/sendsms/', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(requestBody),
//   });

//   console.log('SMS Response Status:', response.status);
//   const data = await response.json();
  
//   if (!response.ok) throw new Error(data.error || 'Failed to send SMS');

//   return data;
// }

// // Function to send Email
// async function sendEmail(to: string, subject: string, text: string) {
//   const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//       user: process.env.EMAIL_USER as string,
//       pass: process.env.EMAIL_PASS as string,
//     },
//   });

//   const mailOptions = {
//     from: process.env.EMAIL_USER as string,
//     to,
//     subject,
//     text,
//   };

//   await transporter.sendMail(mailOptions);
// }

// // API Route Handler
// export async function POST(req: Request) {
//   try {
//     const { 
//       amount, 
//       mobile, 
//       userName = 'User', 
//       isSuccessful = false, 
//       mpesaNumber, 
//       userEmail 
//     } = await req.json();

//     // Validate required environment variables
//     const apiKey = process.env.SMS_API_KEY;
//     const partnerId = process.env.SMS_PARTNER_ID;
//     const senderId = process.env.SMS_SENDER_ID;
//     const adminPhone = process.env.ADMIN_PHONE_NUMBER || '254722522163';
//     const adminEmail = process.env.ADMIN_EMAIL || 'admin@fitrii.com';

//     if (!apiKey || !partnerId || !senderId) {
//       return NextResponse.json({ error: 'SMS service is not properly configured' }, { status: 500 });
//     }

//     if (!amount || !mobile || !userEmail) {
//       return NextResponse.json({ error: 'Amount, mobile number, and email are required' }, { status: 400 });
//     }

//     const formattedAmount = `KES ${Number(amount).toLocaleString()}`;

//     // Construct messages for admin and user
//     const adminMessage = `Withdrawal Request:\n${userName} has initiated a withdrawal of ${formattedAmount}${mpesaNumber ? ` to M-Pesa number ${mpesaNumber}` : ''}\nStatus: ${isSuccessful ? 'Successful' : 'Pending'}`;
//     const adminSubject = `Admin Alert: Withdrawal by ${userName}`;

//     const userMessage = isSuccessful
//       ? `Your withdrawal of ${formattedAmount} has been processed successfully. The funds will be sent to your M-Pesa shortly.\n\nNeed help?\n📧 Email: support@fitrii.com\n📞 Phone: +254722522163`
//       : `Your withdrawal request of ${formattedAmount} has been received and is being processed. You'll receive a confirmation once completed.\n\nNeed help?\n📧 Email: support@fitrii.com\n📞 Phone: +254722522163`;

//     const userSubject = `Withdrawal Confirmation: ${formattedAmount}`;

//     // Send SMS & Email in parallel
//     const smsAdmin = sendSMS(apiKey, partnerId, senderId, adminMessage, adminPhone);
//     const smsUser = sendSMS(apiKey, partnerId, senderId, userMessage, mobile);
//     const emailAdmin = sendEmail(adminEmail, adminSubject, adminMessage);
//     const emailUser = sendEmail(userEmail, userSubject, userMessage);

//     await Promise.all([smsAdmin, smsUser, emailAdmin, emailUser]);

//     return NextResponse.json({ success: true, message: 'SMS & Email notifications sent successfully' });

//   } catch (error: any) {
//     console.error('Notification error:', error);
//     return NextResponse.json({ error: 'Failed to send notifications', details: error.message }, { status: 500 });
//   }
// }


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
