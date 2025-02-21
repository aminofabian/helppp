import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Get admin emails from environment variable and clean them
const ADMIN_EMAILS = process.env.ADMIN_EMAILS 
  ? process.env.ADMIN_EMAILS.split(',').map(email => email.trim().toLowerCase())
  : [];

export async function middleware(request: NextRequest) {
  // Only run on admin routes
  if (!request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const { getUser } = getKindeServerSession();
  const user = await getUser();

  // Check if user is authenticated
  if (!user || !user.email) {
    return NextResponse.redirect(new URL('/api/auth/login', request.url));
  }

  // Check if user's email is in admin list (case insensitive)
  const userEmail = user.email.toLowerCase();
  if (!ADMIN_EMAILS.includes(userEmail)) {
    console.log('Access denied for:', userEmail);
    console.log('Allowed admins:', ADMIN_EMAILS);
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}
