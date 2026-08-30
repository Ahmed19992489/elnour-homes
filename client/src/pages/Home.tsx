import React from "react";
import { Link } from "wouter";
import PublicLayout from "@/components/storefront/PublicLayout";
import ProductCard from "@/components/storefront/ProductCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { UpdateHead } from "@/components/UpdateHead";
import { trpc } from "@/lib/trpc";
import {
  Sparkles,
  ShieldCheck,
  Truck,
  Layers,
  CheckCircle2,
  ArrowLeft,
  Phone,
  MessageCircle,
  Clock,
  Award,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const BUSINESS_PHONE = "01121748885";

export default function Home() {
  const { lang, isRTL, t } = useLanguage();

  UpdateHead({
    title: "Elnour Homes | ديكورات وأعمال الاستيل الفاخرة في مصر",
    description: "متجر ومصنع Elnour Homes المتخصص في أرقى ديكورات وترابيزات الاستيل 304، مرايات ليد، كونسول، وقواطع جدارية فاخرة بأعلى جودة وضمان حقيقي.",
  });

  const { data: rawProducts, isLoading: prodLoading } = trpc.products.list.useQuery();
  const { data: rawCategories, isLoading: catLoading } = trpc.categories.list.useQuery();
  const { data: rawGallery } = trpc.gallery.list.useQuery();

  const products = Array.isArray(rawProducts) ? rawProducts : [];
  const categories = Array.isArray(rawCategories) ? rawCategories : [];
  const galleryItems = Array.isArray(rawGallery) ? rawGallery : [];

  const featuredList = products.filter((p: any) => p.featured || p.isActive === "yes");
  const featuredProducts = featuredList.length > 0 ? featuredList.slice(0, 8) : products.slice(0, 4);

  return (
    <PublicLayout>
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-[#24211d] text-[#f8f5ee] py-20 md:py-32">
        <div className="absolute inset-y-0 left-0 w-1/2 bg-[radial-gradient(circle_at_center,_rgba(213,175,88,0.22),transparent_70%)] pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10 grid gap-12 lg:grid-cols-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#d5af58]/20 px-4 py-1.5 text-xs font-bold text-[#d5af58]">
              <Sparkles className="h-4 w-4" />
              <span>{t("رواد تصنيع الاستيل والديكور الفاخر في مصر", "Egypt's Premier Luxury Stainless Steel Decor")}</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1]">
              {t("دقة الهندسة وجمال", "Precision Engineering &")} <br />
              <span className="gold-text-gradient">{t("فخامة الاستيل 304", "Luxury 304 Steel")}</span>
            </h1>

            <p className="text-base sm:text-xl text-[#ded7cb] leading-relaxed max-w-2xl">
              {t(
                "نصنع لك أرقى ترابيزات الصالون، الكونسول، المرايات المضيئة، وقواطع الديكور المخصصة حسب أبعادك بأعلى معايير الجودة.",
                "Custom crafting living tables, luxury consoles, LED mirrors, and architectural steel partitions tailored to your exact space."
              )}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link href="/products">
                <Button size="lg" className="bg-[#d5af58] text-[#24211d] hover:bg-[#e0be6c] font-black px-8 h-14 rounded-2xl shadow-xl text-base cursor-pointer">
                  {t("تصفح الكتالوج والمنتجات", "Explore Catalogue")}
                  <ArrowLeft className={`h-4 w-4 ${isRTL ? "mr-2" : "ml-2 rotate-180"}`} />
                </Button>
              </Link>

              <a
                href={`https://wa.me/20${BUSINESS_PHONE.slice(1)}?text=${encodeURIComponent("مرحباً Elnour Homes، أود الاستفسار عن تفصيل وتصنيع أعمال استيل.")}`}
                target="_blank"
                rel="noreferrer"
              >
                <Button size="lg" variant="outline" className="border-[#d5af58]/60 text-[#f8f5ee] hover:bg-white/10 font-bold px-6 h-14 rounded-2xl cursor-pointer">
                  <MessageCircle className="ml-2 h-5 w-5 text-emerald-400" />
                  {t("طلب مقاس وتفصيل خاص", "Custom Inquiry")}
                </Button>
              </a>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-[#3b362e] max-w-lg">
              <div>
                <span className="text-2xl sm:text-3xl font-black text-[#d5af58]">+500</span>
                <p className="text-xs text-[#a89f91] mt-0.5">{t("مشروع وفيلا منفذة", "Projects Delivered")}</p>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-[#d5af58]">304</span>
                <p className="text-xs text-[#a89f91] mt-0.5">{t("استيل أصلي مقاوم للصدأ", "Genuine Stainless")}</p>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-[#d5af58]">100%</span>
                <p className="text-xs text-[#a89f91] mt-0.5">{t("ضمان حقيقي وشامل", "Full Warranty")}</p>
              </div>
            </div>
          </div>

          {/* Hero Right Visual Card */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl border border-[#d5af58]/30 bg-white/5 p-6 backdrop-blur-md shadow-2xl overflow-hidden">
              <div className="aspect-4/3 rounded-2xl overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=900&auto=format&fit=crop&q=80"
                  alt="Elnour Homes Steel Work"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#24211d] via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-4 right-4 left-4 text-white">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#d5af58] block">
                    ELNOUR HOMES MASTERPIECE
                  </span>
                  <p className="text-lg font-bold">
                    تشطيب ليزر متقن بألوان PVD ذهبي، فضي، وفيروزي
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#a89f91]">{t("تواصل مع المهندس المختص:", "Contact Expert:")}</p>
                  <a href={`tel:+20${BUSINESS_PHONE.slice(1)}`} className="text-sm font-bold text-[#d5af58] hover:underline dir-ltr block" dir="ltr">
                    +20 {BUSINESS_PHONE.slice(1)}
                  </a>
                </div>
                <Link href="/work">
                  <Button size="sm" variant="ghost" className="text-xs text-white hover:text-[#d5af58] font-bold cursor-pointer">
                    {t("شاهد سابقة الأعمال", "View Gallery")}
                    <ArrowLeft className={`h-3.5 w-3.5 ${isRTL ? "mr-1" : "ml-1 rotate-180"}`} />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Categories Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#a8822d]">
              COLLECTIONS & CATEGORIES
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-[#24211d] mt-1">
              {t("أقسام وتشكيلات المتجر", "Store Collections")}
            </h2>
          </div>
          <Link href="/products">
            <Button variant="outline" className="font-bold border-[#d5af58] text-[#a8822d] hover:bg-[#d5af58]/10 rounded-xl cursor-pointer">
              {t("عرض الكتالوج بالكامل", "View Full Catalogue")}
              <ArrowLeft className={`h-4 w-4 ${isRTL ? "mr-2" : "ml-2 rotate-180"}`} />
            </Button>
          </Link>
        </div>

        {catLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#d5af58]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(categories.length > 0
              ? categories
              : [
                  { id: 1, slug: "tables", nameAr: "ترابيزات استيل", nameEn: "Steel Tables", descriptionAr: "ترابيزات صالون ورخام فاخر" },
                  { id: 2, slug: "consoles", nameAr: "كونسول استيل", nameEn: "Steel Consoles", descriptionAr: "كونسول مداخل وتحف استيل" },
                  { id: 3, slug: "mirrors", nameAr: "مرايات مضيئة", nameEn: "LED Mirrors", descriptionAr: "مرايات استيل ليد ذكية" },
                  { id: 4, slug: "partitions", nameAr: "قواطع جدارية", nameEn: "Wall Partitions", descriptionAr: "قواطع وبرافانات استيل مودرن" },
                ]
            ).map((cat: any) => (
              <Link key={cat.id} href={`/products?category=${cat.slug}`} className="group">
                <div className="rounded-3xl border border-[#e8e2d8] bg-white p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-[#d5af58] space-y-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d5af58]/15 text-[#a8822d] group-hover:bg-[#24211d] group-hover:text-[#d5af58] transition-colors">
                    <Layers className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-[#24211d] group-hover:text-[#a8822d] transition-colors">
                    {lang === "ar" ? cat.nameAr : cat.nameEn}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {(lang === "ar" ? cat.descriptionAr : cat.descriptionEn) || "أرقى تشكيلات الاستيل والديكورات العصرية."}
                  </p>
                  <div className="pt-2 flex items-center text-xs font-bold text-[#a8822d]">
                    <span>{t("تصفح الموديلات", "Explore Collection")}</span>
                    <ArrowLeft className={`h-3.5 w-3.5 ${isRTL ? "mr-1" : "ml-1 rotate-180"}`} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 3. Featured Products Section */}
      <section className="border-t border-[#e8e2d8] bg-[#f5f0e6] py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#a8822d]">
                BESTSELLERS & FEATURED
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-[#24211d] mt-1">
                {t("القطع الأكثر طلباً وتميزاً", "Featured Masterpieces")}
              </h2>
            </div>
            <Link href="/products">
              <Button className="bg-[#24211d] text-white hover:bg-[#a8822d] font-bold rounded-xl cursor-pointer">
                {t("تصفح جميع المنتجات", "Browse All")}
              </Button>
            </Link>
          </div>

          {prodLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-[#d5af58]" />
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  categoryName={
                    categories.find((c: any) => c.slug === p.category)?.[
                      lang === "ar" ? "nameAr" : "nameEn"
                    ]
                  }
                />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-[#ddd6c8] bg-white p-12 text-center text-muted-foreground">
              لا توجد منتجات مضافة حالياً.
            </div>
          )}
        </div>
      </section>

      {/* 4. Real Projects Portfolio Gallery Preview */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#a8822d]">
            REAL WORK & PROJECTS
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-[#24211d] mt-1">
            {t("من أرض الواقع: مشاريع تم تنفيذها", "Real Executed Projects")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("شاهد كيف تبدو قطع Elnour Homes في منازل وفلل عملائنا الكرام.", "See how our pieces elevate our clients' real living spaces.")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(galleryItems.length > 0
            ? galleryItems.slice(0, 3)
            : [
                {
                  id: 1,
                  title: "ترابيزة صالون استيل 304 ذهبي",
                  imageUrl: "https://images.unsplash.com/photo-1533090161767-e6ffed986b88?w=800&auto=format&fit=crop&q=80",
                },
                {
                  id: 2,
                  title: "كونسول مدخل استيل مودرن مع رخام",
                  imageUrl: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&auto=format&fit=crop&q=80",
                },
                {
                  id: 3,
                  title: "قاطع جداري بارتشن استيل ذهبي مطفي",
                  imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80",
                },
              ]
          ).map((item: any) => (
            <div key={item.id} className="group relative overflow-hidden rounded-3xl border border-[#e8e2d8] aspect-4/3 shadow-xs hover:shadow-xl transition-all">
              <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 text-white opacity-90">
                <p className="font-bold text-base">{item.title}</p>
                <Link href="/work" className="mt-2 text-xs text-[#d5af58] font-bold hover:underline">
                  عرض المزيد في المعرض ←
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/work">
            <Button size="lg" variant="outline" className="font-bold border-[#d5af58] text-[#a8822d] px-8 rounded-xl cursor-pointer">
              {t("استكشف معرض الأعمال بالكامل", "View Full Gallery")}
            </Button>
          </Link>
        </div>
      </section>

      {/* 5. Custom Steelwork Banner */}
      <section className="container mx-auto px-4 pb-20">
        <div className="rounded-3xl bg-[#d5af58] p-8 md:p-14 text-[#24211d] flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="space-y-3 text-center lg:text-right">
            <span className="text-xs font-black uppercase tracking-widest text-[#473918]">
              CUSTOM STEEL FABRICATION
            </span>
            <h2 className="text-3xl md:text-5xl font-black">
              {t("لديك مقاس أو تصميم خاص في خيالك؟", "Have a custom size or specific design in mind?")}
            </h2>
            <p className="text-base text-[#473918] max-w-xl leading-relaxed">
              {t(
                "أرسل لنا الصورة أو الأبعاد على واتساب، وسيقوم فريقنا الهندسي بحساب التكلفة وتجهيز طلبك بأعلى دقة.",
                "Send us your reference photo or dimensions on WhatsApp, and our engineering team will calculate the quote and fabricate it."
              )}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <a
              href={`https://wa.me/20${BUSINESS_PHONE.slice(1)}?text=${encodeURIComponent("مرحباً Elnour Homes، أود الاستفسار عن تفصيل وتصنيع أعمال استيل خاصة.")}`}
              target="_blank"
              rel="noreferrer"
            >
              <Button size="lg" className="bg-[#24211d] text-white hover:bg-[#3d372e] font-black px-8 h-14 rounded-2xl text-base shadow-lg cursor-pointer">
                <MessageCircle className="ml-2 h-5 w-5 text-emerald-400" />
                {t("تواصل عبر واتساب", "WhatsApp Chat")}
              </Button>
            </a>

            <a href={`tel:+20${BUSINESS_PHONE.slice(1)}`}>
              <Button size="lg" variant="outline" className="border-[#24211d] text-[#24211d] hover:bg-[#24211d]/10 font-bold px-6 h-14 rounded-2xl cursor-pointer">
                <Phone className="ml-2 h-5 w-5" />
                {BUSINESS_PHONE}
              </Button>
            </a>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
