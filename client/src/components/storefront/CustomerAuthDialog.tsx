import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, UserCheck, Phone, Mail, MapPin, User, ArrowRight, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface CustomerAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function CustomerAuthDialog({
  open,
  onOpenChange,
  onSuccess,
}: CustomerAuthDialogProps) {
  const { lang } = useLanguage();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const utils = trpc.useUtils();

  const customerLogin = trpc.auth.customerLogin.useMutation({
    onSuccess: (data) => {
      toast.success(
        lang === "ar"
          ? `أهلاً بك يا ${data.user?.name || "عميلنا المميز"}! تم تسجيل الدخول بنجاح 🟢`
          : `Welcome back, ${data.user?.name || "Customer"}!`
      );
      utils.auth.me.setData(undefined, data.user as any);
      utils.auth.me.invalidate();
      onOpenChange(false);
      if (onSuccess) onSuccess();
    },
    onError: (err) => {
      toast.error(err.message || (lang === "ar" ? "حدث خطأ أثناء تسجيل الدخول" : "Login error"));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim();
    if (cleanPhone.length < 8) {
      toast.error(lang === "ar" ? "يرجى كتابة رقم هاتف صحيح" : "Please enter a valid phone number");
      return;
    }
    if (tab === "register" && !name.trim()) {
      toast.error(lang === "ar" ? "يرجى كتابة اسمك" : "Please enter your name");
      return;
    }

    customerLogin.mutate({
      phone: cleanPhone,
      name: name.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-[#d9d3c4] bg-[#fdfcfa]" dir={lang === "ar" ? "rtl" : "ltr"}>
        {/* Header with Luxury Brand Banner */}
        <div className="bg-gradient-to-r from-[#24211d] to-[#3a352e] p-6 text-white text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#ad842f]/20 border border-[#ad842f]/40 text-[#e3c97d]">
            <UserCheck className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl font-black tracking-wide text-white">
            {tab === "login"
              ? lang === "ar"
                ? "تسجيل دخول العميل"
                : "Customer Sign In"
              : lang === "ar"
              ? "إنشاء حساب عميل جديد"
              : "Create New Account"}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#d5af58] mt-1">
            {lang === "ar"
              ? "تابع طلباتك وعروضك الحصرية لدى النور ستيل"
              : "Track orders and exclusive steel décor offers"}
          </DialogDescription>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#e3dbc9] bg-[#f8f7f4]">
          <button
            type="button"
            onClick={() => setTab("login")}
            className={`flex-1 py-3 text-xs font-bold transition-colors ${
              tab === "login"
                ? "border-b-2 border-[#ad842f] bg-white text-[#ad842f]"
                : "text-[#746c60] hover:text-[#24211d]"
            }`}
          >
            {lang === "ar" ? "تسجيل الدخول" : "Sign In"}
          </button>
          <button
            type="button"
            onClick={() => setTab("register")}
            className={`flex-1 py-3 text-xs font-bold transition-colors ${
              tab === "register"
                ? "border-b-2 border-[#ad842f] bg-white text-[#ad842f]"
                : "text-[#746c60] hover:text-[#24211d]"
            }`}
          >
            {lang === "ar" ? "حساب جديد" : "New Account"}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {tab === "register" && (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#3d382f]">
                {lang === "ar" ? "الاسم الكامل *" : "Full Name *"}
              </Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#958b7e] rtl:left-auto rtl:right-3" />
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={lang === "ar" ? "مثال: أحمد محمد" : "e.g. Ahmed Mohamed"}
                  className="h-10 bg-white border-[#d9d3c4] px-9"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#3d382f]">
              {lang === "ar" ? "رقم الهاتف / الواتساب *" : "Phone Number / WhatsApp *"}
            </Label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#958b7e] rtl:left-auto rtl:right-3" />
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01xxxxxxxxx"
                className="h-10 bg-white border-[#d9d3c4] px-9"
                required
                dir="ltr"
              />
            </div>
            <p className="text-[11px] text-[#8a806f]">
              {lang === "ar"
                ? "يتم الدخول مباشرة برقم هاتفك لربط ومتابعة فواتيرك وطلباتك."
                : "Used to track your orders and notifications."}
            </p>
          </div>

          {tab === "register" && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#3d382f]">
                  {lang === "ar" ? "البريد الإلكتروني (اختياري)" : "Email (Optional)"}
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#958b7e] rtl:left-auto rtl:right-3" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="h-10 bg-white border-[#d9d3c4] px-9"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#3d382f]">
                  {lang === "ar" ? "العنوان بالتفصيل (اختياري)" : "Delivery Address (Optional)"}
                </Label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#958b7e] rtl:left-auto rtl:right-3" />
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={lang === "ar" ? "المحافظة - المدينة - الشارع" : "City - Street"}
                    className="h-10 bg-white border-[#d9d3c4] px-9"
                  />
                </div>
              </div>
            </>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              disabled={customerLogin.isPending}
              className="w-full h-11 bg-[#24211d] text-white hover:bg-[#ad842f] font-bold text-sm shadow-md transition-all"
            >
              {customerLogin.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin ms-2" />
              ) : (
                <ArrowRight className="h-4 w-4 ms-2 rtl:rotate-180" />
              )}
              <span>
                {tab === "login"
                  ? lang === "ar"
                    ? "تسجيل الدخول والمتابعة"
                    : "Sign In & Continue"
                  : lang === "ar"
                  ? "إنشاء الحساب ومتابعة التسوق"
                  : "Create Account & Continue"}
              </span>
            </Button>
          </div>

          <div className="flex items-center justify-center gap-1.5 pt-2 text-[11px] text-[#8a806f]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#ad842f]" />
            <span>{lang === "ar" ? "بياناتك مشفرة ومحمية بخصوصية تامة 100%" : "100% Secure & Private"}</span>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
