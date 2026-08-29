export const COOKIE_NAME = "elnour_session_id";
export const ADMIN_COOKIE_NAME = "admin_session_id";
export const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
export const OAUTH_STATE_COOKIE = "elnour_oauth_state";

export function encodeOAuthState(state: { redirectUri: string; nonce: string }): string {
  return Buffer.from(JSON.stringify(state)).toString("base64url");
}

export function decodeOAuthState(raw: string): { redirectUri: string; nonce: string } | null {
  try {
    return JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}
