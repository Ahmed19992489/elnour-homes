import React, { createContext, useContext, useEffect, useState } from "react";

export type CartItem = {
  id: string; // unique item key
  productId: number;
  name: string;
  nameAr?: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  meters?: number;
  image?: string;
  isPerMeter?: boolean;
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  discount: number;
  total: number;
  couponCode: string;
  applyCoupon: (code: string, discountPercent: number) => void;
  removeCoupon: () => void;
};

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  itemCount: 0,
  subtotal: 0,
  discount: 0,
  total: 0,
  couponCode: "",
  applyCoupon: () => {},
  removeCoupon: () => {},
});

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("elnour_cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [couponCode, setCouponCode] = useState<string>(() => {
    return localStorage.getItem("elnour_coupon_code") || "";
  });

  const [couponDiscountPercent, setCouponDiscountPercent] = useState<number>(() => {
    const saved = localStorage.getItem("elnour_coupon_percent");
    return saved ? Number(saved) : 0;
  });

  useEffect(() => {
    localStorage.setItem("elnour_cart", JSON.stringify(items));
  }, [items]);

  const addItem = (item: Omit<CartItem, "id">) => {
    const id = `${item.productId}-${item.size || "std"}-${item.color || "std"}-${item.meters || 1}`;
    setItems((prev) => {
      const existing = prev.find((i) => i.id === id);
      if (existing) {
        return prev.map((i) =>
          i.id === id ? { ...i, quantity: i.quantity + item.quantity } : i
        );
      }
      return [...prev, { ...item, id }];
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
    setCouponCode("");
    setCouponDiscountPercent(0);
    localStorage.removeItem("elnour_cart");
    localStorage.removeItem("elnour_coupon_code");
    localStorage.removeItem("elnour_coupon_percent");
  };

  const applyCoupon = (code: string, discountPercent: number) => {
    setCouponCode(code);
    setCouponDiscountPercent(discountPercent);
    localStorage.setItem("elnour_coupon_code", code);
    localStorage.setItem("elnour_coupon_percent", String(discountPercent));
  };

  const removeCoupon = () => {
    setCouponCode("");
    setCouponDiscountPercent(0);
    localStorage.removeItem("elnour_coupon_code");
    localStorage.removeItem("elnour_coupon_percent");
  };

  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const subtotal = items.reduce((acc, item) => {
    const itemPrice = item.isPerMeter && item.meters ? item.price * item.meters : item.price;
    return acc + itemPrice * item.quantity;
  }, 0);

  const discount = (subtotal * couponDiscountPercent) / 100;
  const total = Math.max(0, subtotal - discount);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal,
        discount,
        total,
        couponCode,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
