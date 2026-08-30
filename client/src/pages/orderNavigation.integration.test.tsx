// @vitest-environment jsdom
import React, { type ReactNode } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createInvoicePdf } = vi.hoisted(() => ({ createInvoicePdf: vi.fn(() => Promise.resolve(new Blob(["%PDF-1.4 invoice"], { type: "application/pdf" }))) }));

const order = {
  id: 73,
  status: "confirmed",
  productId: 7,
  productName: "طاولة استيل",
  productPrice: "1200",
  couponCode: "SAVE200",
  discountValue: "200",
  totalAfterDiscount: "1000",
  customerName: "أحمد علي",
  customerPhone: "01118182424",
  customerAddress: "القاهرة",
  message: "يرجى الاتصال قبل التوصيل",
  createdAt: new Date("2026-08-12T10:00:00.000Z"),
};

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: 12, name: "أحمد علي", role: "user" }, loading: false, isAuthenticated: true }),
}));

vi.mock("@/contexts/LanguageContext", () => ({
  LanguageProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useLanguage: () => ({ lang: "ar", isRTL: true }),
}));

vi.mock("@/contexts/ThemeContext", () => ({
  ThemeProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/ErrorBoundary", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/storefront/PublicLayout", () => ({
  default: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));

vi.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/components/ui/sonner", () => ({
  Toaster: () => null,
}));

vi.mock("@/lib/orderInvoicePdf", () => ({
  createOrderInvoicePdf: createInvoicePdf,
  orderInvoiceFileName: (id: number) => `elnour-steel-order-${id}.pdf`,
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ account: { me: { invalidate: vi.fn() }, orders: { invalidate: vi.fn() }, notifications: { invalidate: vi.fn() }, orderDetails: { invalidate: vi.fn() } }, reviews: { invalidate: vi.fn() } }),
    contactInfo: { get: { useQuery: () => ({ data: { phone: "01114323218", whatsappNumber: "01118182424" } }) } },
    account: {
      me: { useQuery: () => ({ data: { name: "أحمد علي", phone: "01118182424", address: "القاهرة" }, isLoading: false }) },
      orders: { useQuery: () => ({ data: [order], isLoading: false }) },
      notifications: { useQuery: () => ({ data: [], isLoading: false }) },
      orderDetails: {
        useQuery: () => ({
          data: {
            order,
            product: {
              id: 7,
              name: "Steel table",
              nameAr: "طاولة استيل",
              description: "Electrostatic-coated steel table",
              price: "1200",
              sizes: "80 × 80 سم",
              colors: "أسود مطفي",
              images: "[]",
            },
          },
          isLoading: false,
          error: null,
        }),
      },
      updateProfile: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
      cancelOrder: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
    },
    referral: { mine: { useQuery: () => ({ data: undefined, isLoading: false }) } },
    reviews: {
      my: { useQuery: () => ({ data: [], isLoading: false }) },
      forProduct: { useQuery: () => ({ data: { stats: { count: 0, average: 0 }, reviews: [] }, isLoading: false }) },
      create: { useMutation: () => ({ isPending: false, mutate: vi.fn(), mutateAsync: vi.fn() }) },
    },
  },
}));

import App from "@/App";

describe("customer order navigation", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/account");
    createInvoicePdf.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("opens the matching order details route and renders its delivery, product, and total information", async () => {
    const user = userEvent.setup();
    render(<App />);

    const detailsLink = await screen.findByRole("link", { name: /عرض تفاصيل الطلب/i });
    expect(detailsLink.getAttribute("href")).toBe("/account/orders/73");

    await user.click(detailsLink);

    expect(window.location.pathname).toBe("/account/orders/73");
    expect(await screen.findByRole("heading", { name: /طلب رقم #73/i })).toBeTruthy();
    expect(screen.getByText("طاولة استيل")).toBeTruthy();
    expect(screen.getByText(/SAVE200/)).toBeTruthy();
    expect(screen.getByText(/1,000/)).toBeTruthy();
    expect(screen.getByText("حالة التوصيل")).toBeTruthy();
    expect(screen.getAllByText("تم التأكيد").length).toBeGreaterThan(0);
  });

  it("opens a native printable PDF from the order details page", async () => {
    window.history.replaceState({}, "", "/account/orders/73");
    const replace = vi.fn();
    const invoiceWindow = { location: { replace }, close: vi.fn() };
    const openSpy = vi.spyOn(window, "open").mockReturnValue(invoiceWindow as unknown as Window);
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:elnour-order-73") });
    const user = userEvent.setup();

    render(<App />);
    await user.click(await screen.findByRole("button", { name: /طباعة الفاتورة/i }));

    expect(openSpy).toHaveBeenCalled();
    await waitFor(() => expect(createInvoicePdf).toHaveBeenCalledWith(expect.objectContaining({ orderId: 73, productName: "طاولة استيل", couponCode: "SAVE200" })));
    expect(replace).toHaveBeenCalledWith("blob:elnour-order-73");

    openSpy.mockRestore();
  });

  it("downloads a real PDF invoice file from the order details page", async () => {
    window.history.replaceState({}, "", "/account/orders/73");
    const createObjectUrl = vi.fn(() => "blob:elnour-order-73");
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectUrl });
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole("button", { name: /تنزيل pdf/i }));

    await waitFor(() => expect(createInvoicePdf).toHaveBeenCalledWith(expect.objectContaining({ orderId: 73 })));
    expect(createObjectUrl).toHaveBeenCalledOnce();
    expect(clickSpy).toHaveBeenCalledOnce();
  });
});
