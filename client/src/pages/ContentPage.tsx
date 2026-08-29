import React from "react";
import PublicLayout from "@/components/storefront/PublicLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { UpdateHead } from "@/components/UpdateHead";
import { Sparkles, ShieldCheck, Award, HeartHandshake, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ContentPageProps {
  sectionKey: "about" | "story";
}

const BUSINESS_PHONE = "01121748885";

export default function ContentPage({ sectionKey }: ContentPageProps) {
  const { lang, t } = useLanguage();

  UpdateHead({
    title: lang === "ar" ? "عن مصنع ومعرض Elnour Homes | قصة التميز" : "About Us | Elnour Homes",
    description: "تعرف على Elnour Homes، المتخصصين في تصنيع أرقى أثاث وديكورات الاستيل 304 في مصر بأحدث تقنيات الليزر.",
  });

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="border-b border-[#e8e2d8] bg-[#24211d] text-[#f8f5ee] py-16 md:py-24">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#d5af58]/20 px-4 py-1.5 text-xs font-bold text-[#d5af58] mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            <span>ELNOUR HOMES FOR STEEL & DECOR</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black leading-tight">
            {t("من الفكرة إلى التحفة الفنية في منزلك", "From Concept to Masterpiece in Your Home")}
          </h1>
          <p className="mt-4 text-base md:text-lg text-[#d8d0c2] leading-relaxed">
            {t(
              "نحن في Elnour Homes نجمع بين دقة الهندسة وجمال الفن العصري لنقدم لك قطع ديكور استانلس تعيش معك عمراً كاملاً.",
              "At Elnour Homes, we blend engineering precision with modern art to bring you stainless steel decor crafted to last a lifetime."
            )}
          </p>
        </div>
      </section>

      {/* Main Content & Values */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="rounded-3xl border border-[#e8e2d8] bg-white p-8 shadow-xs space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d5af58]/15 text-[#a8822d]">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-[#24211d]">خامات استيل 304 الأصلية</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              نستخدم أفضل أنواع الاستانلس ستيل المقاوم للصدأ والخدش والتآكل، مع خيارات تشطيب لامع أو مطفي بأحدث تقنيات الـ PVD.
            </p>
          </div>

          <div className="rounded-3xl border border-[#e8e2d8] bg-white p-8 shadow-xs space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d5af58]/15 text-[#a8822d]">
              <Award className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-[#24211d]">قص ليزر ولحام احترافي</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              تصاميم هندسية مقطوعة بالليزر فائق الدقة مع لحام مخفي تماماً يمنح كل قطعة مظهراً انسيابياً فخماً لا تشوبه شائبة.
            </p>
          </div>

          <div className="rounded-3xl border border-[#e8e2d8] bg-white p-8 shadow-xs space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d5af58]/15 text-[#a8822d]">
              <HeartHandshake className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-[#24211d]">تفصيل وتخصيص حسب رغبتك</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              لديك مقاسات خاصة أو تصميم خاص في خيالك؟ فريقنا جاهز لتنفيذه بالملم وتوصيله إلى باب منزلك مع الضمان.
            </p>
          </div>
        </div>

        {/* Contact Banner */}
        <div className="rounded-3xl bg-[#d5af58] p-8 md:p-12 text-[#24211d] flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center md:text-right">
            <h2 className="text-2xl md:text-3xl font-black">
              هل ترغب في استشارة أو تفصيل طلب خاص؟
            </h2>
            <p className="text-base text-[#473918]">
              فريقنا الهندسي وفريق المبيعات جاهز للرد على كافة استفساراتك وتزويدك بالمقاسات والأسعار.
            </p>
          </div>
          <a href={`tel:+20${BUSINESS_PHONE.slice(1)}`}>
            <Button size="lg" className="bg-[#24211d] text-white hover:bg-[#3d372e] font-bold px-8 h-12 rounded-xl text-base shrink-0">
              <Phone className="ml-2 h-4 w-4" />
              اتصل بنا: {BUSINESS_PHONE}
            </Button>
          </a>
        </div>
      </section>
    </PublicLayout>
  );
}
