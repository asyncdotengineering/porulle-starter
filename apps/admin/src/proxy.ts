import { NextRequest, NextResponse } from 'next/server';

// Gate /dashboard behind the admin session cookie (set on porulle login).
// Signature verification happens server-side in lib/auth; here we only check
// presence to redirect unauthenticated visitors to the login page.
export default function proxy(req: NextRequest) {
  const isDashboard = req.nextUrl.pathname.startsWith('/dashboard');
  const hasSession = req.cookies.has('admin_session');
  if (isDashboard && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = '/auth/sign-in';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)'
  ]
};
