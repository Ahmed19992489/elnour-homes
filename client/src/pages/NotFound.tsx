import React from "react";
import { Link } from "wouter";
import PublicLayout from "@/components/storefront/PublicLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <PublicLayout>
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <span className="text-7xl font-black text-[#d5af58]">404</span>
        <h1 className="mt-4 text-2xl md:text-3xl font-bold text-[#24211d]">
          {t("الصفحة المطلوبة غير موجودة", "Page Not Found")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          {t("يبدو أن الرابط الذي حاولت الوصول إليه غير صحيح أو تم نقله.", "The page you are looking for does not exist or has been moved.")}
        </p>
        <Link href="/">
          <Button className="mt-6 bg-[#24211d] text-white hover:bg-[#a8822d] font-bold px-6 rounded-xl">
            {t("العودة للرئيسية", "Back to Home")}
          </Button>
        </Link>
      </div>
    </PublicLayout>
  );
}
