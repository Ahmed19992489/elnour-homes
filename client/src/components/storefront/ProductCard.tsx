import React from "react";
import { Link } from "wouter";
import { Heart, ShoppingBag, MessageCircle, Star, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface ProductCardProps {
  product: {
    id: number;
    name: string;
    nameAr: string;
    description?: string | null;
    descriptionAr?: string | null;
    price?: number | string | null;
    pricePerMeter?: number | string | null;
    isPerMeter?: boolean | string | null;
    images?: string[] | null;
    category?: string | null;
    featured?: boolean | string | null;
    inStock?: boolean | string | null;
    rating?: number | null;
    reviewCount?: number | null;
  };
  categoryName?: string;
}

const BUSINESS_PHONE = "01121748885";

export default function ProductCard({ product, categoryName }: ProductCardProps) {
  const { lang, isRTL, t } = useLanguage();
  const { isInWishlist, toggleItem } = useWishlist();
  const { addItem } = useCart();

  const isFavorited = isInWishlist(product.id);
  const isMeterBased = product.isPerMeter === true || product.isPerMeter === "true" || product.isPerMeter === "yes";
  const displayPrice = isMeterBased
    ? Number(product.pricePerMeter || product.price || 0)
    : Number(product.price || 0);

  const imagesList = Array.isArray(product.images)
    ? product.images
    : typeof product.images === "string"
    ? JSON.parse(product.images || "[]")
    : [];

  const mainImage = imagesList[0] || "/placeholder-steel.jpg";

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      productId: product.id,
      name: product.name,
      nameAr: product.nameAr,
      price: displayPrice,
      quantity: 1,
      image: mainImage,
      isPerMeter: isMeterBased,
    });
    toast.success(lang === "ar" ? "تمت إضافة المنتج إلى سلة المشتريات" : "Added to cart");
  };

  const handleWhatsAppOrder = (e: React.MouseEvent) => {
    e.preventDefault();
    const productName = lang === "ar" ? product.nameAr : product.name;
    const priceText = isMeterBased ? `${formatPrice(displayPrice)} ج.م / للمتر` : `${formatPrice(displayPrice)} ج.م`;
    const message = `مرحباً Elnour Homes، أود الاستفسار والطلب للمنتج التالي:\nاسم الموديل: ${productName}\nالسعر: ${priceText}\nرابط المنتج: ${window.location.origin}/product/${product.id}`;
    window.open(`https://wa.me/20${BUSINESS_PHONE.slice(1)}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <div className="group relative flex flex-col rounded-2xl border border-[#e5dfd5] bg-white overflow-hidden shadow-xs hover:shadow-xl hover:border-[#d5af58]/60 transition-all duration-300">
      {/* Top badges & Wishlist */}
      <div className="relative aspect-4/3 w-full bg-[#f4efe8] overflow-hidden">
        <Link href={`/product/${product.id}`} className="block h-full w-full">
          <img
            src={mainImage}
            alt={lang === "ar" ? product.nameAr : product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              // fallback image if broken
              (e.target as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&auto=format&fit=crop&q=80";
            }}
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
          {product.featured && (
            <Badge variant="gold" className="shadow-sm">
              {t("مميز", "Featured")}
            </Badge>
          )}
          {isMeterBased && (
            <Badge variant="secondary" className="bg-[#24211d] text-white font-bold text-[10px]">
              {t("حسب المقاس", "Per Meter")}
            </Badge>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleItem(product.id);
          }}
          className={`absolute top-3 left-3 z-10 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition-all ${
            isFavorited
              ? "bg-red-50 text-red-500 shadow-md"
              : "bg-white/80 text-[#3e3931] hover:bg-white hover:text-red-500"
          }`}
          aria-label="Wishlist"
        >
          <Heart className={`h-4 w-4 ${isFavorited ? "fill-current" : ""}`} />
        </button>

        {/* Quick Action Overlay on desktop */}
        <div className="absolute inset-x-3 bottom-3 hidden lg:flex items-center gap-2 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <Button
            size="sm"
            onClick={handleQuickAdd}
            className="flex-1 bg-[#24211d] text-white hover:bg-[#d5af58] hover:text-[#24211d] font-bold text-xs shadow-lg"
          >
            <ShoppingBag className="ml-1 h-3.5 w-3.5" />
            {t("أضف للسلة", "Add to Cart")}
          </Button>
          <Button
            size="sm"
            onClick={handleWhatsAppOrder}
            className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold px-3 shadow-lg"
            title="طلب سريع عبر واتساب"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        {categoryName && (
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#a8822d]">
            {categoryName}
          </span>
        )}

        <Link href={`/product/${product.id}`} className="mt-1 block">
          <h3 className="font-bold text-[#24211d] text-base leading-snug group-hover:text-[#a8822d] transition-colors line-clamp-1">
            {lang === "ar" ? product.nameAr : product.name}
          </h3>
        </Link>

        {/* Rating stars if available */}
        <div className="mt-2 flex items-center gap-1.5 text-xs text-[#786f63]">
          <div className="flex text-amber-500">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${
                  i < (product.rating || 5) ? "fill-current" : "opacity-30"
                }`}
              />
            ))}
          </div>
          <span>({product.reviewCount || 12})</span>
        </div>

        {/* Price & Call to Action */}
        <div className="mt-4 pt-3 border-t border-[#f0eae0] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-lg font-black text-[#24211d]">
              {formatPrice(displayPrice)} <span className="text-xs font-bold text-[#786f63]">{t("ج.م", "EGP")}</span>
            </span>
            {isMeterBased && (
              <span className="text-[11px] text-[#a8822d] font-bold">
                {t("سعر المتر المربع", "Price per meter")}
              </span>
            )}
          </div>

          <Link href={`/product/${product.id}`}>
            <Button size="sm" variant="outline" className="h-9 px-3 rounded-xl border-[#d5af58]/40 hover:border-[#d5af58] font-bold text-xs">
              <span>{t("تفاصيل", "Details")}</span>
              <ArrowLeft className={`h-3.5 w-3.5 ${isRTL ? "mr-1" : "ml-1 rotate-180"}`} />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
