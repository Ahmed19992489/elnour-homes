import { beforeEach, describe, expect, it, vi } from "vitest";

const { addImage, addPage, html2canvas, output } = vi.hoisted(() => ({
  addImage: vi.fn(),
  addPage: vi.fn(),
  html2canvas: vi.fn(() => Promise.resolve({ width: 794, height: 1123, toDataURL: () => "data:image/png;base64,invoice" })),
  output: vi.fn(() => new Blob(["%PDF-1.7 rendered-invoice"], { type: "application/pdf" })),
}));

vi.mock("html2canvas", () => ({ default: html2canvas }));
vi.mock("jspdf", () => ({
  jsPDF: vi.fn(() => ({
    addImage,
    addPage,
    output,
    internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
  })),
}));

import { buildOrderInvoiceMarkup, createOrderInvoicePdf, orderInvoiceFileName } from "./orderInvoicePdf";

const invoice = {
  orderId: 73,
  createdAt: "2026-08-12T10:00:00.000Z",
  customerName: "أحمد علي",
  customerPhone: "01118182424",
  customerAddress: "القاهرة، مصر",
  productName: "طاولة استيل",
  selectedColor: "أسود مطفي",
  originalTotal: 1200,
  discount: 200,
  finalTotal: 1000,
  couponCode: "SAVE200",
  status: "تم التأكيد",
  lang: "ar" as const,
};

describe("order invoice PDF", () => {
  beforeEach(() => {
    addImage.mockClear();
    addPage.mockClear();
    html2canvas.mockClear();
    output.mockClear();
  });

  it("builds a right-to-left visual invoice with intact Arabic text content", () => {
    const markup = buildOrderInvoiceMarkup(invoice);

    expect(markup).toContain('dir="rtl"');
    expect(markup).toContain("طاولة استيل");
    expect(markup).toContain("بيانات العميل والتوصيل");
    expect(markup).toContain("Noto Naskh Arabic");
    expect(markup).toContain("SAVE200");
  });

  it("renders the browser-shaped invoice canvas into a non-empty PDF blob", async () => {
    const mount = {
      setAttribute: vi.fn(),
      style: { cssText: "" },
      innerHTML: "",
      firstElementChild: {} as HTMLElement,
      remove: vi.fn(),
    };
    vi.stubGlobal("document", {
      createElement: vi.fn(() => mount),
      body: { appendChild: vi.fn() },
    });

    const file = await createOrderInvoicePdf(invoice);

    expect(file.type).toBe("application/pdf");
    expect(file.size).toBeGreaterThan(0);
    expect(html2canvas).toHaveBeenCalledOnce();
    expect(html2canvas.mock.calls[0]?.[1]?.onclone).toEqual(expect.any(Function));
    expect(addImage).toHaveBeenCalledWith(
      "data:image/png;base64,invoice",
      "PNG",
      expect.any(Number),
      0,
      expect.any(Number),
      297,
      undefined,
      "FAST",
    );
    expect(addPage).not.toHaveBeenCalled();
    expect(mount.remove).toHaveBeenCalledOnce();
    expect(orderInvoiceFileName(73)).toBe("elnour-steel-order-73.pdf");
  });
});
