import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export type OrderInvoicePdfData = {
  orderId: number;
  createdAt: Date | string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string | null;
  productName: string;
  selectedSize?: string | null;
  selectedColor?: string | null;
  originalTotal: number;
  discount: number;
  finalTotal: number;
  couponCode?: string | null;
  status: string;
  lang: "ar" | "en";
  contactPhone?: string;
};

const ARABIC_FONT_URL = "/manus-storage/NotoNaskhArabic-Regular_2c847b5d.ttf";
const INVOICE_FONT_NAME = "ElnourInvoiceArabic";
const TRAILING_WHITESPACE_TOLERANCE_MM = 2;
let invoiceFontPromise: Promise<void> | null = null;

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "-")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isUsable(value: string | null | undefined) {
  return Boolean(value && value.trim());
}

async function ensureInvoiceFont() {
  if (typeof document === "undefined" || !document.fonts) return;
  if (!invoiceFontPromise) {
    invoiceFontPromise = (async () => {
      try {
        if (typeof FontFace === "undefined") return;
        const font = new FontFace(INVOICE_FONT_NAME, `url(${ARABIC_FONT_URL})`, { style: "normal", weight: "400" });
        document.fonts.add(await font.load());
        await document.fonts.load(`400 18px "${INVOICE_FONT_NAME}"`);
      } catch {
        // Native Arabic system fonts retain browser shaping in the captured invoice.
      }
    })();
  }
  return invoiceFontPromise;
}

export function orderInvoiceFileName(orderId: number) {
  return `elnour-steel-order-${orderId}.pdf`;
}

export function buildOrderInvoiceMarkup(invoice: OrderInvoicePdfData) {
  const isArabic = invoice.lang === "ar";
  const label = (ar: string, en: string) => (isArabic ? ar : en);
  const currency = label("ج.م", "EGP");
  const locale = isArabic ? "ar-EG" : "en-US";
  const direction = isArabic ? "rtl" : "ltr";
  const amount = (value: number) => `${Number(value).toLocaleString(locale)} ${currency}`;
  const row = (title: string, value?: string | number | null, className = "") => `
    <div class="invoice-row ${className}"><span class="invoice-row__label">${escapeHtml(title)}</span><strong class="invoice-row__value">${escapeHtml(value)}</strong></div>`;
  const section = (title: string, rows: string) => `
    <section class="invoice-section"><h2>${escapeHtml(title)}</h2><div class="invoice-section__rows">${rows}</div></section>`;
  const customerRows = [
    row(label("الاسم", "Name"), invoice.customerName),
    row(label("الهاتف", "Phone"), invoice.customerPhone),
    isUsable(invoice.customerAddress) ? row(label("العنوان", "Address"), invoice.customerAddress) : "",
    row(label("تاريخ الطلب", "Order date"), new Date(invoice.createdAt).toLocaleString(locale)),
  ].join("");
  const productRows = [
    row(label("المنتج", "Product"), invoice.productName),
    isUsable(invoice.selectedSize) ? row(label("المقاس المختار", "Selected size"), invoice.selectedSize) : "",
    isUsable(invoice.selectedColor) ? row(label("اللون المختار", "Selected colour"), invoice.selectedColor) : "",
    row(label("سعر المنتج", "Product price"), amount(invoice.originalTotal), "invoice-row--amount"),
  ].join("");
  const totalRows = [
    row(label("إجمالي المنتجات", "Items subtotal"), amount(invoice.originalTotal), "invoice-row--amount"),
    isUsable(invoice.couponCode) ? row(`${label("الكوبون", "Coupon")} (${invoice.couponCode})`, `− ${amount(invoice.discount)}`, "invoice-row--amount") : "",
    row(label("الإجمالي النهائي", "Grand total"), amount(invoice.finalTotal), "invoice-row--total"),
  ].join("");

  return `<article class="elnour-invoice-capture" dir="${direction}" lang="${invoice.lang}">
    <style>
      .elnour-invoice-capture, .elnour-invoice-capture * { box-sizing: border-box; border-color: #e7dec8 !important; outline-color: transparent !important; }
      .elnour-invoice-capture { width: 794px; min-height: 1123px; padding: 48px; color: #29261f; background: #fcfbf7; font-family: "${INVOICE_FONT_NAME}", "Noto Naskh Arabic", Tahoma, Arial, sans-serif; font-size: 17px; line-height: 1.72; text-align: ${isArabic ? "right" : "left"}; }
      .invoice-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; padding: 30px 32px; color: #fffaf0; background: linear-gradient(135deg, #242019, #6a542f); border-bottom: 5px solid #b99252 !important; }
      .invoice-brand { font-family: Georgia, "Times New Roman", serif; font-size: 33px; font-weight: 700; letter-spacing: .05em; line-height: 1.15; }
      .invoice-brand small { display: block; margin-top: 8px; color: #e5c992; font-family: "${INVOICE_FONT_NAME}", Tahoma, Arial, sans-serif; font-size: 16px; font-weight: 400; letter-spacing: 0; }
      .invoice-meta { min-width: 178px; color: #f9e4ba; font-size: 15px; line-height: 1.85; }
      .invoice-meta__number { direction: ltr; font-family: Arial, sans-serif; font-weight: 700; text-align: ${isArabic ? "right" : "left"}; }
      .invoice-section { margin-top: 28px; }.invoice-section h2 { margin: 0 0 13px; padding-bottom: 9px; color: #8e6924; border-bottom: 2px solid #d6c49c; font-size: 22px; font-weight: 700; }.invoice-section__rows { border: 1px solid #e7dec8; background: #fffdf8; }
      .invoice-row { display: flex; align-items: baseline; justify-content: space-between; gap: 28px; min-height: 47px; padding: 11px 18px; border-bottom: 1px solid #eee7d9; }.invoice-row:last-child { border-bottom: 0; }.invoice-row:nth-child(even) { background: #faf7ef; }.invoice-row__label { color: #655d4f; font-weight: 600; }.invoice-row__value { max-width: 64%; color: #29261f; font-weight: 600; overflow-wrap: anywhere; }
      .invoice-row--amount .invoice-row__value { direction: ltr; font-family: Arial, sans-serif; font-size: 16px; }.invoice-row--total { min-height: 58px; color: #fffaf0; background: #8e6924 !important; }.invoice-row--total .invoice-row__label, .invoice-row--total .invoice-row__value { color: #fffaf0; font-size: 20px; }.invoice-row--total .invoice-row__value { direction: ltr; font-family: Arial, sans-serif; }.invoice-footer { margin-top: 34px; padding-top: 16px; color: #655d4f; border-top: 1px solid #d6c49c; font-size: 15px; }.invoice-footer strong { color: #8e6924; }
    </style>
    <header class="invoice-header"><div class="invoice-brand">Elnour for STEEL<small>${escapeHtml(label("فاتورة طلب", "Order invoice"))}</small></div><div class="invoice-meta"><div class="invoice-meta__number">${escapeHtml(label("طلب", "Order"))} #${escapeHtml(invoice.orderId)}</div><div>${escapeHtml(label("الحالة", "Status"))}: ${escapeHtml(invoice.status)}</div></div></header>
    ${section(label("بيانات العميل والتوصيل", "Customer and delivery details"), customerRows)}
    ${section(label("تفاصيل المنتج", "Product details"), productRows)}
    ${section(label("ملخص المبلغ", "Order total"), totalRows)}
    <footer class="invoice-footer"><strong>${escapeHtml(label("للاستفسار", "For support"))}:</strong> ${escapeHtml(invoice.contactPhone || "Elnour for STEEL")}</footer>
  </article>`;
}

export async function createOrderInvoicePdf(invoice: OrderInvoicePdfData): Promise<Blob> {
  if (typeof document === "undefined") throw new Error("Invoice generation is only available in a browser");
  await ensureInvoiceFont();
  const mount = document.createElement("div");
  mount.setAttribute("aria-hidden", "true");
  mount.style.cssText = "position:fixed;left:-100000px;top:0;z-index:-1;pointer-events:none;";
  mount.innerHTML = buildOrderInvoiceMarkup(invoice);
  const printableInvoice = mount.firstElementChild as HTMLElement | null;
  if (!printableInvoice) throw new Error("Unable to prepare the invoice layout");
  document.body.appendChild(mount);
  try {
    const canvas = await html2canvas(printableInvoice, {
      backgroundColor: "#fcfbf7",
      logging: false,
      scale: 2,
      useCORS: true,
      windowWidth: 794,
      onclone: (clonedDocument) => {
        const colorSafety = clonedDocument.createElement("style");
        colorSafety.textContent = "html, body { background: #fcfbf7 !important; color: #29261f !important; }";
        clonedDocument.head.appendChild(colorSafety);
      },
    });
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const naturalImageHeight = (canvas.height * pageWidth) / canvas.width;
    const isSinglePageInvoice = naturalImageHeight <= pageHeight + 15;
    const imageHeight = isSinglePageInvoice ? pageHeight : naturalImageHeight;
    const imageWidth = isSinglePageInvoice ? (canvas.width * imageHeight) / canvas.height : pageWidth;
    const imageLeft = (pageWidth - imageWidth) / 2;
    const imageData = canvas.toDataURL("image/png");
    let imageTop = 0;
    let remainingHeight = imageHeight;
    pdf.addImage(imageData, "PNG", imageLeft, imageTop, imageWidth, imageHeight, undefined, "FAST");
    remainingHeight -= pageHeight;
    while (remainingHeight > TRAILING_WHITESPACE_TOLERANCE_MM) {
      imageTop -= pageHeight;
      pdf.addPage();
      pdf.addImage(imageData, "PNG", imageLeft, imageTop, imageWidth, imageHeight, undefined, "FAST");
      remainingHeight -= pageHeight;
    }
    const result = pdf.output("blob");
    if (!(result instanceof Blob) || result.size === 0) throw new Error("Generated invoice PDF is empty");
    return result;
  } finally {
    mount.remove();
  }
}
