import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ShieldCheck, Phone, Lock, Eye, EyeOff } from "lucide-react";
import { Link, useLocation } from "wouter";
13: export default function AdminLogin() {

const { lang } = useLanguage();
const [, setLocation] = useLocation();
const [phone, setPhone] = useState("");
const [password, setPassword] = useState("");
const [showPassword, setShowPassword] = useState(false);
const [submitted, setSubmitted] = useState(false);
const REMEMBER_KEY = "admin-login-remember";
const [rememberMe, setRememberMe] = useState(() => {
if (typeof localStorage === "undefined") return true;
const saved = localStorage.getItem(REMEMBER_KEY);
return saved === null ? true : saved === "1";
});
27:   const isRTL = lang === "ar";

const me = trpc.adminAuth.me.useQuery();
const login = trpc.adminAuth.login.useMutation({
onSuccess: (data) => {
toast.success(isRTL ? `أهلاً بك في لوحة التحكم، ${data.name}` : `Welcome back, ${data.name}`);
me.refetch();
setTimeout(() => setLocation("/admin"), 300);
<truncated 3349 bytes>
onError: (error) => {
toast.error(error.message);
},
});
40:   const handleSubmit = (event: React.FormEvent) => {

event.preventDefault();
if (!phone.trim() || !password.trim()) {
toast.error(isRTL ? "أدخل رقم الهاتف وكلمة المرور" : "Enter your phone number and password");
return;
}
setSubmitted(true);
if (typeof localStorage !== "undefined") {
localStorage.setItem(REMEMBER_KEY, rememberMe ? "1" : "0");
}
login.mutate({ phone: phone.trim(), password, rememberMe });
};
53:   // If already signed in as admin (OAuth or previous phone session), skip straight in.

if (me.data?.name) {
return (
<div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-6 px-4 text-center">
<ShieldCheck className="h-14 w-14 text-[#ad842f]" />
<div>
<h1 className="text-2xl font-black text-[#24211d]">
{isRTL ? "أنت مسجل الدخول بالفعل" : "You are already signed in"}
</h1>
<p className="mt-2 text-sm text-[#746c60]">
{isRTL ? `مرحباً بك، ${me.data.name}` : `Welcome back, ${me.data.name}`}
</p>
</div>
<div className="flex gap-3">
<Button className="bg-[#26231e] text-white hover:bg-[#ad842f]" onClick={() => setLocation("/admin")}>
{isRTL ? "فتح لوحة التحكم" : "Open dashboard"}
</Button>
<Button variant="outline" onClick={() => setLocation("/")}>
{isRTL ? "المتجر" : "Store"}
</Button>
</div>
</div>
);
}
78:   return (

<div className="mx-auto flex min-h-[75vh] max-w-md flex-col justify-center gap-8 px-4 py-10">
<div className="text-center">
<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#26231e]">
<ShieldCheck className="h-9 w-9 text-[#ad842f]" />
</div>
<h1 className="text-3xl font-black tracking-tight text-[#24211d]">
{isRTL ? "دخول لوحة التحكم" : "Admin login"}
</h1>
<p className="mt-2 text-sm text-[#746c60]">
{isRTL
? "دخول مخصص لأرقام الإدارة المصرّح لها فقط. هذا الدخول منفصل تماماً عن حسابات العملاء."
: "Restricted to authorized admin phone numbers only. This login is fully separate from customer accounts."}
</p>
</div>
94:       <form

onSubmit={handleSubmit}
className="rounded-2xl border border-[#d9d3c4] bg-white p-6 shadow-sm"
dir={isRTL ? "rtl" : "ltr"}
>
<div className="flex flex-col gap-4">
<div className="flex flex-col gap-2">
<Label htmlFor="admin-phone" className="font-bold text-[#514c42]">
{isRTL ? "رقم الهاتف" : "Phone number"}
</Label>
<div className="relative">
<Phone className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#958b7e]" />
<Input
id="admin-phone"
type="tel"
dir="ltr"
value={phone}
onChange={(event) => setPhone(event.target.value)}
placeholder={isRTL ? "01XXXXXXXXX" : "01XXXXXXXXX"}
inputMode="tel"
autoComplete="tel"
className="start-9 h-11 border-[#d9d3c4] bg-white text-center font-mono text-base"
/>
</div>
</div>
120:           <div className="flex flex-col gap-2">

<Label htmlFor="admin-password" className="font-bold text-[#514c42]">
{isRTL ? "كلمة المرور" : "Password"}
</Label>
<div className="relative">
<Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#958b7e]" />
<Input
id="admin-password"
type={showPassword ? "text" : "password"}
value={password}
onChange={(event) => setPassword(event.target.value)}
placeholder={isRTL ? "كلمة المرور" : "Password"}
autoComplete="current-password"
className="start-9 end-11 h-11 border-[#d9d3c4] bg-white"
/>
<button
type="button"
onClick={() => setShowPassword((value) => !value)}
className="absolute end-3 top-1/2 -translate-y-1/2 text-[#958b7e] transition hover:text-[#ad842f]"
aria-label={isRTL ? "إظهار كلمة المرور" : "Show password"}
>