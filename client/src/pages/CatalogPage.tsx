import PublicLayout from "@/components/storefront/PublicLayout";
import ProductCard from "@/components/storefront/ProductCard";
import { UpdateHead } from "@/components/UpdateHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { filterCatalogProducts } from "@/lib/catalog";
import { Loader2, Palette, Search, SlidersHorizontal } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";

export default function CatalogPage() {
  const { lang } = useLanguage();
  UpdateHead({
    title: lang === "ar" ? "كتالوج المنتجات | Elnour for STEEL - ديكورات استيل" : "Product Catalog | Elnour for STEEL - Steel Decor",
    description: lang === "ar" ? "تصفح كتالوج منتجات Elnour for STEEL: طرابيزات، فواصل، مسابح إضاءة وديكور حوائط من الاستيل المطلى بدهانات الكتروستاتيك." : "Browse the Elnour for STEEL catalog: tables, dividers, light channels and wall decor crafted from electrostatic-coated steel.",
    path: lang === "ar" ? "/catalog?lang=ar" : "/catalog?lang=en",
  });
  const { data: categories } = trpc.categories.active.useQuery();
  const { data: products, isLoading } = trpc.products.active.useQuery();
  const [location] = useLocation();
  const [query, setQuery] = useState(() => new URLSearchParams(location.split("?")[1] || "").get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const copy = lang === "ar" ? { eyebrow: "الكتالوج", title: "اختر ما يناسب مساحتك", description: "تصفح الفئات، شاهد التفاصيل، وتواصل معنا للطلب أو الاستفسار.", all: "كل المنتجات", search: "ابحث باسم المنتج...", results: "منتج", empty: "لا توجد منتجات مطابقة للبحث أو الفئة المختارة.", categories: "تصفح حسب الفئة", price: "أقل من", priceFilter: "السعر", colors: "اللون", applyFilters: "تطبيق", clearFilters: "مسح الفلاتر", filters: "فلاتر", currency: "ج.م" } : { eyebrow: "CATALOGUE", title: "Find what fits your space", description: "Browse categories, explore product details, and contact us to order or enquire.", all: "All products", search: "Search products...", results: "products", empty: "No products match this search or category.", categories: "Browse by category", price: "Up to", priceFilter: "Price", colors: "Colour", applyFilters: "Apply", clearFilters: "Clear filters", filters: "Filters", currency: "EGP" };
  const categoryMap = useMemo(() => new Map(categories?.map((category) => [category.slug, lang === "ar" ? category.nameAr : category.nameEn])), [categories, lang]);
  useEffect(() => {
    setQuery(new URLSearchParams(location.split("?")[1] || "").get("q") || "");
  }, [location]);
  const maxProductPrice = useMemo(() => {
    const prices = (products ?? []).map((product) => parseFloat(product.price) || 0).filter(Boolean);
    return prices.length ? Math.max(...prices) : 0;
  }, [products]);

  const filteredProducts = useMemo(() => {
    const base = filterCatalogProducts(products, query, selectedCategory);
    return base.filter((product) => {
      const price = parseFloat(product.price) || 0;
      if (maxPrice !== null && price > maxPrice) return false;
      if (selectedColors.length > 0) {
        const colors = (product.colors || "").toLowerCase();
        const colorOptions = (() => {
          try {
            if (!product.colorOptions) return "";
            const parsed = JSON.parse(product.colorOptions);
            if (!Array.isArray(parsed)) return "";
            return parsed.map((opt: { labelAr?: string; labelEn?: string }) => `${opt.labelAr || ""} ${opt.labelEn || ""}`).join(" ").toLowerCase();
          } catch {
            return "";
          }
        })();
        const matchesColor = selectedColors.some((color) => colors.includes(color) || colorOptions.includes(color));
        if (!matchesColor) return false;
      }
      return true;
    });
  }, [products, query, selectedCategory, maxPrice, selectedColors]);

  const allColors = useMemo(() => {
    const set = new Map<string, number>();
    for (const product of products ?? []) {
      const colors = (product.colors || "").split(/[،,;؛]+/).map((color) => color.trim()).filter(Boolean);
      for (const color of colors) {
        set.set(color, (set.get(color) || 0) + 1);
      }
    }
    return Array.from(set.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name]) => name);
  }, [products]);

  const activeFilterCount = (maxPrice !== null ? 1 : 0) + selectedColors.length;

  return <PublicLayout>
    <section className="bg-[#24211d] px-4 py-16 text-white md:py-20"><div className="container"><p className="text-sm font-bold tracking-[0.18em] text-[#d5af58]">{copy.eyebrow}</p><h1 className="mt-3 text-4xl font-black md:text-6xl">{copy.title}</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-[#ddd5ca]">{copy.description}</p></div></section>
    <section className="container py-12 md:py-16">
      <div className="mb-10"><h2 className="text-xl font-black text-[#24211d]">{copy.categories}</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{categories?.map((category) => <Link key={category.id} href={`/products/${category.slug}`} className="rounded-xl border border-[#ddd6c8] bg-white p-4 transition hover:border-[#ad842f] hover:shadow-md"><p className="font-bold text-[#24211d]">{lang === "ar" ? category.nameAr : category.nameEn}</p><p className="mt-1 line-clamp-2 text-sm text-[#6c6459]">{lang === "ar" ? category.descriptionAr : category.descriptionEn}</p></Link>)}</div></div>
      <div className="rounded-2xl border border-[#ded8ce] bg-white p-4 shadow-sm md:p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="relative w-full lg:max-w-md"><Search className="absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[#958b7e]" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} className="border-[#ded8ce] bg-[#fdfcf9] ps-10" /></div><div className="flex flex-wrap items-center gap-2"><Button size="sm" variant={selectedCategory === "all" ? "default" : "outline"} className={selectedCategory === "all" ? "bg-[#24211d]" : ""} onClick={() => setSelectedCategory("all")}>{copy.all}</Button>{categories?.map((category) => <Button key={category.id} size="sm" variant={selectedCategory === category.slug ? "default" : "outline"} className={selectedCategory === category.slug ? "bg-[#24211d]" : ""} onClick={() => setSelectedCategory(category.slug)}>{lang === "ar" ? category.nameAr : category.nameEn}</Button>)}<Button size="sm" variant={showFilters ? "default" : "outline"} className={showFilters ? "bg-[#b8892f]" : ""} onClick={() => setShowFilters(!showFilters)}><SlidersHorizontal className="h-4 w-4" />{copy.filters}{activeFilterCount > 0 ? <Badge className="ms-1 h-4 min-w-4 px-1 bg-white text-[#b8892f]">{activeFilterCount}</Badge> : null}</Button></div></div>{showFilters && (
        <div className="mt-5 flex flex-col gap-6 border-t border-[#eee8dd] pt-5 lg:flex-row lg:gap-10">
          <div className="w-full max-w-xs"><p className="mb-3 text-sm font-bold text-[#24211d]">{copy.priceFilter}</p><Slider value={[maxPrice ?? maxProductPrice]} max={maxProductPrice || 1} step={Math.max(100, Math.floor(maxProductPrice / 20) / 10)} onValueChange={(values) => setMaxPrice(values[0] >= maxProductPrice ? null : values[0])} /><p className="mt-2 text-sm text-[#6c6459]">{copy.price} <span className="font-bold text-[#24211d]">{maxPrice !== null ? maxPrice.toLocaleString() : "—"}</span> {copy.currency}</p>{maxPrice !== null && <Button size="sm" variant="ghost" className="mt-2 p-0 text-xs text-[#b8892f]" onClick={() => setMaxPrice(null)}>{copy.clearFilters}</Button>}</div>
          {allColors.length > 0 && (
            <div className="w-full max-w-xs"><p className="mb-3 text-sm font-bold text-[#24211d]"><Palette className="me-1 inline h-4 w-4" />{copy.colors}</p><div className="grid grid-cols-2 gap-2">{allColors.map((color) => (
              <div key={color} className="flex items-center gap-2">
                <Checkbox id={`color-${color}`} checked={selectedColors.includes(color)} onCheckedChange={(checked) => setSelectedColors(checked ? [...selectedColors, color] : selectedColors.filter((item) => item !== color))} className="border-[#c8beae]" />
                <Label htmlFor={`color-${color}`} className="cursor-pointer text-sm text-[#4a453c]">{color}</Label>
              </div>
            ))}</div>{selectedColors.length > 0 && <Button size="sm" variant="ghost" className="mt-2 p-0 text-xs text-[#b8892f]" onClick={() => setSelectedColors([])}>{copy.clearFilters}</Button>}</div>
          )}
        </div>
      )}</div>
      <div className="mt-8 flex items-center gap-2 text-sm text-[#6c6459]"><SlidersHorizontal className="h-4 w-4" />{filteredProducts.length} {copy.results}</div>
      {isLoading ? <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#ad842f]" /></div> : filteredProducts.length ? <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filteredProducts.map((product) => <ProductCard key={product.id} product={product} categoryName={categoryMap.get(product.category || "")} />)}</div> : <div className="mt-5 rounded-2xl border border-dashed border-[#c8beae] bg-white px-6 py-20 text-center text-[#625c51]">{copy.empty}</div>}
    </section>
  </PublicLayout>;
}
