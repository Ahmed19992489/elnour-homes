import type { Request } from "express";
import { parse as parseCookieHeader } from "cookie";
import { jwtVerify } from "jose";
import { COOKIE_NAME } from "../../shared/const";
import type { User } from "../../drizzle/schema";
import { ENV } from "./env";
import * as db from "../db";

export const sdk = {
  async authenticateRequest(req: Request): Promise<User | null> {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return null;

    try {
      const cookies = parseCookieHeader(cookieHeader) as Record<string, string>;
      const token = cookies[COOKIE_NAME];
      if (!token) return null;

      const secretKey = new TextEncoder().encode(ENV.cookieSecret);
      const verified = await jwtVerify(token, secretKey, { algorithms: ["HS256"] });
      const payload = verified.payload as Record<string, unknown>;

      if (!payload || !payload.openId) return null;

      const user = await db.getUserByOpenId(String(payload.openId));
      return user || null;
    } catch {
      return null;
    }
  },
};
