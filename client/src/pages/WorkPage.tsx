import PublicLayout from "@/components/storefront/PublicLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { UpdateHead } from "@/components/UpdateHead";
import { trpc } from "@/lib/trpc";
import { Images, Loader2 } from "lucide-react";

export default function WorkPage() {
  const { lang } = useLanguage();
  UpdateHead({
    title: lang === "ar" ? "أعمالنا | Elnour for STEEL - ديكورات استيل" : "Our Work | Elnour for STEEL - Steel Decor",
    description: lang === "ar" ? "نماذج من أعمال Elnour for STEEL المنفذة: ديكورات استيل مطلى بفواصل وطرابيزات ومسابح إضاءة." : "Examples of completed Elnour for STEEL work: electrostatic-coated steel décor, dividers, tables and light channels.",
    path: lang === "ar" ? "/work?lang=ar" : "/work?lang=en",
  });
  const { data: gallery, isLoading } = trpc.gallery.list.useQuery();
  const copy = lang === "ar" ? {
    eyebrow: "أعمالنا", title: "مشاريع نفذناها بعناية", description: "تصفح نماذج من الأعمال المنفذة لتتعرف على أسلوب التشطيب والتفاصيل.", empty: "سنضيف نماذج الأعمال المنفذة قريباً.",
  } : {
    eyebrow: "OUR WORK", title: "Projects crafted with care", description: "Browse selected completed work to see our finishing style and attention to detail.", empty: "Completed project examples will be added soon.",
  };

  return <PublicLayout>
    <section className="bg-[#eee9df] px-4 py-16 md:py-24"><div className="container max-w-4xl text-center"><p className="text-sm font-bold tracking-[0.18em] text-[#a17a26]">{copy.eyebrow}</p><h1 className="mt-4 text-4xl font-black text-[#24211d] md:text-6xl">{copy.title}</h1><p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#5d574d]">{copy.description}</p></div></section>
    <section className="container py-14 md:py-20">
      {isLoading ? <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#ad842f]" /></div> : gallery?.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{gallery.map((item) => <figure key={item.id} className="group overflow-hidden rounded-2xl bg-[#24211d] shadow-sm"><div className="aspect-[4/3] overflow-hidden"><img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /></div><figcaption className="p-4 text-sm font-bold text-white">{item.title}</figcaption></figure>)}</div> : <div className="rounded-2xl border border-dashed border-[#c8beae] bg-white px-6 py-20 text-center"><Images className="mx-auto h-10 w-10 text-[#ad842f]" /><p className="mt-4 text-[#5d574d]">{copy.empty}</p></div>}
    </section>
  </PublicLayout>;
}

