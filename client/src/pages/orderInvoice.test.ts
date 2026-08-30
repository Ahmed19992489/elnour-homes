import { describe, expect, it } from "vitest";
import { buildOrderInvoiceHtml } from "./OrderDetails";

describe("order invoice PDF document", () => {
  it("includes the product, delivery, coupon, totals, and current status in Arabic", () => {
    const invoice = buildOrderInvoiceHtml({
      orderId: 73,
      createdAt: "2026-08-12T10:00:00.000Z",
      customerName: "أحمد علي",
      customerPhone: "01118182424",
      customerAddress: "القاهرة",
      productName: "طاولة استيل",
      originalTotal: 1200,
      discount: 200,
      finalTotal: 1000,
      couponCode: "SAVE200",
      status: "تم التأكيد",
      lang: "ar",
      contactPhone: "01114323218",
    });

    expect(invoice).toContain('dir="rtl"');
    expect(invoice).toContain("طاولة استيل");
    expect(invoice).toContain("SAVE200");
    expect(invoice).toContain("١٬٠٠٠");
    expect(invoice).toContain("تم التأكيد");
    expect(invoice).toContain("القاهرة");
  });

  it("escapes customer-entered text before injecting it into the printable document", () => {
    const invoice = buildOrderInvoiceHtml({
      orderId: 74,
      createdAt: "2026-08-12T10:00:00.000Z",
      customerName: "<script>alert(1)</script>",
      customerPhone: "01118182424",
      productName: "Steel table",
      originalTotal: 1200,
      discount: 0,
      finalTotal: 1200,
      status: "Confirmed",
      lang: "en",
    });

    expect(invoice).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(invoice).not.toContain("<script>alert(1)</script>");
  });
});
