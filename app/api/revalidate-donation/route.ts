import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    // Revalidate the home page
    revalidatePath('/', 'layout');
    
    // Revalidate the specific user's profile page
    if (userId) {
      revalidatePath(`/user/${userId}`, 'layout');
    }
    
    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (err) {
    console.error('Error revalidating:', err);
    return NextResponse.json({ revalidated: false, message: 'Error revalidating' }, { status: 500 });
  }
} 