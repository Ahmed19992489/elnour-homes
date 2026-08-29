import { COOKIE_NAME, ONE_YEAR_MS, OAUTH_STATE_COOKIE, decodeOAuthState } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
8: function getQueryParam(req: Request, key: string): string | undefined {

const value = req.query[key];
return typeof value === "string" ? value : undefined;
}
13: export function registerOAuthRoutes(app: Express) {

app.get("/api/oauth/callback", async (req: Request, res: Response) => {
const code = getQueryParam(req, "code");
const state = getQueryParam(req, "state");
18:     if (!code || !state) {

res.status(400).json({ error: "code and state are required" });
return;
}
23:     // CSRF guard: the nonce in `state` must match the one-time cookie that

// startLogin set in the browser that began this login. An attacker can
// forge `state`, but cannot plant this cookie in the victim's browser.
const { nonce } = decodeOAuthState(state);
const expectedNonce = parseCookieHeader(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
if (!nonce || nonce !== expectedNonce) {
res.status(403).json({ error: "invalid oauth state" });
return;
}
res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });
34:     try {

const tokenResponse = await sdk.exchangeCodeForToken(code, state);
const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
38:       if (!userInfo.openId) {

res.status(400).json({ error: "openId missing from user info" });
return;
}
43:       await db.upsertUser({

openId: userInfo.openId,
name: userInfo.name || null,
email: userInfo.email ?? null,
loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
lastSignedIn: new Date(),
});
51:       const sessionToken = await sdk.createSessionToken(userInfo.openId, {

name: userInfo.name || "",
expiresInMs: ONE_YEAR_MS,
});
56:       const cookieOptions = getSessionCookieOptions(req);

res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
59:       res.redirect(302, "/");

} catch (error) {
console.error("[OAuth] Callback failed", error);
res.status(500).json({ error: "OAuth callback failed" });
}
});
}
The above content shows the entire, complete file contents of the requested file.