import React from "react";
import { Link } from "wouter";
import { Sparkles, Phone, Mail, MapPin, MessageCircle, ShieldCheck, Truck, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const BUSINESS_PHONE = "01121748885";
const BUSINESS_EMAIL = "info@elnourhomes.com";

export default function Footer() {
  const { lang, t } = useLanguage();

  return (
    <footer className="border-t border-[#36312a] bg-[#1e1c18] text-[#e8e2d8]">
      {/* Features Bar */}
      <div className="border-b border-[#2d2923] bg-[#24211d] py-8">
        <div className="container mx-auto px-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#d5af58]/15 text-[#d5af58]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-white">{t("ضمان استيل حقيقي 304", "Genuine 304 Stainless Steel")}</p>
              <p className="text-xs text-[#a89f91]">{t("مقاوم للصدأ والخدش مع تشطيب ليزر فاخر", "Rust-proof, scratch-resistant laser finish")}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#d5af58]/15 text-[#d5af58]">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-white">{t("شحن وتوصيل لكافة المحافظات", "Nationwide Safe Delivery")}</p>
              <p className="text-xs text-[#a89f91]">{t("تغليف محكم وتوصيل لباب المنزل", "Secure packaging to your doorstep")}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#d5af58]/15 text-[#d5af58]">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-white">{t("تنفيذ وتفصيل حسب المقاس", "Custom Dimensions Fabrication")}</p>
              <p className="text-xs text-[#a89f91]">{t("اختر اللون والمقاس ونفصلها لك", "Choose your color and dimensions")}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#d5af58]/15 text-[#d5af58]">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-white">{t("خدمة عملاء سريعة 24/7", "Fast Customer Support")}</p>
              <p className="text-xs text-[#a89f91]">{t("تواصل معنا مباشرة عبر الهاتف والواتساب", "Instant response via phone & WhatsApp")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d5af58] text-[#24211d]">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white">
                ELNOUR <span className="text-[#d5af58]">HOMES</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-[#b5aba0] max-w-sm">
              {t(
                "رواد تصنيع وتصميم ديكورات وأثاث الاستيل الفاخر في مصر. ترابيزات صالون وركنة، كونسول، مرايات مضيئة، قواطع جدارية، وتجهيزات استانلس بجودة لا تضاهى.",
                "Leaders in luxury stainless steel home decor and furniture in Egypt. Living room tables, consoles, LED mirrors, wall partitions, and stainless fittings."
              )}
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href={`https://wa.me/20${BUSINESS_PHONE.slice(1)}`}
                target="_blank"
                rel="noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2e2a23] text-[#d5af58] hover:bg-[#d5af58] hover:text-[#24211d] transition-all"
                title="WhatsApp"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
              <a
                href={`tel:+20${BUSINESS_PHONE.slice(1)}`}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2e2a23] text-[#d5af58] hover:bg-[#d5af58] hover:text-[#24211d] transition-all"
                title="Phone"
              >
                <Phone className="h-5 w-5" />
              </a>
              <a
                href={`mailto:${BUSINESS_EMAIL}`}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2e2a23] text-[#d5af58] hover:bg-[#d5af58] hover:text-[#24211d] transition-all"
                title="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-white mb-4 text-base">{t("روابط سريعة", "Quick Links")}</h4>
            <ul className="space-y-2.5 text-sm text-[#b5aba0]">
              <li><Link href="/" className="hover:text-[#d5af58] transition-colors">{t("الرئيسية", "Home")}</Link></li>
              <li><Link href="/products" className="hover:text-[#d5af58] transition-colors">{t("الكتالوج والمنتجات", "All Products")}</Link></li>
              <li><Link href="/work" className="hover:text-[#d5af58] transition-colors">{t("معرض أعمالنا", "Our Portfolio")}</Link></li>
              <li><Link href="/offers" className="hover:text-[#d5af58] transition-colors">{t("العروض والخصومات", "Special Offers")}</Link></li>
              <li><Link href="/about" className="hover:text-[#d5af58] transition-colors">{t("من نحن", "About Us")}</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-bold text-white mb-4 text-base">{t("خدمة العملاء", "Customer Service")}</h4>
            <ul className="space-y-2.5 text-sm text-[#b5aba0]">
              <li><Link href="/account" className="hover:text-[#d5af58] transition-colors">{t("حسابي وتتبع الطلبات", "My Account & Orders")}</Link></li>
              <li><Link href="/contact" className="hover:text-[#d5af58] transition-colors">{t("تواصل معنا", "Contact Us")}</Link></li>
              <li><Link href="/privacy" className="hover:text-[#d5af58] transition-colors">{t("سياسة الخصوصية", "Privacy Policy")}</Link></li>
              <li><Link href="/terms" className="hover:text-[#d5af58] transition-colors">{t("الشروط والأحكام", "Terms of Service")}</Link></li>
              <li><Link href="/returns" className="hover:text-[#d5af58] transition-colors">{t("سياسة الاستبدال والضمان", "Returns & Warranty")}</Link></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="font-bold text-white mb-4 text-base">{t("معلومات التواصل", "Contact Info")}</h4>
            <ul className="space-y-3 text-sm text-[#b5aba0]">
              <li className="flex items-start gap-2.5">
                <Phone className="h-4 w-4 text-[#d5af58] shrink-0 mt-1" />
                <div>
                  <span className="block font-semibold text-white">{t("الهاتف والواتساب الموحد:", "Phone & WhatsApp:")}</span>
                  <a href={`tel:+20${BUSINESS_PHONE.slice(1)}`} className="text-[#d5af58] font-bold dir-ltr block" dir="ltr">
                    +20 {BUSINESS_PHONE.slice(1, 4)} {BUSINESS_PHONE.slice(4, 7)} {BUSINESS_PHONE.slice(7)}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="h-4 w-4 text-[#d5af58] shrink-0 mt-1" />
                <div>
                  <span className="block font-semibold text-white">{t("البريد الإلكتروني:", "Email:")}</span>
                  <a href={`mailto:${BUSINESS_EMAIL}`} className="hover:text-[#d5af58] dir-ltr block" dir="ltr">
                    {BUSINESS_EMAIL}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-[#d5af58] shrink-0 mt-1" />
                <span>{t("جمهورية مصر العربية — التوصيل لكافة المحافظات", "Egypt — Delivery to all governorates")}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-[#2d2923] py-6 text-center text-xs text-[#8c8273]">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} Elnour Homes for Steel & Decor. {t("جميع الحقوق محفوظة.", "All rights reserved.")}</p>
          <p>{t("تصميم وتصنيع استيل بأعلى معايير الجودة العالمية", "Premium stainless steel decor & custom furniture")}</p>
        </div>
      </div>
    </footer>
  );
}
