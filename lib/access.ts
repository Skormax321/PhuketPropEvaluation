import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ACCESS_COOKIE = "ppe_access";

/** 30 дней */
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function secret(): string {
  const value = process.env.ACCESS_SECRET;
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[access] ACCESS_SECRET не задан — используется небезопасный fallback",
    );
  }
  return "phuket-unit-benchmark-dev-secret";
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Значение cookie: `<expiresAtMs>.<hmac>` */
export function createAccessToken(now = Date.now()): string {
  const expiresAt = String(now + MAX_AGE_SECONDS * 1000);
  return `${expiresAt}.${sign(expiresAt)}`;
}

export function verifyAccessToken(token: string | undefined): boolean {
  if (!token) return false;
  const [expiresAt, signature] = token.split(".");
  if (!expiresAt || !signature) return false;
  if (!safeEqual(signature, sign(expiresAt))) return false;
  const expiresAtMs = Number(expiresAt);
  return Number.isFinite(expiresAtMs) && expiresAtMs > Date.now();
}

export async function hasAccess(): Promise<boolean> {
  const store = await cookies();
  return verifyAccessToken(store.get(ACCESS_COOKIE)?.value);
}

export function accessCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  };
}
