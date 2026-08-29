import React, { useState } from "react";
import { Link } from "wouter";
import PublicLayout from "@/components/storefront/PublicLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { UpdateHead } from "@/components/UpdateHead";
import { trpc } from "@/lib/trpc";
import { formatPrice, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Package, Search, Phone, MessageCircle, ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const BUSINESS_PHONE = "01121748885";

const STATUS_MAP: Record<string, { labelAr: string; color: string }> = {
  new: { labelAr: "طلب جديد", color: "bg-blue-50 text-blue-700 border-blue-200" },
  contacted: { labelAr: "تم التواصل", color: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed: { labelAr: "تم التأكيد والتنفيذ", color: "bg-purple-50 text-purple-700 border-purple-200" },
  shipped: { labelAr: "جاري الشحن", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  delivered: { labelAr: "تم التسليم", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled: { labelAr: "ملغي", color: "bg-red-50 text-red-700 border-red-200" },
};

export default function MyAccount() {
  const { user, isAuthenticated } = useAuth();
  const { lang, t } = useLanguage();

  UpdateHead({
    title: lang === "ar" ? "حسابي ومتابعة الطلبات | Elnour Homes" : "My Account | Elnour Homes",
  });

  const [searchOrderId, setSearchOrderId] = useState("");

  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchOrderId.trim()) {
      window.location.href = `/account/orders/${searchOrderId.trim()}`;
    }
  };

  return (
    <PublicLayout>
      <section className="container mx-auto px-4 py-12 md:py-16 max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e8e2d8] pb-6 mb-8">
          <div>
            <span className="text-xs font-bold text-[#a8822d] uppercase tracking-wider">
              {t("خدمة عملاء Elnour Homes", "Customer Portal")}
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-[#24211d] mt-1">
              {t("تتبع الطلبات وحساب العميل", "Track Orders & Account")}
            </h1>
          </div>

          <a
            href={`https://wa.me/20${BUSINESS_PHONE.slice(1)}?text=${encodeURIComponent("مرحباً Elnour Homes، أود الاستفسار عن حالة طلبي.")}`}
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="outline" className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-bold rounded-xl">
              <MessageCircle className="ml-2 h-4 w-4" />
              {t("خدمة العملاء عبر واتساب", "WhatsApp Support")}
            </Button>
          </a>
        </div>

        {/* Quick Search for Order ID */}
        <Card className="mb-8 border-[#d5af58]/40 bg-[#faf8f5]">
          <CardHeader>
            <CardTitle className="text-base">{t("تتبع طلبك برقم الفاتورة", "Track Order by ID")}</CardTitle>
            <CardDescription>
              {t("أدخل رقم الطلب الذي استلمته عند الشراء لمعرفة حالة التجهيز والشحن فورياً.", "Enter your order number to track current manufacturing & delivery status.")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTrackOrder} className="flex gap-3">
              <Input
                type="number"
                value={searchOrderId}
                onChange={(e) => setSearchOrderId(e.target.value)}
                placeholder="مثال: 104"
                className="bg-white max-w-xs font-bold"
                required
              />
              <Button type="submit" className="bg-[#24211d] text-white hover:bg-[#a8822d] font-bold rounded-xl">
                <Search className="ml-2 h-4 w-4" />
                {t("تتبع الطلب", "Track Order")}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Support & Contact Details */}
        <div className="rounded-3xl border border-[#e8e2d8] bg-white p-6 md:p-8 shadow-xs space-y-4">
          <h3 className="font-bold text-base text-[#24211d]">
            {t("هل تحتاج إلى مساعدة أو تعديل على طلبك؟", "Need assistance or custom modification?")}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            فريق خدمة عملاء Elnour Homes متاح دائماً للرد على استفساراتك حول المقاسات، مواعيد التسليم، وتأكيدات الشحن.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <a href={`tel:+20${BUSINESS_PHONE.slice(1)}`} className="inline-flex items-center gap-2 text-sm font-bold text-[#a8822d] hover:underline">
              <Phone className="h-4 w-4" />
              <span>هاتف: {BUSINESS_PHONE}</span>
            </a>
            <div className="inline-flex items-center gap-2 text-sm text-emerald-700 font-bold">
              <ShieldCheck className="h-4 w-4" />
              <span>ضمان استيل 304 معتمد</span>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}