import PublicLayout from "@/components/storefront/PublicLayout";
import ProductCard from "@/components/storefront/ProductCard";
import { UpdateHead } from "@/components/UpdateHead";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2, PackageSearch } from "lucide-react";
import { Link, useParams } from "wouter";

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { lang, isRTL } = useLanguage();
  const { data: categories, isLoading: categoriesLoading } = trpc.categories.active.useQuery();
  const { data: products, isLoading: productsLoading } = trpc.products.active.useQuery({ category: slug });
  const category = categories?.find((item) => item.slug === slug);
  const title = lang === "ar" ? category?.nameAr : category?.nameEn;
  const description = lang === "ar" ? category?.descriptionAr : category?.descriptionEn;
  const loading = categoriesLoading || productsLoading;

  UpdateHead({
    title: title ? `${title} | Elnour for STEEL` : (lang === "ar" ? "فئة المنتجات | Elnour for STEEL" : "Product Category | Elnour for STEEL"),
    description: description || (lang === "ar" ? "تصفح منتجات الفئة من ديكورات وفواصل وطرابيزات الاستيل" : "Browse products in this category: steel decor, dividers and tables"),
    path: `/products/${slug}`,
  });

  return <PublicLayout>
    <section className="bg-[#eee9df] px-4 py-16 md:py-20"><div className="container"><Link href="/products" className="inline-flex items-center text-sm font-bold text-[#8c681d] hover:text-[#24211d]"><ArrowLeft className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2 rotate-180"}`} />{lang === "ar" ? "كل المنتجات" : "All products"}</Link><h1 className="mt-5 text-4xl font-black text-[#24211d] md:text-6xl">{title || (lang === "ar" ? "فئة المنتجات" : "Product category")}</h1>{description ? <p className="mt-4 max-w-2xl text-lg leading-8 text-[#5e574c]">{description}</p> : null}</div></section>
    <section className="container py-14 md:py-20">{loading ? <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#ad842f]" /></div> : !category ? <div className="rounded-2xl border border-dashed border-[#c8beae] bg-white px-6 py-20 text-center"><PackageSearch className="mx-auto h-10 w-10 text-[#ad842f]" /><p className="mt-4 text-[#625c51]">{lang === "ar" ? "هذه الفئة غير متاحة." : "This category is not available."}</p><Link href="/products"><Button variant="outline" className="mt-5">{lang === "ar" ? "العودة للمنتجات" : "Back to products"}</Button></Link></div> : products?.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{products.map((product) => <ProductCard key={product.id} product={product} categoryName={title} />)}</div> : <div className="rounded-2xl border border-dashed border-[#c8beae] bg-white px-6 py-20 text-center"><PackageSearch className="mx-auto h-10 w-10 text-[#ad842f]" /><p className="mt-4 text-[#625c51]">{lang === "ar" ? "لا توجد منتجات ظاهرة في هذه الفئة حالياً." : "There are no visible products in this category yet."}</p></div>}</section>
  </PublicLayout>;
}

