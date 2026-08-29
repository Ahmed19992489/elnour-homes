import crypto from "crypto";

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "image/jpeg"
): Promise<{ key: string; url: string }> {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const cleanKey = relKey.replace(/^\/+/, "");
  const lastDot = cleanKey.lastIndexOf(".");
  const key = lastDot === -1 ? `${cleanKey}_${hash}` : `${cleanKey.slice(0, lastDot)}_${hash}${cleanKey.slice(lastDot)}`;

  if (typeof data === "string" && data.startsWith("data:")) {
    return { key, url: data };
  }

  const base64Data = Buffer.isBuffer(data) ? data.toString("base64") : typeof data === "string" ? Buffer.from(data).toString("base64") : Buffer.from(data).toString("base64");
  const url = `data:${contentType};base64,${base64Data}`;

  return { key, url };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = relKey.replace(/^\/+/, "");
  return { key, url: `/images/products/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const key = relKey.replace(/^\/+/, "");
  return `/images/products/${key}`;
}
