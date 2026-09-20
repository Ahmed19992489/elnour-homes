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
    introAr: "خصوصيتك أولوية لدينا. توضح هذه السياسة كيف نتعامل مع بياناتك الشخصية عند استخدامك لموقع Elnour Home (النور هوم).",
    introEn: "Your privacy matters to us. This policy explains how we handle your personal data when you use the Elnour Home website.",
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
    introAr: "باستخدامك لموقع Elnour Home (النور هوم)، فإنك توافق على الشروط التالية الخاصة بالطلبات والشراء من موقعنا.",
    introEn: "By using the Elnour Home website, you agree to the following terms governing orders and purchases from our site.",
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
    titleAr: "سياسة الإرجاع والاستبدال",
    titleEn: "Returns & Exchange Policy",
    introAr: "رضاك هو أولويتنا. يمكنك إرجاع أي منتج خلال 14 يومًا من تاريخ الاستلام وفقًا للشروط التالية. نلتزم بتقديم أفضل خدمة ما بعد البيع لضمان تجربة شراء مميزة.",
    introEn: "Your satisfaction is our priority. You can return any product within 14 days of delivery according to the following terms. We are committed to providing the best after-sales service.",
    blocks: [
      {
        hAr: "📦 كيفية إرجاع منتج",
        hEn: "📦 How to Return a Product",
        pAr: "1️⃣ تواصل معنا عبر واتساب أو الهاتف (01118182424 أو 01114323218) خلال 14 يومًا من الاستلام.\n2️⃣ اذكر رقم الطلب وسبب الإرجاع بالتفصيل مع إرفاق صور توضيحية للمنتج.\n3️⃣ سنراجع طلبك ونرد عليك خلال يوم عمل واحد بتفاصيل الإجراء.\n4️⃣ رتّب مع فريقنا موعد استلام المنتج (الشحن على حسابنا في حالة العيوب).\n5️⃣ بعد فحص المنتج وقبوله، يبدأ إجراء الاسترداد.",
        pEn: "1️⃣ Contact us via WhatsApp or phone (01118182424 or 01114323218) within 14 days of delivery.\n2️⃣ Provide your order number and detailed return reason with supporting photos.\n3️⃣ We will review your request and reply within 1 business day.\n4️⃣ Arrange a pickup time with our team (shipping is on us for defects).\n5️⃣ After inspection and acceptance, the refund process begins.",
      },
      {
        hAr: "✅ شروط قبول الإرجاع",
        hEn: "✅ Return Conditions",
        pAr: "• يجب أن يكون المنتج في حالته الأصلية وعبوته الأصلية مع جميع الملحقات.\n• يجب الإبلاغ عن أي عيوب أو تلف خلال 48 ساعة من الاستلام مع صور توضيحية.\n• المنتجات المصنوعة حسب الطلب (مقاسات خاصة، تصاميم مخصصة) غير قابلة للإرجاع بسبب تغيير الرأي.\n• يجب إرجاع أي هدايا مرفقة مع المنتج المرتجع.\n• تأكد من كتابة سبب الإرجاع بشكل مفصل لمساعدتنا في فحص المنتج.",
        pEn: "• The product must be in its original condition and packaging with all accessories.\n• Any defects or damage must be reported within 48 hours of delivery with photos.\n• Custom-made products (special sizes, custom designs) are non-returnable for change of mind.\n• Any gifts included with the product must also be returned.\n• Please describe the return reason in detail to help us inspect the product.",
      },
      {
        hAr: "❌ حالات رفض الإرجاع",
        hEn: "❌ Return Rejection Cases",
        pAr: "• إذا مرت أكثر من 14 يومًا على تاريخ الاستلام.\n• إذا كان المنتج مستخدمًا أو تالفًا بسبب سوء الاستخدام.\n• إذا كان سبب الإرجاع غير صحيح أو غير مطابق لحالة المنتج.\n• المنتجات المصنوعة بمقاسات خاصة حسب طلب العميل (ما لم يكن بها عيب تصنيع).\n• في حالة رفض طلب الإرجاع، سيتم شحن المنتج إليك مرة أخرى.",
        pEn: "• If more than 14 days have passed since delivery.\n• If the product has been used or damaged due to misuse.\n• If the return reason is inaccurate or doesn't match the product condition.\n• Custom-sized products made to order (unless there's a manufacturing defect).\n• If the return is rejected, the product will be shipped back to you.",
      },
      {
        hAr: "💰 سياسة الاسترداد",
        hEn: "💰 Refund Policy",
        pAr: "بعد فحص المنتج وقبوله، يبدأ إجراء الاسترداد:\n\n• الدفع نقدًا عند الاستلام → استرداد عبر إنستاباي أو محفظة إلكترونية خلال 3-5 أيام عمل.\n• الدفع عبر إنستاباي/محفظة → يُرد المبلغ لنفس الطريقة خلال 3-5 أيام عمل.\n• رقم إنستاباي للتحويل: 01121748885\n\nملاحظة: في حالة الشراء أثناء التخفيضات، يتم رد القيمة المدفوعة وليس القيمة الأصلية.",
        pEn: "After product inspection and acceptance, the refund process begins:\n\n• Cash on delivery → Refund via InstaPay or e-wallet within 3-5 business days.\n• InstaPay/wallet payment → Refund to the same method within 3-5 business days.\n• InstaPay number: 01121748885\n\nNote: For purchases made during sales, the paid amount is refunded, not the original price.",
      },
      {
        hAr: "🔄 سياسة الاستبدال",
        hEn: "🔄 Exchange Policy",
        pAr: "للأسف لا نوفر خدمة الاستبدال المباشر. لكن يمكنك طلب إرجاع وفقًا لسياسة الإرجاع الخاصة بنا، ثم تقديم طلب جديد بالمنتج الذي ترغب فيه. هذا يضمن لك الحصول على المنتج المناسب بالمقاس واللون المطلوب.",
        pEn: "Unfortunately, we don't offer direct exchanges. However, you can request a return according to our return policy, then place a new order for the product you prefer. This ensures you get the right product in the desired size and color.",
      },
      {
        hAr: "📞 هل لديك سؤال؟",
        hEn: "📞 Have a Question?",
        pAr: "للمساعدة في الإرجاع أو الاستبدال، تواصل معنا:\n• واتساب: 01118182424\n• هاتف: 01114323218\n• من خلال صفحة اتصل بنا على الموقع\n\nفريقنا متاح للرد على استفساراتك ومساعدتك في أي وقت.",
        pEn: "For help with returns or exchanges, contact us:\n• WhatsApp: 01118182424\n• Phone: 01114323218\n• Through the Contact Us page on our website\n\nOur team is available to answer your questions and assist you anytime.",
      },
    ],
    updatedAr: "آخر تحديث: سبتمبر 2026",
    updatedEn: "Last updated: September 2026",
  },
};

export default function LegalPage({ page }: { page: Legal }) {
  const { lang } = useLanguage();
  const c = content[page];
  UpdateHead({
    title: lang === "ar" ? `${c.titleAr} | Elnour Home - النور هوم` : `${c.titleEn} | Elnour Home`,
    description: lang === "ar" ? `${c.titleAr} لموقع Elnour Home — أعمال ديكور منزلية وأثاث من الاستيل المطلى بدهانات الكتروستاتيك` : `${c.titleEn} for Elnour Home — luxury furniture and steel home décor`,
    path: `/${page}`,
  });

  return (
    <PublicLayout>
      <section className="border-b border-[#ddd6c8] bg-[#24211d] px-4 py-16 text-[#f9f7f2] md:py-24">
        <div className="container max-w-4xl">
          <p className="text-sm font-bold tracking-[0.2em] text-[#d5af58]">ELNOUR HOME</p>
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
