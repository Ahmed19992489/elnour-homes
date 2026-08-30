import { describe, expect, it } from "vitest";
import { buildBusinessWhatsAppUrl, buildOrderWhatsAppMessage, buildOrderWhatsAppUrl, normalizeWhatsAppRecipient } from "./orderWhatsApp";

describe("order WhatsApp message helpers", () => {
  it("normalizes Egyptian customer numbers for a WhatsApp chat", () => {
    expect(normalizeWhatsAppRecipient("01114323218")).toBe("201114323218");
    expect(normalizeWhatsAppRecipient("+20 111 432 3218")).toBe("201114323218");
    expect(normalizeWhatsAppRecipient("20")).toBe("");
  });

  it("uses the verified business number when a saved support number is incomplete", () => {
    expect(buildBusinessWhatsAppUrl("20", "مرحبا")).toBe(`https://wa.me/201118182424?text=${encodeURIComponent("مرحبا")}`);
    expect(buildBusinessWhatsAppUrl("+20 111 818 2424", "مرحبا")).toBe(`https://wa.me/201118182424?text=${encodeURIComponent("مرحبا")}`);
  });

  it("builds a customer-specific status message and chat URL", () => {
    const order = {
      id: 77,
      customerName: "أحمد",
      customerPhone: "01114323218",
      productName: "طاولة استيل",
      status: "shipped",
      orderUrl: "https://elnour.example/account/orders/77",
    };

    expect(buildOrderWhatsAppMessage(order)).toContain("تم شحن طلبك");
    expect(buildOrderWhatsAppMessage(order)).toContain("رقم الطلب: #77");
    expect(buildOrderWhatsAppUrl(order)).toBe(
      `https://wa.me/201114323218?text=${encodeURIComponent(buildOrderWhatsAppMessage(order))}`,
    );
  });

  it("does not create a chat URL when the customer has no phone number", () => {
    expect(buildOrderWhatsAppUrl({ id: 77, status: "confirmed" })).toBeNull();
  });
});
