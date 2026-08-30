import React, { useState, useMemo } from "react";
import PublicLayout from "@/components/storefront/PublicLayout";
import ProductCard from "@/components/storefront/ProductCard";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { UpdateHead } from "@/components/UpdateHead";
import { Search, Filter, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CatalogPage() {
  const { lang, t } = useLanguage();
  UpdateHead({
    title: lang === "ar" ? "كتالوج منتجات الاستيل والديكور | Elnour Homes" : "Steel Decor Catalogue | Elnour Homes",
    description: "تصفح تشكيلة Elnour Homes الحصرية من ترابيزات الاستيل، المرايات، الكونسول، والقواطع الفاخرة المصنعة بأعلى جودة.",
  });

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("q") || params.get("category") || "";
    }
    return "";
  });
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc">("featured");

  const { data: rawProducts, isLoading: productsLoading } = trpc.products.list.useQuery();
  const { data: rawCategories } = trpc.categories.list.useQuery();

  const products = Array.isArray(rawProducts) ? rawProducts : [];
  const categories = Array.isArray(rawCategories) ? rawCategories : [];

  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Category filter
    if (selectedCategory !== "all") {
      list = list.filter((p: any) => p.category === selectedCategory);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p: any) =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.nameAr && p.nameAr.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.descriptionAr && p.descriptionAr.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortBy === "price-asc") {
      list.sort((a: any, b: any) => Number(a.price || 0) - Number(b.price || 0));
    } else if (sortBy === "price-desc") {
      list.sort((a: any, b: any) => Number(b.price || 0) - Number(a.price || 0));
    }

    return list;
  }, [products, selectedCategory, searchQuery, sortBy]);

  return (
    <PublicLayout>
      {/* Header */}
      <section className="border-b border-[#e8e2d8] bg-[#f5f0e6] py-12 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-[#d5af58]/20 px-4 py-1.5 text-xs font-bold text-[#a8822d] mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{t("كتالوج Elnour Homes الحصري", "Elnour Homes Exclusive Catalogue")}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-[#24211d]">
            {t("أعمال وديكورات الاستيل الفاخرة", "Luxury Stainless Steel Decor")}
          </h1>
          <p className="mt-3 text-base text-[#6b6255] max-w-2xl mx-auto">
            {t(
              "ترابيزات صالون، كونسول، مرايات مضيئة ذكية، وقواطع ديكورية مصنوعة من أجود خامات استيل 304 المقاوم للصدأ.",
              "Salon tables, consoles, smart LED mirrors, and architectural screens forged from genuine 304 stainless steel."
            )}
          </p>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-[#e8e2d8] shadow-xs">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("ابحث عن ترابيزة، كونسول، مراية...", "Search pieces...")}
              className="w-full h-11 pr-10 pl-4 rounded-xl border border-[#ded7cb] bg-[#faf8f5] text-sm focus:outline-none focus:border-[#d5af58] focus:ring-1 focus:ring-[#d5af58]"
            />
          </div>

          {/* Categories Tab Pill */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-[#24211d] text-[#d5af58]"
                  : "bg-[#f5f0e6] text-[#6b6255] hover:bg-[#eae3d5]"
              }`}
            >
              {t("الكل", "All")}
            </button>
            {categories.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat.slug
                    ? "bg-[#24211d] text-[#d5af58]"
                    : "bg-[#f5f0e6] text-[#6b6255] hover:bg-[#eae3d5]"
                }`}
              >
                {lang === "ar" ? cat.nameAr : cat.nameEn}
              </button>
            ))}
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            <span className="text-xs text-muted-foreground">{t("ترتيب حسب:", "Sort:")}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-10 px-3 rounded-xl border border-[#ded7cb] bg-[#faf8f5] text-xs font-bold focus:outline-none focus:border-[#d5af58]"
            >
              <option value="featured">{t("الأحدث والأبرز", "Featured")}</option>
              <option value="price-asc">{t("السعر: من الأقل للأعلى", "Price: Low to High")}</option>
              <option value="price-desc">{t("السعر: من الأعلى للأقل", "Price: High to Low")}</option>
            </select>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="container mx-auto px-4 pb-20">
        {productsLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-[#d5af58]" />
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
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
        ) : (
          <div className="rounded-3xl border border-dashed border-[#ddd6c8] bg-white p-16 text-center max-w-lg mx-auto space-y-3">
            <Filter className="h-10 w-10 text-muted-foreground mx-auto" />
            <h3 className="text-xl font-bold text-[#24211d]">
              {t("لم نجد نتائج مطابقة لبحثك", "No matching products found")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("جرّب تغيير كلمات البحث أو استعراض قسم آخر.", "Try adjusting your search query or selecting a different category.")}
            </p>
            <Button
              onClick={() => {
                setSelectedCategory("all");
                setSearchQuery("");
              }}
              variant="outline"
              className="mt-2 font-bold border-[#d5af58] text-[#a8822d]"
            >
              {t("إعادة ضبط الفلاتر", "Reset Filters")}
            </Button>
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
