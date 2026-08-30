import React, { type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

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

const notification = {
  id: 22,
  orderId: 73,
  status: "confirmed",
  title: "تم تأكيد طلبك",
  message: "تم تأكيد طلبك رقم #73 وسنتابع معك خطوات الشحن.",
  createdAt: new Date("2026-08-12T11:00:00.000Z"),
};

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: 12, name: "أحمد علي", role: "user" }, loading: false, isAuthenticated: true }),
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ lang: "ar", isRTL: true }),
}));

vi.mock("@/components/storefront/PublicLayout", () => ({
  default: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("wouter", () => ({
  Link: ({ href, children, ...props }: { href: string; children: ReactNode }) => <a href={href} {...props}>{children}</a>,
  useParams: () => ({ id: "73" }),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ account: { me: { invalidate: vi.fn() }, orders: { invalidate: vi.fn() }, notifications: { invalidate: vi.fn() }, orderDetails: { invalidate: vi.fn() } } }),
    contactInfo: { get: { useQuery: () => ({ data: { phone: "01114323218", whatsappNumber: "01118182424" } }) } },
    account: {
      me: { useQuery: () => ({ data: { name: "أحمد علي", phone: "01118182424", address: "القاهرة" }, isLoading: false }) },
      orders: { useQuery: () => ({ data: [order], isLoading: false }) },
      notifications: { useQuery: () => ({ data: [notification], isLoading: false }) },
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

import MyAccount from "./MyAccount";
import OrderDetails from "./OrderDetails";

describe("customer order details UI", () => {
  it("links every displayed account order to its protected details route", () => {
    const markup = renderToStaticMarkup(<MyAccount />);

    expect(markup).toContain('href="/account/orders/73"');
    expect(markup).toContain("عرض تفاصيل الطلب");
  });

  it("renders an order update inside the account and links it to that order only", () => {
    const markup = renderToStaticMarkup(<MyAccount />);

    expect(markup).toContain("تم تأكيد طلبك");
    expect(markup).toContain("تم تأكيد طلبك رقم #73");
    expect(markup).toContain('href="/account/orders/73"');
  });

  it("renders the product, coupon total, and delivery progress for the selected order", () => {
    const markup = renderToStaticMarkup(<OrderDetails />);

    expect(markup).toContain("طاولة استيل");
    expect(markup).toContain("SAVE200");
    expect(markup).toContain("1,000");
    expect(markup).toContain("حالة التوصيل");
    expect(markup).toContain("تم التأكيد");
  });
});
