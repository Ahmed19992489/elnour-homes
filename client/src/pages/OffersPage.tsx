import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Tag, Copy, Check, Clock, Gift } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import PublicLayout from "@/components/storefront/PublicLayout";
import { UpdateHead } from "@/components/UpdateHead";

function Countdown({ targetAt }: { targetAt: number }) {
  const { lang } = useLanguage();
  const [now, setNow] = useState(Date.now());
  useState(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  });
  const diff = targetAt - now;
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  const unit = (v: number) => String(v).padStart(2, "0");
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#8b6821]">
      <Clock className="h-4 w-4" />
      {days > 0 ? <>{days} {lang === "ar" ? "يوم" : "d"} </> : null}
      {unit(hours)}:{unit(minutes)}:{unit(seconds)}
    </span>
  );
}

export default function OffersPage() {
  const { lang, t } = useLanguage();
  const { data: coupons, isLoading } = trpc.coupons.getOffers.useQuery();
  const [copied, setCopied] = useState<string | null>(null);

  UpdateHead({
    title: lang === "ar" ? "العروض والخصومات | Elnour for STEEL" : "Offers & Discounts | Elnour for STEEL",
    description: lang === "ar" ? "اكشف أكواد الخصم النشطة من Elnour for STEEL — ديكورات استيل منزلية فاخرة." : "Discover active discount codes from Elnour for STEEL — luxury steel home decor.",
    path: "/offers",
  });

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
      toast.success(lang === "ar" ? `تم نسخ الكود «${code}»` : `Code “${code}” copied`);
    } catch {
      toast.error(lang === "ar" ? "تعذر نسخ الكود" : "Could not copy code");
    }
  };

  return (
    <PublicLayout>
      <div className="container py-10">
        <div className="mb-8 text-center">
          <Badge variant="secondary" className="mb-3"><Gift className="h-4 w-4 text-[#ad842f]" /><span className="ms-1">{lang === "ar" ? "عروض حصرية" : "Exclusive Offers"}</span></Badge>
          <h1 className="text-3xl font-bold sm:text-4xl">{lang === "ar" ? "العروض والخصومات" : "Offers & Discounts"}</h1>
          <p className="mt-2 text-muted-foreground">
            {lang === "ar" ? "أكواد خصم نشطة من Elnour for STEEL — استخدمها في السلة أو عند إتمام الطلب." : "Active discount codes from Elnour for STEEL — apply them in the cart or at checkout."}
          </p>
        </div>

        {isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : !coupons || coupons.length === 0 ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
            <Tag className="h-14 w-14 text-[#d9d1c0]" />
            <p className="text-lg font-bold text-muted-foreground">{lang === "ar" ? "لا توجد عروض نشطة حاليًا" : "No active offers at the moment"}</p>
            <p className="max-w-md text-sm text-muted-foreground">{lang === "ar" ? "تابعنا على صفحاتنا أو اشترك لتصلك أكواد الخصم أولًا بأول." : "Follow us on social media to be the first to know about new discount codes."}</p>
            <Link href="/products"><Button variant="outline" className="mt-2 border-2 border-[#ad842f] text-[#8b6821]">{lang === "ar" ? "تصفح المنتجات" : "Browse products"}</Button></Link>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {coupons.map((c) => (
              <div key={c.code} className="relative flex flex-col overflow-hidden rounded-2xl border border-[#e3dbc9] bg-white shadow-sm transition-all hover:shadow-lg">
                <div className="flex items-center justify-between gap-2 border-b border-dashed border-[#e3dbc9] bg-[#fdf9ee] px-5 py-4">
                  <span className="text-2xl font-black tracking-widest text-[#24211d]" dir="ltr">{c.code}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 border-[#ad842f] text-[#8b6821]"
                    onClick={() => copyCode(c.code)}
                  >
                    {copied === c.code ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span className="ms-1">{lang === "ar" ? "نسخ" : "Copy"}</span>
                  </Button>
                </div>
                <div className="space-y-2.5 p-5">
                  <p className="text-lg font-bold text-amber-600">
                    {c.discountType === "percent"
                      ? (lang === "ar" ? `خصم ${Number(c.discountValue)}% على الطلب` : `${Number(c.discountValue)}% off your order`)
                      : (lang === "ar" ? `خصم ${Number(c.discountValue).toLocaleString()} ج.م` : `${Number(c.discountValue).toLocaleString()} EGP off`)}
                  </p>
                  {c.expiresAt ? <Countdown targetAt={c.expiresAt} /> : (
                    <p className="text-xs text-[#8a806f]">{lang === "ar" ? "العرض ساري حتى إشعار آخر" : "Offer valid until further notice"}</p>
                  )}
                  {c.minOrderValue && Number(c.minOrderValue) > 0 && (
                    <p className="text-xs text-[#8a806f]">
                      {lang === "ar" ? `الحد الأدنى للطلب: ${Number(c.minOrderValue).toLocaleString()} ج.م` : `Minimum order: ${Number(c.minOrderValue).toLocaleString()} EGP`}
                    </p>
                  )}
                  <p className="text-xs text-[#8a806f]">{t("orderSuccess") ? "" : ""}</p>
                  <Link href="/products">
                    <Button className="w-full bg-gradient-to-r from-[#ad842f] to-[#c9a24a] hover:from-[#96702a] hover:to-[#b5913f] text-white font-bold">
                      {lang === "ar" ? "تسوق الآن" : "Shop now"}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
