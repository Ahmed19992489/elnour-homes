import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowRight, Calculator, Check, Heart, MessageCircle, Palette, Ruler, ShoppingCart, Phone, Star, Globe, ShieldCheck, Gem, Paintbrush, Truck, BellRing, Tag, ListChecks } from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import PublicLayout from "@/components/storefront/PublicLayout";
import { getPrimaryProductImage, parseProductImages } from "@/lib/productImages";
import { UpdateHead } from "@/components/UpdateHead";
import ReviewSection from "@/components/storefront/ReviewSection";
import { SQM_PRICE_EGP } from "@shared/const";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ChevronLeft } from "lucide-react";

function getUtmParams() {
  // SSR guard: window.location is unavailable during renderToString — UTM
  // params are only needed for order submission (client-only interaction).
  if (typeof window === "undefined") {
    return {
      utmSource: undefined,
      utmMedium: undefined,
      utmCampaign: undefined,
      utmContent: undefined,
      utmTerm: undefined,
    };
  }
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get("utm_source") || undefined,
    utmMedium: params.get("utm_medium") || undefined,
    utmCampaign: params.get("utm_campaign") || undefined,
    utmContent: params.get("utm_content") || undefined,
    utmTerm: params.get("utm_term") || undefined,
  };
}

function splitOptions(value?: string | null) {
  return (value || "").split(/[،,;؛]+/).map((option) => option.trim()).filter(Boolean);
}

interface SizeOption {
  labelAr: string;
  labelEn: string;
  price: string;
}

interface ColorOption {
  labelAr: string;
  labelEn: string;
  hex: string;
}

const arabicDigitMap: Record<string, string> = { "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4", "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9" };

function normalizeSizeLabel(raw: string): string {
  return raw
    .replace(/[۰-۹٠-٩]/g, (ch) => arabicDigitMap[ch] ?? ch)
    .toLowerCase()
    .replace(/سم|cm|inch|in\b/g, "")
    .replace(/×/g, "x")
    .replace(/[\s،,;؛_.-]+/g, "")
    .trim();
}

function extractNumbers(norm: string): number[] {
  const out: number[] = [];
  const re = /\d+(?:[.,]\d+)?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(norm)) !== null) out.push(parseFloat(m[0]));
  return out;
}

// مطابقة أحادية الاتجاه: أرقام نص الاختيار (مثل "60 سم" → [60]) يجب أن تظهر كلها داخل تسمية الخيار ("صغير 60×60 سم" → [60,60])
function findSizeOption(sizeOptions: SizeOption[], label: string): SizeOption | undefined {
  const needle = normalizeSizeLabel(label);
  const needleNums = extractNumbers(needle);
  if (!needleNums.length) return undefined;
  const exact = sizeOptions.find((o) => {
    const normAr = normalizeSizeLabel(o.labelAr);
    const normEn = normalizeSizeLabel(o.labelEn);
    if (normAr === needle || normEn === needle) return true;
    const needleDims = extractDimensionPairs(needle);
    if (needleDims.length > 0) {
      const matchDim = (norm: string) => extractDimensionPairs(norm).some((d) => needleDims.some((n) => n[0] === d[0] && n[1] === d[1]));
      if (matchDim(normAr) || matchDim(normEn)) return true;
    }
    const allNumsIn = (norm: string) => needleNums.every((n) => extractNumbers(norm).includes(n));
    return allNumsIn(normAr) || allNumsIn(normEn);
  });
  return exact;
}

// يستخرج أزواج الأرقام (الأبعاد) من تسمية معيارية مثل "صغير60x60" → [[60,60]]
function extractDimensionPairs(norm: string): [number, number][] {
  const out: [number, number][] = [];
  const re = /(\d+(?:[.,]\d+)?)\s*[×xX*]\s*(\d+(?:[.,]\d+)?)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(norm)) !== null) out.push([parseFloat(m[1]), parseFloat(m[2])]);
  return out;
}

function parseSizeOptions(value?: string | null): SizeOption[] {
  try {
    if (!value) return [];
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((opt) => opt && opt.labelAr).map((opt) => ({
      labelAr: String(opt.labelAr ?? ""),
      labelEn: String(opt.labelEn ?? opt.labelAr ?? ""),
      price: String(opt.price ?? "0"),
    }));
  } catch {
    return [];
  }
}

function parseColorOptions(value?: string | null): ColorOption[] {
  try {
    if (!value) return [];
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((opt) => opt && opt.labelAr).map((opt) => ({
      labelAr: String(opt.labelAr ?? ""),
      labelEn: String(opt.labelEn ?? opt.labelAr ?? ""),
      hex: String(opt.hex ?? colorSwatch(opt.labelAr)),
    }));
  } catch {
    return [];
  }
}

function formatPrice(price: number) {
  return price.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

// يستخرج أبعاد المقاس من التسمية العربية مثل "متوسط 120×60 سم"
function parseDimensions(labelAr: string): { w: number; h: number } | null {
  const match = labelAr.match(/(\d+(?:[.,]\d+)?)\s*[×xX*]\s*(\d+(?:[.,]\d+)?)/);
  if (!match) return null;
  return { w: parseFloat(match[1]), h: parseFloat(match[2]) };
}

// سعر المتر المربع × 3000 ج (للبراويز والطابوهات) محسوبًا من أبعاد المقاس المختار
function computedSquareMeterPrice(labelAr: string, sqmPrice: number): number | null {
  const dims = parseDimensions(labelAr);
  if (!dims) return null;
  const sqm = (dims.w * dims.h) / 10000;
  return Math.round((sqm * sqmPrice) / 100) * 100;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function colorSwatch(name: string) {
  const normalized = name.trim().toLocaleLowerCase();
  if (/(ذهبي|gold)/.test(normalized)) return "#c7a256";
  if (/(فضي|silver)/.test(normalized)) return "#b7b8b9";
  if (/(أسود|اسود|black)/.test(normalized)) return "#242424";
  if (/(أبيض|ابيض|white)/.test(normalized)) return "#f7f6f2";
  if (/(برونزي|bronze|نحاسي|copper)/.test(normalized)) return "#9a6544";
  if (/(رمادي|gray|grey)/.test(normalized)) return "#737373";
  return "#d7c6a4";
}

export default function ProductDetail() {
  const { id } = useParams();
  const { lang, t, setLang } = useLanguage();
  const { addItem } = useCart();
  const { isWished, toggle: toggleWishlist } = useWishlist();
  const utm = getUtmParams();

  // Wall calculator state
  const [calcWidth, setCalcWidth] = useState("");
  const [calcHeight, setCalcHeight] = useState("");
  const [calcResult, setCalcResult] = useState<{ sqm: number; cost: number } | null>(null);

  // Restock alert state
  const [restockOpen, setRestockOpen] = useState(false);
  const [restockForm, setRestockForm] = useState({ email: "", phone: "" });
  const createRestockAlert = trpc.restockAlerts.create.useMutation({
    onSuccess: () => {
      toast.success(lang === "ar" ? "تم حفظ طلبك — سنخطرك فور توفر هذا المنتج" : "Saved — we will notify you when this product is back");
      setRestockOpen(false);
      setRestockForm({ email: "", phone: "" });
    },
    onError: (err) => toast.error(err.message),
  });
  const [orderOpen, setOrderOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [orderForm, setOrderForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "",
    message: "",
  });
  const [emailError, setEmailError] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [referralCodeInput, setReferralCodeInput] = useState("");
  const [couponState, setCouponState] = useState<{
    valid: boolean | null;
    discount: number;
    message: string;
    checking: boolean;
  }>({ valid: null, discount: 0, message: "", checking: false });

  // Track pageview on mount

  const trackPageview = trpc.pageviews.track.useMutation();
  useEffect(() => {
    let sessionId = sessionStorage.getItem("_sessionId");
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem("_sessionId", sessionId);
    }
    trackPageview.mutate({
      sessionId,
      path: `/product/${id}`,
      referrer: document.referrer || undefined,
      userAgent: navigator.userAgent,
      ...utm,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const { data: product, isLoading } = trpc.products.byId.useQuery(
    { id: Number(id) },
    { enabled: !!id }
  );

  const sqmSetting = trpc.settings.get.useQuery(undefined, {
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const sqmPrice = sqmSetting.data?.sqmPrice ?? SQM_PRICE_EGP;

  // Wish state and related products (depend on `product`)
  const wished = !!product && isWished(product.id);
  const relatedQuery = trpc.products.active.useQuery(undefined, {
    enabled: !!product?.category,
    staleTime: 300_000,
    refetchOnWindowFocus: false,
  });
  const related = (relatedQuery.data ?? []).filter((p) => p.category === product?.category && String(p.id) !== String(product?.id)).slice(0, 4);

  const reviewStatsQuery = trpc.reviews.forProduct.useQuery(
    { productId: Number(id) },
    { enabled: !!id, staleTime: 300_000, refetchOnWindowFocus: false },
  );
  const avgRating = reviewStatsQuery.data?.stats?.average;
  const reviewCount = reviewStatsQuery.data?.stats?.count;

  const createOrder = trpc.orders.create.useMutation({
    onSuccess: () => {
      toast.success(t("orderSuccess"));
      setOrderOpen(false);
      setEmailError("");
      setOrderForm({ customerName: "", customerPhone: "", customerEmail: "", customerAddress: "", message: "" });
    },
    onError: (err) => {
      const realMessage = err?.message || "";
      if (!realMessage || realMessage.includes("Unexpected error") || realMessage.toLowerCase().includes("internal")) {
        toast.error(t("orderFailed"));
      } else {
        toast.error(realMessage);
      }
    },
  });

  const images = parseProductImages(product?.images);
  const sizes = splitOptions(product?.sizes);
  const colors = splitOptions(product?.colors);
  const sizeOptions = parseSizeOptions(product?.sizeOptions);
  const colorOptions = parseColorOptions(product?.colorOptions);
  const specs = useMemo(() => {
    try {
      if (product?.specifications) return JSON.parse(product.specifications) as Record<string, string>;
    } catch { /* ignore invalid JSON */ }
    return null;
  }, [product?.specifications]);
  const isPerMeter = product?.pricingType === "per_meter";
  const pricePerMeterValue = product?.pricePerMeter ? parseFloat(product.pricePerMeter) : 0;
  const currency = lang === "ar" ? "ج.م" : "EGP";

  const priceValue = product?.price ? parseFloat(product.price) : 0;
  const couponDiscount = couponState.valid ? couponState.discount : 0;

  // Dynamic price: size option price overrides base price when selected.
  const sizePriceValue = useMemo(() => {
    if (!sizeOptions.length || !selectedSize) return priceValue;
    const opt = findSizeOption(sizeOptions, selectedSize);
    if (!opt) return priceValue;
    return parseFloat(opt.price);
  }, [sizeOptions, selectedSize, priceValue]);

  const activeTotal = isPerMeter ? pricePerMeterValue : sizePriceValue;
  const finalTotal = useMemo(() => Math.max(0, activeTotal - couponDiscount), [activeTotal, couponDiscount]);

  const productJsonLd = product ? {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.nameAr,
    "alternateName": product.name || undefined,
    "description": product.description || undefined,
    "sku": `ELN-${product.id}`,
    "category": product.category || undefined,
    "image": images.map((image) => (image.startsWith("http") ? image : `https://elnoursteel-eexiztdb.manus.space${image}`)),
    "brand": { "@type": "Brand", "name": "Elnour for STEEL" },
    "additionalProperty": (specs ? Object.entries(specs)
      .filter(([, value]) => String(value).trim())
      .map(([key, value]) => ({ "@type": "PropertyValue", "name": key === "material" ? (lang === "ar" ? "المادة" : "Material") : key === "dimensions" ? (lang === "ar" ? "الأبعاد" : "Dimensions") : key === "finish" ? (lang === "ar" ? "التشطيب" : "Finish") : (lang === "ar" ? "العناية" : "Care"), "value": String(value) }))
      : undefined),
    "offers": {
      "@type": "Offer",
      "price": Number(activeTotal || product.price),
      "priceCurrency": "EGP",
      "availability": "https://schema.org/InStock",
      "seller": { "@type": "Organization", "name": "Elnour for STEEL" },
    },
    ...(Number(avgRating) > 0 && Number(reviewCount) > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(avgRating),
            ratingCount: Number(reviewCount),
            reviewCount: Number(reviewCount),
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": lang === "ar" ? "الرئيسية" : "Home", "item": "https://elnoursteel-eexiztdb.manus.space/" },
        { "@type": "ListItem", "position": 2, "name": lang === "ar" ? "المنتجات" : "Products", "item": "https://elnoursteel-eexiztdb.manus.space/products" },
        { "@type": "ListItem", "position": 3, "name": product.nameAr },
      ],
    },
  } : null;

  UpdateHead({
    title: product ? `${product.nameAr} | Elnour for STEEL` : (lang === "ar" ? "تفاصيل المنتج | Elnour for STEEL" : "Product | Elnour for STEEL"),
    description: product ? (product.description || "").slice(0, 155) : "",
    path: `/product/${id}`,
    jsonLd: productJsonLd,
  });

  const couponReason = lang === "ar"
    ? { invalid: "كوبون غير صالح",
        invalidCode: "رمز الكوبون غير صحيح",
        inactive: "هذا الكوبون متوقف عن العمل",
        notStarted: "هذا الكوبون لم يبدأ بعد",
        expired: "انتهت صلاحية هذا الكوبون",
        exhausted: "تم استنفاد استخدامات هذا الكوبون" }
    : { invalid: "Invalid coupon",
        invalidCode: "Coupon code not recognized",
        inactive: "This coupon is disabled",
        notStarted: "This coupon has not started yet",
        expired: "This coupon has expired",
        exhausted: "This coupon's uses have been exhausted" };

  const validateCoupon = trpc.coupons.validate.useMutation({
    onSuccess: (data) => {
      const reason = data.valid ? (lang === "ar" ? "الكوبون صحيح" : "Coupon applied") : (couponReason[data.reason as keyof typeof couponReason] || couponReason.invalid);
      setCouponState({ valid: data.valid, discount: data.discount, message: reason, checking: false });
      if (!data.valid) toast.error(reason);
      else toast.success(lang === "ar" ? `${reason} — خصم ${data.discount} ${currency}` : `${reason} — ${data.discount} ${currency} off`);
    },
    onError: (err) => {
      setCouponState({ valid: false, discount: 0, message: err.message, checking: false });
      toast.error(err.message);
    },
  });

  useEffect(() => {
    setSelectedImage(0);
    setSelectedSize("");
    setSelectedColor("");
  }, [id]);

  const handleOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const customerEmail = orderForm.customerEmail.trim();
    if (!isValidEmail(customerEmail)) {
      setEmailError(lang === "ar" ? "يرجى إدخال بريد إلكتروني صحيح لتلقي تحديثات الطلب." : "Please enter a valid email address for order updates.");
      return;
    }
    setEmailError("");
    if (sizes.length && !selectedSize) {
      toast.error(lang === "ar" ? "يرجى اختيار المقاس أولاً" : "Please select a size first");
      return;
    }
    if (colors.length && !selectedColor) {
      toast.error(lang === "ar" ? "يرجى اختيار اللون أولاً" : "Please select a colour first");
      return;
    }
    createOrder.mutate({
      customerName: orderForm.customerName,
      customerPhone: orderForm.customerPhone,
      customerEmail,
      customerAddress: orderForm.customerAddress || undefined,
      message: [orderForm.message || "", isPerMeter ? `تسعير بالمتر: ${formatPrice(pricePerMeterValue)} ${currency}/م` : ""].filter(Boolean).join(" | ").trim() || undefined,
      productId: product?.id,
      productName: product?.nameAr,
      productPrice: isPerMeter ? undefined : (sizePriceValue || undefined),
      selectedSize: selectedSize || undefined,
      selectedColor: selectedColor || undefined,
      couponCode: couponState.valid ? couponCode.trim() : undefined,
      referralCode: referralCodeInput.trim().toUpperCase() || undefined,
      orderValue: couponState.valid ? finalTotal : undefined,
      orderSource: "web",
      ...utm,
      referrer: document.referrer || undefined,
      userAgent: navigator.userAgent,
    });
  };

  const handleWhatsApp = () => {
    const phone = "201118182424";
    const text = lang === "ar"
      ? `مرحباً، أرغب في الاستفسار عن المنتج التالي:\n${product?.nameAr}\n${selectedSize ? `المقاس: ${selectedSize}\n` : ""}${selectedColor ? `اللون: ${selectedColor}\n` : ""}${isPerMeter ? `السعر: ${formatPrice(pricePerMeterValue)} ج.م للمتر` : `السعر: ${formatPrice(sizePriceValue)} ج.م`}`
      : `Hello, I would like to inquire about this product:\n${product?.name}\n${selectedSize ? `Size: ${selectedSize}\n` : ""}${selectedColor ? `Colour: ${selectedColor}\n` : ""}${isPerMeter ? `Price: ${formatPrice(pricePerMeterValue)} EGP per meter` : `Price: ${formatPrice(sizePriceValue)} EGP`}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  if (isLoading) {
    return (
      <PublicLayout><div className="flex min-h-[55vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PublicLayout>
    );
  }

  if (!product) {
    return (
      <PublicLayout><div className="flex min-h-[55vh] flex-col items-center justify-center gap-4"><p className="text-xl text-muted-foreground">{lang === "ar" ? "المنتج غير موجود" : "Product not found"}</p><Link href="/products"><Button variant="outline">{t("backHome")}</Button></Link></div></PublicLayout>
    );
  }

  const displayName = lang === "ar" ? product.nameAr : product.name;

  const benefits = [
    { icon: ShieldCheck, ar: "استيل مطلي بدهان إلكتروستاتيك", en: "Electrostatic-coated steel", noteAr: "ضمان ضد الصدأ والتآكل", noteEn: "Rust & wear protection" },
    { icon: Gem, ar: "جودة تنفيذ يدوية فاخرة", en: "Handcrafted luxury quality", noteAr: "تشطيب دقيق على مستوى A-Class", noteEn: "A-class refined finishing" },
    { icon: Paintbrush, ar: "مقاسات وألوان متعددة", en: "Multiple sizes & colours", noteAr: "اختيار يناسب مساحتك وذوقك", noteEn: "Fits your space & taste" },
    { icon: Truck, ar: "شحن وتوصيل آمن", en: "Safe delivery & tracking", noteAr: "متابعة حالة الطلب لحظة بلحظة", noteEn: "Real-time order tracking" },
  ];

  const needsSelection = (sizeOptions.length && !selectedSize) || (colorOptions.length && !selectedColor);
  const primaryCtaDisabled = Boolean(isPerMeter || needsSelection);

  return (
    <PublicLayout>
      <div className="container py-8">
        <Breadcrumb className="mb-5">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">{lang === "ar" ? "الرئيسية" : "Home"}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>{lang === "ar" ? <ChevronLeft className="rotate-180" /> : <ChevronLeft />}</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink href="/products">{lang === "ar" ? "المنتجات" : "Products"}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>{lang === "ar" ? <ChevronLeft className="rotate-180" /> : <ChevronLeft />}</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>{displayName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden bg-muted">
              {images.length > 0 ? (
                <img
                  src={images[selectedImage]}
                  alt={product.nameAr}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Star className="h-16 w-16 opacity-30" />
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div>
                <p className="mb-2 text-sm font-semibold text-muted-foreground">{lang === "ar" ? "صور وزوايا المنتج" : "Product views & details"}</p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      i === selectedImage ? "border-amber-500 ring-2 ring-amber-200" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt={`${product.nameAr} — ${lang === "ar" ? `صورة ${i + 1}` : `view ${i + 1}`}`} className="w-full h-full object-cover" />
                  </button>
                ))}
                </div>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <Badge variant="secondary" className="mb-3">{product.category}</Badge>
              <h1 className="text-3xl font-bold mb-2">{displayName}</h1>
              {lang === "en" && product.nameAr && (
                <p className="text-sm text-muted-foreground">{product.nameAr}</p>
              )}
            </div>

            <div className="text-3xl font-bold text-amber-600">
              <span className="flex flex-col">
                <span>{isPerMeter ? (
                  <>{formatPrice(pricePerMeterValue)} <span className="text-lg text-muted-foreground">{lang === "ar" ? "ج.م / متر" : "EGP / meter"}</span>{priceValue ? <span className="ms-2 text-base font-medium text-muted-foreground">({lang === "ar" ? "سعر ابتدائي" : "starting from"} {formatPrice(priceValue)} {currency})</span> : null}</>
                ) : sizeOptions.length && selectedSize ? (
                  <>{formatPrice(sizePriceValue)} <span className="text-lg text-muted-foreground">{currency}</span></>
                ) : (
                  <>{product.price} <span className="text-lg text-muted-foreground">{currency}</span>{!isPerMeter && sizeOptions.length ? <span className="ms-2 text-base font-medium text-muted-foreground">{lang === "ar" ? "(اختر المقاس لمعرفة السعر)" : "(select a size to see the price)"}</span> : null}</>
                )}</span>
                {(() => {
                  const sqm = selectedSize ? computedSquareMeterPrice(selectedSize, sqmPrice) : null;
                  if (sqm === null) return null;
                  return (
                    <span className="mt-1 text-xs font-medium text-[#8a806f]" dir="auto">
                      {lang === "ar"
                        ? `≈ ${(sqm / sqmPrice).toFixed(2)} م² × ${formatPrice(sqmPrice)} ج/م² = ${formatPrice(sqm)} ${currency}`
                        : `≈ ${(sqm / sqmPrice).toFixed(2)} m² × ${formatPrice(sqmPrice)} EGP/m² = ${formatPrice(sqm)} ${currency}`}
                    </span>
                  );
                })()}
              </span>
            </div>

            {product.description && (
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            )}

            {specs && Object.entries(specs).filter(([, value]) => String(value).trim()).length > 0 && (
              <div className="rounded-2xl border border-[#e3dbc9] bg-[#fcfbf7] p-4">
                <h3 className="font-bold mb-3 flex items-center gap-2"><ListChecks className="h-4 w-4 text-[#ad842f]" />{lang === "ar" ? "المواصفات التفصيلية" : "Detailed Specifications"}</h3>
                <dl className="space-y-2 text-sm">
                  {Object.entries(specs).map(([key, value]) => {
                    if (!String(value).trim()) return null;
                    const label = key === "material" ? (lang === "ar" ? "المادة" : "Material")
                      : key === "dimensions" ? (lang === "ar" ? "الأبعاد" : "Dimensions")
                      : key === "finish" ? (lang === "ar" ? "التشطيب" : "Finish")
                      : (lang === "ar" ? "العناية والتنظيف" : "Care & Cleaning");
                    return (
                      <div key={key} className="flex items-start justify-between gap-3">
                        <dt className="text-muted-foreground shrink-0">{label}</dt>
                        <dd className="font-semibold text-start">{String(value)}</dd>
                      </div>
                    );
                  })}
                </dl>
              </div>
            )}

            {sizes.length ? <div className="space-y-3 rounded-2xl border border-[#e3dbc9] bg-[#fcfbf7] p-4">
              <div className="flex items-center gap-2"><Ruler className="h-4 w-4 text-[#ad842f]" /><h3 className="font-bold">{lang === "ar" ? "اختر المقاس" : "Choose your size"}</h3><span className="text-xs text-[#8a806f]">{lang === "ar" ? "مطلوب" : "Required"}</span></div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">{sizes.map((size) => {
                const opt = findSizeOption(sizeOptions, size);
                const optPrice = opt ? parseFloat(opt.price) : sizePriceValue;
                return (
                  <button type="button" key={size} onClick={() => setSelectedSize(size)} aria-pressed={selectedSize === size} className={`flex min-h-12 flex-col items-stretch justify-center gap-0.5 rounded-xl border px-4 py-2 text-start transition ${selectedSize === size ? "border-[#ad842f] bg-[#24211d] text-white shadow-sm" : "border-[#d9d1c0] bg-white text-[#3d382f] hover:border-[#ad842f]"}`}>
                    <span className="flex items-center gap-2 text-sm font-bold"><span className="flex items-center">{selectedSize === size ? <Check className="h-3.5 w-3.5" /> : <span className="w-3.5" />}{size}</span></span>
                    <span className={`text-[13px] font-bold leading-none ${selectedSize === size ? "text-[#e3c97d]" : "text-[#ad842f]"}`}>{formatPrice(optPrice)} {currency}</span>
                  </button>
                );
              })}</div>
            </div> : sizeOptions.length ? <div className="space-y-3 rounded-2xl border border-[#e3dbc9] bg-[#fcfbf7] p-4">
              <div className="flex items-center gap-2"><Ruler className="h-4 w-4 text-[#ad842f]" /><h3 className="font-bold">{lang === "ar" ? "اختر المقاس" : "Choose your size"}</h3><span className="text-xs text-[#8a806f]">{lang === "ar" ? "كل مقاس له سعر مختلف" : "Each size has its own price"}</span></div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">{sizeOptions.map((opt) => {
                const label = lang === "ar" ? opt.labelAr : opt.labelEn;
                return (
                  <button type="button" key={opt.labelAr} onClick={() => setSelectedSize(opt.labelAr)} aria-pressed={selectedSize === opt.labelAr} className={`flex min-h-12 flex-col items-stretch justify-center gap-0.5 rounded-xl border px-4 py-2 text-start transition ${selectedSize === opt.labelAr ? "border-[#ad842f] bg-[#24211d] text-white shadow-sm" : "border-[#d9d1c0] bg-white text-[#3d382f] hover:border-[#ad842f]"}`}>
                    <span className="flex items-center gap-2 text-sm font-bold">{selectedSize === opt.labelAr ? <Check className="h-3.5 w-3.5" /> : <span className="w-3.5" />}{label}</span>
                    <span className={`text-[13px] font-bold leading-none ${selectedSize === opt.labelAr ? "text-[#e3c97d]" : "text-[#ad842f]"}`}>{formatPrice(parseFloat(opt.price))} {currency}</span>
                  </button>
                );
              })}</div>
            </div> : null}

            {(colors.length > 0 || colorOptions.length > 0) ? <div className="space-y-3 rounded-2xl border border-[#e3dbc9] bg-[#fcfbf7] p-4">
              <div className="flex items-center gap-2"><Palette className="h-4 w-4 text-[#ad842f]" /><h3 className="font-bold">{lang === "ar" ? "اختر اللون" : "Choose your colour"}</h3><span className="text-xs text-[#8a806f]">{lang === "ar" ? "مطلوب" : "Required"}</span></div>

              <div className="flex flex-wrap gap-2">{colorOptions.length ? colorOptions.map((opt) => {
                const label = lang === "ar" ? opt.labelAr : opt.labelEn;
                return <button type="button" key={opt.labelAr} onClick={() => setSelectedColor(opt.labelAr)} aria-pressed={selectedColor === opt.labelAr} className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold transition ${selectedColor === opt.labelAr ? "border-[#ad842f] bg-[#24211d] text-white shadow-sm" : "border-[#d9d1c0] bg-white text-[#3d382f] hover:border-[#ad842f]"}`}><span className="h-4 w-4 rounded-full border border-black/15" style={{ backgroundColor: opt.hex }} />{selectedColor === opt.labelAr ? <Check className="h-3.5 w-3.5" /> : null}{label}</button>;
              }) : colors.map((color) => <button type="button" key={color} onClick={() => setSelectedColor(color)} aria-pressed={selectedColor === color} className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold transition ${selectedColor === color ? "border-[#ad842f] bg-[#24211d] text-white shadow-sm" : "border-[#d9d1c0] bg-white text-[#3d382f] hover:border-[#ad842f]"}`}><span className="h-4 w-4 rounded-full border border-black/15" style={{ backgroundColor: colorSwatch(color) }} />{selectedColor === color ? <Check className="h-3.5 w-3.5" /> : null}{color}</button>)}</div>
            </div> : null}

            {/* Wishlist toggle */}
            <button
              type="button"
              onClick={() => {
                toggleWishlist(product.id);
                toast.success(!wished ? (lang === "ar" ? `تمت إضافة «${displayName}» إلى المفضلة` : `“${displayName}” added to your wishlist`) : (lang === "ar" ? "تمت إزالته من المفضلة" : "Removed from wishlist"));
              }}
              aria-pressed={wished}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition hover:scale-[1.01] ${wished ? "border-red-200 bg-red-50 text-red-600" : "border-[#e3dbc9] bg-white text-[#8a806f] hover:border-red-300 hover:text-red-500"}`}
            >
              <Heart className={`h-4 w-4 ${wished ? "fill-current" : ""}`} />
              {wished ? (lang === "ar" ? "في المفضلة — اضغط للإزالة" : "In wishlist — click to remove") : (lang === "ar" ? "أضف إلى المفضلة" : "Add to wishlist")}
            </button>

            {/* Wall area calculator */}
            <div className="space-y-3 rounded-2xl border border-[#e3dbc9] bg-[#fcfbf7] p-4">
              <div className="flex items-center gap-2"><Calculator className="h-4 w-4 text-[#ad842f]" /><h3 className="font-bold">{lang === "ar" ? "حاسبة مساحة الحائط" : "Wall Area Calculator"}</h3><span className="text-xs text-[#8a806f]">{lang === "ar" ? "اعرف مساحتك وتقدير التكلفة بالمتر المربع" : "Know your wall area and an estimated cost per m²"}</span></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">{lang === "ar" ? "العرض" : "Width"}</Label>
                    <span className="text-[11px] text-[#8a806f]">{lang === "ar" ? "يمكنك الإدخال بالسم أو بالمتر" : "Enter in cm or metres"}</span>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    inputMode="decimal"
                    value={calcWidth}
                    onChange={(e) => { setCalcWidth(e.target.value); setCalcResult(null); }}
                    placeholder={lang === "ar" ? "مثال: 300 أو 3" : "e.g. 300 or 3"}
                    className="h-10 bg-white"
                    aria-label={lang === "ar" ? "عرض الحائط بالسنتيمتر أو بالمتر" : "Wall width in centimetres or metres"}
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">{lang === "ar" ? "الارتفاع" : "Height"}</Label>
                    <span className="text-[11px] text-[#8a806f]">{lang === "ar" ? "أقل من 100 تُحسب بالمتر" : "Below 100 is treated as metres"}</span>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    inputMode="decimal"
                    value={calcHeight}
                    onChange={(e) => { setCalcHeight(e.target.value); setCalcResult(null); }}
                    placeholder={lang === "ar" ? "مثال: 250 أو 2.5" : "e.g. 250 or 2.5"}
                    className="h-10 bg-white"
                    aria-label={lang === "ar" ? "ارتفاع الحائط بالسنتيمتر أو بالمتر" : "Wall height in centimetres or metres"}
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full border-[#ad842f] text-[#8b6821] hover:bg-[#fdf9ee] h-10"
                onClick={() => {
                  const w = parseFloat(calcWidth.replace(",", "."));
                  const h = parseFloat(calcHeight.replace(",", "."));
                  if (!w || !h || w <= 0 || h <= 0) {
                    toast.error(lang === "ar" ? "يرجى إدخال العرض والارتفاع" : "Please enter width and height");
                    return;
                  }
                  // Auto-detect unit: values under 100 are treated as metres (e.g. 3 → 300cm), 100+ as centimetres (e.g. 300cm)
                  const wCm = w < 100 ? w * 100 : w;
                  const hCm = h < 100 ? h * 100 : h;
                  if (wCm < 25 || hCm < 25) {
                    toast.error(lang === "ar" ? "المقاس أصغر من حائط حقيقي — تأكد من الإدخال الصحيح (سم أو متر)" : "The size is smaller than a real wall — check your input (cm or metres)");
                    return;
                  }
                  const sqm = (wCm * hCm) / 10000;
                  setCalcResult({ sqm, cost: Math.round(sqm * sqmPrice) });
                }}
              >
                <Calculator className="ms-0 me-1.5 h-4 w-4" />
                {lang === "ar" ? "احسب المساحة" : "Calculate Area"}
              </Button>
              {calcResult ? (
                <div className="rounded-xl border border-[#e3dbc9] bg-white p-3 space-y-1" role="status">
                  <p className="text-sm">
                    {lang === "ar" ? "المساحة:" : "Area:"} <strong>{calcResult.sqm.toFixed(2)} {lang === "ar" ? "م²" : "m²"}</strong>
                  </p>
                  <p className="text-sm">
                    {lang === "ar" ? "التقدير بالمتر المربع (" : "Estimate at "}{formatPrice(sqmPrice)} {lang === "ar" ? "ج/م²): " : "EGP/m²: "}<strong className="text-amber-600">{calcResult.cost.toLocaleString()} {currency}</strong>
                  </p>
                  <p className="text-xs text-[#8a806f]">{lang === "ar" ? "تقدير استرشادي — السعر النهائي يتوقف على التصميم والألوان المختارة" : "Guideline estimate — the final price depends on the design and chosen colours"}</p>
                </div>
              ) : null}
            </div>

            {/* Restock alert */}
            <Dialog open={restockOpen} onOpenChange={setRestockOpen}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#e3dbc9] bg-white px-4 py-2.5 text-sm font-bold text-[#8a806f] transition hover:border-[#ad842f] hover:text-[#8b6821]"
                >
                  <BellRing className="h-4 w-4" />
                  {lang === "ar" ? "نبهني عندما يتوفر هذا المنتج" : "Notify me when this product is back in stock"}
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-md sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <BellRing className="h-5 w-5 text-[#ad842f]" />
                    {lang === "ar" ? "إشعار التوفر" : "Restock Notification"}
                  </DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!product) return;
                    if (!restockForm.email.trim() && !restockForm.phone.trim()) {
                      toast.error(lang === "ar" ? "يرجى إدخال البريد الإلكتروني أو رقم الهاتف" : "Please enter your email or phone number");
                      return;
                    }
                    createRestockAlert.mutate({
                      productId: product.id,
                      size: selectedSize || (lang === "ar" ? "غير محدد" : "Not specified"),
                      email: restockForm.email.trim() || undefined,
                      phone: restockForm.phone.trim() || undefined,
                    });
                  }}
                  className="space-y-3"
                >
                  <p className="text-sm text-muted-foreground">{lang === "ar" ? `سيُخطرك فريقنا فور توفر «${displayName}» — سنعرضه عليك أو على بياناتك فور تحديث المخزون.` : `Our team will alert you as soon as “${displayName}” is back in stock.`}</p>
                  <div className="space-y-1.5">
                    <Label>{lang === "ar" ? "البريد الإلكتروني" : "Email"}</Label>
                    <Input
                      type="email"
                      value={restockForm.email}
                      onChange={(e) => setRestockForm({ ...restockForm, email: e.target.value })}
                      placeholder="name@example.com"
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{lang === "ar" ? "رقم الهاتف (واتساب)" : "Phone (WhatsApp)"}</Label>
                    <Input
                      type="tel"
                      value={restockForm.phone}
                      onChange={(e) => setRestockForm({ ...restockForm, phone: e.target.value })}
                      placeholder="01xxxxxxxxx"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={createRestockAlert.isPending}>
                    {createRestockAlert.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />}
                    <span className="ms-1">{lang === "ar" ? "سجّلني في قائمة الانتظار" : "Join the waitlist"}</span>
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            {/* Why Elnour — trust strip */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {benefits.map((b) => {
                const Icon = b.icon;
                return (
                  <div key={b.en} className="flex items-start gap-2.5 rounded-xl border border-[#e3dbc9] bg-[#fdfcfa] p-3">
                    <Icon className="h-5 w-5 flex-shrink-0 text-[#ad842f] mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-[#24211d] leading-snug">{lang === "ar" ? b.ar : b.en}</p>
                      <p className="text-xs text-[#8a806f] leading-snug mt-0.5">{lang === "ar" ? b.noteAr : b.noteEn}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                size="lg"
                variant="outline"
                className="flex-1 h-12 border-2 border-[#ad842f] text-[#8b6821] hover:bg-[#fdf9ee]"
                disabled={isPerMeter}
                onClick={() => {
                  if (sizeOptions.length && !selectedSize) {
                    toast.error(lang === "ar" ? "يرجى اختيار المقاس أولاً" : "Please select a size first");
                    return;
                  }
                  if (colorOptions.length && !selectedColor) {
                    toast.error(lang === "ar" ? "يرجى اختيار اللون أولاً" : "Please select a colour first");
                    return;
                  }
                  addItem({
                    productId: product.id,
                    selectedSize: selectedSize || undefined,
                    selectedColor: selectedColor || undefined,
                    quantity: 1,
                    unitPrice: sizePriceValue,
                  });
                  toast.success(lang === "ar" ? `تمت إضافة «${displayName}» إلى السلة` : `“${displayName}” added to your cart`);
                }}
              >
                <ShoppingCart className="ms-0 me-2 h-5 w-5" />
                {lang === "ar" ? "أضف إلى السلة" : "Add to Cart"}
              </Button>
              <Button
                size="lg"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white h-12"
                onClick={handleWhatsApp}
              >
                <MessageCircle className="ms-0 me-2 h-5 w-5" />
                {lang === "ar" ? "احجز عبر واتساب" : "Order via WhatsApp"}
              </Button>
              <Dialog open={orderOpen} onOpenChange={setOrderOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="flex-1 h-13 px-6 text-base font-bold bg-gradient-to-r from-[#ad842f] to-[#c9a24a] hover:from-[#96702a] hover:to-[#b5913f] text-white shadow-lg shadow-amber-200/40">
                    <ArrowRight className="ms-0 me-2 h-5 w-5" />
                    {lang === "ar" ? "اطلب الآن" : "Order Now"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto overscroll-contain sm:max-h-[75vh]">
                  <DialogHeader>
                    <DialogTitle>{t("orderFormTitle")}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleOrder} className="space-y-4">
                    <div className="space-y-2">
                      <Label>{t("customerName")} *</Label>
                      <Input
                        value={orderForm.customerName}
                        onChange={(e) => setOrderForm({ ...orderForm, customerName: e.target.value })}
                        required
                        placeholder={lang === "ar" ? "اكتب اسمك هنا" : "Enter your name"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("customerPhone")} *</Label>
                      <Input
                        value={orderForm.customerPhone}
                        onChange={(e) => setOrderForm({ ...orderForm, customerPhone: e.target.value })}
                        required
                        placeholder="01xxxxxxxxx"
                        type="tel"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{lang === "ar" ? "البريد الإلكتروني لتحديثات الطلب" : "Email for order updates"} *</Label>
                      <Input
                        value={orderForm.customerEmail}
                        onChange={(e) => {
                          setOrderForm({ ...orderForm, customerEmail: e.target.value });
                          if (emailError) setEmailError("");
                        }}
                        onInvalid={(event) => {
                          event.preventDefault();
                          setEmailError(lang === "ar" ? "يرجى إدخال بريد إلكتروني صحيح لتلقي تحديثات الطلب." : "Please enter a valid email address for order updates.");
                        }}
                        required
                        type="email"
                        autoComplete="email"
                        placeholder="name@example.com"
                        aria-invalid={Boolean(emailError)}
                        aria-describedby="customer-email-help"
                        className={emailError ? "border-destructive focus-visible:ring-destructive" : undefined}
                      />
                      <p id="customer-email-help" role={emailError ? "alert" : undefined} className={`text-xs ${emailError ? "font-medium text-destructive" : "text-muted-foreground"}`}>{emailError || (lang === "ar" ? "سنرسل تحديثات حالة الطلب والفاتورة إلى هذا البريد." : "We will send order-status updates and your invoice to this address.")}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("customerAddress")}</Label>
                      <Input
                        value={orderForm.customerAddress}
                        onChange={(e) => setOrderForm({ ...orderForm, customerAddress: e.target.value })}
                        placeholder={lang === "ar" ? "المحافظة - المدينة - المنطقة" : "Governorate - City - Area"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("orderMessage")} ({lang === "ar" ? "اختياري" : "optional"})</Label>
                      <Textarea
                        value={orderForm.message}
                        onChange={(e) => setOrderForm({ ...orderForm, message: e.target.value })}
                        placeholder={lang === "ar" ? "اكتب أي ملاحظة إضافية للطلب" : "Add any extra note for your order"}
                        rows={3}
                      />
                    </div>
                    <div className="bg-muted p-3 rounded-lg space-y-1">
                      <p className="text-sm font-medium">{t("orderProduct")}: {displayName}</p>
                      {selectedSize ? <p className="text-sm text-[#514c42]">{lang === "ar" ? "المقاس المختار" : "Selected size"}: <strong>{selectedSize}</strong></p> : null}
                      {selectedColor ? <p className="text-sm text-[#514c42]">{lang === "ar" ? "اللون المختار" : "Selected colour"}: <strong>{selectedColor}</strong></p> : null}
                      {isPerMeter ? <p className="text-sm text-amber-600 font-bold">{formatPrice(pricePerMeterValue)} {currency} {lang === "ar" ? "/ متر" : "/ meter"}{lang === "ar" ? " — السعر النهائي حسب القياسات" : " — final price based on measurements"}</p> : <p className="text-sm text-amber-600 font-bold">{formatPrice(sizePriceValue)} {currency}</p>}
                      {couponState.valid && couponDiscount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-green-600 font-medium">{couponState.message}</span>
                          <span className="text-green-600 font-medium">- {couponDiscount} {currency}</span>
                        </div>
                      )}
                      {couponDiscount > 0 && (
                        <div className="flex justify-between text-sm font-bold border-t pt-1">
                          <span>{lang === "ar" ? "الإجمالي بعد الخصم" : "Total after discount"}</span>
                          <span>{finalTotal.toLocaleString()} {currency}</span>
                        </div>
                      )}
                      {isPerMeter && <p className="text-xs text-[#8a806f]">{lang === "ar" ? "يمكنك إضافة هذا المنتج إلى السلة بكمية بالمتر، وسيُحسب الإجمالي بناءً على القياسات المعتمدة." : "You can add this to the cart with a quantity in meters; the total is computed from the approved measurements."}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">{lang === "ar" ? "كود الإحالة (إن وجد)" : "Referral Code (if any)"} <Tag className="h-3.5 w-3.5 text-[#ad842f]" /></Label>
                      <Input
                        value={referralCodeInput}
                        onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                        placeholder={lang === "ar" ? "مثال: ELN-A1B2 — كود صديق أحالك إلينا" : "e.g. ELN-A1B2 — a friend's code who referred you"}
                        className="h-9"
                      />
                      <p className="text-xs text-muted-foreground">{lang === "ar" ? "إن رشحك أحد العملاء بكوده، أدخله هنا لتُحسب دعوته" : "If a customer referred you with a code, enter it here so their referral is recorded"}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>{lang === "ar" ? "كوبون الخصم" : "Coupon Code"}</Label>
                      <div className="flex gap-2">
                        <Input
                          value={couponCode}
                          onChange={(e) => {
                            setCouponCode(e.target.value);
                            if (couponState.valid) setCouponState({ valid: null, discount: 0, message: "", checking: false });
                          }}
                          placeholder={lang === "ar" ? "أدخل الكود ثم اضغط تحقق" : "Enter code then verify"}
                          className="uppercase tracking-wider"
                          disabled={validateCoupon.isPending}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="border-2 shrink-0"
                          disabled={!couponCode.trim() || validateCoupon.isPending}
                          onClick={() => {
                            if (!priceValue) return;
                            validateCoupon.mutate({ code: couponCode.trim(), orderValue: priceValue });
                          }}
                        >
                          {validateCoupon.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (lang === "ar" ? "تحقق" : "Apply")}
                        </Button>
                      </div>
                      {couponState.message && (
                        <p className={`text-xs ${couponState.valid ? "text-green-600" : "text-red-500"}`}>{couponState.message}</p>
                      )}
                    </div>
                    <Button type="submit" className="w-full" size="lg" disabled={createOrder.isPending}>
                      {createOrder.isPending && <Loader2 className="ms-0 me-2 h-4 w-4 animate-spin" />}
                      {t("submitOrder")}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <ReviewSection productId={Number(id)} title={lang === "ar" ? product.nameAr : product.name} />

            <div className="border-t pt-4">
              <a href="tel:01118182424" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <Phone className="h-4 w-4" />
                <span>{lang === "ar" ? "اتصل بنا" : "Call Us"}: 01118182424</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky order bar: single action for ad conversions */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-[#fcfbf7]/95 backdrop-blur border-t border-[#e3dbc9] px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[#24211d] truncate">
            {formatPrice(finalTotal)} <span className="text-[10px] text-muted-foreground font-medium">{currency}</span>
            {selectedSize ? <span className="block text-[10px] text-[#8a806f] truncate">{selectedSize}{selectedColor ? ` · ${selectedColor}` : ""}</span> : null}
          </span>
          {/* Same orderOpen state as the inline dialog above — the dialog markup lives only in the inline copy to avoid duplicate Radix dialogs */}
          <Button size="lg" disabled={primaryCtaDisabled} className="ms-auto h-11 px-6 font-bold bg-gradient-to-r from-[#ad842f] to-[#c9a24a] hover:from-[#96702a] hover:to-[#b5913f] text-white" onClick={() => setOrderOpen(true)}>
            {lang === "ar" ? "اطلب الآن" : "Order Now"}
          </Button>
        </div>
      </div>

      {/* Bottom spacer so the sticky bar doesn't cover footer content */}
      <div className="h-20 lg:hidden" />
    </PublicLayout>
  );
}
