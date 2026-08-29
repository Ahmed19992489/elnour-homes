import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ShieldCheck, Phone, Lock, Eye, EyeOff } from "lucide-react";

export default function AdminLogin() {
  const { lang, isRTL, t } = useLanguage();
  const [, setLocation] = useLocation();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const me = trpc.adminAuth.me.useQuery();

  const login = trpc.adminAuth.login.useMutation({
    onSuccess: (data) => {
      toast.success(isRTL ? `أهلاً بك في لوحة التحكم، ${data.name}` : `Welcome back, ${data.name}`);
      me.refetch();
      setTimeout(() => setLocation("/admin"), 300);
    },
    onError: (error) => {
      toast.error(error.message || (isRTL ? "بيانات الدخول غير صحيحة" : "Invalid login credentials"));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !password.trim()) {
      toast.error(isRTL ? "يرجى إدخال رقم الهاتف وكلمة المرور" : "Please enter phone and password");
      return;
    }
    login.mutate({
      phone: phone.trim(),
      password: password.trim(),
      rememberMe,
    });
  };

  if (me.data?.name) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-6 px-4 text-center">
        <ShieldCheck className="h-16 w-16 text-[#d5af58]" />
        <div>
          <h1 className="text-2xl font-black text-[#24211d]">
            {isRTL ? "أنت مسجل الدخول بالفعل" : "You are already signed in"}
          </h1>
          <p className="mt-2 text-sm text-[#746c60]">
            {isRTL ? `مرحباً بك، ${me.data.name}` : `Welcome back, ${me.data.name}`}
          </p>
        </div>
        <div className="flex gap-3">
          <Button className="bg-[#24211d] text-white hover:bg-[#d5af58] hover:text-[#24211d] font-bold" onClick={() => setLocation("/admin")}>
            {isRTL ? "فتح لوحة التحكم" : "Open Dashboard"}
          </Button>
          <Button variant="outline" onClick={() => setLocation("/")}>
            {isRTL ? "المتجر" : "Store"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center gap-8 px-4 py-12">
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#24211d] shadow-lg">
          <ShieldCheck className="h-9 w-9 text-[#d5af58]" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-[#24211d]">
          {isRTL ? "دخول لوحة الإدارة والموظفين" : "Admin & Staff Login"}
        </h1>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          {isRTL
            ? "دخول مخصص لأرقام الإدارة والمشرفين لمتابعة الطلبات وتحديث الكتالوج."
            : "Authorized portal for administrators and staff to manage orders and catalogue."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-3xl border border-[#e8e2d8] bg-white p-8 shadow-sm space-y-4">
        <div>
          <Label className="text-xs font-bold text-[#514c42] block mb-1.5">
            {isRTL ? "رقم الهاتف المعتمد *" : "Phone Number *"}
          </Label>
          <div className="relative">
            <Input
              type="tel"
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01121748885"
              className="font-mono text-center font-bold"
              required
            />
            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <div>
          <Label className="text-xs font-bold text-[#514c42] block mb-1.5">
            {isRTL ? "كلمة المرور *" : "Password *"}
          </Label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="font-mono"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3 top-3 text-muted-foreground hover:text-[#24211d]"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={login.isPending}
          className="w-full bg-[#24211d] text-white hover:bg-[#d5af58] hover:text-[#24211d] font-bold h-12 rounded-xl text-base shadow-md"
        >
          {login.isPending ? <Spinner size="sm" /> : isRTL ? "تسجيل الدخول" : "Sign In"}
        </Button>

        <div className="pt-2 text-center">
          <Link href="/" className="text-xs text-muted-foreground hover:text-[#a8822d] font-bold">
            ← {isRTL ? "العودة للمتجر الرئيسي" : "Back to Store"}
          </Link>
        </div>
      </form>
    </div>
  );
}