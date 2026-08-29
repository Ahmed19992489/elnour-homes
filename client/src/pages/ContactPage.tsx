import React, { useState } from "react";
import { Phone, MapPin, MessageCircle, Clock, Send, Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import PublicLayout from "@/components/storefront/PublicLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { UpdateHead } from "@/components/UpdateHead";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const BUSINESS_PHONE = "01121748885";
const BUSINESS_EMAIL = "info@elnourhomes.com";

export default function ContactPage() {
  const { lang, t } = useLanguage();

  UpdateHead({
    title: lang === "ar" ? "اتصل بنا وتواصل معنا | Elnour Homes" : "Contact Us | Elnour Homes",
    description: "تواصل مع فريق Elnour Homes للاستفسار عن أسعار وتفصيل ترابيزات الاستيل، المرايات، وقواطع الديكور.",
  });

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });

  const submitMessage = trpc.contact.submit.useMutation({
    onSuccess: () => {
      toast.success(lang === "ar" ? "تم إرسال رسالتك بنجاح! سنتواصل معك قريباً." : "Message sent successfully!");
      setForm({ name: "", phone: "", email: "", message: "" });
    },
    onError: (e) => {
      toast.error(e.message || "حدث خطأ أثناء إرسال الرسالة");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.message.trim()) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    submitMessage.mutate({
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      message: form.message.trim(),
    });
  };

  return (
    <PublicLayout>
      {/* Header Banner */}
      <section className="border-b border-[#e8e2d8] bg-[#f5f0e6] py-12 md:py-16">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-wider text-[#a8822d]">
            GET IN TOUCH
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-[#24211d] mt-1">
            {t("تواصل معنا مباشرة", "Contact Elnour Homes")}
          </h1>
          <p className="mt-3 text-base text-[#6b6255]">
            {t(
              "يسعدنا الرد على كافة استفساراتكم حول المقاسات، الأسعار، ومواعيد الشحن والتسليم.",
              "We're happy to answer your questions regarding custom dimensions, pricing, and deliveries."
            )}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Contact Details Cards */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl border border-[#e8e2d8] bg-white p-6 md:p-8 shadow-xs space-y-6">
              <h2 className="text-xl font-bold text-[#24211d] border-b border-[#eee8dd] pb-4">
                {t("قنوات التواصل المباشرة", "Direct Contact Channels")}
              </h2>

              <div className="space-y-5">
                <a
                  href={`https://wa.me/20${BUSINESS_PHONE.slice(1)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-4 p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 transition-all group"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shrink-0 shadow-md">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-800 block">{t("محادثة فورية عبر واتساب", "WhatsApp Chat")}</span>
                    <span className="text-base font-black text-[#24211d] dir-ltr block" dir="ltr">
                      +20 {BUSINESS_PHONE.slice(1)}
                    </span>
                  </div>
                </a>

                <a
                  href={`tel:+20${BUSINESS_PHONE.slice(1)}`}
                  className="flex items-center gap-4 p-3.5 rounded-2xl border border-[#e8e2d8] bg-[#faf8f5] hover:bg-white transition-all group"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#24211d] text-[#d5af58] shrink-0 shadow-md">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-muted-foreground block">{t("الهاتف الموحد", "Direct Phone")}</span>
                    <span className="text-base font-black text-[#24211d] dir-ltr block" dir="ltr">
                      +20 {BUSINESS_PHONE.slice(1)}
                    </span>
                  </div>
                </a>

                <a
                  href={`mailto:${BUSINESS_EMAIL}`}
                  className="flex items-center gap-4 p-3.5 rounded-2xl border border-[#e8e2d8] bg-[#faf8f5] hover:bg-white transition-all group"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d5af58]/20 text-[#a8822d] shrink-0 shadow-md">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-muted-foreground block">{t("البريد الإلكتروني", "Email Address")}</span>
                    <span className="text-sm font-bold text-[#24211d] dir-ltr block" dir="ltr">
                      {BUSINESS_EMAIL}
                    </span>
                  </div>
                </a>

                <div className="flex items-center gap-4 p-3.5 rounded-2xl border border-[#e8e2d8] bg-[#faf8f5]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#24211d] text-white shrink-0 shadow-md">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-muted-foreground block">{t("مواعيد العمل والدعم", "Working Hours")}</span>
                    <span className="text-sm font-bold text-[#24211d] block">
                      السبت – الخميس: 9:00 ص – 11:00 م
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-[#e8e2d8] bg-white p-6 md:p-10 shadow-xs space-y-6">
              <div>
                <h2 className="text-2xl font-black text-[#24211d]">
                  {t("أرسل لنا استفسارك أو طلبك", "Send Us a Message")}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("اترك بياناتك وسيتواصل معك أحد مهندسينا في أسرع وقت.", "Fill in the form and an engineer will reach back to you shortly.")}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#5c5448] block mb-1.5">
                      {t("الاسم الكريم *", "Your Name *")}
                    </label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="مثال: أحمد مصطفى"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#5c5448] block mb-1.5">
                      {t("رقم الهاتف (واتساب) *", "Phone / WhatsApp *")}
                    </label>
                    <Input
                      dir="ltr"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="01112345678"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#5c5448] block mb-1.5">
                    {t("البريد الإلكتروني (اختياري)", "Email (Optional)")}
                  </label>
                  <Input
                    type="email"
                    dir="ltr"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="example@domain.com"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#5c5448] block mb-1.5">
                    {t("نص الرسالة أو تفاصيل القطعة المطلوبة *", "Message or Custom Requirements *")}
                  </label>
                  <Textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="اكتب استفسارك أو المقاسات المطلوبة والموديل الذي ترغب في تفصيله..."
                    rows={4}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitMessage.isPending}
                  className="w-full bg-[#24211d] text-white hover:bg-[#d5af58] hover:text-[#24211d] font-bold h-12 rounded-xl text-base shadow-md"
                >
                  <Send className="ml-2 h-4 w-4" />
                  {submitMessage.isPending ? "جاري الإرسال..." : "إرسال الرسالة الآن"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}