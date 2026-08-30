import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { ArrowLeft, Heart, PackageOpen, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { getPrimaryProductImage, parseProductImages } from "@/lib/productImages";
import { StarRatingDisplay } from "./StarRating";

type ProductCardProps = {
  product: {
    id: number;
    name: string;
    nameAr: string;
    description: string | null;
    price: string;
    images: string | null;
  };
  categoryName?: string;
};

export default function ProductCard({ product, categoryName }: ProductCardProps) {
  const { lang, isRTL } = useLanguage();
  const { addItem } = useCart();
  const { isWished, toggle } = useWishlist();
  const wished = isWished(product.id);

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(product.id);
    toast.success(wished ? (lang === "ar" ? "تمت إزالته من المفضلة" : "Removed from wishlist") : (lang === "ar" ? "تمت إضافته إلى المفضلة" : "Added to wishlist"));
  };
  const image = getPrimaryProductImage(product.images);
  const { data: ratingData } = trpc.reviews.forProduct.useQuery({ productId: product.id });
  const reviewSummary = ratingData && ratingData.stats.count > 0 ? ratingData.stats : null;
  const imageCount = parseProductImages(product.images).length;
  const price = Number(product.price || 0).toLocaleString(lang === "ar" ? "ar-EG" : "en-US");
  const title = lang === "ar" ? product.nameAr : product.name;

  return (
    <article className="group overflow-hidden rounded-2xl border border-[#e0dacd] bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
      <Link href={`/product/${product.id}`} className="relative block aspect-[4/3] overflow-hidden bg-[#eee9df]">
        {image ? <img src={image} alt={title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-[#ad842f]"><PackageOpen className="h-10 w-10" /></div>}
        <button
          type="button"
          aria-label={lang === "ar" ? "أضف إلى المفضلة" : "Add to wishlist"}
          onClick={handleWishlist}
          className={`absolute top-2.5 ${isRTL ? "left-2.5" : "right-2.5"} flex h-8 w-8 items-center justify-center rounded-full border border-black/15 bg-white/95 shadow-sm transition-all hover:scale-110 ${wished ? "text-red-500" : "text-[#8a806f]"}`}
        >
          <Heart className={`h-4 w-4 ${wished ? "fill-current" : ""}`} />
        </button>
        {imageCount > 1 ? <span className="absolute bottom-3 right-3 rounded-full bg-black/70 px-2.5 py-1 text-xs font-bold text-white">{imageCount} {lang === "ar" ? "صور" : "photos"}</span> : null}
      </Link>
      <div className="space-y-3 p-4">
        {categoryName ? <span className="text-xs font-bold text-[#ad842f]">{categoryName}</span> : null}
        <Link href={`/product/${product.id}`} className="block truncate text-lg font-bold text-[#24211d] hover:text-[#ad842f]">{title}</Link>
        {reviewSummary ? (
          <div className="flex items-center gap-1.5">
            <StarRatingDisplay value={reviewSummary.average} count={reviewSummary.count} />
            <span className="text-[10px] font-bold text-[#8b6821]">{lang === "ar" ? "مشتري موثّق" : "Verified buyers"}</span>
          </div>
        ) : null}
        <div className="flex items-end justify-between gap-3">
          <p className="text-base font-black text-[#24211d]">{price} <span className="text-xs font-medium">{lang === "ar" ? "ج.م" : "EGP"}</span></p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label={lang === "ar" ? "أضف إلى السلة" : "Add to cart"}
              onClick={() => {
                addItem({ productId: product.id, quantity: 1, unitPrice: Number(product.price || 0) });
                toast.success(lang === "ar" ? `تمت إضافة «${title}» إلى السلة — اختر المقاس واللون من صفحة المنتج` : `“${title}” added — pick size and colour on the product page`);
              }}
              className="inline-flex h-8 items-center rounded-md border border-[#ad842f] px-2 text-[#8b6821] transition-colors hover:bg-[#fdf9ee]"
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
            <Link href={`/product/${product.id}`} className="inline-flex h-8 items-center rounded-md border border-[#24211d] px-3 text-xs font-medium transition-colors hover:bg-[#24211d] hover:text-white">
              {lang === "ar" ? "التفاصيل" : "Details"}<ArrowLeft className={`h-4 w-4 ${isRTL ? "mr-1" : "ml-1 rotate-180"}`} />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
