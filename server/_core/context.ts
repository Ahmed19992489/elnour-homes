import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { jwtVerify } from "jose";
import { parse as parseCookieHeader } from "cookie";
import { ADMIN_COOKIE_NAME } from "../../shared/const";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import * as db from "../db";
import { ENV } from "./env";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

/**
 * Phone-based admin session — verifies the `admin_session_id` JWT cookie
 * and creates a synthesized User with role "admin" or "moderator".
 */
async function authenticateAdminSession(
  cookieHeader: string | undefined
): Promise<User | null> {
  if (!cookieHeader) return null;

  const cookies = new Map(
    Object.entries(parseCookieHeader(cookieHeader) as Record<string, string>)
  );
  const token = cookies.get(ADMIN_COOKIE_NAME);
  if (!token) return null;

  let payload: Record<string, unknown>;
  try {
    const secretKey = new TextEncoder().encode(ENV.cookieSecret);
    const verified = await jwtVerify(token, secretKey, { algorithms: ["HS256"] });
    payload = verified.payload as Record<string, unknown>;
  } catch {
    return null;
  }

  const jti = payload.jti;
  const openId = payload.openId;
  const name = payload.name;
  if (
    !isNonEmptyString(jti) ||
    !isNonEmptyString(openId) ||
    !isNonEmptyString(name) ||
    !openId.startsWith("admin-")
  ) {
    return null;
  }

  const session = await db.getActiveAdminSession(jti);
  if (!session) return null;

  const credential = await db.getAdminCredentialByPhone(session.adminPhone);
  const role = credential?.role === "moderator" ? "moderator" : "admin";

  return {
    id: 0,
    openId,
    name: name || session.adminPhone,
    email: null,
    phone: session.adminPhone,
    address: null,
    loginMethod: "admin_phone",
    role: role as any,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  } as User;
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    user = null;
  }

  if (!user) {
    try {
      user = await authenticateAdminSession(opts.req.headers.cookie);
    } catch {
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}