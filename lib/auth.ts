import bcrypt from 'bcrypt';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const COOKIE_NAME = 'latin_admin_session';
const SALT_ROUNDS = 10;
const SECRET = process.env.AUTH_SECRET || 'latin-in-seoul-dev-secret';
const SESSION_MAX_AGE = 60 * 60 * 24; // 24h

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
}

function createSessionValue(username: string, role: string): string {
  const payload = JSON.stringify({ username, role, exp: Date.now() + SESSION_MAX_AGE * 1000 });
  const encoded = Buffer.from(payload, 'utf-8').toString('base64url');
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

function parseSessionValue(value: string): { username: string; role: string } | null {
  try {
    const [encoded, sig] = value.split('.');
    if (!encoded || !sig || sign(encoded) !== sig) return null;
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8'));
    if (payload.exp && payload.exp < Date.now()) return null;
    return { username: payload.username, role: payload.role };
  } catch {
    return null;
  }
}

export async function setAdminSession(username: string, role: string): Promise<void> {
  const value = createSessionValue(username, role);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

export async function getAdminSession(): Promise<{ username: string; role: string } | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  if (!value) return null;
  return parseSessionValue(value);
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
