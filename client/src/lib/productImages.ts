export function parseProductImages(raw?: string | string[] | null): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [raw];
  } catch {
    return raw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }
}

export function serializeProductImages(images: string[]): string {
  return JSON.stringify(images);
}

export function hasProductImage(product: { images?: string | string[] | null }): boolean {
  const images = parseProductImages(product.images);
  return images.length > 0 && !!images[0];
}
