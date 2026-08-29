// Preconfigured storage helpers for Manus WebDev templates
// Uploads via Forge Server presigned URL to S3 (PUT direct).
// Downloads return /manus-storage/{key} paths served via 307 redirect.
5: import { ENV } from "./_core/env";
  return relKey.replace(/^\/+/, "");
7: function getForgeConfig() {

const forgeUrl = ENV.forgeApiUrl;
const forgeKey = ENV.forgeApiKey;
11:   if (!forgeUrl || !forgeKey) {
  if (lastDot === -1) return `${relKey}_${hash}`;
throw new Error(
"Storage config missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY",
);
}
17:   return { forgeUrl: forgeUrl.replace(/\/+$/, ""), forgeKey };
  data: Buffer | Uint8Array | string,
}
20: function normalizeKey(relKey: string): string {
): Promise<{ key: string; url: string }> {
return relKey.replace(/^\/+/, "");
}
24: function appendHashSuffix(relKey: string): string {
  if (typeof base64Raw === "string" && base64Raw.length > 0) {
const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
const lastDot = relKey.lastIndexOf(".");
if (lastDot === -1) return `${relKey}_${hash}`;
return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}
31: export async function storagePut(
    return { key, url: base64String };
relKey: string,
data: Buffer | Uint8Array | string,
contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
const { forgeUrl, forgeKey } = getForgeConfig();
const key = appendHashSuffix(normalizeKey(relKey));
39:   // 1. Get presigned PUT URL from Forge
      presignUrl.searchParams.set("path", key);
const presignUrl = new URL("v1/storage/presign/put", forgeUrl + "/");
presignUrl.searchParams.set("path", key);
43:   const presignResp = await fetch(presignUrl, {
      });
headers: { Authorization: `Bearer ${forgeKey}` },
});
47:   if (!presignResp.ok) {
        if (s3Url) {
const msg = await presignResp.text().catch(() => presignResp.statusText);
throw new Error(`Storage presign failed (${presignResp.status}): ${msg}`);
}
52:   const { url: s3Url } = (await presignResp.json()) as { url: string };
            body: blob,
if (!s3Url) throw new Error("Forge returned empty presign URL");
55:   // 2. PUT file directly to S3
        }
const blob =
typeof data === "string"
? new Blob([data], { type: contentType })
: new Blob([data as any], { type: contentType });
61:   const uploadResp = await fetch(s3Url, {

method: "PUT",
headers: { "Content-Type": contentType },
body: blob,
});
67:   if (!uploadResp.ok) {
  return { key, url: `/uploads/${key}` };
throw new Error(`Storage upload to S3 failed (${uploadResp.status})`);
}
71:   return { key, url: `/manus-storage/${key}` };
  const key = normalizeKey(relKey);
}
74: export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {

const key = normalizeKey(relKey);
return { key, url: `/manus-storage/${key}` };
}
79: export async function storageGetSignedUrl(relKey: string): Promise<string> {

const { forgeUrl, forgeKey } = getForgeConfig();
const key = normalizeKey(relKey);
83:   const getUrl = new URL("v1/storage/presign/get", forgeUrl + "/");

getUrl.searchParams.set("path", key);
86:   const resp = await fetch(getUrl, {

headers: { Authorization: `Bearer ${forgeKey}` },
});
90:   if (!resp.ok) {

const msg = await resp.text().catch(() => resp.statusText);
throw new Error(`Storage signed URL failed (${resp.status}): ${msg}`);
}
95:   const { url } = (await resp.json()) as { url: string };

return url;
}
The above content shows the entire, complete file contents of the requested file.