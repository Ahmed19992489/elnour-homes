import React, { useState } from "react";
import { useParams, Link } from "wouter";
import PublicLayout from "@/components/storefront/PublicLayout";
import ReviewSection from "@/components/ReviewSection";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { UpdateHead } from "@/components/UpdateHead";
import { formatPrice } from "@/lib/utils";
import {
  ShoppingBag,
  Heart,
  MessageCircle,
  Phone,
  ShieldCheck,
  Truck,
  Sparkles,
  Check,
  Plus,
  Minus,
  Loader2,
  ArrowRight,
  Ruler,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const BUSINESS_PHONE = "01121748885";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const { lang, isRTL, t } = useLanguage();
  const { addItem } = useCart();
  const { isInWishlist, toggleItem } = useWishlist();

  const { data: product, isLoading } = trpc.products.byId.useQuery(
    { id: productId },
    { enabled: !isNaN(productId) }
  );

  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [customMeters, setCustomMeters] = useState<number>(1);

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#d5af58]" />
        </div>
      </PublicLayout>
    );
  }

  if (!product) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold text-[#24211d]">
            {t("المنتج غير موجود أو تم حذفه", "Product not found")}
          </h2>
          <Link href="/products">
            <Button className="mt-6 bg-[#24211d] text-white hover:bg-[#a8822d] font-bold">
              {t("العودة للكتالوج", "Back to Catalogue")}
            </Button>
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const isFavorited = isInWishlist(product.id);
  const isMeterBased =
    product.isPerMeter === true ||
    product.isPerMeter === "true" ||
    product.isPerMeter === "yes";

  const basePrice = isMeterBased
    ? Number(product.pricePerMeter || product.price || 0)
    : Number(product.price || 0);

  const finalUnitPrice = isMeterBased ? basePrice * customMeters : basePrice;
  const finalTotal = finalUnitPrice * quantity;

  const imagesList = Array.isArray(product.images)
    ? product.images
    : typeof product.images === "string"
    ? JSON.parse(product.images || "[]")
    : [];

  const mainImage = imagesList[selectedImageIdx] || imagesList[0] || "/placeholder-steel.jpg";

  const sizes = Array.isArray(product.sizes)
    ? product.sizes
    : typeof product.sizes === "string"
    ? JSON.parse(product.sizes || "[]")
    : ["قياسي (Standard)"];

  const colors = Array.isArray(product.colors)
    ? product.colors
    : typeof product.colors === "string"
    ? JSON.parse(product.colors || "[]")
    : ["ذهبي فاخر (PVD Gold)", "فضي كروم (Silver)", "أسود مط (Black Matte)"];

  const currentSize = selectedSize || sizes[0];
  const currentColor = selectedColor || colors[0];

  UpdateHead({
    title: `${lang === "ar" ? product.nameAr : product.name} | Elnour Homes`,
    description: product.descriptionAr || product.description || "تفاصيل ومواصفات المنتج من Elnour Homes للاستيل والديكور.",
    image: mainImage,
  });

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      nameAr: product.nameAr,
      price: basePrice,
      quantity,
      size: currentSize,
      color: currentColor,
      meters: isMeterBased ? customMeters : undefined,
      isPerMeter: isMeterBased,
      image: mainImage,
    });
    toast.success(lang === "ar" ? "تمت إضافة المنتج إلى سلة المشتريات!" : "Added to cart!");
  };

  const handleWhatsAppOrder = () => {
    const pName = lang === "ar" ? product.nameAr : product.name;
    const priceText = isMeterBased
      ? `${formatPrice(finalTotal)} ج.م (${customMeters} متر²)`
      : `${formatPrice(finalTotal)} ج.م`;

    const message = `مرحباً Elnour Homes، أود طلب وتفصيل المنتج التالي:\n- الموديل: ${pName}\n- المقاس: ${currentSize}\n- اللون: ${currentColor}${isMeterBased ? `\n- المساحة: ${customMeters} م²` : ""}\n- الكمية: ${quantity}\n- الإجمالي: ${priceText}\n- رابط المنتج: ${window.location.origin}/product/${product.id}`;

    window.open(`https://wa.me/20${BUSINESS_PHONE.slice(1)}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <PublicLayout>
      <section className="container mx-auto px-4 py-8 md:py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-bold text-[#a8822d] mb-6">
          <Link href="/" className="hover:underline">{t("الرئيسية", "Home")}</Link>
          <span>/</span>
          <Link href="/products" className="hover:underline">{t("المنتجات", "Products")}</Link>
          <span>/</span>
          <span className="text-[#24211d]">{lang === "ar" ? product.nameAr : product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-14">
          {/* Gallery Images */}
          <div className="space-y-4">
            <div className="relative aspect-4/3 w-full rounded-3xl border border-[#e8e2d8] bg-[#f5f0e6] overflow-hidden shadow-xs">
              <img
                src={mainImage}
                alt={product.nameAr}
                className="h-full w-full object-cover transition-all"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&auto=format&fit=crop&q=80";
                }}
              />

              <button
                onClick={() => toggleItem(product.id)}
                className={`absolute top-4 left-4 z-10 flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-md transition-all ${
                  isFavorited
                    ? "bg-red-50 text-red-500 shadow-md"
                    : "bg-white/80 text-[#3e3931] hover:bg-white hover:text-red-500"
                }`}
                aria-label="Wishlist"
              >
                <Heart className={`h-5 w-5 ${isFavorited ? "fill-current" : ""}`} />
              </button>

              {product.featured && (
                <div className="absolute top-4 right-4">
                  <Badge variant="gold" className="text-xs px-3 py-1 font-bold shadow-md">
                    {t("منتج مميز", "Featured")}
                  </Badge>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {imagesList.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {imagesList.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`relative h-20 w-20 shrink-0 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                      selectedImageIdx === idx ? "border-[#d5af58] scale-95 shadow-md" : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="thumb" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details & Purchase Form */}
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#a8822d]">
                {product.category || "ديكورات استيل"}
              </span>
              <h1 className="text-2xl md:text-4xl font-black text-[#24211d] mt-1">
                {lang === "ar" ? product.nameAr : product.name}
              </h1>

              {/* Pricing Display */}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-3xl font-black text-[#24211d]">
                  {formatPrice(finalUnitPrice)} <span className="text-base font-bold text-[#786f63]">{t("ج.م", "EGP")}</span>
                </span>
                {isMeterBased && (
                  <span className="text-sm font-bold text-[#a8822d] bg-[#d5af58]/15 px-2.5 py-0.5 rounded-lg">
                    {t("سعر المتر المربع (حسب الأبعاد)", "Per square meter")}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-sm md:text-base text-[#5c5448] leading-relaxed">
              {lang === "ar" ? product.descriptionAr : product.description}
            </p>

            {/* Custom Meter input if per-meter */}
            {isMeterBased && (
              <div className="rounded-2xl border border-[#d5af58]/30 bg-[#faf8f5] p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#24211d]">
                  <Ruler className="h-4 w-4 text-[#a8822d]" />
                  <span>{t("حدد المساحة المطلوبة بالمتر المربع (م²):", "Select area in square meters:")}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={customMeters}
                    onChange={(e) => setCustomMeters(Math.max(0.5, Number(e.target.value) || 1))}
                    className="max-w-[140px] bg-white font-bold text-center"
                  />
                  <span className="text-xs text-muted-foreground font-semibold">
                    = {formatPrice(finalUnitPrice)} ج.م للقطعة
                  </span>
                </div>
              </div>
            )}

            {/* Size Selector */}
            {sizes.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#5c5448] block">
                  {t("اختر المقاس والأبعاد:", "Select Size:")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s: string) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                        currentSize === s
                          ? "border-[#24211d] bg-[#24211d] text-white shadow-sm"
                          : "border-[#e0d9cc] bg-white text-[#3e3931] hover:border-[#d5af58]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selector */}
            {colors.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#5c5448] block">
                  {t("اختر لون وتشطيب الاستيل:", "Select Finish & Color:")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((c: string) => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                        currentColor === c
                          ? "border-[#a8822d] bg-[#d5af58]/20 text-[#24211d] font-black"
                          : "border-[#e0d9cc] bg-white text-[#3e3931] hover:border-[#d5af58]"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Controller & Add Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center justify-between rounded-xl border border-[#ddd6c8] bg-[#faf8f5] p-1.5 shrink-0">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 rounded-lg hover:bg-white text-[#24211d] transition-colors"
                  aria-label="Decrease"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center font-bold text-sm text-[#24211d]">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 rounded-lg hover:bg-white text-[#24211d] transition-colors"
                  aria-label="Increase"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <Button
                onClick={handleAddToCart}
                className="flex-1 h-12 bg-[#24211d] text-white hover:bg-[#a8822d] font-bold text-sm rounded-xl shadow-md"
              >
                <ShoppingBag className="ml-2 h-4 w-4" />
                {t("إضافة إلى السلة", "Add to Cart")}
              </Button>

              <Button
                onClick={handleWhatsAppOrder}
                className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl px-6 shadow-md"
              >
                <MessageCircle className="ml-2 h-5 w-5" />
                {t("طلب فوري عبر واتساب", "WhatsApp Order")}
              </Button>
            </div>

            {/* Quality Guarantees */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-[#eee8dd] text-xs text-[#5c5448]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>ضمان كامل ضد الصدأ والخدش واللحام</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-[#a8822d] shrink-0" />
                <span>توصيل ومعاينة لكافة محافظات مصر</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#d5af58] shrink-0" />
                <span>تنفيذ وتفصيل حسب أبعادك ومواصفاتك</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-600 shrink-0" />
                <a href={`tel:+20${BUSINESS_PHONE.slice(1)}`} className="hover:underline font-bold" dir="ltr">
                  هاتف الدعم: {BUSINESS_PHONE}
                </a>
              </div>
            </div>

            {/* Customer Reviews Component */}
            <ReviewSection productId={product.id} title={lang === "ar" ? product.nameAr : product.name} />
          </div>
        </div>
      </section>

      {/* Mobile Sticky Order Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-[#e8e2d8] p-3 lg:hidden shadow-2xl flex items-center justify-between gap-3">
        <div>
          <span className="text-xs text-muted-foreground block">{t("الإجمالي:", "Total:")}</span>
          <span className="text-lg font-black text-[#24211d]" dir="ltr">
            {formatPrice(finalTotal)} ج.م
          </span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleAddToCart} className="bg-[#24211d] text-white hover:bg-[#a8822d] font-bold rounded-xl text-xs h-10 px-4">
            <ShoppingBag className="ml-1 h-3.5 w-3.5" />
            السلة
          </Button>
          <Button size="sm" onClick={handleWhatsAppOrder} className="bg-emerald-600 text-white font-bold rounded-xl text-xs h-10 px-4">
            <MessageCircle className="ml-1 h-3.5 w-3.5" />
            واتساب
          </Button>
        </div>
      </div>
    </PublicLayout>
  );
}