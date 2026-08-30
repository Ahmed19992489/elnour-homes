// @vitest-environment jsdom
import React, { type ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ createOrder: vi.fn() }));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ lang: "ar", t: (key: string) => key, setLang: vi.fn() }),
}));
vi.mock("@/components/storefront/PublicLayout", () => ({ default: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock("@/components/UpdateHead", () => ({ UpdateHead: () => null }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ reviews: { invalidate: vi.fn() } }),
    pageviews: { track: { useMutation: () => ({ mutate: vi.fn() }) } },
    products: {
      byId: { useQuery: () => ({ data: { id: 17, name: "Steel Table", nameAr: "طاولة استيل", price: "1200", images: "[]", sizes: "", colors: "", category: "furniture" }, isLoading: false }) },
      active: { useQuery: () => ({ data: [], isLoading: false }) },
    },
    account: { me: { useQuery: () => ({ data: null, isLoading: false }) } },
    orders: { create: { useMutation: () => ({ mutate: state.createOrder, isPending: false }) } },
    coupons: { validate: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) } },
    settings: { get: { useQuery: () => ({ data: { sqmPrice: 3000 }, isLoading: false }) } },
    restockAlerts: { create: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) } },
    reviews: {
      my: { useQuery: () => ({ data: [], isLoading: false }) },
      forProduct: { useQuery: () => ({ data: { stats: { count: 0, average: 0 }, reviews: [] }, isLoading: false }) },
      create: { useMutation: () => ({ isPending: false, mutate: vi.fn(), mutateAsync: vi.fn() }) },
    },
  },
}));

import ProductDetail from "./ProductDetail";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";

describe("ProductDetail customer email validation", () => {
  afterEach(() => {
    cleanup();
    state.createOrder.mockReset();
  });

  it("shows a clear Arabic error and blocks order submission for an invalid email", async () => {
    const user = userEvent.setup();
    render(<ProductDetail />, { wrapper: ({ children }: { children: ReactNode }) => <WishlistProvider><CartProvider>{children}</CartProvider></WishlistProvider> });

    // One dialog exists now: click the "اطلب الآن" trigger to open it.
    const trigger = screen.getAllByRole("button", { name: "اطلب الآن" })[0];
    await user.click(trigger);
    const emails = await screen.findAllByPlaceholderText("name@example.com");
    await user.type(emails[0], "invalid-email");
    // Submit the form through the visible "تأكيد الطلب" submit button inside the open dialog.
    const submitBtn = screen.getByRole("button", { name: "submitOrder" });
    await user.click(submitBtn);

    expect((await screen.findByRole("alert")).textContent).toContain("يرجى إدخال بريد إلكتروني صحيح لتلقي تحديثات الطلب.");
    expect(emails[0].getAttribute("aria-invalid")).toBe("true");
    expect(state.createOrder).not.toHaveBeenCalled();
  });
});
