import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  
  const response = new NextResponse(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });

  // Keep the connection alive
  const keepAlive = setInterval(async () => {
    try {
      await writer.write(new TextEncoder().encode('event: ping\ndata: keep-alive\n\n'));
    } catch (error) {
      console.error('Error sending keep-alive:', error);
    }
  }, 30000);

  // Clean up on close
  request.signal.addEventListener('abort', () => {
    clearInterval(keepAlive);
    writer.close();
  });

  return response;
}
