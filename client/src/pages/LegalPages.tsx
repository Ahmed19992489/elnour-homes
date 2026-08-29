import React from "react";
import PublicLayout from "@/components/storefront/PublicLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { UpdateHead } from "@/components/UpdateHead";

interface LegalPageProps {
  page: "privacy" | "terms" | "returns";
}

export default function LegalPages({ page }: LegalPageProps) {
  const { lang, t } = useLanguage();

  const titles = {
    privacy: lang === "ar" ? "سياسة الخصوصية | Elnour Homes" : "Privacy Policy | Elnour Homes",
    terms: lang === "ar" ? "الشروط والأحكام | Elnour Homes" : "Terms & Conditions | Elnour Homes",
    returns: lang === "ar" ? "سياسة الاستبدال والضمان | Elnour Homes" : "Warranty & Returns | Elnour Homes",
  };

  UpdateHead({
    title: titles[page],
  });

  return (
    <PublicLayout>
      <section className="container mx-auto px-4 py-12 md:py-16 max-w-3xl">
        <h1 className="text-3xl font-black text-[#24211d] mb-8 pb-4 border-b border-[#e8e2d8]">
          {page === "privacy" && t("سياسة الخصوصية", "Privacy Policy")}
          {page === "terms" && t("الشروط والأحكام", "Terms of Service")}
          {page === "returns" && t("سياسة الضمان والاستبدال", "Warranty & Returns Policy")}
        </h1>

        <div className="prose prose-stone dark:prose-invert max-w-none text-sm md:text-base leading-relaxed space-y-6 text-[#4a433a]">
          {page === "privacy" && (
            <>
              <p>نحن في <strong>Elnour Homes</strong> نولي خصوصية عملائنا أهمية قصوى. نقوم بجمع البيانات الأساسية اللازمة فقط لتوصيل وتأكيد الطلبات والتواصل معك (مثل الاسم، رقم الهاتف، والعنوان).</p>
              <p>لا نقوم بمشاركة أو بيع بياناتك لأي طرف ثالث، وتستخدم معلوماتك فقط لتنفيذ وتأكيد طلباتك ومتابعة خدمات ما بعد البيع.</p>
            </>
          )}

          {page === "terms" && (
            <>
              <p>مرحباً بك في متجر <strong>Elnour Homes</strong>. باستخدامك للموقع أو تسجيلك لأي طلب، فإنك توافق على الالتزام بالشروط والأحكام الخاصة بنا.</p>
              <p>جميع التصاميم والأعمال المعروضة مصنعة بجودة استيل 304، ويتم تحديد الأسعار بناءً على المقاس والمواصفات المختارة وقت تسجيل الطلب.</p>
            </>
          )}

          {page === "returns" && (
            <>
              <p>نقدم في <strong>Elnour Homes</strong> ضماناً حقيقياً وشاملاً على جميع أعمال الاستيل واللحام والتشطيب ضد عيوب الصناعة أو الصدأ.</p>
              <p>يحق للعميل معاينة المنتجات عند الاستلام للتأكد من مطابقتها للمقاسات والتصميم المتفق عليه، وفي حال وجود أي ملاحظة يتم معالجتها أو استبدال القطعة فوراً.</p>
            </>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
