import PublicLayout from "@/components/storefront/PublicLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { UpdateHead } from "@/components/UpdateHead";

type Legal = "privacy" | "terms" | "returns";

const content: Record<Legal, {
  titleAr: string; titleEn: string;
  introAr: string; introEn: string;
  blocks: { hAr: string; hEn: string; pAr: string; pEn: string }[];
  updatedAr: string; updatedEn: string;
}> = {
  privacy: {
    titleAr: "سياسة الخصوصية",
    titleEn: "Privacy Policy",
    introAr: "خصوصيتك أولوية لدينا. توضح هذه السياسة كيف نتعامل مع بياناتك الشخصية عند استخدامك لموقع Elnour for STEEL.",
    introEn: "Your privacy matters to us. This policy explains how we handle your personal data when you use the Elnour for STEEL website.",
    blocks: [
      {
        hAr: "البيانات التي نجمعها",
        hEn: "Data We Collect",
        pAr: "نجمع البيانات التي تقدمها بنفسك عند إنشاء حساب أو إتمام طلب: الاسم، رقم الهاتف، العنوان، والبريد الإلكتروني، بالإضافة إلى تفاصيل الطلب والمقاسات والألوان المختارة. كما قد نستخدم بيانات تصفح عامة (نوع الجهاز وصفحات الزيارة) لتحسين تجربة الموقع عبر أدوات التحليل.",
        pEn: "We collect the data you provide yourself when creating an account or placing an order: name, phone number, address, and email, along with order details and chosen sizes and colors. We may also use general browsing data (device type and pages visited) to improve the site experience via analytics tools.",
      },
      {
        hAr: "كيف نستخدم بياناتك",
        hEn: "How We Use Your Data",
        pAr: "تُستخدم بياناتك حصريًا لمعالجة طلباتك، وتجهيز الشحن والتوصيل، وإرسال تحديثات حالة الطلب، والرد على استفساراتك عبر واتساب أو الهاتف. لا نبيع بياناتك لأي طرف ثالث ولا نشاركها إلا مع شركات الشحن اللازمة لتوصيل طلبك.",
        pEn: "Your data is used exclusively to process your orders, arrange shipping and delivery, send order status updates, and respond to your inquiries via WhatsApp or phone. We never sell your data to any third party and only share it with the shipping companies required to deliver your order.",
      },
      {
        hAr: "طرق الدفع والتخزين",
        hEn: "Payment & Storage",
        pAr: "الدفع يتم نقدًا عند الاستلام أو بطرق متفق عليها مسبقًا، ولا نخزن بيانات بطاقات الدفع على خوادمنا. تُخزن بيانات حسابك وطلباتك بأمان في قواعد بيانات مؤمنة، وتبقى لديك إمكانية تحديثها أو حذفها من خلال صفحة حسابي أو بمراسلتنا.",
        pEn: "Payment is made in cash upon delivery or via pre-agreed methods, and we never store card payment data on our servers. Your account and order data is stored securely in protected databases, and you can update or delete it through your account page or by contacting us.",
      },
      {
        hAr: "تواصل معنا",
        hEn: "Contact Us",
        pAr: "لأي استفسار عن بياناتك أو طلب تعديلها، تواصل معنا عبر واتساب أو الهاتف أو البريد الإلكتروني أو صفحة اتصل بنا.",
        pEn: "For any inquiry about your data or a request to amend it, reach out via WhatsApp, phone, email, or our contact page.",
      },
    ],
    updatedAr: "آخر تحديث: أغسطس 2026",
    updatedEn: "Last updated: August 2026",
  },
  terms: {
    titleAr: "الشروط والأحكام",
    titleEn: "Terms & Conditions",
    introAr: "باستخدامك لموقع Elnour for STEEL، فإنك توافق على الشروط التالية الخاصة بالطلبات والشراء من موقعنا.",
    introEn: "By using the Elnour for STEEL website, you agree to the following terms governing orders and purchases from our site.",
    blocks: [
      {
        hAr: "الطلبات والتأكيد",
        hEn: "Orders & Confirmation",
        pAr: "تعتبر الطلبات المقدمة عبر الموقع التزامًا بالشراء بعد التواصل معك وتأكيد التفاصيل (المقاس، اللون، الموقع). قد نتواصل معك قبل الشحن للتأكد من صحة العنوان وجاهزية الاستلام.",
        pEn: "Orders placed through the site are considered a purchase commitment once we contact you to confirm details (size, color, location). We may reach out before shipping to verify the address and delivery readiness.",
      },
      {
        hAr: "الأسعار والمقاسات",
        hEn: "Pricing & Sizes",
        pAr: "الأسعار المعروضة بالجنيه المصري شاملة تفاصيل المقاسات المتاحة لكل منتج، وقد تتغير أسعار منتجات الاستيل بالمتر المربع بتغير سعر المتر. الأعمال حسب الطلب (بوابات، سلالم، تصاميم خاصة) تسعّر بعد الاتفاق على المقاسات والمواصفات النهائية.",
        pEn: "Listed prices are in Egyptian pounds and include each product's available size options; steel products priced per square meter may vary with meter price changes. Custom work (gates, staircases, special designs) is quoted after agreeing on final measurements and specifications.",
      },
      {
        hAr: "الشحن والتوصيل",
        hEn: "Shipping & Delivery",
        pAr: "تُحدد رسوم التوصيل حسب المنطقة وتُوضح عند إتمام الطلب. نفحص كل قطعة قبل الشحن، ونلتزم بمواعيد التسليم المتفق عليها، ونوافيك بتحديث حالة الطلب عبر الحساب.",
        pEn: "Delivery fees depend on the area and are shown at checkout. Every piece is inspected before shipping, we commit to agreed delivery timelines, and we keep your order status updated through your account.",
      },
      {
        hAr: "إلغاء الطلب",
        hEn: "Order Cancellation",
        pAr: "يمكنك إلغاء طلبك من خلال حسابك طالما لم تخرج الشحنة. بعد شحن المنتج، يخضع الإلغاء أو الاستبدال لسياسة الإرجاع والاستبدال الموضحة في صفحة الإرجاع.",
        pEn: "You may cancel your order from your account as long as the shipment has not left. After dispatch, cancellation or exchange is governed by the Returns & Exchange policy on the returns page.",
      },
      {
        hAr: "الاستخدام الصحيح للموقع",
        hEn: "Proper Site Use",
        pAr: "يلتزم المستخدم بتقديم بيانات صحيحة وعدم إساءة استخدام الموقع أو أي أدوات فيه (التقييمات، نماذج الإشعار، أكواد الخصم). نحتفظ بحق إيقاف أي استخدام مخالف.",
        pEn: "Users must provide accurate data and refrain from misusing the site or any of its tools (reviews, notification forms, discount codes). We reserve the right to suspend any misuse.",
      },
    ],
    updatedAr: "آخر تحديث: أغسطس 2026",
    updatedEn: "Last updated: August 2026",
  },
  returns: {
    titleAr: "الإرجاع والاستبدال",
    titleEn: "Returns & Exchange",
    introAr: "نسعى لأن تصلك كل قطعة بحالة مثالية. إن وُجد أي خلل في التصنيع أو عدم مطابقة للمواصفات المتفق عليها، تعامل معه السياسة التالية.",
    introEn: "We strive for every piece to reach you in perfect condition. If there is a manufacturing defect or a mismatch with the agreed specifications, this policy applies.",
    blocks: [
      {
        hAr: "خلل التصنيع",
        hEn: "Manufacturing Defects",
        pAr: "عند استلام المنتج، افحصه فورًا ووثّق أي خدش أو لحام غير سليم أو خطأ في اللون أو المقاس بالصور. إذا كان الخلل من تصنيعنا، نستبدل القطعة أو نصلحها على حسابنا، وتصل الخدمة أو القطعة المصححة خلال موعد نتفق عليه معًا.",
        pEn: "Inspect the product immediately upon delivery and document any scratch, flawed welding, color or size discrepancy with photos. If the defect is from our workmanship, we replace or repair the piece at our expense, and the corrected item or service arrives at a mutually agreed time.",
      },
      {
        hAr: "عدم مطابقة المواصفات",
        hEn: "Specification Mismatch",
        pAr: "إذا وصلك المنتج بمواصفات مختلفة عما طلبته (لون أو مقاس أو تصميم خاطئ)، أبلغنا خلال 48 ساعة من الاستلام مع الصور وسنتكفل بحل المشكلة سواء استبدال أو تصحيح دون أي رسوم عليك.",
        pEn: "If the product arrives with different specifications from what you ordered (wrong color, size, or design), notify us within 48 hours of delivery with photos, and we will resolve the issue through replacement or correction at no cost to you.",
      },
      {
        hAr: "تغيير رأي العميل",
        hEn: "Customer Change of Mind",
        pAr: "المنتجات المصنوعة حسب الطلب والمقاسات الخاصة لا تخضع للإرجاع ما لم يوجد خلل تصنيع، إذ تُصنع خصيصًا لمقاساتك. إذا كان لديك استفسار قبل الإتمام، نرحب بالأسئلة عبر واتساب قبل الطلب.",
        pEn: "Custom-made products and special sizes are not eligible for returns unless there is a manufacturing defect, as they are crafted for your specific measurements. If you have any questions before ordering, we welcome them via WhatsApp.",
      },
      {
        hAr: "كيفية تقديم طلب الاستبدال",
        hEn: "How to Request an Exchange",
        pAr: "تواصل معنا عبر واتساب برقم العميل، وأرسل صور القطعة ورقم الطلب، وسنرد عليك خلال يوم عمل بتفاصيل الإجراء والموعد المناسب للفحص أو الاستلام.",
        pEn: "Contact us via WhatsApp using the customer number, send photos of the piece and your order number, and we will reply within one business day with the procedure details and a suitable inspection or pickup time.",
      },
    ],
    updatedAr: "آخر تحديث: أغسطس 2026",
    updatedEn: "Last updated: August 2026",
  },
};

export default function LegalPage({ page }: { page: Legal }) {
  const { lang } = useLanguage();
  const c = content[page];
  UpdateHead({
    title: lang === "ar" ? `${c.titleAr} | Elnour for STEEL` : `${c.titleEn} | Elnour for STEEL`,
    description: lang === "ar" ? `${c.titleAr} لموقع Elnour for STEEL — أعمال ديكور منزلية من الاستيل المطلى بدهانات الكتروستاتيك` : `${c.titleEn} for Elnour for STEEL — electrostatic-coated steel home décor`,
    path: `/${page}`,
  });

  return (
    <PublicLayout>
      <section className="border-b border-[#ddd6c8] bg-[#24211d] px-4 py-16 text-[#f9f7f2] md:py-24">
        <div className="container max-w-4xl">
          <p className="text-sm font-bold tracking-[0.2em] text-[#d5af58]">ELNOUR FOR STEEL</p>
          <h1 className="mt-4 text-4xl font-black md:text-6xl">{lang === "ar" ? c.titleAr : c.titleEn}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#ded8ce]">{lang === "ar" ? c.introAr : c.introEn}</p>
        </div>
      </section>
      <section className="container max-w-4xl py-14 md:py-20">
        <div className="space-y-10">
          {c.blocks.map((block, i) => (
            <article key={i}>
              <h2 className="text-2xl font-black text-[#24211d] md:text-3xl">{lang === "ar" ? block.hAr : block.hEn}</h2>
              <p className="mt-4 text-base leading-8 text-[#4a453d]">{lang === "ar" ? block.pAr : block.pEn}</p>
            </article>
          ))}
        </div>
        <p className="mt-12 border-t border-[#e5e0d4] pt-6 text-sm text-[#8f887c]">{lang === "ar" ? c.updatedAr : c.updatedEn}</p>
      </section>
    </PublicLayout>
  );
}
