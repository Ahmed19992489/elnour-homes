import PublicLayout from "@/components/storefront/PublicLayout";
import ProductCard from "@/components/storefront/ProductCard";
import { UpdateHead } from "@/components/UpdateHead";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ArrowUpLeft, Loader2, Sparkles } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { lang, isRTL } = useLanguage();
  UpdateHead({
    title: lang === "ar" ? "Elnour for STEEL - ديكورات استيل منزلية فاخرة | طرابيزات وفواصل" : "Elnour for STEEL - Luxury Steel Home Decor | Tables & Dividers",
    description: lang === "ar" ? "أعمال ديكور منزلية فاخرة من الاستيل المطلى بدهانات الكتروستاتيك: طرابيزات، فواصل، مسابح إضاءة وديكور حوائط. اطلب أونلاين وتوصيل لبيتك." : "Luxury home decor crafted from electrostatic-coated steel: tables, dividers, light channels and wall decor. Order online with delivery.",
    path: lang === "ar" ? "/?lang=ar" : "/?lang=en",
  });
  const { data: content } = trpc.siteContent.list.useQuery();
  const { data: categories } = trpc.categories.active.useQuery();
  const { data: products, isLoading } = trpc.products.active.useQuery();
  const hero = content?.find((item) => item.sectionKey === "hero");
  const copy = lang === "ar" ? {
    eyebrow: "تصميمات استيل للبيت العصري", title: hero?.titleAr || "استيل يترك أثراً في كل مساحة", subtitle: hero?.subtitleAr || "ديكورات وأثاث استيل بتشطيبات أنيقة، من القطعة الجاهزة إلى التصميم الخاص.", browse: "تصفح المنتجات", work: "شاهد أعمالنا", categories: "تسوق حسب الفئة", featured: "منتجات مختارة", all: "عرض كل المنتجات", categoryFallback: "تصميمات استيل بتفاصيل متقنة.",
  } : {
    eyebrow: "STEEL DESIGNS FOR THE MODERN HOME", title: hero?.titleEn || "Steel that makes every space memorable", subtitle: hero?.subtitleEn || "Steel décor and furniture with refined finishes, from ready pieces to custom designs.", browse: "Browse products", work: "View our work", categories: "Shop by category", featured: "Selected products", all: "View all products", categoryFallback: "Well-crafted steel designs for your space.",
  };

  return <PublicLayout>
    <section className="relative overflow-hidden bg-[#24211d] px-4 py-20 text-[#f9f7f2] md:py-28"><div className="absolute inset-y-0 left-0 w-1/3 bg-[radial-gradient(circle_at_center,_rgba(213,175,88,0.20),transparent_70%)]" /><div className="container relative grid gap-12 lg:grid-cols-[1.25fr_0.75fr] lg:items-end"><div><p className="flex items-center gap-2 text-sm font-bold tracking-[0.18em] text-[#d5af58]"><Sparkles className="h-4 w-4" />{copy.eyebrow}</p><h1 className="mt-5 max-w-3xl text-5xl font-black leading-[1.08] md:text-7xl">{copy.title}</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-[#ded8ce] md:text-xl">{copy.subtitle}</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/products"><Button size="lg" className="bg-[#d5af58] text-[#24211d] hover:bg-[#f0cc79]">{copy.browse}<ArrowLeft className={`h-4 w-4 ${isRTL ? "mr-2" : "ml-2 rotate-180"}`} /></Button></Link><Link href="/work"><Button size="lg" variant="outline" className="border-white/50 bg-transparent text-white hover:bg-white hover:text-[#24211d]">{copy.work}</Button></Link></div></div><div className="border border-[#d5af58]/40 bg-white/5 p-7 backdrop-blur"><p className="text-sm text-[#d5af58]">ELNOUR FOR STEEL</p><p className="mt-4 text-2xl font-bold leading-10">{lang === "ar" ? "من الفكرة إلى التشطيب، نساعدك على اختيار قطعة تناسب مساحتك." : "From concept to finish, we help you choose a piece that belongs in your space."}</p><Link href="/about" className="mt-6 inline-flex items-center font-bold text-white hover:text-[#d5af58]">{lang === "ar" ? "تعرف علينا" : "Get to know us"}<ArrowUpLeft className="mx-2 h-4 w-4" /></Link></div></div></section>

    <section className="container py-14 md:py-20"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-bold tracking-[0.16em] text-[#a17a26]">CATALOGUE</p><h2 className="mt-2 text-3xl font-black text-[#24211d] md:text-4xl">{copy.categories}</h2></div><Link href="/products" className="font-bold text-[#8c681d] hover:text-[#24211d]">{copy.all}</Link></div><div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{categories?.slice(0, 4).map((category) => <Link key={category.id} href={`/products/${category.slug}`} className="group rounded-2xl border border-[#ddd6c8] bg-white p-5 transition hover:-translate-y-1 hover:border-[#ad842f] hover:shadow-lg"><p className="font-black text-[#24211d]">{lang === "ar" ? category.nameAr : category.nameEn}</p><p className="mt-2 text-sm leading-6 text-[#6c6459]">{(lang === "ar" ? category.descriptionAr : category.descriptionEn) || copy.categoryFallback}</p><span className="mt-4 inline-flex items-center text-sm font-bold text-[#a17a26]">{lang === "ar" ? "تصفح الفئة" : "Explore category"}<ArrowLeft className={`h-4 w-4 ${isRTL ? "mr-2" : "ml-2 rotate-180"}`} /></span></Link>)}</div></section>

    <section className="border-y border-[#e0dacd] bg-[#eee9df] py-14 md:py-20"><div className="container"><div className="flex items-end justify-between gap-4"><div><p className="text-sm font-bold tracking-[0.16em] text-[#a17a26]">FEATURED</p><h2 className="mt-2 text-3xl font-black text-[#24211d] md:text-4xl">{copy.featured}</h2></div><Link href="/products"><Button variant="outline">{copy.all}</Button></Link></div>{isLoading ? <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#ad842f]" /></div> : products?.length ? <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{products.slice(0, 3).map((product) => <ProductCard key={product.id} product={product} categoryName={categories?.find((category) => category.slug === product.category)?.[lang === "ar" ? "nameAr" : "nameEn"]} />)}</div> : <div className="mt-7 rounded-2xl border border-dashed border-[#c8beae] bg-white px-6 py-16 text-center text-[#625c51]">{lang === "ar" ? "أضف منتجاتك من لوحة التحكم لتظهر هنا." : "Add products from the dashboard to show them here."}</div>}</div></section>

    <section className="container py-14 md:py-20"><div className="grid gap-7 rounded-3xl bg-[#d5af58] p-8 md:grid-cols-[1fr_auto] md:items-center md:p-12"><div><p className="text-sm font-bold tracking-[0.16em] text-[#57400c]">CUSTOM STEELWORK</p><h2 className="mt-3 text-3xl font-black text-[#24211d] md:text-4xl">{lang === "ar" ? "لديك مقاس أو تصميم خاص؟" : "Have a custom size or design?"}</h2><p className="mt-3 max-w-2xl text-lg leading-8 text-[#4c3b11]">{lang === "ar" ? "تواصل معنا على واتساب وشاركنا فكرتك لنناقش القطعة الأنسب لمساحتك." : "Contact us on WhatsApp and share your idea so we can discuss the right piece for your space."}</p></div><a href="https://wa.me/201118182424" target="_blank" rel="noreferrer"><Button size="lg" className="bg-[#24211d] text-white hover:bg-[#4a4238]">{lang === "ar" ? "تواصل عبر واتساب" : "Chat on WhatsApp"}</Button></a></div></section>
  </PublicLayout>;
}
