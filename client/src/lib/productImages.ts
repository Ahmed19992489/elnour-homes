/**
 * Product images are stored as a comma-separated list for compatibility with
 * existing records. This utility also accepts JSON arrays imported from older
 * catalogue tools, and treats both relative S3 paths and full URLs as valid.
 */
export function parseProductImages(images: string | null | undefined): string[] {
  if (!images?.trim()) return [];

  const value = images.trim();
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim());
    }
  } catch {
    // Existing records use comma-separated URLs; parse them below.
  }

  return value.split(",").map((image) => image.trim()).filter(Boolean);
}

export function getPrimaryProductImage(images: string | null | undefined): string | undefined {
  return parseProductImages(images)[0];
}

export function hasProductImage(images: string | null | undefined): boolean {
  return parseProductImages(images).length > 0;
}

export function serializeProductImages(images: string[]): string {
  return images.map((image) => image.trim()).filter(Boolean).join(", ");
}
