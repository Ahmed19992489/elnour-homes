/**
 * Shopping cart shared logic + localStorage persistence.
 * The cart is keyed by (productId, size, colour) so the same product can be
 * added with different variants as separate lines.
 */

export interface CartItem {
  productId: number;
  selectedSize?: string;
  selectedColor?: string;
  quantity: number;
  unitPrice: number;
}

export const CART_STORAGE_KEY = "elnour-steel-cart";

export function cartKey(item: Pick<CartItem, "productId" | "selectedSize" | "selectedColor">): string {
  return `${item.productId}|${item.selectedSize ?? ""}|${item.selectedColor ?? ""}`;
}

export function readCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (i): i is CartItem =>
          typeof i.productId === "number" &&
          typeof i.quantity === "number" &&
          Number.isFinite(i.unitPrice ?? 0),
      )
      .map((i) => ({ ...i, quantity: Math.max(1, Math.min(99, Math.round(i.quantity))) }));
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]): CartItem[] {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  return items;
}

export function clearCart(): void {
  localStorage.removeItem(CART_STORAGE_KEY);
}

export function addToCart(items: CartItem[], item: CartItem): CartItem[] {
  const key = cartKey(item);
  const existing = items.findIndex((i) => cartKey(i) === key);
  const next = [...items];
  if (existing >= 0) {
    next[existing] = {
      ...next[existing],
      quantity: Math.min(99, next[existing].quantity + item.quantity),
    };
  } else {
    next.push({ ...item });
  }
  return next;
}

export function removeFromCart(items: CartItem[], item: CartItem): CartItem[] {
  const key = cartKey(item);
  return items.filter((i) => cartKey(i) !== key);
}

export function updateCartQuantity(items: CartItem[], item: CartItem, quantity: number): CartItem[] {
  const key = cartKey(item);
  return items.map((i) =>
    cartKey(i) === key
      ? { ...i, quantity: Math.max(1, Math.min(99, Math.round(quantity))) }
      : i,
  );
}

export function cartTotals(items: CartItem[]) {
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  return { subtotal: Math.round(subtotal * 100) / 100, itemCount };
}
