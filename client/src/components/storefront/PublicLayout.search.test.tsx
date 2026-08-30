// @vitest-environment jsdom
import React, { type ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const setLocation = vi.fn();

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, loading: false, logout: vi.fn() }),
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ lang: "ar", isRTL: true, setLang: vi.fn() }),
}));

vi.mock("@/const", () => ({ startLogin: vi.fn() }));

vi.mock("wouter", () => ({
  Link: ({ href, children, ...props }: { href: string; children: ReactNode }) => <a href={href} {...props}>{children}</a>,
  useLocation: () => ["/", setLocation],
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    pageviews: { track: { useMutation: () => ({ mutate: vi.fn() }) } },
    contactInfo: { get: { useQuery: () => ({ data: {} }) } },
    products: {
      active: {
        useQuery: () => ({
          data: [{ id: 8, name: "Gold steel table", nameAr: "طاولة استيل ذهبية", description: "Luxury table", price: "1500", sizes: "80 سم", colors: "ذهبي", category: "furniture" }],
        }),
      },
    },
    categories: {
      active: {
        useQuery: () => ({
          data: [{ id: 3, slug: "furniture", nameAr: "أثاث", nameEn: "Furniture", descriptionAr: "أثاث ذهبي فاخر", descriptionEn: "Gold furniture" }],
        }),
      },
    },
  },
}));

import PublicLayout from "./PublicLayout";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";

describe("public live store search", () => {
  it("shows matching product and category results as a customer types", async () => {
    const user = userEvent.setup();
    render(<PublicLayout><div>Store content</div></PublicLayout>, { wrapper: ({ children }: { children: ReactNode }) => <WishlistProvider><CartProvider>{children}</CartProvider></WishlistProvider> });

    await user.type(screen.getByLabelText("البحث في المنتجات"), "ذهب");

    expect(screen.getByText("المنتجات المطابقة")).toBeTruthy();
    expect(screen.getByText("طاولة استيل ذهبية")).toBeTruthy();
    expect(screen.getByText("الفئات المطابقة")).toBeTruthy();
    expect(screen.getByText("أثاث")).toBeTruthy();
  });
});
