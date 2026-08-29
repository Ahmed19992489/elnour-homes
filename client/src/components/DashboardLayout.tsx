import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Tags,
  Image as ImageIcon,
  FileText,
  Ticket,
  Images,
  Star,
  BellRing,
  BarChart3,
  Settings2,
  Users,
  LogOut,
  Sparkles,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isOwnerOrAdmin = user?.role === "admin";
  const isModerator = user?.role === "moderator";

  const allMenuItems = [
    { icon: LayoutDashboard, label: "الرئيسية والإحصائيات", path: "/admin", roles: ["admin", "moderator"] },
    { icon: ShoppingBag, label: "إدارة الطلبات", path: "/admin/orders", roles: ["admin", "moderator"] },
    { icon: Package, label: "المنتجات والكتالوج", path: "/admin/products", roles: ["admin", "moderator"] },
    { icon: Tags, label: "الفئات والأقسام", path: "/admin/categories", roles: ["admin", "moderator"] },
    { icon: ImageIcon, label: "معرض سابقة الأعمال", path: "/admin/gallery", roles: ["admin", "moderator"] },
    { icon: BellRing, label: "إشعارات التوفر", path: "/admin/stock-alerts", roles: ["admin", "moderator"] },
    { icon: Star, label: "تقييمات العملاء", path: "/admin/reviews", roles: ["admin", "moderator"] },
    { icon: Ticket, label: "كوبونات الخصم", path: "/admin/coupons", roles: ["admin", "moderator"] },
    { icon: Images, label: "مكتبة الصور والوسائط", path: "/admin/media", roles: ["admin", "moderator"] },
    { icon: FileText, label: "محتوى ونصوص الموقع", path: "/admin/content", roles: ["admin"] },
    { icon: BarChart3, label: "التقارير والمبيعات", path: "/admin/reports", roles: ["admin"] },
    { icon: Settings2, label: "إعدادات المتجر", path: "/admin/settings", roles: ["admin"] },
    { icon: Users, label: "حسابات الإدارة والمشرفين", path: "/admin/admins", roles: ["admin"] },
  ];

  const allowedMenuItems = allMenuItems.filter(
    (item) => !item.roles || item.roles.includes(user?.role || "moderator")
  );

  return (
    <div className="flex min-h-screen bg-[#f6f3ed]" dir="rtl">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-l border-[#2e2a24] bg-[#24211d] text-[#f8f5ee] sticky top-0 h-screen z-30">
        {/* Brand */}
        <div className="flex h-18 items-center gap-3 px-6 border-b border-[#36312a]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d5af58] text-[#24211d]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <span className="font-black text-lg text-white block">ELNOUR HOMES</span>
            <span className="text-[10px] font-bold text-[#d5af58] tracking-widest uppercase">
              {isOwnerOrAdmin ? "لوحة الإدارة" : "لوحة المشرف"}
            </span>
          </div>
        </div>

        {/* Menu Links */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {allowedMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    isActive
                      ? "bg-[#d5af58] text-[#24211d] shadow-sm"
                      : "text-[#d5cebf] hover:bg-[#343029] hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#36312a] space-y-2">
          <Link href="/">
            <Button variant="ghost" size="sm" className="w-full text-xs text-[#ded7cb] hover:text-white justify-start font-bold">
              <ExternalLink className="ml-2 h-3.5 w-3.5" />
              عرض المتجر الرئيسي
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              logout();
              setLocation("/admin-login");
            }}
            className="w-full text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 justify-start font-bold"
          >
            <LogOut className="ml-2 h-3.5 w-3.5" />
            تسجيل الخروج
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-[#e8e2d8] bg-white/80 backdrop-blur px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-xl text-[#24211d] hover:bg-[#eee8dd]"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <span className="font-bold text-sm text-[#24211d]">
              {allMenuItems.find((m) => m.path === location)?.label || "لوحة التحكم"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="gold" className="text-xs px-2.5 py-0.5">
              {isOwnerOrAdmin ? "المدير العام" : "مشرف"}
            </Badge>
            <Link href="/" target="_blank">
              <Button size="sm" variant="outline" className="hidden sm:inline-flex rounded-xl font-bold border-[#d5af58]/40">
                <ExternalLink className="ml-1.5 h-3.5 w-3.5 text-[#a8822d]" />
                المتجر
              </Button>
            </Link>
          </div>
        </header>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-x-0 top-16 bottom-0 z-50 bg-[#24211d] text-white p-4 overflow-y-auto space-y-1">
            {allowedMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              return (
                <Link key={item.path} href={item.path} onClick={() => setMobileOpen(false)}>
                  <div
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold ${
                      isActive ? "bg-[#d5af58] text-[#24211d]" : "text-[#ded7cb] hover:bg-[#343029]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}
            <div className="pt-4 border-t border-[#36312a]">
              <Button
                variant="ghost"
                onClick={() => {
                  logout();
                  setLocation("/admin-login");
                }}
                className="w-full text-red-400 font-bold justify-start"
              >
                <LogOut className="ml-2 h-4 w-4" />
                تسجيل الخروج
              </Button>
            </div>
          </div>
        )}

        {/* Body Content */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1">{children}</main>
      </div>
    </div>
  );
}