import React, { useEffect, useRef, useState } from "react";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { buildBusinessWhatsAppUrl } from "@/lib/orderWhatsApp";
import PublicLayout from "@/components/storefront/PublicLayout";
import CustomerAuthDialog from "@/components/storefront/CustomerAuthDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Bell, Copy, Gift, Loader2, Package, Save, ShieldCheck, MessageCircle, Phone, History, UserRound, Star, Users } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { StarRatingDisplay, InteractiveRating } from "@/components/storefront/StarRating";

const STATUS_AR: Record<string, string> = {
  new: "طلب جديد",
  contacted: "تم التواصل",
  confirmed: "تم التأكيد",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغي",
};
const STATUS_EN: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_COLOR: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-amber-100 text-amber-800",
  confirmed: "bg-purple-100 text-purple-800",
  shipped: "bg-cyan-100 text-cyan-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-zinc-200 text-zinc-600",
};

export default function MyAccount() {
  const { lang, isRTL } = useLanguage();
  const { user, loading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const utils = trpc.useUtils();
  const { data: profile, isLoading: profileLoading } = trpc.account.me.useQuery(undefined, { enabled: !!user });
  const { data: myOrders, isLoading: ordersLoading } = trpc.account.orders.useQuery(undefined, { enabled: !!user });
  const { data: notifications, isLoading: notificationsLoading } = trpc.account.notifications.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
  const { data: contact } = trpc.contactInfo.get.useQuery();
  const { data: reviewableProducts, isLoading: reviewableLoading } = trpc.reviews.my.useQuery(undefined, {
    enabled: !!user,
    refetchOnWindowFocus: false,
  });
  const { data: referral } = trpc.referral.mine.useQuery(undefined, { enabled: !!user, refetchOnWindowFocus: false });
  const [reviewDrafts, setReviewDrafts] = useState<Record<number, { rating: number; comment: string }>>({});
  const createReview = trpc.reviews.create.useMutation({
    onSuccess: () => {
      toast.success(lang === "ar" ? "شكرًا لك! سيظهر تقييمك على صفحة المنتج" : "Thank you! Your review will appear on the product page");
      void utils.reviews.invalidate();
      void utils.account.invalidate();
    },
    onError: (error: any) => {
      const message = error?.message ?? "";
      toast.error(
        message.includes("لقد قمت بتقييم")
          ? (lang === "ar" ? "لقد قيّمت هذا المنتج من قبل" : "You already reviewed this product")
          : (lang === "ar" ? "فشل إرسال التقييم: " + message : "Review failed: " + message),
      );
    },
  });

  // First-visit onboarding: a customer whose account has no personal data yet
  // sees a compact form to save their name/phone before the full view.
  const needsOnboarding =
    !!user && user.role !== "admin" && !profileLoading && profile && !(profile.name || profile.phone);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const knownNotificationIds = useRef<Set<number> | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setPhone(profile.phone ?? "");
      setAddress(profile.address ?? "");
    }
  }, [profile]);

  useEffect(() => {
    if (!user || user.role === "admin") return;
    if (typeof EventSource === "undefined") return;
    const stream = new EventSource("/api/notifications/stream");
    const refreshNotifications = () => {
      void utils.account.notifications.invalidate();
      void utils.account.orders.invalidate();
    };
    stream.addEventListener("order_notification", refreshNotifications);
    return () => {
      stream.removeEventListener("order_notification", refreshNotifications);
      stream.close();
    };
  }, [user?.id, user?.role, utils]);

  useEffect(() => {
    if (!notifications) return;
    const currentIds = new Set(notifications.map((notification) => notification.id));
    if (knownNotificationIds.current) {
      const freshNotifications = notifications.filter((notification) => !knownNotificationIds.current!.has(notification.id));
      if (freshNotifications.length) {
        toast.info(
          lang === "ar"
            ? `لديك تحديث جديد للطلب #${freshNotifications[0].orderId}`
            : `You have a new update for order #${freshNotifications[0].orderId}`,
        );
      }
    }
    knownNotificationIds.current = currentIds;
  }, [notifications, lang]);

  const updateProfileMutation = trpc.account.updateProfile.useMutation({
    onSuccess: () => {
      utils.account.me.invalidate();
      toast.success(lang === "ar" ? "تم تحديث بياناتك" : "Profile updated");
    },
    onError: (error) => toast.error(lang === "ar" ? "فشل التحديث: " + error.message : "Update failed: " + error.message),
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({ name, phone, address });
  };

  const draftFor = (productId: number) => reviewDrafts[productId] ?? { rating: 5, comment: "" };
  const setDraft = (productId: number, patch: Partial<{ rating: number; comment: string }>) => {
    setReviewDrafts((prev) => ({ ...prev, [productId]: { ...draftFor(productId), ...patch } }));
  };
  const submitReview = (productId: number) => {
    const draft = draftFor(productId);
    createReview.mutate({ productId, rating: draft.rating, comment: draft.comment.trim() || undefined });
  };

  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);

  // Direct call number taken from site contact settings (phone field)
  const callNumber = (contact?.phone ?? "").replace(/[^0-9+]/g, "");
  const supportWhatsAppUrl = buildBusinessWhatsAppUrl(contact?.whatsappNumber);

  if (!loading && !user) {
    return (
      <PublicLayout>
        <div className="container py-16 text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-[#ad842f]" />
          <h1 className="mt-4 text-2xl font-bold">{t("أنشئ حسابك أو سجّل الدخول", "Create your account or sign in")}</h1>
          <p className="mt-2 max-w-md mx-auto text-muted-foreground">
            {t(
              "سجّل الدخول برقم هاتفك لمتابعة حالة طلباتك وفواتيرك، وتحديث عنوانك والتواصل المباشر مع فريق المبيعات.",
              "Sign in with your phone number to track your order status and invoices, update your details, and contact our sales team directly.",
            )}
          </p>
          <Button className="mt-6 bg-[#26231e] text-white hover:bg-[#ad842f] px-8 h-11 font-bold" onClick={() => setAuthOpen(true)}>
            {t("دخول / إنشاء حساب", "Sign in / Create account")}
          </Button>
          <CustomerAuthDialog open={authOpen} onOpenChange={setAuthOpen} />
          <p className="mt-4 text-xs text-muted-foreground">
            {t(
              "تسجيل دخول فوري وآمن برقم الهاتف الخاص بك دون أي تعقيد.",
              "Fast and secure instant login with your phone number.",
            )}
          </p>
        </div>
      </PublicLayout>
    );
  }

  // Onboarding screen: compact, single focus.
  if (needsOnboarding) {
    return (
      <PublicLayout>
        <div className="container max-w-lg py-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="h-5 w-5 text-[#ad842f]" />
                {t("أكمل بياناتك الأولى", "Complete your profile")}
              </CardTitle>
              <CardDescription>
                {t(
                  "أخبرنا باسمك ورقم هاتفك لنربطهما بحسابك، ولن نتمكن من إرسال طلباتك إلا بعد تحديث البيانات.",
                  "Tell us your name and phone so we can link them to your account and process your orders.",
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("الاسم", "Name")}</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("اكتب اسمك", "Your name")} />
                </div>
                <div className="space-y-2">
                  <Label>{t("رقم الهاتف", "Phone")}</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" dir="ltr" />
                </div>
                <Button type="submit" className="w-full bg-[#26231e] text-white hover:bg-[#ad842f]" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {t("حفظ والمتابعة", "Save and continue")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="container py-10">
        {/* Page header with quick contact actions */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              {t(`مرحبًا${user?.name ? `، ${user.name}` : ""}`, `Welcome${user?.name ? `, ${user.name}` : ""}`)}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {t("متابعة طلباتك وتحديث بياناتك", "Track your orders and update your details")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {callNumber ? (
              <a href={`tel:${callNumber}`} aria-label={t("اتصل بنا", "Call us")}>
                <Button variant="outline" className="gap-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200">
                  <Phone className="h-4 w-4" />
                  <span className="font-mono text-sm" dir="ltr">{callNumber}</span>
                  {t("اتصل", "Call")}
                </Button>
              </a>
            ) : null}
            <Button variant="outline" className="gap-2" onClick={() => window.open(supportWhatsAppUrl, "_blank", "noopener,noreferrer")}>
              <MessageCircle className="h-4 w-4 text-[#25d366]" />
              {t("واتساب", "WhatsApp")}
            </Button>
          </div>
        </div>

        {/* Quick navigation strip — jump to each section */}
        <nav className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" aria-label={t("أقسام حسابي", "My account sections")}>
          {[
            { icon: Package, label: t("طلباتي", "My Orders"), badge: myOrders?.length, target: "#orders" },
            { icon: Star, label: t("تقييماتي", "My Reviews"), badge: reviewableProducts?.length ?? null, target: "#reviews" },
            { icon: Bell, label: t("التنبيهات", "Updates"), badge: notifications?.length, target: "#notifications" },
            { icon: UserRound, label: t("بياناتي", "My Profile"), badge: null, target: "#profile" },
            { icon: Users, label: t("كود الإحالة", "Referral"), badge: referral?.usage ?? null, target: "#referral" },
            { icon: Star, label: t("كوبون الخصم", "Coupon"), badge: null, target: "#coupons" },
            { icon: Phone, label: t("اتصل بنا", "Call Us"), badge: callNumber, target: "#support" },
          ].map(({ icon: Icon, label, badge, target }) => (
            <a
              key={label}
              href={target}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-card-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#ad842f] hover:shadow-md"
            >
              <Icon className="h-4 w-4 text-[#ad842f]" />
              <span>{label}</span>
              {badge != null ? <Badge variant="outline" className="ms-auto text-xs">{badge}</Badge> : null}
            </a>
          ))}
        </nav>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          {/* Profile card */}
          <Card id="profile">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserRound className="h-5 w-5 text-[#ad842f]" />
                {t("بياناتي الشخصية", "My Profile")}
              </CardTitle>
              <CardDescription>
                {t("ستُستخدم هذه البيانات تلقائياً في نماذج الطلب", "These details are auto-filled in order forms")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profileLoading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : (
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("الاسم", "Name")}</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("رقم الهاتف", "Phone")}</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" placeholder="0XXXXXXXXXX" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("العنوان", "Address")}</Label>
                    <Textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} />
                  </div>
                  <Button type="submit" disabled={updateProfileMutation.isPending} className="gap-2 w-full bg-[#26231e] text-white hover:bg-[#ad842f]">
                    {updateProfileMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    <Save className="h-4 w-4" />
                    {t("حفظ", "Save")}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Reviews card */}
          <Card id="reviews">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Star className="h-5 w-5 text-[#ad842f]" />
                {t("تقييماتي", "My Reviews")}
                {reviewableProducts ? <Badge variant="outline" className="text-xs">{reviewableProducts.length}</Badge> : null}
              </CardTitle>
              <CardDescription>
                {t(
                  "منتجات اشتريتها من المتجر يمكنك تقييمها — تظهر تقييماتك على صفحة المنتج ليراها الجميع.",
                  "Products you bought from the store that you can review — your reviews appear on the product page.",
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reviewableLoading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : !reviewableProducts || reviewableProducts.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <Star className="mx-auto h-8 w-8 opacity-40" />
                  <p className="mt-3">{t("لا توجد مشتريات قابلة للتقييم بعد", "No purchases to review yet")}</p>
                  <a href="/products">
                    <Button variant="link" className="mt-2 text-[#ad842f]">
                      {t("تصفّح المنتجات", "Browse products")}
                    </Button>
                  </a>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviewableProducts.map((item: any) => {
                    const product = item.product;
                    const draft = draftFor(product.id);
                    return (
                      <div key={product.id} className="rounded-xl border border-border bg-card/50 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <Link href={`/product/${product.id}`} className="group min-w-0">
                            <p className="truncate font-bold text-[#24211d] group-hover:text-[#ad842f]">
                              {lang === "ar" ? product.nameAr : product.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {product.price ? `${Number(product.price).toLocaleString()} ${t("ج.م", "EGP")}` : null}
                            </p>
                          </Link>
                          <Button
                            size="sm"
                            className="bg-[#26231e] text-white hover:bg-[#ad842f]"
                            disabled={createReview.isPending}
                            onClick={() => submitReview(product.id)}
                          >
                            {createReview.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                            {t("إرسال التقييم", "Submit review")}
                          </Button>
                        </div>
                        <div className="mt-3 space-y-2">
                          <InteractiveRating
                            size="sm"
                            value={draft.rating}
                            onChange={(rating) => setDraft(product.id, { rating })}
                            labelAr={t("التقييم", "Rating")}
                          />
                          <Textarea
                            value={draft.comment}
                            onChange={(e) => setDraft(product.id, { comment: e.target.value })}
                            maxLength={500}
                            rows={2}
                            placeholder={t("اكتب تعليقك (اختياري)", "Write a comment (optional)")}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Orders card */}
          <Card id="orders">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5 text-[#ad842f]" />
                {t("طلباتي", "My Orders")}
                {myOrders ? <Badge variant="outline" className="text-xs">{myOrders.length}</Badge> : null}
              </CardTitle>
              <CardDescription>
                {t("متابعة حالة كل طلب قمت به من الموقع", "Status of every order you placed through the site")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="flex items-center justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : !myOrders || myOrders.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  <Package className="mx-auto h-8 w-8 opacity-40" />
                  <p className="mt-3">{t("لا توجد طلبات حتى الآن", "No orders yet")}</p>
                  <a href="/">
                    <Button variant="link" className="mt-2 text-[#ad842f]">
                      {t("تصفّح المنتجات", "Browse products")}
                    </Button>
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  {myOrders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/account/orders/${order.id}`}
                      className="block rounded-lg border border-border bg-card/50 p-4 transition-all hover:-translate-y-0.5 hover:border-[#ad842f] hover:bg-amber-50/40 hover:shadow-sm"
                      dir={isRTL ? "rtl" : "ltr"}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="font-bold">{order.productName || t("طلب عام", "General request")}</div>
                        <Badge className={`${STATUS_COLOR[order.status] ?? ""}`}>
                          {t(STATUS_AR[order.status] ?? order.status, STATUS_EN[order.status] ?? order.status)}
                        </Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>#{order.id}</span>
                        <span>{order.customerName} — {order.customerPhone}</span>
                        <span>{new Date(order.createdAt).toLocaleString(lang === "ar" ? "ar-EG" : "en-US")}</span>
                        {order.totalAfterDiscount ? <span>{Number(order.totalAfterDiscount).toLocaleString()} {t("ج.م", "EGP")}</span> : null}
                        {order.selectedSize ? <span>{t("المقاس:", "Size:")} <strong>{order.selectedSize}</strong></span> : null}
                        {order.selectedColor ? <span>{t("اللون:", "Colour:")} <strong>{order.selectedColor}</strong></span> : null}
                      </div>
                      {order.message ? <p className="mt-2 text-sm">{order.message}</p> : null}
                      {order.couponCode ? (
                        <div className="mt-2 text-xs">
                          {t("الكوبون المستخدم:", "Coupon applied:")} <Badge variant="outline">{order.couponCode}</Badge>
                        </div>
                      ) : null}
                      <p className="mt-3 text-xs font-semibold text-[#ad842f]">
                        {t("عرض تفاصيل الطلب ←", "View order details →")}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card id="notifications" className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5 text-[#ad842f]" />
              {t("تحديثات طلباتي", "My order updates")}
              {notifications ? <Badge variant="outline" className="text-xs">{notifications.length}</Badge> : null}
            </CardTitle>
            <CardDescription>
              {t("تظهر هنا كل رسالة عند إنشاء الطلب أو تغيير حالته وتصل فورًا عند فتح حسابك، ويمكنك الضغط لعرض التفاصيل.", "Every order creation and status update appears instantly while your account is open. Select one to view its details.")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {notificationsLoading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : !notifications?.length ? (
              <p className="py-5 text-center text-sm text-muted-foreground">{t("لا توجد تحديثات حتى الآن.", "No updates yet.")}</p>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <Link
                    key={notification.id}
                    href={`/account/orders/${notification.orderId}`}
                    className="block rounded-lg border border-border bg-card/50 p-4 transition-colors hover:border-[#ad842f] hover:bg-amber-50/40"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-card-foreground">{notification.title}</p>
                      <Badge className={STATUS_COLOR[notification.status] ?? "bg-zinc-100 text-zinc-700"}>
                        {t(STATUS_AR[notification.status] ?? notification.status, STATUS_EN[notification.status] ?? notification.status)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleString(lang === "ar" ? "ar-EG" : "en-US")}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Coupons section */}
        <Card id="coupons" className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Star className="h-5 w-5 text-[#ad842f]" />
              {t("كوبون الخصم", "Discount Coupon")}
            </CardTitle>
            <CardDescription>
              {t(
                "أدخل الكود في صفحة الطلب قبل الإرسال ليُخصم من الإجمالي تلقائيًا. تواصل معنا إن لم يصلك كوبون بعد.",
                "Enter the code in the order page before submitting and the discount applies automatically. Contact us if you haven't received a coupon yet.",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline" className="font-mono text-[#ad842f]">
              {t("يصلح للشاشات والأثاث وديكورات الاستيل", "Applies to panels, furniture, and steel decor")}
            </Badge>
          </CardContent>
        </Card>

        {/* Referral code section */}
        <Card id="referral" className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-[#ad842f]" />
              {t("كود الإحالة", "Referral Code")}
            </CardTitle>
            <CardDescription>
              {t(
                "شارك كودك مع أصدقائك وعند إتمام أي منهم طلبًا عبره، يُسجَّل لك فضل الدعوة ويُحتسب في تقرير الأصدقاء.",
                "Share your code with friends — when one of them completes an order with it, the referral is recorded under your account.",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {referral?.code ? (
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="font-mono text-base tracking-widest text-[#ad842f]">{referral.code}</Badge>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-[#ad842f] text-[#8b6821]"
                  onClick={() => {
                    navigator.clipboard?.writeText(referral!.code).then(
                      () => toast.success(t("تم نسخ كود الإحالة", "Referral code copied")),
                      () => toast.error(t("تعذر النسخ", "Could not copy")),
                    );
                  }}
                >
                  <Copy className="h-4 w-4" />
                  <span className="ms-1">{t("نسخ الكود", "Copy code")}</span>
                </Button>
                <Button
                  size="sm"
                  className="gap-1 bg-[#25d366] text-white hover:bg-[#1fb855]"
                  onClick={() => {
                    const text = lang === "ar"
                      ? `اشترِ من Elnour for STEEL باستخدام كود الإحالة الخاص بي: ${referral!.code}`
                      : `Shop at Elnour for STEEL using my referral code: ${referral!.code}`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                  }}
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>{t("شارك عبر واتساب", "Share via WhatsApp")}</span>
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("جارٍ إنشاء كود الإحالة...", "Generating your referral code...")}</p>
            )}
            {referral?.usage !== undefined && referral.usage >= 0 && (
              <p className="text-sm text-muted-foreground">
                {t(
                  `تم استخدام كودك في ${referral.usage} طلب`,
                  `Your code was used in ${referral.usage} order${referral.usage === 1 ? "" : "s"}`,
                )}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Support / contact section */}
        <Card id="support" className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageCircle className="h-5 w-5 text-[#25d366]" />
              {t("تحتاج مساعدة أو متابعة على طلبك؟", "Need help or want to follow up?")}
            </CardTitle>
            <CardDescription>
              {t("تواصل معنا مباشرة — فريقنا يرد على استفساراتك في أسرع وقت", "Reach us directly — our team replies as fast as possible")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            {callNumber ? (
              <a href={`tel:${callNumber}`}>
                <Button className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700">
                  <Phone className="h-4 w-4" />
                  <span dir="ltr">{callNumber}</span>
                  {t("اتصل الآن", "Call now")}
                </Button>
              </a>
            ) : null}
            <Button variant="outline" className="gap-2" onClick={() => window.open(supportWhatsAppUrl, "_blank", "noopener,noreferrer")}>
              <MessageCircle className="h-4 w-4 text-[#25d366]" />
              {t("راسلنا على واتساب", "Message us on WhatsApp")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
}
