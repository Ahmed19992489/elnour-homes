import React from "react";
import PublicLayout from "@/components/storefront/PublicLayout";
import ProductCard from "@/components/storefront/ProductCard";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { UpdateHead } from "@/components/UpdateHead";
import { Tag, Sparkles, Loader2 } from "lucide-react";

export default function OffersPage() {
  const { lang, t } = useLanguage();
  UpdateHead({
    title: lang === "ar" ? "العروض والخصومات الخاصة | Elnour Homes" : "Special Offers | Elnour Homes",
    description: "استمتع بأقوى عروض وتخفيضات ديكورات الاستيل الفاخرة من Elnour Homes لفترة محدودة.",
  });

  const { data: products, isLoading } = trpc.products.list.useQuery();
  const { data: categories } = trpc.categories.list.useQuery();

  // Filter featured products or offer products
  const offerProducts = products?.filter((p) => p.featured) || products || [];

  return (
    <PublicLayout>
      <section className="border-b border-[#e8e2d8] bg-[#f5f0e6] py-12 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-[#d5af58]/20 px-4 py-1.5 text-xs font-bold text-[#a8822d] mb-4">
            <Tag className="h-3.5 w-3.5" />
            <span>{t("عروض حصرية ومميزة", "Exclusive Limited Offers")}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-[#24211d]">
            {t("عروض ديكورات الاستيل الفاخرة", "Luxury Steel Decor Deals")}
          </h1>
          <p className="mt-3 text-base text-[#6b6255] max-w-2xl mx-auto">
            {t(
              "اغتنم الفرصة واحصل على أرقى قطع الاستيل بأسعار تنافسية وضمان حقيقي مع إمكانية التفصيل حسب الطلب.",
              "Take advantage of special pricing on top stainless steel pieces with genuine warranty and custom sizes."
            )}
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-[#d5af58]" />
          </div>
        ) : offerProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {offerProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                categoryName={
                  categories?.find((c) => c.slug === product.category)?.[
                    lang === "ar" ? "nameAr" : "nameEn"
                  ]
                }
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-[#ddd6c8] bg-white p-16 text-center">
            <p className="font-bold text-lg">{t("تابعونا قريباً للمزيد من العروض الحصرية", "Stay tuned for more exclusive offers soon")}</p>
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
