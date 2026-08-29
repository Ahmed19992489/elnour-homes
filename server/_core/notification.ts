import { TRPCError } from "@trpc/server";
import { ENV } from "./env";
4: export type NotificationPayload = {

title: string;
content: string;
};
9: const TITLE_MAX_LENGTH = 1200;

const CONTENT_MAX_LENGTH = 20000;
12: const trimValue = (value: string): string => value.trim();

const isNonEmptyString = (value: unknown): value is string =>
typeof value === "string" && value.trim().length > 0;
16: const buildEndpointUrl = (baseUrl: string): string => {

const normalizedBase = baseUrl.endsWith("/")
? baseUrl
: `${baseUrl}/`;
return new URL(
"webdevtoken.v1.WebDevService/SendNotification",
normalizedBase
).toString();
};
26: const validatePayload = (input: NotificationPayload): NotificationPayload => {

if (!isNonEmptyString(input.title)) {
throw new TRPCError({
code: "BAD_REQUEST",
message: "Notification title is required.",
});
}
if (!isNonEmptyString(input.content)) {
throw new TRPCError({
code: "BAD_REQUEST",
message: "Notification content is required.",
});
}
40:   const title = trimValue(input.title);

const content = trimValue(input.content);
43:   if (title.length > TITLE_MAX_LENGTH) {

throw new TRPCError({
code: "BAD_REQUEST",
message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`,
});
}
50:   if (content.length > CONTENT_MAX_LENGTH) {

throw new TRPCError({
<truncated 59 bytes>
message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`,
});
}
57:   return { title, content };

};
60: /**
/**
* Dispatches a project-owner notification through the Manus Notification Service.
* Returns `true` if the request was accepted, `false` when the upstream service
* cannot be reached (callers can fall back to email/slack). Validation errors
* bubble up as TRPC errors so callers can fix the payload.
*/
export async function notifyOwner(
payload: NotificationPayload
): Promise<boolean> {
const { title, content } = validatePayload(payload);
71:   if (!ENV.forgeApiUrl) {
  // Send email alert to the owner email if configured
throw new TRPCError({
code: "INTERNAL_SERVER_ERROR",
message: "Notification service URL is not configured.",
});
}
78:   if (!ENV.forgeApiKey) {
      await fetch("https://api.resend.com/emails", {
throw new TRPCError({
code: "INTERNAL_SERVER_ERROR",
message: "Notification service API key is not configured.",
});
}
85:   const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
          from: resendFrom,
87:   try {
          subject: `[Elnour Homes] ${title}`,
const response = await fetch(endpoint, {
method: "POST",
headers: {
accept: "application/json",
authorization: `Bearer ${ENV.forgeApiKey}`,
"content-type": "application/json",
"connect-protocol-version": "1",
},
body: JSON.stringify({ title, content }),
});
99:     if (!response.ok) {
    const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
const detail = await response.text().catch(() => "");
console.warn(
`[Notification] Failed to notify owner (${response.status} ${response.statusText})${
detail ? `: ${detail}` : ""
}`
);
return false;
}
109:     return true;
        body: JSON.stringify({ title, content }),
} catch (error) {
console.warn("[Notification] Error calling notification service:", error);
return false;
}
}
The above content shows the entire, complete file contents of the requested file.

  return true;
}
