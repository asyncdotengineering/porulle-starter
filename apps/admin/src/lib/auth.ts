import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const COOKIE = 'admin_session';
const MAX_AGE = 60 * 60 * 8; // 8h
const PORULLE_API_URL = process.env.PORULLE_API_URL ?? 'http://localhost:4000';
const SECRET = process.env.ADMIN_SESSION_SECRET ?? 'dev-admin-session-secret-change-me';

export interface AdminSession {
  email: string;
  exp: number;
}

function sign(value: string): string {
  return createHmac('sha256', SECRET).update(value).digest('base64url');
}

function encode(session: AdminSession): string {
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function decode(token: string | undefined): AdminSession | null {
  if (!token) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = sign(payload);
  if (expected.length !== sig.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) {
    return null;
  }
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString()) as AdminSession;
    if (session.exp < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Validates credentials against porulle Better Auth, then enforces the admin allowlist. */
export async function signInAdmin(email: string, password: string): Promise<{ error?: string; ok: boolean }> {
  const normalized = email.trim().toLowerCase();
  const allow = adminEmails();
  if (allow.length > 0 && !allow.includes(normalized)) {
    return { ok: false, error: 'This account is not an admin.' };
  }

  let res: Response;
  try {
    res = await fetch(`${PORULLE_API_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: PORULLE_API_URL },
      body: JSON.stringify({ email: normalized, password })
    });
  } catch {
    return { ok: false, error: 'Cannot reach the commerce backend.' };
  }
  if (!res.ok) {
    return { ok: false, error: 'Invalid email or password.' };
  }

  const store = await cookies();
  store.set(COOKIE, encode({ email: normalized, exp: Date.now() + MAX_AGE * 1000 }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE
  });
  return { ok: true };
}

export async function signOutAdmin(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

export async function getAdminSession(): Promise<AdminSession | null> {
  return decode((await cookies()).get(COOKIE)?.value);
}

export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect('/auth/sign-in');
  return session;
}
