import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export const COOKIE = "comunidade_session";
const MAX_AGE = 60 * 60 * 8; // 8 horas

function secret(): Uint8Array | null {
  const s = process.env.AUTH_SECRET;
  return s && s.length >= 16 ? new TextEncoder().encode(s) : null;
}

export function authConfigured(): boolean {
  return Boolean(process.env.ADMIN_USER && process.env.ADMIN_PASSWORD && secret());
}

function digest(v: string) {
  return createHash("sha256").update(v).digest();
}

export function checkCredentials(user: string, password: string): boolean {
  if (!authConfigured()) return false;
  const okUser = timingSafeEqual(digest(user), digest(process.env.ADMIN_USER!));
  const okPass = timingSafeEqual(digest(password), digest(process.env.ADMIN_PASSWORD!));
  return okUser && okPass;
}

export async function createSessionToken(user: string): Promise<string> {
  return new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret()!);
}

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE,
};

export async function isAuthed(): Promise<boolean> {
  const key = secret();
  if (!key) return false;
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, key);
    return true;
  } catch {
    return false;
  }
}
