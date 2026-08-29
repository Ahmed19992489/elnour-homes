import React from "react";
import { useParams, Link } from "wouter";
import PublicLayout from "@/components/storefront/PublicLayout";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { UpdateHead } from "@/components/UpdateHead";
import { formatPrice, formatDate } from "@/lib/utils";
import { Loader2, Package, CheckCircle2, Clock, Truck, MessageCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const BUSINESS_PHONE = "01121748885";

const STATUS_MAP: Record<string, { labelAr: string; labelEn: string; color: string }> = {
  new: { labelAr: "طلب جديد قيد المراجعة", labelEn: "New Order", color: "bg-blue-50 text-blue-700 border-blue-300" },
  contacted: { labelAr: "تم التواصل مع العميل", labelEn: "Contacted", color: "bg-amber-50 text-amber-700 border-amber-300" },
  confirmed: { labelAr: "تم تأكيد الطلب وجاري التنفيذ", labelEn: "Confirmed", color: "bg-purple-50 text-purple-700 border-purple-300" },
  shipped: { labelAr: "جاري الشحن والتوصيل", labelEn: "Shipped", color: "bg-indigo-50 text-indigo-700 border-indigo-300" },
  delivered: { labelAr: "تم التسليم بنجاح", labelEn: "Delivered", color: "bg-emerald-50 text-emerald-700 border-emerald-300" },
  cancelled: { labelAr: "تم إلغاء الطلب", labelEn: "Cancelled", color: "bg-red-50 text-red-700 border-red-300" },
};

export default function OrderDetails() {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const { lang, isRTL, t } = useLanguage();

  UpdateHead({
    title: `تفاصيل الطلب #${orderId} | Elnour Homes`,
  });

  const { data: order, isLoading } = trpc.orders.byId.useQuery({ id: orderId }, { enabled: !isNaN(orderId) });

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#d5af58]" />
        </div>
      </PublicLayout>
    );
  }

  if (!order) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold text-[#24211d]">{t("لم يتم العثور على هذا الطلب", "Order not found")}</h2>
          <Link href="/account">
            <Button className="mt-6 font-bold">{t("العودة لحسابي", "Back to My Account")}</Button>
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const itemsList = Array.isArray(order.items)
    ? order.items
    : typeof order.items === "string"
    ? JSON.parse(order.items || "[]")
    : [];

  const statusInfo = STATUS_MAP[order.status] || {
    labelAr: order.status,
    labelEn: order.status,
    color: "bg-gray-50 text-gray-700 border-gray-300",
  };

  const handleWhatsAppInquiry = () => {
    const message = `مرحباً Elnour Homes، أستفسر عن حالة الطلب رقم #${order.id} باسم ${order.customerName || "العميل"}.`;
    window.open(`https://wa.me/20${BUSINESS_PHONE.slice(1)}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <PublicLayout>
      <section className="container mx-auto px-4 py-12 md:py-16 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#e8e2d8] pb-6 mb-8">
          <div>
            <span className="text-xs font-bold text-[#a8822d] uppercase tracking-wider block">
              {t("فاتورة وتفاصيل الطلب", "Order Invoice & Tracking")}
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-[#24211d] mt-1">
              {t(`طلب رقم #${order.id}`, `Order #${order.id}`)}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              تاريخ التسجيل: {formatDate(order.createdAt)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className={`px-3 py-1 text-sm font-bold ${statusInfo.color}`}>
              {lang === "ar" ? statusInfo.labelAr : statusInfo.labelEn}
            </Badge>
            <Button
              onClick={handleWhatsAppInquiry}
              variant="outline"
              size="sm"
              className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-bold"
            >
              <MessageCircle className="ml-1.5 h-4 w-4" />
              استفسار عبر واتساب
            </Button>
          </div>
        </div>

        {/* Customer & Delivery Summary Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="rounded-2xl border border-[#e8e2d8] bg-white p-6 shadow-xs">
            <h3 className="font-bold text-sm text-[#a8822d] mb-3">بيانات العميل المستلم:</h3>
            <p className="font-bold text-base text-[#24211d]">{order.customerName}</p>
            <p className="text-sm text-muted-foreground mt-1" dir="ltr">{order.customerPhone}</p>
            {order.customerEmail && <p className="text-sm text-muted-foreground">{order.customerEmail}</p>}
          </div>

          <div className="rounded-2xl border border-[#e8e2d8] bg-white p-6 shadow-xs">
            <h3 className="font-bold text-sm text-[#a8822d] mb-3">عنوان وملاحظات التوصيل:</h3>
            <p className="text-sm text-[#24211d] leading-relaxed">{order.customerAddress || "لم يحدد"}</p>
            {order.notes && (
              <p className="text-xs text-amber-800 bg-amber-50 rounded-lg p-2 mt-2 border border-amber-200">
                ملاحظات: {order.notes}
              </p>
            )}
          </div>
        </div>

        {/* Ordered Items Table */}
        <div className="rounded-3xl border border-[#e8e2d8] bg-white p-6 md:p-8 shadow-xs space-y-6">
          <h2 className="text-lg font-bold text-[#24211d] border-b border-[#eee8dd] pb-4">
            قائمة المنتجات المطلوبة
          </h2>

          <div className="space-y-4">
            {itemsList.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between py-3 border-b border-[#f4f0e8] text-sm">
                <div>
                  <p className="font-bold text-[#24211d]">{item.productName || item.name || "منتج استيل"}</p>
                  <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>الكمية: {item.quantity}</span>
                    {item.size && <span>· المقاس: {item.size}</span>}
                    {item.color && <span>· اللون: {item.color}</span>}
                    {item.isPerMeter && item.meters && <span>· المساحة: {item.meters} م²</span>}
                  </div>
                </div>
                <span className="font-black text-[#24211d]" dir="ltr">
                  {formatPrice(item.price * (item.quantity || 1))} ج.م
                </span>
              </div>
            ))}
          </div>

          {/* Pricing Totals */}
          <div className="border-t border-[#eee8dd] pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-base font-black text-[#24211d]">
              <span>الإجمالي النهائي:</span>
              <span className="text-[#a8822d]" dir="ltr">{formatPrice(order.totalAmount)} ج.م</span>
            </div>
            {order.couponCode && (
              <p className="text-xs text-emerald-700">تم استخدام كود خصم: {order.couponCode}</p>
            )}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
