import { writeFile } from 'fs/promises';
import { join } from 'path';

export const runtime = 'nodejs'; // Add this line

export async function POST(req) {
  const formData = await req.formData();
  const file = formData.get('file');

  if (!file) {
    return new Response(JSON.stringify({ error: 'No file uploaded' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const path = join(process.cwd(), 'public', 'uploads', file.name);
  await writeFile(path, buffer);

  return new Response(JSON.stringify({ done: 'ok', path: '/uploads/' + file.name }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    }
  );
}