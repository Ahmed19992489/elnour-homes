/**
 * Shared pricing logic used on the server (orders.createCart) to compute
 * the unit price of a single cart item from the product's configuration.
 *
 * Precedence:
 * 1. pricingType === "per_meter"  → pricePerMeter
 * 2. sizeOptions (JSON) contains a matching size label → that option's price
 * 3. legacy `sizes` list contains the selected size → base price (legacy
 *    sizing had one price per product)
 * 4. fall back to the product's base price
 */
import type { Product } from "../drizzle/schema";

export function parseJsonOptions<T>(value: string | null | undefined): T[] {
  try {
    if (!value) return [];
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

interface SizeOption {
  labelAr?: string;
  labelEn?: string;
  price?: unknown;
}

function splitOptions(value?: string | null): string[] {
  return (value || "").split(/[،,;؛]+/).map((option) => option.trim()).filter(Boolean);
}

export function computeCartItemPrice(
  product: Product | undefined,
  selectedSize: string | undefined,
  selectedColor: string | undefined,
): number {
  if (!product) return 0;
  const basePrice = product.price ? parseFloat(String(product.price)) : 0;

  if (product.pricingType === "per_meter") {
    const perMeter = product.pricePerMeter ? parseFloat(String(product.pricePerMeter)) : 0;
    return perMeter || basePrice;
  }

  const sizeOptions = parseJsonOptions<SizeOption>(product.sizeOptions);
  if (sizeOptions.length && selectedSize) {
    const match = sizeOptions.find(
      (opt) =>
        (opt.labelAr ?? "").toLocaleLowerCase() === selectedSize.trim().toLocaleLowerCase() ||
        (opt.labelEn ?? "").toLocaleLowerCase() === selectedSize.trim().toLocaleLowerCase(),
    );
    if (match) {
      const optPrice = match.price != null ? parseFloat(String(match.price)) : NaN;
      if (!Number.isNaN(optPrice)) return optPrice;
    }
  }

  const legacySizes = splitOptions(product.sizes);
  if (legacySizes.length && selectedSize) {
    if (legacySizes.some((s) => s.toLocaleLowerCase() === selectedSize.trim().toLocaleLowerCase())) {
      return basePrice;
    }
  }

  return basePrice;
}

function normalizeText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\s\-_]+/g, "");
}

export function isOptionAvailable(
  values: string | null | undefined,
  jsonOptions: string | null | undefined,
  key: "labelAr" | "labelEn",
  selected: string | undefined,
): boolean {
  if (!selected || !selected.trim()) return true;
  const legacy = splitOptions(values);
  const json = parseJsonOptions<Record<string, unknown> | string>(jsonOptions);

  // If this product does not have any options configured, allow the selection without blocking
  if (legacy.length === 0 && json.length === 0) return true;

  const normSelected = normalizeText(selected);

  if (legacy.some((v) => {
    const nv = normalizeText(v);
    return nv === normSelected || nv.includes(normSelected) || normSelected.includes(nv);
  })) {
    return true;
  }

  if (json.some((opt) => {
    if (typeof opt === "string") {
      const nv = normalizeText(opt);
      return nv === normSelected || nv.includes(normSelected) || normSelected.includes(nv);
    }
    if (typeof opt === "object" && opt !== null) {
      const val = String(opt[key] ?? opt.labelAr ?? opt.labelEn ?? (opt as any).name ?? "").trim();
      if (!val) return false;
      const nv = normalizeText(val);
      return nv === normSelected || nv.includes(normSelected) || normSelected.includes(nv);
    }
    return false;
  })) {
    return true;
  }

  return false;
}
