import React from "react";
import { useParams, Link } from "wouter";
import PublicLayout from "@/components/storefront/PublicLayout";
import ProductCard from "@/components/storefront/ProductCard";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { UpdateHead } from "@/components/UpdateHead";
import { Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { lang, isRTL, t } = useLanguage();

  const { data: category, isLoading: catLoading } = trpc.categories.bySlug.useQuery({ slug: slug || "" });
  const { data: rawProducts, isLoading: prodLoading } = trpc.products.byCategory.useQuery({ category: slug || "", slug: slug || "" });

  const products = Array.isArray(rawProducts) ? rawProducts : [];

  const catName = category ? (lang === "ar" ? category.nameAr : category.nameEn) : (slug || "القسم");
  const catDesc = category ? (lang === "ar" ? category.descriptionAr : category.descriptionEn) : "";

  UpdateHead({
    title: `${catName} | Elnour Homes`,
    description: catDesc || `تصفح تشكيلة ${catName} الفاخرة من استيل وديكورات Elnour Homes.`,
  });

  return (
    <PublicLayout>
      {/* Category Header */}
      <section className="border-b border-[#e8e2d8] bg-[#f5f0e6] py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[#a8822d] mb-4">
            <Link href="/" className="hover:underline">{t("الرئيسية", "Home")}</Link>
            <span>/</span>
            <Link href="/products" className="hover:underline">{t("المنتجات", "Products")}</Link>
            <span>/</span>
            <span className="text-[#24211d]">{catName}</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-[#24211d]">
            {catName}
          </h1>
          {catDesc && (
            <p className="mt-3 text-base text-[#6b6255] max-w-2xl">
              {catDesc}
            </p>
          )}
        </div>
      </section>

      {/* Category Products */}
      <section className="container mx-auto px-4 py-12">
        {prodLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-[#d5af58]" />
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                categoryName={catName}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-[#ddd6c8] bg-white p-16 text-center max-w-md mx-auto space-y-4">
            <h3 className="text-xl font-bold text-[#24211d]">
              {t("لا توجد منتجات في هذا القسم حالياً", "No products in this category yet")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("تابعنا قريباً لإضافة موديلات جديدة أو تواصل معنا لتفصيل طلبك الخاص.", "Check back soon or contact us directly for custom fabrication.")}
            </p>
            <Link href="/products">
              <Button className="bg-[#24211d] text-white hover:bg-[#a8822d] font-bold rounded-xl">
                {t("تصفح باقي الأقسام", "Browse Other Categories")}
              </Button>
            </Link>
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
