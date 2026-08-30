import PublicLayout from "@/components/storefront/PublicLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { UpdateHead } from "@/components/UpdateHead";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";

type ContentPageProps = {
  sectionKey: "about" | "story";
};

const fallbackContent = {
  about: {
    titleAr: "من نحن", titleEn: "About Us", subtitleAr: "استيل بتفاصيل تصنع الفرق", subtitleEn: "Steel crafted for meaningful spaces",
    contentAr: "في Elnour for STEEL نصمم وننفذ ديكورات وأثاث الاستيل بلمسة تجمع بين المتانة والذوق. نهتم بالتشطيب، تناسب المقاسات، والتفاصيل التي تجعل كل قطعة مناسبة لمساحتك.\n\nتصفح المنتجات أو تواصل معنا على واتساب لمناقشة أي مقاس أو تصميم خاص.",
    contentEn: "At Elnour for STEEL, we design and craft steel décor and furniture that balances durability with refined style. We care about finishes, proportions, and the details that make every piece belong in your space.\n\nBrowse the catalogue or contact us on WhatsApp to discuss a custom size or design.",
  },
  story: {
    titleAr: "قصتنا", titleEn: "Our Story", subtitleAr: "خبرة تتطور مع كل مشروع", subtitleEn: "Experience refined with every project",
    contentAr: "بدأت رحلتنا من شغف بتحويل الاستيل إلى قطع عملية وجميلة في الوقت نفسه. ومع كل مشروع تعلمنا كيف نربط التصميم باحتياجات المكان، ونقدم حلولاً تراعي الجودة والتفاصيل.\n\nاليوم نواصل تنفيذ أعمال استيل وديكور منزلية مصممة لتدوم وتضيف قيمة حقيقية للمساحات.",
    contentEn: "Our journey began with a passion for turning steel into pieces that are both functional and beautiful. With every project, we have learned how to connect design to the needs of each space and deliver solutions that value quality and detail.\n\nToday, we continue crafting steelwork and home décor designed to last and add real value to every setting.",
  },
};

export default function ContentPage({ sectionKey }: ContentPageProps) {
  const { lang, isRTL } = useLanguage();

  UpdateHead({
    title: lang === "ar" ? (sectionKey === "about" ? "من نحن | Elnour for STEEL" : "قصتنا | Elnour for STEEL") : (sectionKey === "about" ? "About Us | Elnour for STEEL" : "Our Story | Elnour for STEEL"),
    description: lang === "ar" ? "تعرف على Elnour for STEEL وقصة خبرتنا في تصميم وتنفيذ ديكورات الاستيل المطلى بدهانات الكتروستاتيك" : "Learn about Elnour for STEEL and our experience designing and crafting electrostatic-coated steel home décor",
    path: `/${sectionKey}`,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "mainEntity": {
        "@type": "HomeGoodsStore",
        "name": "Elnour for STEEL",
        "description": lang === "ar" ? "أعمال ديكور منزلية فاخرة من الاستيل المطلى بدهانات الكتروستاتيك" : "Luxury home décor crafted from electrostatic-coated steel",
        "url": "https://elnoursteel-eexiztdb.manus.space",
        "telephone": "+201118182424",
        "sameAs": ["https://www.facebook.com/share/19KhMom9Sq/"],
      },
    },
  });
  const { data: sections, isLoading } = trpc.siteContent.list.useQuery();
  const fallback = fallbackContent[sectionKey];
  const section = sections?.find((item) => item.sectionKey === sectionKey);
  const title = lang === "ar" ? section?.titleAr || fallback.titleAr : section?.titleEn || fallback.titleEn;
  const subtitle = lang === "ar" ? section?.subtitleAr || fallback.subtitleAr : section?.subtitleEn || fallback.subtitleEn;
  const body = lang === "ar" ? section?.contentAr || fallback.contentAr : section?.contentEn || fallback.contentEn;

  return <PublicLayout>
    <section className="border-b border-[#ddd6c8] bg-[#24211d] px-4 py-16 text-[#f9f7f2] md:py-24">
      <div className="container max-w-4xl">
        <p className="text-sm font-bold tracking-[0.2em] text-[#d5af58]">ELNOUR FOR STEEL</p>
        <h1 className="mt-4 text-4xl font-black md:text-6xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-[#ded8ce]">{subtitle}</p>
      </div>
    </section>
    <section className="container max-w-4xl py-14 md:py-20">
      {isLoading ? <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#ad842f]" /></div> : <div className="rounded-2xl border border-[#e0dacd] bg-white p-7 shadow-sm md:p-12">
        <div className="space-y-5 text-base leading-9 text-[#514c42] md:text-lg">
          {(body || "").split(/\n+/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </div>
        <div className="mt-10 border-t border-[#e8e1d5] pt-6">
          <Link href="/products" className="inline-flex items-center font-bold text-[#8c681d] hover:text-[#24211d]">{lang === "ar" ? "استكشف المنتجات" : "Explore products"}<ArrowLeft className={`h-4 w-4 ${isRTL ? "mr-2" : "ml-2 rotate-180"}`} /></Link>
        </div>
      </div>}
    </section>
  </PublicLayout>;
}

