import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

export async function POST(req) {
  const requiredEnvVars = [
    "BACKBLAZE_BUCKET_NAME",
    "BACKBLAZE_KEY_ID",
    "BACKBLAZE_APP_KEY",
  ];
  const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingEnvVars.length > 0) {
    console.error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // Get the file buffer from the request
    const fileBuffer = Buffer.from(await req.arrayBuffer());

    // Extract the filename from headers or generate a unique name
    const reqFileName = (req.headers.get("x-filename") || `file-${uuidv4()}`)
      .replace(/[^a-zA-Z0-9_.-]/g, '_'); // Sanitize filename

    console.log('Uploading file:', reqFileName);

    // Create an S3 client instance
    const s3Client = new S3Client({
      region: "us-east-005", // Use the Backblaze B2 region
      endpoint: "https://s3.us-east-005.backblazeb2.com", // Backblaze S3 endpoint
      credentials: {
        accessKeyId: process.env.BACKBLAZE_KEY_ID,
        secretAccessKey: process.env.BACKBLAZE_APP_KEY,
      },
    });

    // Create and send the PutObjectCommand to upload the file
    const putObjectParams = {
      Bucket: process.env.BACKBLAZE_BUCKET_NAME, // Your Backblaze bucket name
      Key: reqFileName, // File name
      Body: fileBuffer, // File data
      ContentType: getContentType(reqFileName), // Set the content type
    };

    console.log('Upload parameters:', putObjectParams);

    const command = new PutObjectCommand(putObjectParams);
    await s3Client.send(command);

    // Construct the file download URL
    const fileUrl = `https://${process.env.BACKBLAZE_BUCKET_NAME}.s3.us-east-005.backblazeb2.com/${reqFileName}`;
    console.log('File uploaded to:', fileUrl);

    return new Response(JSON.stringify({ fileUrl }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in S3 upload:", error);
    return new Response(
      JSON.stringify({
        error: "File upload failed",
        details: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// Function to get the content type based on the file extension
const getContentType = (fileName) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  const mimeTypes = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    bmp: 'image/bmp',
    pdf: 'application/pdf',
    txt: 'text/plain',
    // Add more types as needed
  };
  return mimeTypes[extension] || 'application/octet-stream'; // Default to binary
};

// Disable body parsing and handle stream as in Next.js API config
export const config = {
  api: {
    bodyParser: false,
  },
};
