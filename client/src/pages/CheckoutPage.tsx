import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import PublicLayout from "@/components/storefront/PublicLayout";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { UpdateHead } from "@/components/UpdateHead";
import { trpc } from "@/lib/trpc";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CheckCircle2, ShoppingBag, Truck, MessageCircle, ArrowLeft, ShieldCheck } from "lucide-react";

const BUSINESS_PHONE = "01121748885";

const EGYPT_GOVERNORATES = [
  "القاهرة", "الجيزة", "الإسكندرية", "القليوبية", "الشرقية", "الدقهلية",
  "البحيرة", "المنوفية", "الغربية", "كفر الشيخ", "دمياط", "بورسعيد",
  "الإسماعيلية", "السويس", "شمال سيناء", "جنوب سيناء", "البحر الأحمر",
  "الفيوم", "بني سويف", "المنيا", "أسيوط", "سوهاج", "قنا", "الأقصر", "أسوان", "مطروح", "الوادي الجديد"
];

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const { lang, isRTL, t } = useLanguage();
  UpdateHead({
    title: lang === "ar" ? "تأكيد الطلب والدفع | Elnour Homes" : "Checkout | Elnour Homes",
  });

  const { items, total, subtotal, discount, couponCode, clearCart } = useCart();

  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    governorate: "القاهرة",
    city: "",
    address: "",
    notes: "",
  });

  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);

  const createOrder = trpc.orders.create.useMutation({
    onSuccess: (order) => {
      setCreatedOrderId(order.id);
      clearCart();
      toast.success(lang === "ar" ? "تم تسجيل طلبك بنجاح! سنتواصل معك للتأكيد." : "Order placed successfully!");
    },
    onError: (err) => {
      toast.error(err.message || (lang === "ar" ? "حدث خطأ أثناء تسجيل الطلب، يرجى المحاولة مرة أخرى" : "Error placing order"));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName.trim() || !form.phone.trim() || !form.address.trim()) {
      toast.error("يرجى إدخال جميع البيانات الإلزامية");
      return;
    }

    if (items.length === 0) {
      toast.error("سلة مشترياتك فارغة");
      return;
    }

    // Build payload
    createOrder.mutate({
      customerName: form.customerName.trim(),
      customerPhone: form.phone.trim(),
      customerAddress: `${form.governorate} - ${form.city ? form.city + " - " : ""}${form.address.trim()}`,
      notes: form.notes ? form.notes.trim() : undefined,
      couponCode: couponCode || undefined,
      items: items.map((i) => ({
        productId: i.productId,
        productName: i.nameAr || i.name,
        price: i.price,
        quantity: i.quantity,
        size: i.size,
        color: i.color,
        meters: i.meters,
        isPerMeter: i.isPerMeter ? true : false,
      })),
      totalAmount: total,
    });
  };

  const handleWhatsAppConfirmation = () => {
    if (!createdOrderId) return;
    const message = `مرحباً Elnour Homes، لقد قمت بتسجيل طلب جديد رقم #${createdOrderId} باسم ${form.customerName}.\nأرجو تأكيد استلام الطلب وموعد التوصيل. شكراً لكم!`;
    window.open(`https://wa.me/20${BUSINESS_PHONE.slice(1)}?text=${encodeURIComponent(message)}`, "_blank");
  };

  if (createdOrderId) {
    return (
      <PublicLayout>
        <section className="container mx-auto px-4 py-16 text-center max-w-xl">
          <div className="rounded-3xl border border-emerald-200 bg-white p-8 md:p-12 shadow-sm space-y-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-12 w-12" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-black text-[#24211d]">
                {t("تم استلام وتأكيد طلبك بنجاح!", "Order Received Successfully!")}
              </h1>
              <p className="text-sm font-bold text-[#a8822d]">
                {t(`رقم الطلب: #${createdOrderId}`, `Order Number: #${createdOrderId}`)}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed pt-2">
                {t(
                  "شكراً لثقتك في Elnour Homes. سيقوم فريق خدمة العملاء بالتواصل معك هاتفياً أو عبر واتساب لمراجعة المقاسات وموعد التسليم.",
                  "Thank you for choosing Elnour Homes. Our support team will contact you shortly to review dimensions and delivery schedule."
                )}
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleWhatsAppConfirmation}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 rounded-xl"
              >
                <MessageCircle className="ml-2 h-5 w-5" />
                {t("متابعة الطلب على واتساب", "Follow up on WhatsApp")}
              </Button>

              <Link href={`/account/orders/${createdOrderId}`} className="flex-1">
                <Button variant="outline" className="w-full font-bold h-12 rounded-xl border-[#d5af58]">
                  {t("عرض تفاصيل الفاتورة", "View Invoice")}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <section className="container mx-auto px-4 py-12 md:py-16">
        <h1 className="text-3xl md:text-4xl font-black text-[#24211d] mb-8">
          {t("إتمام الطلب وتأكيد البيانات", "Checkout & Order Details")}
        </h1>

        {items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#ddd6c8] bg-white p-12 text-center max-w-md mx-auto">
            <p className="font-bold text-lg text-[#24211d]">{t("لا توجد منتجات في السلة", "Your cart is empty")}</p>
            <Link href="/products">
              <Button className="mt-4 bg-[#24211d] text-white hover:bg-[#a8822d] font-bold">
                {t("العودة للتسوق", "Back to Shopping")}
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Customer Information Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-3xl border border-[#e8e2d8] bg-white p-6 md:p-8 shadow-xs space-y-6">
                <div className="flex items-center gap-3 border-b border-[#eee8dd] pb-4">
                  <Truck className="h-5 w-5 text-[#a8822d]" />
                  <h2 className="text-xl font-bold text-[#24211d]">
                    {t("بيانات العميل والشحن", "Customer & Delivery Details")}
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#5c5448] block mb-1.5">
                      {t("الاسم بالكامل *", "Full Name *")}
                    </label>
                    <Input
                      value={form.customerName}
                      onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                      placeholder="مثال: أحمد محمد سالم"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#5c5448] block mb-1.5">
                      {t("رقم الهاتف المحمول (واتساب) *", "Phone / WhatsApp *")}
                    </label>
                    <Input
                      dir="ltr"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="01112345678"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#5c5448] block mb-1.5">
                      {t("المحافظة *", "Governorate *")}
                    </label>
                    <select
                      value={form.governorate}
                      onChange={(e) => setForm({ ...form, governorate: e.target.value })}
                      className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#d5af58]"
                    >
                      {EGYPT_GOVERNORATES.map((gov) => (
                        <option key={gov} value={gov}>{gov}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#5c5448] block mb-1.5">
                      {t("المدينة / المنطقة", "City / Area")}
                    </label>
                    <Input
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      placeholder="مثال: مدينة نصر / التجمع الخامس"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#5c5448] block mb-1.5">
                    {t("العنوان التفصيلي (الشارع - رقم العمارة - الدور) *", "Detailed Street Address *")}
                  </label>
                  <Textarea
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="مثال: شارع التسعين الشمالي، عمارة 45، الدور الثالث شقة 6"
                    rows={2}
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#5c5448] block mb-1.5">
                    {t("ملاحظات خاصة بالتصميم أو التوصيل (اختياري)", "Special Notes / Custom Requests")}
                  </label>
                  <Textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="مثال: برجاء دهان الاستيل بلون ذهبي مطفي، أو مواعيد تسليم مسائية..."
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Order Summary & Confirm */}
            <div className="space-y-6">
              <div className="rounded-3xl border border-[#e8e2d8] bg-white p-6 shadow-xs space-y-6">
                <h2 className="text-xl font-bold text-[#24211d] border-b border-[#eee8dd] pb-4">
                  {t("محتويات الطلب", "Order Summary")}
                </h2>

                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm py-2 border-b border-[#f4f0e8]">
                      <div>
                        <span className="font-bold text-[#24211d] block">{item.nameAr || item.name}</span>
                        <span className="text-xs text-muted-foreground">
                          الكمية: {item.quantity} {item.size ? `· المقاس: ${item.size}` : ""}
                        </span>
                      </div>
                      <span className="font-black text-[#24211d]" dir="ltr">
                        {formatPrice(item.price * item.quantity)} ج.م
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 text-sm border-t border-[#eee8dd] pt-4">
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t("المجموع الفرعي:", "Subtotal:")}</span>
                    <span dir="ltr">{formatPrice(subtotal)} ج.م</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>{t("الخصم:", "Discount:")}</span>
                      <span dir="ltr">-{formatPrice(discount)} ج.م</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-black text-[#24211d] border-t border-[#eee8dd] pt-3">
                    <span>{t("الإجمالي المطلوب:", "Total Amount:")}</span>
                    <span className="text-[#a8822d]" dir="ltr">{formatPrice(total)} ج.م</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={createOrder.isPending}
                  className="w-full h-12 bg-[#24211d] text-white hover:bg-[#a8822d] font-bold text-base rounded-xl shadow-lg"
                >
                  {createOrder.isPending ? "جاري تأكيد الطلب..." : "تأكيد وإرسال الطلب الآن"}
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>الدفع عند الاستلام والمعاينة</span>
                </div>
              </div>
            </div>
          </form>
        )}
      </section>
    </PublicLayout>
  );
}
