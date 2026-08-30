import React, { useState } from "react";
import { Link, useParams } from "wouter";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { parseProductImages } from "@/lib/productImages";
import { createOrderInvoicePdf, orderInvoiceFileName } from "@/lib/orderInvoicePdf";
import { buildBusinessWhatsAppUrl } from "@/lib/orderWhatsApp";
import PublicLayout from "@/components/storefront/PublicLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowRight, Check, Circle, Loader2, MapPin, MessageCircle, Package, Phone, ReceiptText, TicketPercent } from "lucide-react";
import { toast } from "sonner";

const STATUS_META = {
  new: { ar: "طلب جديد", en: "New order", descriptionAr: "تم استلام طلبك وسنتواصل معك قريبًا.", descriptionEn: "We received your order and will contact you shortly.", tone: "bg-blue-100 text-blue-800" },
  contacted: { ar: "تم التواصل", en: "Contacted", descriptionAr: "تم التواصل معك لمراجعة تفاصيل الطلب.", descriptionEn: "We contacted you to review the order details.", tone: "bg-amber-100 text-amber-800" },
  confirmed: { ar: "تم التأكيد", en: "Confirmed", descriptionAr: "تم تأكيد الطلب وتجهيز الخطوة التالية للتوصيل.", descriptionEn: "Your order is confirmed and moving toward delivery.", tone: "bg-purple-100 text-purple-800" },
  shipped: { ar: "تم الشحن", en: "Shipped", descriptionAr: "طلبك في طريقه إليك ولا يمكن إلغاؤه الآن.", descriptionEn: "Your order is on its way and can no longer be cancelled.", tone: "bg-cyan-100 text-cyan-800" },
  delivered: { ar: "تم التسليم", en: "Delivered", descriptionAr: "تم تسليم طلبك بنجاح.", descriptionEn: "Your order was delivered successfully.", tone: "bg-emerald-100 text-emerald-800" },
  cancelled: { ar: "ملغي", en: "Cancelled", descriptionAr: "تم إلغاء هذا الطلب. تواصل معنا إن احتجت إلى مساعدة.", descriptionEn: "This order was cancelled. Contact us if you need help.", tone: "bg-zinc-200 text-zinc-700" },
} as const;

const DELIVERY_STEPS = ["new", "contacted", "confirmed", "shipped", "delivered"] as const;
const DELIVERY_RANK = { new: 0, contacted: 1, confirmed: 2, shipped: 3, delivered: 4 } as const;

export type InvoiceData = {
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

function escapeInvoiceText(value: unknown) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    "\"": "&quot;",
  })[character] ?? character);
}

export function buildOrderInvoiceHtml(invoice: InvoiceData) {
  const isArabic = invoice.lang === "ar";
  const label = (ar: string, en: string) => (isArabic ? ar : en);
  const currency = label("ج.م", "EGP");
  const locale = isArabic ? "ar-EG" : "en-US";
  const date = new Date(invoice.createdAt).toLocaleString(locale);
  const amount = (value: number) => `${Number(value).toLocaleString(locale)} ${currency}`;
  const row = (title: string, value: string) => `<tr><th>${escapeInvoiceText(title)}</th><td>${escapeInvoiceText(value)}</td></tr>`;

  return `<!doctype html>
<html lang="${isArabic ? "ar" : "en"}" dir="${isArabic ? "rtl" : "ltr"}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeInvoiceText(label("فاتورة طلب", "Order Invoice"))} #${invoice.orderId}</title>
    <style>
      @page { size: A4; margin: 18mm; }
      * { box-sizing: border-box; }
      body { margin: 0; color: #29261f; background: #fff; font-family: Tahoma, Arial, sans-serif; font-size: 13px; line-height: 1.6; }
      .invoice { max-width: 760px; margin: auto; }
      .header { display: flex; justify-content: space-between; gap: 24px; align-items: start; border-bottom: 2px solid #ad842f; padding-bottom: 18px; }
      .brand { color: #8e6924; font-size: 25px; font-weight: 800; letter-spacing: .3px; }
      .subtitle { margin: 4px 0 0; color: #746d61; }
      .order-number { text-align: ${isArabic ? "left" : "right"}; font-size: 18px; font-weight: 800; }
      .status { display: inline-block; margin-top: 7px; padding: 4px 11px; border-radius: 999px; background: #f8edda; color: #704d13; font-weight: 700; }
      h2 { font-size: 15px; color: #8e6924; margin: 25px 0 8px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { padding: 10px 12px; border: 1px solid #e7dfd3; text-align: ${isArabic ? "right" : "left"}; vertical-align: top; }
      th { width: 38%; background: #fcf8f0; color: #655d50; font-weight: 700; }
      .total { margin-top: 18px; margin-${isArabic ? "right" : "left"}: auto; max-width: 360px; }
      .total-row { display: flex; justify-content: space-between; gap: 20px; padding: 8px 0; border-bottom: 1px solid #e7dfd3; }
      .total-row.discount { color: #137145; }
      .total-row.grand { border-bottom: 0; color: #8e6924; font-size: 17px; font-weight: 800; padding-top: 13px; }
      .footer { margin-top: 38px; padding-top: 14px; border-top: 1px solid #e7dfd3; color: #746d61; font-size: 11px; }
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style>
  </head>
  <body>
    <main class="invoice">
      <header class="header">
        <div><div class="brand">Elnour for STEEL</div><p class="subtitle">${escapeInvoiceText(label("فاتورة طلب", "Order Invoice"))}</p></div>
        <div class="order-number">${escapeInvoiceText(label("طلب رقم", "Order"))} #${invoice.orderId}<br /><span class="status">${escapeInvoiceText(invoice.status)}</span></div>
      </header>
      <section><h2>${escapeInvoiceText(label("بيانات العميل والتوصيل", "Customer and delivery details"))}</h2><table><tbody>
        ${row(label("الاسم", "Name"), invoice.customerName)}
        ${row(label("الهاتف", "Phone"), invoice.customerPhone)}
        ${invoice.customerAddress ? row(label("العنوان", "Address"), invoice.customerAddress) : ""}
        ${row(label("تاريخ الطلب", "Order date"), date)}
      </tbody></table></section>
      <section><h2>${escapeInvoiceText(label("المنتج", "Product"))}</h2><table><tbody>
        ${row(label("المنتج المطلوب", "Ordered product"), invoice.productName)}
        ${invoice.selectedSize ? row(label("المقاس المختار", "Selected size"), invoice.selectedSize) : ""}
        ${invoice.selectedColor ? row(label("اللون المختار", "Selected colour"), invoice.selectedColor) : ""}
        ${row(label("سعر المنتج", "Product price"), amount(invoice.originalTotal))}
      </tbody></table></section>
      <section class="total">
        <div class="total-row"><span>${escapeInvoiceText(label("قيمة المنتجات", "Items subtotal"))}</span><strong>${escapeInvoiceText(amount(invoice.originalTotal))}</strong></div>
        ${invoice.couponCode ? `<div class="total-row discount"><span>${escapeInvoiceText(label("الكوبون", "Coupon"))} (${escapeInvoiceText(invoice.couponCode)})</span><strong>− ${escapeInvoiceText(amount(invoice.discount))}</strong></div>` : ""}
        <div class="total-row grand"><span>${escapeInvoiceText(label("الإجمالي", "Total"))}</span><span>${escapeInvoiceText(amount(invoice.finalTotal))}</span></div>
      </section>
      <footer class="footer">${escapeInvoiceText(label("هذه الفاتورة ملخص لطلبك. للاستفسار، يرجى التواصل معنا", "This invoice is a summary of your order. For questions, please contact us"))}${invoice.contactPhone ? ` — ${escapeInvoiceText(invoice.contactPhone)}` : ""}.</footer>
    </main>
  </body>
</html>`;
}

export default function OrderDetails() {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const isValidOrderId = Number.isInteger(orderId) && orderId > 0;
  const { user, loading } = useAuth();
  const { lang, isRTL } = useLanguage();
  const { data: contact } = trpc.contactInfo.get.useQuery();
  const { data, isLoading, error, refetch } = trpc.account.orderDetails.useQuery(
    { id: orderId },
    { enabled: !!user && isValidOrderId, retry: false },
  );

  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const callNumber = (contact?.phone ?? "").replace(/[^0-9+]/g, "");
  const [isPreparingInvoice, setIsPreparingInvoice] = useState(false);
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const cancelOrder = trpc.account.cancelOrder.useMutation({
    onSuccess: async () => {
      toast.success(t("تم إلغاء الطلب بنجاح", "Order cancelled successfully"));
      await refetch();
    },
    onError: (mutationError) => toast.error(mutationError.message),
  });

  if (!loading && !user) {
    return (
      <PublicLayout>
        <div className="container max-w-lg py-16 text-center">
          <Package className="mx-auto h-12 w-12 text-[#ad842f]" />
          <h1 className="mt-4 text-2xl font-bold">{t("سجّل الدخول لعرض طلبك", "Sign in to view your order")}</h1>
          <p className="mt-2 text-muted-foreground">{t("تفاصيل الطلب تظهر فقط لصاحب الحساب الذي أنشأه.", "Order details are visible only to the account that placed it.")}</p>
          <Button className="mt-6 bg-[#26231e] text-white hover:bg-[#ad842f]" onClick={startLogin}>
            {t("دخول / إنشاء حساب", "Sign in / Create account")}
          </Button>
        </div>
      </PublicLayout>
    );
  }

  if (!isValidOrderId) {
    return <UnavailableOrder />;
  }

  if (loading || isLoading) {
    return (
      <PublicLayout>
        <div className="container flex min-h-[45vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#ad842f]" /></div>
      </PublicLayout>
    );
  }

  if (error || !data) {
    return <UnavailableOrder />;
  }

  const { order, product } = data;
  const status = STATUS_META[order.status as keyof typeof STATUS_META] ?? STATUS_META.new;
  const productName = lang === "ar" ? (product?.nameAr || order.productName || "طلب عام") : (product?.name || order.productName || "General request");
  const productImages = product ? parseProductImages(product.images) : [];
  const originalTotal = Number(order.productPrice ?? 0);
  const finalTotal = order.totalAfterDiscount === null || order.totalAfterDiscount === undefined
    ? originalTotal
    : Number(order.totalAfterDiscount);
  const discount = order.discountValue === null || order.discountValue === undefined
    ? Math.max(0, originalTotal - finalTotal)
    : Number(order.discountValue);
  const currentRank = order.status === "cancelled" ? -1 : DELIVERY_RANK[order.status as keyof typeof DELIVERY_RANK] ?? 0;

  const invoiceData = () => ({
    orderId: order.id,
    createdAt: order.createdAt,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerAddress: order.customerAddress,
    productName,
    selectedSize: order.selectedSize,
    selectedColor: order.selectedColor,
    originalTotal,
    discount,
    finalTotal,
    couponCode: order.couponCode,
    status: lang === "ar" ? status.ar : status.en,
    lang,
    contactPhone: callNumber,
  });

  const triggerFileDownload = (pdfBlob: Blob) => {
    const downloadUrl = URL.createObjectURL(pdfBlob);
    const downloadLink = document.createElement("a");
    downloadLink.href = downloadUrl;
    downloadLink.download = orderInvoiceFileName(order.id);
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    window.setTimeout(() => {
      URL.revokeObjectURL(downloadUrl);
      downloadLink.remove();
    }, 30_000);
  };

  const handleInvoicePdf = async () => {
    if (typeof window === "undefined") return;
    setInvoiceError(null);
    setIsPreparingInvoice(true);
    const invoiceWindow = window.open("", "_blank", "width=920,height=760");
    if (!invoiceWindow) {
      setIsPreparingInvoice(false);
      setInvoiceError(t("تعذر فتح نافذة الطباعة. يرجى السماح بالنوافذ المنبثقة ثم المحاولة مرة أخرى.", "The print window was blocked. Allow popups, then try again."));
      return;
    }
    try {
      const pdfBlob = await createOrderInvoicePdf(invoiceData());
      const previewUrl = URL.createObjectURL(pdfBlob);
      // A native PDF viewer is printable on desktop and mobile, unlike the old
      // detached HTML window which could render as an empty page on Chromium.
      invoiceWindow.location.replace(previewUrl);
      window.setTimeout(() => URL.revokeObjectURL(previewUrl), 60_000);
    } catch (printError) {
      invoiceWindow.close();
      console.error("Unable to prepare printable invoice PDF", printError);
      setInvoiceError(t("تعذر تجهيز الفاتورة للطباعة الآن. جرّب تنزيل ملف PDF أولاً.", "We could not prepare the printable invoice. Try downloading the PDF first."));
    } finally {
      setIsPreparingInvoice(false);
    }
  };

  const handleInvoiceDownload = async () => {
    if (typeof window === "undefined") return;
    setInvoiceError(null);
    setIsDownloadingInvoice(true);

    try {
      const pdfBlob = await createOrderInvoicePdf(invoiceData());
      triggerFileDownload(pdfBlob);
    } catch (downloadError) {
      console.error("Unable to create order invoice PDF", downloadError);
      setInvoiceError(t("تعذر إنشاء ملف PDF الآن. يرجى المحاولة مرة أخرى.", "We could not create the PDF right now. Please try again."));
    } finally {
      setIsDownloadingInvoice(false);
    }
  };

  const canCustomerCancel = ["new", "contacted", "confirmed"].includes(order.status);
  const handleCancelOrder = () => {
    if (!window.confirm(t("هل أنت متأكد من إلغاء هذا الطلب؟ لا يمكن التراجع عن الإلغاء.", "Are you sure you want to cancel this order? This cannot be undone."))) return;
    cancelOrder.mutate({ id: order.id });
  };

  return (
    <PublicLayout>
      <main className="container max-w-5xl py-10" dir={isRTL ? "rtl" : "ltr"}>
        <Link href="/account" className="inline-flex items-center gap-2 text-sm font-medium text-[#8e6924] hover:text-[#26231e]">
          <ArrowRight className={`h-4 w-4 ${isRTL ? "" : "rotate-180"}`} />
          {t("العودة إلى حسابي", "Back to my account")}
        </Link>

        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#ad842f]">{t("تفاصيل الطلب", "Order details")}</p>
            <h1 className="mt-1 text-3xl font-bold">{t("طلب رقم", "Order")} #{order.id}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleString(lang === "ar" ? "ar-EG" : "en-US")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={`px-3 py-1.5 text-sm ${status.tone}`}>{lang === "ar" ? status.ar : status.en}</Badge>
            <Button type="button" className="gap-2 bg-[#26231e] text-white hover:bg-[#ad842f]" onClick={handleInvoiceDownload} disabled={isDownloadingInvoice}>
              {isDownloadingInvoice ? <Loader2 className="h-4 w-4 animate-spin" /> : <ReceiptText className="h-4 w-4" />}
              {t("تنزيل PDF", "Download PDF")}
            </Button>
            <Button type="button" variant="outline" className="gap-2 border-[#ad842f] text-[#8e6924] hover:bg-amber-50" onClick={handleInvoicePdf} disabled={isPreparingInvoice}>
              {isPreparingInvoice ? <Loader2 className="h-4 w-4 animate-spin" /> : <ReceiptText className="h-4 w-4" />}
              {t("طباعة الفاتورة", "Print invoice")}
            </Button>
            {canCustomerCancel ? <Button type="button" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" onClick={handleCancelOrder} disabled={cancelOrder.isPending}>{cancelOrder.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("إلغاء الطلب", "Cancel order")}</Button> : null}
          </div>
        </div>
        {invoiceError ? <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert">{invoiceError}</div> : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.45fr_0.9fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Package className="h-5 w-5 text-[#ad842f]" />{t("المنتج المطلوب", "Ordered product")}</CardTitle>
                <CardDescription>{t("بيانات المنتج وقت إنشاء الطلب", "Product information connected to this order")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-5 sm:flex-row">
                  {productImages[0] ? <img src={productImages[0]} alt={productName} className="h-44 w-full rounded-xl object-cover sm:w-44" /> : <div className="flex h-44 w-full items-center justify-center rounded-xl bg-amber-50 text-[#ad842f] sm:w-44"><Package className="h-10 w-10" /></div>}
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-bold">{productName}</h2>
                    {product?.description ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{product.description}</p> : null}
                    <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                      <p><span className="text-muted-foreground">{t("سعر المنتج:", "Product price:")}</span> <strong>{originalTotal.toLocaleString()} {t("ج.م", "EGP")}</strong></p>
                      {order.selectedSize ? <p><span className="text-muted-foreground">{t("المقاس المختار:", "Selected size:")}</span> <strong>{order.selectedSize}</strong></p> : null}
                      {order.selectedColor ? <p><span className="text-muted-foreground">{t("اللون المختار:", "Selected colour:")}</span> <strong>{order.selectedColor}</strong></p> : null}
                    </div>
                    {product ? <Link href={`/product/${product.id}`} className="mt-4 inline-block text-sm font-semibold text-[#8e6924] hover:underline">{t("عرض صفحة المنتج", "View product page")}</Link> : null}
                  </div>
                </div>
                {order.message ? <div className="mt-5 rounded-lg bg-stone-50 p-3 text-sm"><span className="font-semibold">{t("ملاحظتك:", "Your note:")}</span> {order.message}</div> : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><ReceiptText className="h-5 w-5 text-[#ad842f]" />{t("ملخص المبلغ", "Payment summary")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between gap-4"><span className="text-muted-foreground">{t("قيمة المنتجات", "Items subtotal")}</span><span>{originalTotal.toLocaleString()} {t("ج.م", "EGP")}</span></div>
                {order.couponCode ? <div className="flex justify-between gap-4"><span className="flex items-center gap-1 text-muted-foreground"><TicketPercent className="h-4 w-4" />{t("الكوبون", "Coupon")} ({order.couponCode})</span><span className="text-emerald-700">− {discount.toLocaleString()} {t("ج.م", "EGP")}</span></div> : null}
                <div className="flex justify-between gap-4 border-t border-border pt-3 text-base font-bold"><span>{t("الإجمالي", "Total")}</span><span className="text-[#8e6924]">{finalTotal.toLocaleString()} {t("ج.م", "EGP")}</span></div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("حالة التوصيل", "Delivery status")}</CardTitle>
                <CardDescription>{lang === "ar" ? status.descriptionAr : status.descriptionEn}</CardDescription>
              </CardHeader>
              <CardContent>
                {order.status === "cancelled" ? <div className="rounded-lg bg-zinc-100 p-4 text-sm text-zinc-700">{order.cancelledBy === "customer" ? t("تم إلغاء هذا الطلب بناءً على طلبك.", "You cancelled this order.") : (lang === "ar" ? status.descriptionAr : status.descriptionEn)}</div> : <ol className="space-y-4">{DELIVERY_STEPS.map((step, index) => {
                  const complete = index <= currentRank;
                  const active = index === currentRank;
                  const item = STATUS_META[step];
                  return <li key={step} className="flex gap-3"><div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${complete ? "bg-[#ad842f] text-white" : "bg-stone-100 text-stone-400"}`}>{complete ? <Check className="h-4 w-4" /> : <Circle className="h-3 w-3" />}</div><div className="-mt-0.5"><p className={`text-sm font-semibold ${active ? "text-[#8e6924]" : ""}`}>{lang === "ar" ? item.ar : item.en}</p>{active ? <p className="mt-1 text-xs text-muted-foreground">{t("المرحلة الحالية", "Current stage")}</p> : null}</div></li>;
                })}</ol>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><MapPin className="h-5 w-5 text-[#ad842f]" />{t("بيانات التوصيل", "Delivery details")}</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm"><p><span className="text-muted-foreground">{t("الاسم:", "Name:")}</span> {order.customerName}</p><p dir="ltr"><span className="text-muted-foreground">{t("الهاتف:", "Phone:")}</span> {order.customerPhone}</p>{order.customerAddress ? <p><span className="text-muted-foreground">{t("العنوان:", "Address:")}</span> {order.customerAddress}</p> : null}</CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50/50"><CardContent className="pt-6"><p className="font-semibold">{t("هل تحتاج إلى مساعدة؟", "Need help with this order?")}</p><p className="mt-1 text-sm text-muted-foreground">{t("تواصل معنا واذكر رقم الطلب.", "Contact us and mention your order number.")}</p><div className="mt-4 flex flex-wrap gap-2">{callNumber ? <a href={`tel:${callNumber}`}><Button size="sm" variant="outline" className="gap-2"><Phone className="h-4 w-4" />{t("اتصل", "Call")}</Button></a> : null}<Button size="sm" className="gap-2 bg-[#26231e] text-white hover:bg-[#ad842f]" onClick={() => window.open(buildBusinessWhatsAppUrl(contact?.whatsappNumber, `${t("مرحبًا، أحتاج مساعدة بخصوص الطلب رقم", "Hello, I need help with order")} #${order.id}`), "_blank", "noopener,noreferrer")}><MessageCircle className="h-4 w-4" />{t("واتساب", "WhatsApp")}</Button></div></CardContent></Card>
          </div>
        </div>
      </main>
    </PublicLayout>
  );
}

function UnavailableOrder() {
  const { lang } = useLanguage();
  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);
  return (
    <PublicLayout>
      <div className="container max-w-lg py-16 text-center"><AlertCircle className="mx-auto h-12 w-12 text-amber-600" /><h1 className="mt-4 text-2xl font-bold">{t("لا يمكن عرض هذا الطلب", "This order cannot be displayed")}</h1><p className="mt-2 text-muted-foreground">{t("قد يكون رقم الطلب غير صحيح أو أنه لا يتبع حسابك.", "The order number may be invalid or it does not belong to your account.")}</p><Link href="/account"><Button className="mt-6 bg-[#26231e] text-white hover:bg-[#ad842f]">{t("العودة إلى حسابي", "Back to my account")}</Button></Link></div>
    </PublicLayout>
  );
}
