import { NextResponse } from 'next/server';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(request: Request) {
  try {
    const responseStream = new TransformStream();
    const writer = responseStream.writable.getWriter();
    
    const response = new NextResponse(responseStream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });

    // Keep the connection alive
    const keepAlive = setInterval(async () => {
      try {
        await writer.write(new TextEncoder().encode('event: ping\ndata: keep-alive\n\n'));
      } catch (error) {
        console.error('Error sending keep-alive:', error);
        clearInterval(keepAlive);
        writer.close();
      }
    }, 30000);

    // Clean up on close
    request.signal.addEventListener('abort', () => {
      clearInterval(keepAlive);
      writer.close();
    });

    return response;
  } catch (error) {
    console.error('Error in payment-events route:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
