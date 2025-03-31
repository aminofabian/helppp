import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';


/**
 * Sends an SMS message through the textsms.co.ke API
 * @param {string} apiKey - The API key for authentication
 * @param {string} partnerId - The partner ID for the SMS service
 * @param {string} senderId - The sender ID (shortcode)
 * @param {string} message - The message content to send
 * @param {string} mobile - The recipient's mobile number
 * @returns {Promise<object>} The API response data
 */
async function sendSMS(apiKey: string, partnerId: string, senderId: string, message: string, mobile: string): Promise<any> {
  // Format mobile number to contain only digits
  const formattedMobile = mobile.replace(/[^0-9]/g, '');
  
  const requestBody = {
    apikey: apiKey,
    partnerID: partnerId,
    message,
    shortcode: senderId,
    mobile: formattedMobile
  };

  // Log request without sensitive data
  console.log('SMS Request:', {
    ...requestBody,
    apikey: '[REDACTED]',
    mobile: `${formattedMobile.substring(0, 4)}xxxx${formattedMobile.substring(formattedMobile.length - 2)}`
  });

  try {
    const response = await fetch('https://sms.textsms.co.ke/api/services/sendsms/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('SMS Response Status:', response.status);
    
    // Check for non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text();
      console.error('Received non-JSON response:', textResponse);
      throw new Error('Invalid response format from SMS provider');
    }
    
    const data = await response.json();
    
    // Log response without sensitive data
    console.log('SMS Response:', {
      ...data,
      apikey: data.apikey ? '[REDACTED]' : undefined
    });

    if (!response.ok) {
      throw new Error(data.error || `SMS API error: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('SMS Request Failed:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

/**
 * Sends an email notification
 * @param {string} recipient - Email recipient
 * @param {string} subject - Email subject
 * @param {string} content - HTML content of the email
 * @returns {Promise<void>}
 */
async function sendEmail(recipient: string, subject: string, content: string): Promise<void> {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPassword = process.env.GMAIL_APP_PASSWORD;

  
  if (!gmailUser || !gmailPassword) {
    throw new Error('Email service is not properly configured');
  }
 

  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: gmailUser,
      pass: gmailPassword,
    },
  });

  await transporter.sendMail({
    from: gmailUser, 
    to: recipient, 
    subject,
    html: content,
  });
  
  console.log('Email sent successfully to:', recipient);
}

/**
 * API route handler for withdrawal notifications
 */
export async function POST(req: Request) {
  const SUPPORT_EMAIL = 'support@fitrii.com';
  const SUPPORT_PHONE = '+254722522163';

  
  try {
    // Parse request body
    const { 
      amount = null,
      mobile,
      userName = 'User',
      isSuccessful = false,
      mpesaNumber = null
    } = await req.json();

    // Validate required environment variables
    const apiKey = process.env.SMS_API_KEY;
    const partnerId = process.env.SMS_PARTNER_ID;
    const senderId = process.env.SMS_SENDER_ID;
    const adminPhone = process.env.ADMIN_PHONE_NUMBER || '254722522163';

    // Log environment variables status (not values)
    console.log('Configuration Status:', {
      SMS_API_KEY: apiKey ? 'Set' : 'Not Set',
      SMS_PARTNER_ID: partnerId ? 'Set' : 'Not Set',
      SMS_SENDER_ID: senderId ? 'Set' : 'Not Set',
      ADMIN_PHONE_NUMBER: process.env.ADMIN_PHONE_NUMBER ? 'Set' : 'Using default'
    });

    if (!apiKey || !partnerId || !senderId) {
      return NextResponse.json(
        { 
          error: 'SMS service is not properly configured',
          details: {
            missingVariables: {
              SMS_API_KEY: !apiKey,
              SMS_PARTNER_ID: !partnerId,
              SMS_SENDER_ID: !senderId
            }
          }
        },
        { status: 500 }
      );
    }

    // Validate required input
    if (!amount || !mobile) {
      return NextResponse.json(
        { error: 'Amount and mobile number are required' },
        { status: 400 }
      );
    }

    // Format amount for display
    const formattedAmount = `KES ${Number(amount).toLocaleString()}`;
    
    // Prepare messages
    const adminMessage = `Withdrawal Request:
${userName} has initiated a withdrawal of ${formattedAmount}${mpesaNumber ? ` to M-Pesa number ${mpesaNumber}` : ''}
Status: ${isSuccessful ? 'Successful' : 'Pending'}`;
    
    const userMessage = isSuccessful
      ? `Your withdrawal of ${formattedAmount} has been processed successfully. The funds will be sent to your M-Pesa shortly.

Need help?
📧 Email: ${SUPPORT_EMAIL}
📞 Phone: ${SUPPORT_PHONE} (Call/Text/WhatsApp)`
      : `Your withdrawal request of ${formattedAmount} has been received and is being processed. You'll receive a confirmation once completed.

Need help?
📧 Email: ${SUPPORT_EMAIL}
📞 Phone: ${SUPPORT_PHONE} (Call/Text/WhatsApp)`;

    // Send notifications in parallel
    const [adminSmsResult, userSmsResult] = await Promise.all([
      sendSMS(apiKey, partnerId, senderId, adminMessage, adminPhone),
      sendSMS(apiKey, partnerId, senderId, userMessage, mobile)
    ]);

    // Send email notification (non-blocking)
    try {
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #333;">${isSuccessful ? 'Withdrawal Successful' : 'Withdrawal Request Received'}</h2>
          <p>Hello ${userName},</p>
          <p>${isSuccessful 
            ? `Your withdrawal of <strong>${formattedAmount}</strong> has been processed successfully.` 
            : `Your withdrawal request of <strong>${formattedAmount}</strong> has been received.`}</p>
          <p>Need help? Contact us at ${SUPPORT_EMAIL}</p>
        </div>
      `;
    
      const { getUser } = getKindeServerSession();
      const user = await getUser();
      const recipient = user?.email || 'default@example.com';
    
      await sendEmail(recipient, 'Withdrawal Notification', emailContent);

      
    } catch (emailError) {
      console.error('Email notification failed:', emailError instanceof Error ? emailError.message : emailError);
      // Don't fail the request if email sending fails
    }
    
    return NextResponse.json({
      success: true,
      message: 'Notifications sent successfully',
      data: {
        admin: { ...adminSmsResult, apikey: undefined },
        user: { ...userSmsResult, apikey: undefined }
      }
    });
  } catch (error) {
    console.error('Request processing error:', error instanceof Error ? error.message : error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process withdrawal notification',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}




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































// import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
// import { NextResponse } from 'next/server';
// import nodemailer from 'nodemailer';


// /**
//  * Sends an SMS message through the textsms.co.ke API
//  * @param {string} apiKey - The API key for authentication
//  * @param {string} partnerId - The partner ID for the SMS service
//  * @param {string} senderId - The sender ID (shortcode)
//  * @param {string} message - The message content to send
//  * @param {string} mobile - The recipient's mobile number
//  * @returns {Promise<object>} The API response data
//  */
// async function sendSMS(apiKey: string, partnerId: string, senderId: string, message: string, mobile: string): Promise<any> {
//   // Format mobile number to contain only digits
//   const formattedMobile = mobile.replace(/[^0-9]/g, '');
  
//   const requestBody = {
//     apikey: apiKey,
//     partnerID: partnerId,
//     message,
//     shortcode: senderId,
//     mobile: formattedMobile
//   };

//   // Log request without sensitive data
//   console.log('SMS Request:', {
//     ...requestBody,
//     apikey: '[REDACTED]',
//     mobile: `${formattedMobile.substring(0, 4)}xxxx${formattedMobile.substring(formattedMobile.length - 2)}`
//   });

//   try {
//     const response = await fetch('https://sms.textsms.co.ke/api/services/sendsms/', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(requestBody),
//     });

//     console.log('SMS Response Status:', response.status);
    
//     // Check for non-JSON responses
//     const contentType = response.headers.get('content-type');
//     if (!contentType || !contentType.includes('application/json')) {
//       const textResponse = await response.text();
//       console.error('Received non-JSON response:', textResponse);
//       throw new Error('Invalid response format from SMS provider');
//     }
    
//     const data = await response.json();
    
//     // Log response without sensitive data
//     console.log('SMS Response:', {
//       ...data,
//       apikey: data.apikey ? '[REDACTED]' : undefined
//     });

//     if (!response.ok) {
//       throw new Error(data.error || `SMS API error: ${response.status}`);
//     }

//     return data;
//   } catch (error) {
//     console.error('SMS Request Failed:', error instanceof Error ? error.message : 'Unknown error');
//     throw error;
//   }
// }

// /**
//  * Sends an email notification
//  * @param {string} recipient - Email recipient
//  * @param {string} subject - Email subject
//  * @param {string} content - HTML content of the email
//  * @returns {Promise<void>}
//  */
// async function sendEmail(recipient: string, subject: string, content: string): Promise<void> {
//   const gmailUser = 'tobiasbarakan@gmail.com';
//   const gmailPassword = '3817.Tob.#123@bar';

// //   GMAIL_APP_PASSWORD='3817.Tob.#123@bar'
// // GMAIL_USER='tobiasbarakan@gmail.com'
  
//   if (!gmailUser || !gmailPassword) {
//     throw new Error('Email service is not properly configured');
//   }
//   console.log('Attempting to send email to::::::::::::::::::::::::::::::::::::::::', recipient);
// console.log('Using Gmail user::::::::::::::::::::::::::::::::::::::::::::::::::::::::::', gmailUser.substring(0, 3) + '...'); // Don't log full email
// console.log('Gmail app password configureddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd:', !!gmailPassword);
//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     host: "smtp.gmail.com",
//     port: 587,
//     secure: false,
//     auth: {
//       user: gmailUser,
//       pass: gmailPassword,
//     },
//   });

//   await transporter.sendMail({
//     from: gmailUser, 
//     to: recipient, 
//     subject,
//     html: content,
//   });
  
//   console.log('Email sent successfully to:', recipient);
// }

// /**
//  * API route handler for withdrawal notifications
//  */
// export async function POST(req: Request) {
//   const SUPPORT_EMAIL = 'support@fitrii.com';
//   const SUPPORT_PHONE = '+254722522163';

//   console.log(SUPPORT_PHONE, '//////////////////////////////////////////////////////////////////////////')
  
//   try {
//     // Parse request body
//     const { 
//       amount = null,
//       mobile,
//       userName = 'User',
//       isSuccessful = false,
//       mpesaNumber = null
//     } = await req.json();

//     // Validate required environment variables
//     const apiKey = process.env.SMS_API_KEY;
//     const partnerId = process.env.SMS_PARTNER_ID;
//     const senderId = process.env.SMS_SENDER_ID;
//     const adminPhone = process.env.ADMIN_PHONE_NUMBER || '254722522163';

//     // Log environment variables status (not values)
//     console.log('Configuration Status:', {
//       SMS_API_KEY: apiKey ? 'Set' : 'Not Set',
//       SMS_PARTNER_ID: partnerId ? 'Set' : 'Not Set',
//       SMS_SENDER_ID: senderId ? 'Set' : 'Not Set',
//       ADMIN_PHONE_NUMBER: process.env.ADMIN_PHONE_NUMBER ? 'Set' : 'Using default'
//     });

//     if (!apiKey || !partnerId || !senderId) {
//       return NextResponse.json(
//         { 
//           error: 'SMS service is not properly configured',
//           details: {
//             missingVariables: {
//               SMS_API_KEY: !apiKey,
//               SMS_PARTNER_ID: !partnerId,
//               SMS_SENDER_ID: !senderId
//             }
//           }
//         },
//         { status: 500 }
//       );
//     }

//     // Validate required input
//     if (!amount || !mobile) {
//       return NextResponse.json(
//         { error: 'Amount and mobile number are required' },
//         { status: 400 }
//       );
//     }

//     // Format amount for display
//     const formattedAmount = `KES ${Number(amount).toLocaleString()}`;
    
//     // Prepare messages
//     const adminMessage = `Withdrawal Request:
// ${userName} has initiated a withdrawal of ${formattedAmount}${mpesaNumber ? ` to M-Pesa number ${mpesaNumber}` : ''}
// Status: ${isSuccessful ? 'Successful' : 'Pending'}`;
    
//     const userMessage = isSuccessful
//       ? `Your withdrawal of ${formattedAmount} has been processed successfully. The funds will be sent to your M-Pesa shortly.

// Need help?
// 📧 Email: ${SUPPORT_EMAIL}
// 📞 Phone: ${SUPPORT_PHONE} (Call/Text/WhatsApp)`
//       : `Your withdrawal request of ${formattedAmount} has been received and is being processed. You'll receive a confirmation once completed.

// Need help?
// 📧 Email: ${SUPPORT_EMAIL}
// 📞 Phone: ${SUPPORT_PHONE} (Call/Text/WhatsApp)`;

//     // Send notifications in parallel
//     const [adminSmsResult, userSmsResult] = await Promise.all([
//       sendSMS(apiKey, partnerId, senderId, adminMessage, adminPhone),
//       sendSMS(apiKey, partnerId, senderId, userMessage, mobile)
//     ]);

//     // Send email notification (non-blocking)
//     try {
//       const emailContent = `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
//           <h2 style="color: #333;">${isSuccessful ? 'Withdrawal Successful' : 'Withdrawal Request Received'}</h2>
//           <p>Hello ${userName},</p>
//           <p>${isSuccessful 
//             ? `Your withdrawal of <strong>${formattedAmount}</strong> has been processed successfully.` 
//             : `Your withdrawal request of <strong>${formattedAmount}</strong> has been received.`}</p>
//           <p>Need help? Contact us at ${SUPPORT_EMAIL}</p>
//         </div>
//       `;
    
//       const { getUser } = getKindeServerSession();
//       const user = await getUser();
//       console.log(user, 'this is the userrrrrrrrrrrrrrrrrrrrrrrrrrrrr............:')
//       const recipient = user?.email || 'default@example.com';
    
//       await sendEmail(recipient, 'Withdrawal Notification', emailContent);

      
//     } catch (emailError) {
//       console.error('Email notification failed:', emailError instanceof Error ? emailError.message : emailError);
//       // Don't fail the request if email sending fails
//     }
    
//     return NextResponse.json({
//       success: true,
//       message: 'Notifications sent successfully',
//       data: {
//         admin: { ...adminSmsResult, apikey: undefined },
//         user: { ...userSmsResult, apikey: undefined }
//       }
//     });
//   } catch (error) {
//     console.error('Request processing error:', error instanceof Error ? error.message : error);
    
//     return NextResponse.json(
//       { 
//         error: 'Failed to process withdrawal notification',
//         details: error instanceof Error ? error.message : 'Unknown error'
//       },
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
