import React, { createContext, useContext, useEffect, useState } from "react";

type WishlistContextType = {
  items: number[]; // product IDs
  toggleItem: (productId: number) => void;
  isInWishlist: (productId: number) => boolean;
  itemCount: number;
};

const WishlistContext = createContext<WishlistContextType>({
  items: [],
  toggleItem: () => {},
  isInWishlist: () => false,
  itemCount: 0,
});

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem("elnour_wishlist");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("elnour_wishlist", JSON.stringify(items));
  }, [items]);

  const toggleItem = (productId: number) => {
    setItems((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const isInWishlist = (productId: number) => items.includes(productId);

  return (
    <WishlistContext.Provider
      value={{
        items,
        toggleItem,
        isInWishlist,
        itemCount: items.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
