import { useState } from "react";
import { Phone, MapPin, MessageCircle, Clock, Send, CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import PublicLayout from "@/components/storefront/PublicLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { UpdateHead } from "@/components/UpdateHead";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const BOOKING_WHATSAPP = "01041939388";
const AFTERSALES_PHONE = "01118182424";
const SECONDARY_PHONE = "01114323218";
const DEFAULT_FACEBOOK = "https://www.facebook.com/Elnour.home";

function waNumber(n: string): string {
  const digits = n.replace(/\D/g, "");
  return digits.startsWith("20") ? digits : `20${digits}`;
}

export default function ContactPage() {
  const { lang } = useLanguage();
  UpdateHead({
    title: lang === "ar" ? "اتصل بنا | Elnour Home - النور هوم" : "Contact Us | Elnour Home",
    description:
      lang === "ar"
        ? "تواصل مع Elnour Home (النور هوم) عبر واتساب الحجز 01041939388، أو خدمة ما بعد البيع 01118182424، أو عبر نموذج الرسائل."
        : "Contact Elnour Home via Booking WhatsApp 01041939388 or After-Sales Service 01118182424.",
    path: "/contact",
  });
  const [form, setForm] = useState({ name: "", phone: "", email: "", subject: "", message: "" });
  const submit = trpc.contact.submit.useMutation({
    onSuccess: () => {
      toast.success(lang === "ar" ? "تم إرسال رسالتك بنجاح، سنتواصل معك قريبًا" : "Message sent — we'll get back to you soon");
      setForm({ name: "", phone: "", email: "", subject: "", message: "" });
    },
    onError: (e) => toast.error(e.message || (lang === "ar" ? "حدث خطأ، حاول مرة أخرى" : "Something went wrong, try again")),
  });

  const bookingWaLink = `https://wa.me/${waNumber(BOOKING_WHATSAPP)}`;
  const aftersalesWaLink = `https://wa.me/${waNumber(AFTERSALES_PHONE)}?text=${encodeURIComponent("مرحباً، أود التواصل مع خدمة ما بعد البيع والدعم بخصوص طلبي")}`;
  const phoneDisplay = `+20 ${AFTERSALES_PHONE.slice(1)} / +20 ${SECONDARY_PHONE.slice(1)}`;

  const blocks = [
    {
      icon: MessageCircle,
      titleAr: "واتساب الحجز والطلبات",
      titleEn: "Booking & Orders WhatsApp",
      valueAr: "01041939388 — احجز أي منتج أو استفسر عن التصاميم والأسعار",
      valueEn: "01041939388 — Book any product or inquire about designs & prices",
      href: bookingWaLink,
      ctaAr: "احجز عبر واتساب الآن",
      ctaEn: "Book via WhatsApp",
      highlight: true,
    },
    {
      icon: ShieldCheck,
      titleAr: "خدمة ما بعد البيع والدعم",
      titleEn: "After-Sales & Customer Care",
      valueAr: "01118182424 — متابعة الطلبات والشحن، الضمان، والاسترجاع",
      valueEn: "01118182424 — Order tracking, shipping, warranty & returns",
      href: aftersalesWaLink,
      ctaAr: "تواصل مع خدمة ما بعد البيع",
      ctaEn: "After-Sales Support",
      highlight: false,
    },
    {
      icon: Phone,
      titleAr: "الاتصال الهاتفي المباشر",
      titleEn: "Call Us",
      valueAr: phoneDisplay,
      valueEn: phoneDisplay,
      href: `tel:+20${AFTERSALES_PHONE.slice(1)}`,
      ctaAr: "اتصل الآن",
      ctaEn: "Call now",
      highlight: false,
    },
    {
      icon: MapPin,
      titleAr: "صفحة فيسبوك الرسمية",
      titleEn: "Official Facebook Page",
      valueAr: "تابع أعمالنا الجديدة والعروض الحصرية على صفحتنا",
      valueEn: "Follow our latest work and exclusive offers",
      href: DEFAULT_FACEBOOK,
      external: true,
      ctaAr: "افتح الصفحة",
      ctaEn: "Open page",
      highlight: false,
    },
  ];

  return (
    <PublicLayout>
      <section className="border-b border-[#ddd6c8] bg-[#24211d] px-4 py-16 text-[#f9f7f2] md:py-24">
        <div className="container max-w-4xl">
          <p className="text-sm font-bold tracking-[0.2em] text-[#d5af58]">ELNOUR HOME</p>
          <h1 className="mt-4 text-4xl font-black md:text-6xl">
            {lang === "ar" ? "اتصل بنا" : "Contact Us"}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#ded8ce]">
            {lang === "ar"
              ? "نسعد بالتواصل معك لأي استفسار عن منتجاتنا، أو لطلب تصميم مخصص يناسب مساحتك. تواصل معنا بأي طريقة تناسبك."
              : "We'd love to hear from you — any inquiry about our products or a custom design for your space. Reach out however works best for you."}
          </p>
        </div>
      </section>

      <section className="container max-w-5xl py-14 md:py-20">
        <div className="grid gap-5 md:grid-cols-2">
          {blocks.map((b, i) => (
            <a
              key={i}
              href={b.href}
              target={b.external || b.href.startsWith("http") ? "_blank" : undefined}
              rel={b.external || b.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className={`group flex items-start gap-4 rounded-2xl border p-6 transition-all duration-200 hover:shadow-lg ${b.highlight ? "border-emerald-300 bg-emerald-50/40 hover:border-emerald-500 hover:shadow-emerald-500/15" : "border-[#e5e0d4] bg-white hover:border-[#d5af58] hover:shadow-[#d5af58]/10"}`}
            >
              <b.icon className={`mt-1 h-6 w-6 shrink-0 ${b.highlight ? "text-[#25d366]" : "text-[#d5af58]"}`} />
              <div className="min-w-0">
                <p className="font-black text-[#24211d] flex items-center gap-2">
                  <span>{lang === "ar" ? b.titleAr : b.titleEn}</span>
                  {b.highlight ? <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">{lang === "ar" ? "حجز فوري" : "Instant"}</span> : null}
                </p>
                <p className="mt-1 text-sm leading-6 text-[#6b6459]">
                  {lang === "ar" ? b.valueAr : b.valueEn}
                </p>
                <p className={`mt-2 text-sm font-bold ${b.highlight ? "text-emerald-700 group-hover:text-emerald-800" : "text-[#b8892f] group-hover:text-[#a37520]"}`}>
                  {lang === "ar" ? b.ctaAr : b.ctaEn}
                </p>
              </div>
            </a>
          ))}
        </div>

        <div className="mt-14 rounded-3xl border border-[#e5e0d4] bg-[#faf8f4] p-6 md:p-12">
          <h2 className="text-2xl font-black text-[#24211d] md:text-3xl">
            {lang === "ar" ? "أرسل لنا رسالة" : "Send Us a Message"}
          </h2>
          <p className="mt-2 text-sm text-[#6b6459]">
            {lang === "ar"
              ? "اترك بياناتك وسؤالك وسيرد عليك فريقنا خلال يوم عمل واحد"
              : "Leave your details and question — our team replies within one business day"}
          </p>
          <form
            className="mt-8 grid gap-4 md:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.name.trim() || !form.message.trim().length || form.message.trim().length < 10) {
                toast.error(lang === "ar" ? "يرجى إدخال الاسم والرسالة (10 أحرف على الأقل)" : "Please fill your name and a message (at least 10 characters)");
                return;
              }
              submit.mutate({
                name: form.name.trim(),
                phone: form.phone.trim() || undefined,
                email: form.email.trim() || undefined,
                subject: form.subject.trim() || undefined,
                message: form.message.trim(),
              });
            }}
          >
            <div>
              <label className="mb-1.5 block text-sm font-bold text-[#24211d]">
                {lang === "ar" ? "الاسم *" : "Name *"}
              </label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={lang === "ar" ? "اسمك بالكامل" : "Your full name"}
                maxLength={160}
                className="bg-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-[#24211d]">
                {lang === "ar" ? "رقم الهاتف" : "Phone"}
              </label>
              <Input
                dir="ltr"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="01X XXX XXXX"
                maxLength={40}
                className="bg-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-[#24211d]">
                {lang === "ar" ? "البريد الإلكتروني" : "Email"}
              </label>
              <Input
                dir="ltr"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="name@example.com"
                maxLength={180}
                className="bg-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-[#24211d]">
                {lang === "ar" ? "الموضوع" : "Subject"}
              </label>
              <Input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder={lang === "ar" ? "موضوع الرسالة" : "Message subject"}
                maxLength={200}
                className="bg-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-bold text-[#24211d]">
                {lang === "ar" ? "الرسالة *" : "Message *"}
              </label>
              <Textarea
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder={
                  lang === "ar"
                    ? "اكتب استفسارك أو تفاصيل التصميم المطلوب (المقاسات، الألوان، المساحة)"
                    : "Tell us about your inquiry or the custom design you need (sizes, colors, area)"
                }
                maxLength={5000}
                className="bg-white"
              />
            </div>
            <div className="md:col-span-2">
              <Button
                type="submit"
                size="lg"
                disabled={submit.isPending}
                className="w-full bg-[#d5af58] font-bold text-[#24211d] hover:bg-[#c49e44] disabled:opacity-60"
              >
                {submit.isPending ? (
                  (lang === "ar" ? "جارٍ الإرسال..." : "Sending...")
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    {lang === "ar" ? "إرسال الرسالة" : "Send Message"}
                  </>
                )}
              </Button>
            </div>
            {submit.isSuccess && (
              <div className="flex items-center gap-2 text-sm font-bold text-[#3d7a3d]">
                <CheckCircle2 className="h-4 w-4" />
                {lang === "ar" ? "تم إرسال رسالتك بنجاح" : "Your message was sent successfully"}
              </div>
            )}
          </form>
        </div>
      </section>
    </PublicLayout>
  );
}
