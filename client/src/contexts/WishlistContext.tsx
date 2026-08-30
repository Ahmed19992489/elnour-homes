import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface WishlistItem {
  productId: number;
  addedAt: number;
}

interface WishlistContextValue {
  items: WishlistItem[];
  isWished: (productId: number) => boolean;
  toggle: (productId: number) => void;
  add: (productId: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);
const STORAGE_KEY = "elnour_wishlist";

function readItems(): WishlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (it) => it && typeof it.productId === "number",
    ) as WishlistItem[];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>(readItems);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const isWished = useCallback(
    (productId: number) => items.some((it) => it.productId === productId),
    [items],
  );

  const toggle = useCallback((productId: number) => {
    setItems((prev) => {
      const exists = prev.some((it) => it.productId === productId);
      return exists
        ? prev.filter((it) => it.productId !== productId)
        : [...prev.filter((it) => it.productId !== productId), { productId, addedAt: Date.now() }];
    });
  }, []);

  const add = useCallback((productId: number) => {
    setItems((prev) =>
      prev.some((it) => it.productId === productId)
        ? prev
        : [...prev, { productId, addedAt: Date.now() }],
    );
  }, []);

  const remove = useCallback((productId: number) => {
    setItems((prev) => prev.filter((it) => it.productId !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  return (
    <WishlistContext.Provider value={{ items, isWished, toggle, add, remove, clear }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within a WishlistProvider");
  return ctx;
}
