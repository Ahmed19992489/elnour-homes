import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { Loader2, ShoppingCart, Truck, BadgeCheck, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { cartTotals } from "@/lib/cart";
import { trpc } from "@/lib/trpc";
import PublicLayout from "@/components/storefront/PublicLayout";

function formatPrice(price: number) {
  return price.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function priceDisplay(price: number, lang: string) {
  return `${formatPrice(price)} ${lang === "ar" ? "ج.م" : "EGP"}`;
}

export default function CheckoutPage() {
  const { lang, t } = useLanguage();
  const { items, empty } = useCart();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [hydrated, setHydrated] = useState(false);

  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "",
    message: "",
  });

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        customerName: prev.customerName || user.name || "",
        customerPhone: prev.customerPhone || user.phone || "",
        customerEmail: prev.customerEmail || user.email || "",
        customerAddress: prev.customerAddress || user.address || "",
        message: prev.message,
      }));
    }
  }, [user]);
  const [emailError, setEmailError] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponState, setCouponState] = useState<{
    valid: boolean | null;
    discount: number;
    message: string;
    checking: boolean;
  }>({ valid: null, discount: 0, message: "", checking: false });

  useEffect(() => {
    setHydrated(true);
  }, []);

  const productIds = useMemo(
    () => Array.from(new Set(items.map((i) => i.productId))),
    [items],
  );

  const { data: products } = trpc.products.active.useQuery(undefined, {
    enabled: hydrated && productIds.length > 0,
  });

  const availableItems = useMemo(() => {
    const map = new Map<number, NonNullable<typeof products>[number]>();
    (products ?? []).forEach((p) => map.set(p.id, p));
    return items.filter((i) => map.get(i.productId)?.isActive === "yes");
  }, [items, products]);

  const { subtotal } = cartTotals(availableItems);
  const discount = couponState.valid ? couponState.discount : 0;
  const finalTotal = Math.max(0, subtotal - discount);

  const trackPageview = trpc.pageviews.track.useMutation();
  useEffect(() => {
    let sessionId = sessionStorage.getItem("_sessionId");
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem("_sessionId", sessionId);
    }
    trackPageview.mutate({
      sessionId,
      path: "/checkout",
      referrer: document.referrer || undefined,
      userAgent: navigator.userAgent,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateCoupon = trpc.coupons.validate.useMutation({
    onSuccess: (data) => {
      const reason = data.valid
        ? (lang === "ar" ? "الكوبون صحيح" : "Coupon applied")
        : (lang === "en" ? "This coupon is invalid" : "الكوبون غير صالح");
      setCouponState({ valid: data.valid, discount: data.discount, message: reason, checking: false });
      if (!data.valid) toast.error(reason);
      else toast.success(lang === "en" ? `${reason} — ${data.discount} EGP off` : `${reason} — خصم ${data.discount} ج.م`);
    },
    onError: (err) => {
      setCouponState({ valid: false, discount: 0, message: err.message, checking: false });
      toast.error(err.message);
    },
  });

  const createCartOrder = trpc.orders.createCart.useMutation({
    onSuccess: (data) => {
      toast.success(
        lang === "ar"
          ? `تم استلام طلبك بنجاح${data.orderId ? ` (رقم الطلب: ${data.orderId})` : ""}. سنتواصل معك قريبًا.`
          : `Your order was received successfully${data.orderId ? ` (Order #${data.orderId})` : ""}. We'll contact you soon.`,
      );
      empty();
      if (data.orderId) navigate(`/account/orders/${data.orderId}`);
      else navigate("/account");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const setField = (field: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    if (!form.customerName.trim()) {
      toast.error(lang === "ar" ? "يرجى إدخال الاسم" : "Please enter your name");
      return;
    }
    if (!/^(01|\+?20|20)?1[0125][0-9]{8}$/.test(form.customerPhone.trim().replace(/\s+/g, ""))) {
      toast.error(lang === "ar" ? "يرجى إدخال رقم هاتف مصري صحيح يبدأ بـ 01" : "Please enter a valid Egyptian phone number starting with 01");
      return;
    }
    if (form.customerEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail.trim())) {
      setEmailError(lang === "ar" ? "يرجى إدخال بريد إلكتروني صحيح" : "Please enter a valid email address");
      return;
    }
    if (availableItems.length === 0) {
      toast.error(lang === "ar" ? "السلة فارغة أو المنتجات لم تعد متاحة" : "Your cart is empty or the products are no longer available");
      return;
    }
    createCartOrder.mutate({
      customerName: form.customerName.trim(),
      customerPhone: form.customerPhone.trim(),
      customerEmail: form.customerEmail.trim() || undefined,
      customerAddress: form.customerAddress.trim() || undefined,
      message: form.message.trim() || undefined,
      items: availableItems.map((i) => ({
        productId: i.productId,
        selectedSize: i.selectedSize,
        selectedColor: i.selectedColor,
        quantity: i.quantity,
      })),
      couponCode: couponState.valid ? couponCode.trim().toUpperCase() : undefined,
      orderValue: couponState.valid ? finalTotal : undefined,
      orderSource: "web",
      referrer: document.referrer || undefined,
      userAgent: navigator.userAgent,
    });
  };

  const productById = useMemo(() => {
    const map = new Map<number, NonNullable<typeof products>[number]>();
    (products ?? []).forEach((p) => map.set(p.id, p));
    return map;
  }, [products]);

  if (!hydrated || items.length === 0) {
    return (
      <PublicLayout>
        <div className="container max-w-3xl py-12 text-center">
          <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">
            {lang === "ar" ? "لا يوجد طلب لإتمامه" : "Nothing to checkout"}
          </h1>
          <Button asChild className="mt-6">
            <Link href="/cart">{lang === "ar" ? "عرض السلة" : "View cart"}</Link>
          </Button>
        </div>
      </PublicLayout>
    );
  }

  const unavailable = items.filter((i) => productById.get(i.productId)?.isActive !== "yes");

  return (
    <PublicLayout>
      <div className="container max-w-4xl py-10">
        <h1 className="text-2xl font-bold">
          {lang === "ar" ? "إتمام الطلب" : "Checkout"}
        </h1>

        {unavailable.length > 0 && (
          <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            {lang === "ar"
              ? "تم استبعاد منتجات غير متاحة من الطلب."
              : "Unavailable products were excluded from your order."}
            <Button
              variant="ghost"
              size="sm"
              className="mt-1 p-0 text-amber-800 underline"
              onClick={() => navigate("/cart")}
            >
              {lang === "ar" ? "العودة إلى السلة" : "Back to cart"}
            </Button>
          </div>
        )}

        {availableItems.length === 0 ? (
          <div className="mt-6 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {lang === "ar" ? "جميع منتجات سلتك لم تعد متاحة. العودة إلى السلة." : "All items in your cart are no longer available. Back to cart."}
          </div>
        ) : (
          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">
                  {lang === "ar" ? "بيانات التواصل والتوصيل" : "Contact & delivery details"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {lang === "ar"
                    ? "سنتواصل معك لتأكيد الطلب وترتيب التوصيل."
                    : "We'll contact you to confirm the order and arrange delivery."}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="c-name">{lang === "ar" ? "الاسم" : "Name"} *</Label>
                  <Input
                    id="c-name"
                    required
                    autoComplete="name"
                    value={form.customerName}
                    onChange={(e) => setField("customerName", e.target.value)}
                    placeholder={lang === "ar" ? "الاسم الكامل" : "Full name"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-phone">{lang === "ar" ? "رقم الهاتف" : "Phone number"} *</Label>
                  <Input
                    id="c-phone"
                    required
                    autoComplete="tel"
                    dir="ltr"
                    value={form.customerPhone}
                    onChange={(e) => setField("customerPhone", e.target.value)}
                    placeholder={lang === "ar" ? "01xxxxxxxxx" : "01xxxxxxxxx"}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="c-email">{lang === "ar" ? "البريد الإلكتروني" : "Email"} ({lang === "ar" ? "اختياري — لاستقبال تحديثات الطلب" : "optional — for order updates"})</Label>
                <Input
                  id="c-email"
                  type="email"
                  autoComplete="email"
                  dir="ltr"
                  value={form.customerEmail}
                  onChange={(e) => setField("customerEmail", e.target.value)}
                  placeholder={lang === "ar" ? "example@email.com" : "example@email.com"}
                />
                {emailError && <p className="text-sm text-destructive">{emailError}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="c-address">{lang === "ar" ? "العنوان" : "Address"}</Label>
                <Input
                  id="c-address"
                  value={form.customerAddress}
                  onChange={(e) => setField("customerAddress", e.target.value)}
                  placeholder={lang === "ar" ? "المحافظة — المنطقة — الشارع" : "Governorate — area — street"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="c-message">{lang === "ar" ? "ملاحظات إضافية" : "Additional notes"}</Label>
                <Textarea
                  id="c-message"
                  rows={2}
                  value={form.message}
                  onChange={(e) => setField("message", e.target.value)}
                  placeholder={lang === "ar" ? "أي تفاصيل عن التصميم أو التوصيل..." : "Any details about the design or delivery..."}
                />
              </div>

              <div className="rounded-lg border border-border/70 bg-card p-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="c-coupon" className="font-semibold">
                    <BadgeCheck className="me-1 inline h-4 w-4" />
                    {lang === "ar" ? "كوبون الخصم" : "Coupon code"}
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!couponCode.trim() || validateCoupon.isPending}
                    onClick={() => {
                      setCouponState((s) => ({ ...s, checking: true }));
                      validateCoupon.mutate({ code: couponCode.trim().toUpperCase(), orderValue: subtotal });
                    }}
                  >
                    {validateCoupon.isPending && <Loader2 className="me-1 h-3.5 w-3.5 animate-spin" />}
                    {lang === "ar" ? "تطبيق" : "Apply"}
                  </Button>
                </div>
                <Input
                  id="c-coupon"
                  className="mt-3"
                  dir="ltr"
                  placeholder={lang === "ar" ? "أدخل كود الكوبون" : "Enter coupon code"}
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value);
                    if (couponState.valid !== null) setCouponState({ valid: null, discount: 0, message: "", checking: false });
                  }}
                />
                {couponState.message && (
                  <p className={`mt-2 text-sm ${couponState.valid ? "text-green-600" : "text-destructive"}`}>
                    {couponState.message}
                  </p>
                )}
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={createCartOrder.isPending}>
                {createCartOrder.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {lang === "ar" ? "تأكيد الطلب" : "Place order"}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                {lang === "ar"
                  ? "بتأكيد الطلب أنت توافق على تواصل فريقنا معك لتأكيد التفاصيل. الدفع عند الاستلام أو عبر واتساب."
                  : "By placing the order you agree that our team will contact you to confirm the details. Payment on delivery or via WhatsApp."}
              </p>
            </form>

            <aside className="h-fit rounded-lg border border-border/70 bg-card p-5">
              <h2 className="text-lg font-semibold">
                {lang === "ar" ? "ملخص الطلب" : "Order summary"}
              </h2>
              <div className="mt-4 space-y-3">
                {availableItems.map((item) => {
                  const product = productById.get(item.productId);
                  const variant = [item.selectedSize, item.selectedColor].filter(Boolean).join(" • ");
                  return (
                    <div key={`${item.productId}|${item.selectedSize ?? ""}|${item.selectedColor ?? ""}`} className="flex justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate">
                          {product ? (lang === "ar" ? product.nameAr : product.name) : `#${item.productId}`}
                        </p>
                        {variant && <p dir="auto" className="text-muted-foreground">{variant} × {item.quantity}</p>}
                      </div>
                      <p className="shrink-0 font-medium">{priceDisplay(item.unitPrice * item.quantity, lang)}</p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 border-t border-border/70 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{lang === "ar" ? "المجموع الفرعي" : "Subtotal"}</span>
                  <span>{priceDisplay(subtotal, lang)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>{lang === "ar" ? "الخصم" : "Discount"}</span>
                    <span>− {priceDisplay(discount, lang)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-border/70 pt-3 text-base font-bold">
                  <span>{lang === "ar" ? "الإجمالي" : "Total"}</span>
                  <span>{priceDisplay(finalTotal, lang)}</span>
                </div>
              </div>
              <div className="mt-5 space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  {lang === "ar" ? "التوصيل يُحدد معك أثناء تأكيد الطلب" : "Delivery details confirmed with you on order confirmation"}
                </p>
                <p className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  {lang === "ar" ? "متاح أيضًا الطلب المباشر عبر واتساب من صفحة المنتج" : "You can also order directly via WhatsApp from the product page"}
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
