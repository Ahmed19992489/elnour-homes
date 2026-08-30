import React from "react";
import { Link } from "wouter";
import PublicLayout from "@/components/storefront/PublicLayout";
import ProductCard from "@/components/storefront/ProductCard";
import { useWishlist } from "@/contexts/WishlistContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { UpdateHead } from "@/components/UpdateHead";
import { trpc } from "@/lib/trpc";
import { Heart, ShoppingBag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WishlistPage() {
  const { lang, t } = useLanguage();
  UpdateHead({
    title: lang === "ar" ? "قائمة رغباتي والمفضلات | Elnour Homes" : "My Wishlist | Elnour Homes",
  });

  const { items: wishlistIds } = useWishlist();
  const { data: rawProducts, isLoading } = trpc.products.list.useQuery();
  const { data: rawCategories } = trpc.categories.list.useQuery();

  const allProducts = Array.isArray(rawProducts) ? rawProducts : [];
  const categories = Array.isArray(rawCategories) ? rawCategories : [];

  const favoriteProducts = allProducts.filter((p) => wishlistIds.includes(p.id));

  return (
    <PublicLayout>
      <section className="container mx-auto px-4 py-12 md:py-16">
        <h1 className="text-3xl md:text-4xl font-black text-[#24211d] mb-8">
          {t("قائمة رغباتي والمفضلات", "My Wishlist")}
        </h1>

        {wishlistIds.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#ddd6c8] bg-white p-16 text-center max-w-xl mx-auto space-y-4">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-500">
              <Heart className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold text-[#24211d]">
              {t("لم تقم بإضافة أي منتجات للمفضلة بعد", "Your wishlist is empty")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("اضغط على أيقونة القلب في أي منتج لحفظه والرجوع إليه في أي وقت.", "Click the heart icon on any product to save it for later.")}
            </p>
            <Link href="/products">
              <Button className="mt-4 bg-[#24211d] text-white hover:bg-[#a8822d] font-bold rounded-xl px-8 cursor-pointer">
                {t("تصفح المنتجات الآن", "Browse Products")}
              </Button>
            </Link>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-[#d5af58]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favoriteProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                categoryName={
                  categories.find((c: any) => c.slug === product.category)?.[
                    lang === "ar" ? "nameAr" : "nameEn"
                  ]
                }
              />
            ))}
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
