import React, { useState } from "react";
import PublicLayout from "@/components/storefront/PublicLayout";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { UpdateHead } from "@/components/UpdateHead";
import { Sparkles, MessageCircle, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const BUSINESS_PHONE = "01121748885";

export default function WorkPage() {
  const { lang, t } = useLanguage();
  UpdateHead({
    title: lang === "ar" ? "معرض أعمالنا ومشاريع الاستيل | Elnour Homes" : "Our Portfolio & Steel Work | Elnour Homes",
    description: "استعرض سابقة أعمال ومشاريع Elnour Homes المنفذة من ديكورات الاستيل الفاخرة وتشطيبات الفلل والمنازل العصرية.",
  });

  const { data: galleryItems, isLoading } = trpc.gallery.list.useQuery();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Fallback demo items if database gallery is empty
  const defaultItems = [
    {
      id: 1,
      title: "ترابيزة صالون استيل 304 ذهبي",
      category: "ترابيزات",
      imageUrl: "https://images.unsplash.com/photo-1533090161767-e6ffed986b88?w=800&auto=format&fit=crop&q=80",
    },
    {
      id: 2,
      title: "كونسول مدخل استيل مودرن مع رخام",
      category: "كونسول",
      imageUrl: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&auto=format&fit=crop&q=80",
    },
    {
      id: 3,
      title: "مراية مضيئة بإطار استيل ليزر",
      category: "مرايات",
      imageUrl: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&auto=format&fit=crop&q=80",
    },
    {
      id: 4,
      title: "قاطع جداري بارتشن استيل ذهبي مطفي",
      category: "قواطع",
      imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80",
    },
    {
      id: 5,
      title: "طقم ترابيزات متداخلة ركنة استيل",
      category: "ترابيزات",
      imageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80",
    },
    {
      id: 6,
      title: "ديكور جداري استانلس ليزر بتصميم هندسي",
      category: "ديكورات",
      imageUrl: "https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=800&auto=format&fit=crop&q=80",
    },
  ];

  const items = galleryItems && galleryItems.length > 0 ? galleryItems : defaultItems;

  return (
    <PublicLayout>
      {/* Header Banner */}
      <section className="border-b border-[#e8e2d8] bg-[#f5f0e6] py-12 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-[#d5af58]/20 px-4 py-1.5 text-xs font-bold text-[#a8822d] mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{t("سابقة أعمالنا الواقعية", "Our Real Project Portfolio")}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-[#24211d]">
            {t("معرض مشاريع وأعمال الاستيل", "Executed Steel Projects")}
          </h1>
          <p className="mt-3 text-base text-[#6b6255] max-w-2xl mx-auto">
            {t(
              "نماذج حية من أعمالنا في تصنيع وتركيب أثاث وديكورات الاستيل لعملائنا في مختلف محافظات مصر.",
              "Live examples of our manufactured stainless steel decor and furniture for clients across Egypt."
            )}
          </p>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-[#d5af58]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item: any) => (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-2xl border border-[#e8e2d8] bg-white shadow-xs hover:shadow-xl transition-all duration-300 aspect-4/3"
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6 text-white">
                  <span className="text-xs font-bold text-[#d5af58] mb-1">{item.category}</span>
                  <h3 className="text-lg font-bold">{item.title}</h3>
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setSelectedImage(item.imageUrl)}
                      className="bg-white/20 hover:bg-white/30 text-white backdrop-blur rounded-xl text-xs font-bold"
                    >
                      <Eye className="ml-1 h-3.5 w-3.5" />
                      تكبير الصورة
                    </Button>
                    <a
                      href={`https://wa.me/20${BUSINESS_PHONE.slice(1)}?text=${encodeURIComponent(`مرحباً Elnour Homes، أود الاستفسار عن تنفيذ مثل هذا التصميم: ${item.title}`)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button size="sm" className="bg-[#d5af58] text-[#24211d] hover:bg-[#e0be6c] font-bold rounded-xl text-xs">
                        <MessageCircle className="ml-1 h-3.5 w-3.5" />
                        طلب مثل هذا
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Lightbox Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0 bg-transparent border-0 overflow-hidden shadow-2xl">
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Project View"
              className="w-full max-h-[85vh] object-contain rounded-2xl"
            />
          )}
        </DialogContent>
      </Dialog>
    </PublicLayout>
  );
}
