import React, { useState } from "react";
import { Link } from "wouter";
import PublicLayout from "@/components/storefront/PublicLayout";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { UpdateHead } from "@/components/UpdateHead";
import { formatPrice } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { Trash2, ShoppingBag, Plus, Minus, ArrowLeft, MessageCircle, Tag, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const BUSINESS_PHONE = "01121748885";

export default function CartPage() {
  const { lang, isRTL, t } = useLanguage();
  UpdateHead({
    title: lang === "ar" ? "سلة المشتريات | Elnour Homes" : "Shopping Cart | Elnour Homes",
  });

  const {
    items,
    removeItem,
    updateQuantity,
    subtotal,
    discount,
    total,
    couponCode,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [inputCoupon, setInputCoupon] = useState("");

  const validateCoupon = trpc.coupons.validate.useMutation({
    onSuccess: (data) => {
      if (data && data.discountPercent) {
        applyCoupon(inputCoupon.trim().toUpperCase(), data.discountPercent);
        toast.success(lang === "ar" ? `تم تطبيق كود الخصم بنجاح (${data.discountPercent}%)` : `Coupon applied (${data.discountPercent}%)`);
        setInputCoupon("");
      } else {
        toast.error(lang === "ar" ? "كود الخصم غير صحيح أو منتهي الصلاحية" : "Invalid or expired coupon");
      }
    },
    onError: (err) => {
      toast.error(err.message || (lang === "ar" ? "كود الخصم غير صالح" : "Invalid coupon"));
    },
  });

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCoupon.trim()) return;
    validateCoupon.mutate({ code: inputCoupon.trim().toUpperCase() });
  };

  const handleWhatsAppCheckout = () => {
    const itemsList = items
      .map(
        (i) =>
          `• ${i.nameAr || i.name} - الكمية: ${i.quantity}${i.size ? ` (المقاس: ${i.size})` : ""}${i.color ? ` (اللون: ${i.color})` : ""}${i.isPerMeter ? ` (${i.meters} متر)` : ""} - السعر: ${formatPrice(i.price * i.quantity)} ج.م`
      )
      .join("\n");

    const message = `مرحباً Elnour Homes، أود إتمام طلب المنتجات التالية من السلة:\n\n${itemsList}\n\nالإجمالي: ${formatPrice(total)} ج.م${couponCode ? ` (تم تطبيق كود خصم: ${couponCode})` : ""}\n\nيرجى تأكيد موعد التجهيز والتوصيل.`;
    window.open(`https://wa.me/20${BUSINESS_PHONE.slice(1)}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <PublicLayout>
      <section className="container mx-auto px-4 py-12 md:py-16">
        <h1 className="text-3xl md:text-4xl font-black text-[#24211d] mb-8">
          {t("سلة المشتريات", "Shopping Cart")}
        </h1>

        {items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#ddd6c8] bg-white p-16 text-center max-w-2xl mx-auto space-y-4">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#d5af58]/15 text-[#a8822d]">
              <ShoppingBag className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold text-[#24211d]">
              {t("سلة مشترياتك فارغة حالياً", "Your cart is currently empty")}
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {t("تصفح كتالوج منتجاتنا الفاخرة واختر ما يناسب ديكور منزلك من ترابيزات ومرايات واستيل.", "Browse our luxury catalogue and choose the best pieces for your space.")}
            </p>
            <Link href="/products">
              <Button className="mt-4 bg-[#24211d] text-white hover:bg-[#a8822d] px-8 py-6 font-bold text-base rounded-xl">
                {t("تصفح الكتالوج الآن", "Browse Products Now")}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const itemTotal = item.isPerMeter && item.meters ? item.price * item.meters * item.quantity : item.price * item.quantity;
                return (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-[#e8e2d8] bg-white p-5 shadow-xs"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={item.image || "/placeholder-steel.jpg"}
                        alt={item.name}
                        className="h-20 w-20 rounded-xl object-cover border border-[#eee8dd] shrink-0"
                      />
                      <div>
                        <h3 className="font-bold text-base text-[#24211d]">
                          {lang === "ar" ? item.nameAr || item.name : item.name}
                        </h3>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground font-medium">
                          {item.size && <span>المقاس: {item.size}</span>}
                          {item.color && <span>اللون: {item.color}</span>}
                          {item.isPerMeter && item.meters && <span>المساحة: {item.meters} م²</span>}
                        </div>
                        <span className="mt-2 block font-black text-sm text-[#24211d]">
                          {formatPrice(item.price)} {t("ج.م", "EGP")}
                          {item.isPerMeter && <span className="text-[11px] font-normal text-[#a8822d]"> / للمتر</span>}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between w-full sm:w-auto gap-6 pt-3 sm:pt-0 border-t sm:border-0 border-[#eee8dd]">
                      {/* Quantity Controller */}
                      <div className="flex items-center rounded-xl border border-[#ddd6c8] bg-[#faf8f5] p-1">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1.5 rounded-lg hover:bg-white text-[#24211d] transition-colors"
                          aria-label="Decrease"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center font-bold text-sm text-[#24211d]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1.5 rounded-lg hover:bg-white text-[#24211d] transition-colors"
                          aria-label="Increase"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Total Item Price */}
                      <span className="font-black text-base text-[#24211d] min-w-20 text-left" dir="ltr">
                        {formatPrice(itemTotal)} {t("ج.م", "EGP")}
                      </span>

                      {/* Delete */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-muted-foreground hover:text-red-600 transition-colors"
                        title="حذف من السلة"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary & Actions */}
            <div className="space-y-6">
              <div className="rounded-3xl border border-[#e8e2d8] bg-white p-6 shadow-xs space-y-6">
                <h2 className="text-xl font-bold text-[#24211d] border-b border-[#eee8dd] pb-4">
                  {t("ملخص الحساب", "Order Summary")}
                </h2>

                {/* Coupon input */}
                <div>
                  <label className="text-xs font-bold text-[#5c5448] block mb-2">
                    {t("كود الخصم أو الكوبون:", "Promo / Coupon Code:")}
                  </label>
                  {couponCode ? (
                    <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-300 p-3 text-sm">
                      <div className="flex items-center gap-2 text-emerald-800 font-bold">
                        <Tag className="h-4 w-4" />
                        <span>{couponCode} (تم تطبيق الخصم)</span>
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="text-xs text-red-600 hover:underline font-bold"
                      >
                        إلغاء
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <Input
                        value={inputCoupon}
                        onChange={(e) => setInputCoupon(e.target.value)}
                        placeholder="أدخل كود الخصم..."
                        className="rounded-xl uppercase font-mono"
                      />
                      <Button
                        type="submit"
                        disabled={validateCoupon.isPending}
                        variant="outline"
                        className="font-bold border-[#d5af58] text-[#a8822d]"
                      >
                        {validateCoupon.isPending ? "فحص..." : "تطبيق"}
                      </Button>
                    </form>
                  )}
                </div>

                {/* Totals Breakdown */}
                <div className="space-y-3 text-sm border-t border-[#eee8dd] pt-4">
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t("المجموع الفرعي:", "Subtotal:")}</span>
                    <span className="font-bold text-[#24211d]" dir="ltr">{formatPrice(subtotal)} ج.م</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>{t("قيمة الخصم:", "Discount:")}</span>
                      <span dir="ltr">-{formatPrice(discount)} ج.م</span>
                    </div>
                  )}

                  <div className="flex justify-between text-muted-foreground">
                    <span>{t("الشحن والتوصيل:", "Shipping:")}</span>
                    <span className="text-xs font-bold text-[#a8822d]">{t("يحدد حسب العنوان والمحافظة", "Calculated at checkout")}</span>
                  </div>

                  <div className="flex justify-between text-lg font-black text-[#24211d] border-t border-[#eee8dd] pt-3">
                    <span>{t("الإجمالي النهائي:", "Total:")}</span>
                    <span className="text-[#a8822d]" dir="ltr">{formatPrice(total)} ج.م</span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="space-y-3 pt-2">
                  <Link href="/checkout">
                    <Button className="w-full h-12 bg-[#24211d] text-white hover:bg-[#a8822d] font-bold text-base rounded-xl shadow-md">
                      {t("متابعة الدفع وتأكيد الطلب", "Proceed to Checkout")}
                      <ArrowLeft className={`h-4 w-4 ${isRTL ? "mr-2" : "ml-2 rotate-180"}`} />
                    </Button>
                  </Link>

                  <Button
                    onClick={handleWhatsAppCheckout}
                    variant="outline"
                    className="w-full h-12 border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-bold text-base rounded-xl"
                  >
                    <MessageCircle className="ml-2 h-5 w-5" />
                    {t("إتمام الطلب مباشرة عبر واتساب", "Order via WhatsApp")}
                  </Button>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>ضمان كامل على الاستيل واللحام والتشطيب</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
