import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  addToCart,
  clearCart,
  readCart,
  removeFromCart,
  updateCartQuantity,
  writeCart,
  type CartItem,
} from "@/lib/cart";

interface CartContextValue {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (item: CartItem) => void;
  setQuantity: (item: CartItem, quantity: number) => void;
  empty: () => void;
  refresh: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Populate from localStorage after first render (avoids SSR/CSR mismatch)
    setItems(readCart());
    setHydrated(true);
  }, []);

  const persist = useCallback((next: CartItem[]) => {
    setItems(writeCart(next));
  }, []);

  const addItem = useCallback(
    (item: CartItem) => {
      if (!hydrated) return;
      persist(addToCart(readCart(), item));
    },
    [hydrated, persist],
  );

  const removeItem = useCallback(
    (item: CartItem) => {
      if (!hydrated) return;
      persist(removeFromCart(readCart(), item));
    },
    [hydrated, persist],
  );

  const setQuantity = useCallback(
    (item: CartItem, quantity: number) => {
      if (!hydrated) return;
      persist(updateCartQuantity(readCart(), item, quantity));
    },
    [hydrated, persist],
  );

  const empty = useCallback(() => {
    if (!hydrated) return;
    clearCart();
    setItems([]);
  }, [hydrated]);

  const refresh = useCallback(() => {
    setItems(readCart());
  }, []);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, setQuantity, empty, refresh }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
