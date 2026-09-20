import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { Cookie, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const COOKIE_KEY = "elnour_cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const { lang, t } = useLanguage();

  useEffect(() => {
    // Show after a small delay if not already accepted
    const accepted = localStorage.getItem(COOKIE_KEY);
    if (!accepted) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-[9999] animate-in slide-in-from-bottom duration-500"
      role="dialog"
      aria-label={t("إشعار ملفات تعريف الارتباط", "Cookie Notice")}
    >
      <div className="bg-white/95 backdrop-blur-lg border-t border-[#e5e0d4] shadow-2xl shadow-black/20">
        <div className="container mx-auto px-4 py-4 md:py-5">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {/* Icon */}
            <div className="flex-shrink-0 hidden md:flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d5af58]/15 text-[#d5af58]">
              <Cookie className="h-6 w-6" />
            </div>

            {/* Text */}
            <div className="flex-1">
              <p className="font-bold text-[#24211d] text-sm md:text-base mb-1">
                {t(
                  'يستخدم هذا الموقع ملفات تعريف الارتباط "cookies"',
                  'This website uses cookies'
                )}
              </p>
              <p className="text-xs md:text-sm text-[#6b6459] leading-relaxed">
                {t(
                  "يستخدم هذا الموقع ملفات تعريف الارتباط. لمزيد من المعلومات حول كيفية استخدامنا لملفات تعريف الارتباط، يمكنك قراءة إشعار الخصوصية وملفات تعريف الارتباط الخاص بنا.",
                  "This website uses cookies. For more information about how we use cookies, you can read our privacy and cookie notice."
                )}{" "}
                <Link
                  href="/privacy"
                  className="text-[#96702a] underline underline-offset-2 hover:text-[#d5af58] font-semibold transition-colors"
                >
                  {t("ملفات تعريف الارتباط وسياسة الخصوصية", "Cookie & Privacy Policy")}
                </Link>
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={accept}
                className="flex-1 md:flex-none px-6 py-2.5 rounded-xl bg-[#d5af58] hover:bg-[#c9a04c] text-white font-bold text-sm transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
              >
                {t("أقبل ملفات تعريف الارتباط", "Accept Cookies")}
              </button>
              <button
                onClick={accept}
                className="p-2 rounded-lg hover:bg-[#f4efe4] text-[#8f887c] hover:text-[#24211d] transition-colors"
                aria-label={t("إغلاق", "Close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
