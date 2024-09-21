import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
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
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file uploaded" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const fileBuffer = await file.arrayBuffer();
    const fileName = `file-${uuidv4()}-${file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;

    console.log('Uploading file:', fileName);

    const s3Client = new S3Client({
      region: "us-east-005",
      endpoint: "https://s3.us-east-005.backblazeb2.com",
      credentials: {
        accessKeyId: process.env.BACKBLAZE_KEY_ID!,
        secretAccessKey: process.env.BACKBLAZE_APP_KEY!,
      },
    });

    const putObjectParams = {
      Bucket: process.env.BACKBLAZE_BUCKET_NAME!,
      Key: fileName,
      Body: Buffer.from(fileBuffer),
      ContentType: file.type || 'application/octet-stream',
    };

    console.log('Upload parameters:', putObjectParams);

    const command = new PutObjectCommand(putObjectParams);
    await s3Client.send(command);

    const fileUrl = `https://f005.backblazeb2.com/file/${process.env.BACKBLAZE_BUCKET_NAME}/${fileName}`;
    console.log('File uploaded to:', fileUrl);

    return new Response(JSON.stringify({ fileUrl }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
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