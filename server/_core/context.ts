import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { jwtVerify } from "jose";
import { parse as parseCookieHeader } from "cookie";
import { ADMIN_COOKIE_NAME } from "../../shared/const";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import * as db from "../db";
import { ENV } from "./env";
10: export type TrpcContext = {

req: CreateExpressContextOptions["req"];
res: CreateExpressContextOptions["res"];
user: User | null;
};
16: const isNonEmptyString = (value: unknown): value is string =>

typeof value === "string" && value.length > 0;
19: /**

* Phone-based admin session — an alternative admin login that does not depend
* on Manus OAuth. When the OAuth cookie is missing or invalid we fall back to
* the `admin_session_id` cookie, verify the JWT signature and the matching
* active row in adminSessions, and synthesize a User with role "admin".
*/
async function authenticateAdminSession(
cookieHeader: string | undefined
): Promise<User | null> {
if (!cookieHeader) return null;
30:   const cookies = new Map(

Object.entries(parseCookieHeader(cookieHeader) as Record<string, string>)
);
const token = cookies.get(ADMIN_COOKIE_NAME);
if (!token) return null;
36:   let payload: Record<string, unknown>;

try {
const secretKey = new TextEncoder().encode(ENV.cookieSecret);
const verified = await jwtVerify(token, secretKey, { algorithms: ["HS256"] });
payload = verified.payload as Record<string, unknown>;
} catch {
return null;
}
45:   const jti = payload.jti;

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
57:   const session = await db.getActiveAdminSession(jti, new Date());
  const session = await db.getActiveAdminSession(jti, new Date());
if (!session) return null;
60:   // Return a synthesized User-shaped object with full admin role.
  const credential = await db.getAdminCredentialByPhone(session.adminPhone);
return {
id: 0,
openId,
name: name || session.adminPhone,
email: null,
phone: session.adminPhone,
address: null,
loginMethod: "admin_phone",
role: "admin",
createdAt: new Date(),
updatedAt: new Date(),
lastSignedIn: new Date(),
} as User;
}
76: export async function createContext(
  } as User;
opts: CreateExpressContextOptions
): Promise<TrpcContext> {
let user: User | null = null;
81:   try {

user = await sdk.authenticateRequest(opts.req);
} catch (error) {
// OAuth is not available — try the phone-based admin session.
user = null;
}
88:   if (!user) {

try {
user = await authenticateAdminSession(opts.req.headers.cookie);
} catch (error) {
user = null;
}
}
96:   return {

req: opts.req,
res: opts.res,
user,
};
}
The above content shows the entire, complete file contents of the requested file.