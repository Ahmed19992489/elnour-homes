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
      return params.get("q") || "";
    }
    return "";
  });
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc">("featured");

  const { data: products, isLoading: productsLoading } = trpc.products.list.useQuery();
  const { data: categories } = trpc.categories.list.useQuery();

  const filteredProducts = useMemo(() => {
    if (!products) return [];

    let list = [...products];

    // Category filter
    if (selectedCategory !== "all") {
      list = list.filter((p) => p.category === selectedCategory);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.nameAr.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.descriptionAr && p.descriptionAr.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortBy === "price-asc") {
      list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    }

    return list;
  }, [products, selectedCategory, searchQuery, sortBy]);

  return (
    <PublicLayout>
      {/* Header Banner */}
      <section className="border-b border-[#e8e2d8] bg-[#f5f0e6] py-12 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-[#d5af58]/20 px-4 py-1.5 text-xs font-bold text-[#a8822d] mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{t("كتالوج Elnour Homes الحصري", "Elnour Homes Exclusive Catalogue")}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-[#24211d]">
            {t("أرقى ديكورات وأعمال الاستيل", "Luxury Stainless Steel Decor")}
          </h1>
          <p className="mt-3 text-base text-[#6b6255] max-w-2xl mx-auto">
            {t(
              "اكتشف مجموعتنا المميزة من ترابيزات الصالون، الكونسول، المرايات العصرية، وقواطع الديكور المنفذة بأعلى دقة.",
              "Explore our premium collection of living tables, consoles, modern mirrors, and architectural steel partitions."
            )}
          </p>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-[#e8e2d8] pb-6">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
              className={`rounded-xl font-bold ${
                selectedCategory === "all" ? "bg-[#24211d] text-white hover:bg-[#a8822d]" : ""
              }`}
            >
              {t("جميع المنتجات", "All Products")}
            </Button>
            {categories?.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.slug ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat.slug)}
                className={`rounded-xl font-bold ${
                  selectedCategory === cat.slug ? "bg-[#24211d] text-white hover:bg-[#a8822d]" : ""
                }`}
              >
                {lang === "ar" ? cat.nameAr : cat.nameEn}
              </Button>
            ))}
          </div>

          {/* Search & Sort */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("بحث في المنتجات...", "Search products...")}
                className="w-full rounded-xl border border-input bg-white pr-9 pl-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d5af58]"
              />
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-xl border border-input bg-white px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#d5af58]"
            >
              <option value="featured">{t("المقترحة", "Featured")}</option>
              <option value="price-asc">{t("الأقل سعراً", "Price: Low to High")}</option>
              <option value="price-desc">{t("الأعلى سعراً", "Price: High to Low")}</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        <div className="py-10">
          {productsLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-[#d5af58]" />
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => (
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
              <p className="text-lg font-bold text-[#24211d]">
                {t("لم نجد منتجات مطابقة لبحثك", "No products matched your search")}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("جرب البحث بكلمات أخرى أو اختر فئة مختلفة.", "Try different search terms or select another category.")}
              </p>
              <Button
                variant="outline"
                className="mt-6 font-bold"
                onClick={() => {
                  setSelectedCategory("all");
                  setSearchQuery("");
                }}
              >
                {t("عرض كل المنتجات", "Reset Filters")}
              </Button>
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
