import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Revalidate the home page and user profile pages
    revalidatePath('/');
    revalidatePath('/user/[id]');
    
    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (err) {
    return NextResponse.json({ revalidated: false, message: 'Error revalidating' }, { status: 500 });
  }
} 