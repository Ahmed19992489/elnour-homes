// @vitest-environment jsdom
import React, { type ReactNode } from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  notifications: [] as Array<Record<string, unknown>>,
  streams: [] as Array<{ emit: (name: string) => void }>,
  invalidationCount: 0,
}));

class FakeEventSource {
  private listeners = new Map<string, Set<EventListener>>();
  constructor(_url: string) {
    state.streams.push({ emit: (name) => this.emit(name) });
  }
  addEventListener(name: string, listener: EventListener) {
    const current = this.listeners.get(name) || new Set<EventListener>();
    current.add(listener);
    this.listeners.set(name, current);
  }
  removeEventListener(name: string, listener: EventListener) {
    this.listeners.get(name)?.delete(listener);
  }
  close() {}
  private emit(name: string) {
    for (const listener of Array.from(this.listeners.get(name) || [])) listener(new Event(name));
  }
}

Object.defineProperty(globalThis, "EventSource", { value: FakeEventSource, writable: true });

const order = {
  id: 73,
  status: "shipped",
  productId: 7,
  productName: "طاولة استيل",
  productPrice: "1200",
  totalAfterDiscount: "1200",
  customerName: "أحمد علي",
  customerPhone: "01118182424",
  customerAddress: "القاهرة",
  createdAt: new Date("2026-08-12T10:00:00.000Z"),
};

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: 12, name: "أحمد علي", role: "user" }, loading: false, isAuthenticated: true }),
}));
vi.mock("@/contexts/LanguageContext", () => ({
  LanguageProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useLanguage: () => ({ lang: "ar", isRTL: true }),
}));
vi.mock("@/contexts/ThemeContext", () => ({ ThemeProvider: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock("@/components/ErrorBoundary", () => ({ default: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock("@/components/storefront/PublicLayout", () => ({ default: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock("@/components/ui/tooltip", () => ({ TooltipProvider: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock("@/components/ui/sonner", () => ({ Toaster: () => null }));
vi.mock("sonner", () => ({ toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() } }));
vi.mock("html2pdf.js", () => ({ default: () => ({ set: () => ({ from: () => ({ save: vi.fn() }) }) }) }));

vi.mock("@/lib/trpc", async () => {
  const ReactModule = await import("react");
  return {
    trpc: {
      useUtils: () => {
        const invalidate = vi.fn(() => { state.invalidationCount += 1; });
        return {
          account: {
            me: { invalidate },
            orders: { invalidate },
            orderDetails: { invalidate },
            notifications: { invalidate },
          },
          reviews: { invalidate },
        };
      },
      contactInfo: { get: { useQuery: () => ({ data: { phone: "01114323218", whatsappNumber: "01118182424" } }) } },
      account: {
        me: { useQuery: () => ({ data: { name: "أحمد علي", phone: "01118182424", address: "القاهرة" }, isLoading: false }) },
        orders: { useQuery: () => ({ data: [order], isLoading: false }) },
        notifications: { useQuery: () => ({ data: state.notifications, isLoading: false }) },
        orderDetails: { useQuery: () => ({ data: { order, product: null }, isLoading: false, error: null }) },
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
  };
});

import App from "@/App";

describe("customer live order notifications", () => {
  beforeEach(() => {
    state.notifications = [];
    state.streams = [];
    state.invalidationCount = 0;
    window.history.replaceState({}, "", "/account");
  });

  afterEach(() => cleanup());

  it("renders a streamed notification immediately and opens its associated order", async () => {
    const view = render(<App />);
    expect(await screen.findByText("لا توجد تحديثات حتى الآن.")).toBeTruthy();

    state.notifications = [{
      id: 901,
      orderId: 73,
      status: "shipped",
      title: "تم شحن طلبك",
      message: "طلبك رقم #73 في الطريق إليك.",
      createdAt: new Date("2026-08-13T10:00:00.000Z"),
    }];
    expect(state.streams.length).toBeGreaterThan(0);
    act(() => state.streams.at(-1)!.emit("order_notification"));
    expect(state.invalidationCount).toBe(2);
    view.rerender(<App />);

    const updateLink = await screen.findByRole("link", { name: /تم شحن طلبك/i });
    expect(updateLink.getAttribute("href")).toBe("/account/orders/73");
    await userEvent.setup().click(updateLink);
    expect(window.location.pathname).toBe("/account/orders/73");
  });
});
