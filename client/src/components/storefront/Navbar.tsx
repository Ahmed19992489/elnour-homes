import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ShoppingBag,
  Heart,
  User,
  Phone,
  Menu,
  X,
  Search,
  Sparkles,
  Globe,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";

const BUSINESS_PHONE = "01121748885";

export default function Navbar() {
  const [location] = useLocation();
  const { itemCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const { lang, setLang, isRTL, t } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const navLinks = [
    { href: "/", labelAr: "الرئيسية", labelEn: "Home" },
    { href: "/products", labelAr: "الكتالوج والمنتجات", labelEn: "Products" },
    { href: "/work", labelAr: "أعمالنا ومعرض الصور", labelEn: "Our Work" },
    { href: "/offers", labelAr: "العروض الخاصة", labelEn: "Offers" },
    { href: "/about", labelAr: "عن النور", labelEn: "About Us" },
    { href: "/contact", labelAr: "اتصل بنا", labelEn: "Contact" },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#e8e2d8] bg-[#fbf9f5]/95 backdrop-blur shadow-xs">
      {/* Top announcement bar */}
      <div className="bg-[#24211d] text-[#f8f5ee] px-4 py-2 text-xs font-medium">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-[#d5af58] animate-pulse" />
            <span>{t("تصنيع وتفصيل أرقى ديكورات الاستيل حسب المقاس والطلب", "Custom luxury steel fabrication per your custom dimensions")}</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href={`tel:+20${BUSINESS_PHONE.slice(1)}`}
              className="flex items-center gap-1.5 text-[#d5af58] hover:text-[#f3dd9b] transition-colors"
            >
              <Phone className="h-3.5 w-3.5" />
              <span dir="ltr">{BUSINESS_PHONE}</span>
            </a>
            <button
              onClick={() => setLang(lang === "ar" ? "en" : "ar")}
              className="flex items-center gap-1 hover:text-[#d5af58] transition-colors cursor-pointer"
            >
              <Globe className="h-3 w-3" />
              <span>{lang === "ar" ? "English" : "العربية"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#24211d] text-[#d5af58] shadow-md group-hover:scale-105 transition-transform">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tight text-[#24211d]">
              ELNOUR <span className="text-[#a8822d]">HOMES</span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#786f63]">
              STEEL & LUXURY DECOR
            </span>
          </div>
        </Link>

        {/* Desktop navigation links */}
        <nav className="hidden lg:flex items-center gap-7">
          {navLinks.map((link) => {
            const isActive = location === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-bold transition-all hover:text-[#a8822d] relative py-1 ${
                  isActive ? "text-[#a8822d]" : "text-[#3e3931]"
                }`}
              >
                {lang === "ar" ? link.labelAr : link.labelEn}
                {isActive && (
                  <span className="absolute bottom-0 right-0 left-0 h-0.5 bg-[#d5af58] rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search Toggle */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[#3e3931] hover:bg-[#eee8dd] transition-colors"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Wishlist */}
          <Link href="/wishlist">
            <button className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[#3e3931] hover:bg-[#eee8dd] transition-colors">
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#d5af58] text-[10px] font-bold text-[#24211d]">
                  {wishlistCount}
                </span>
              )}
            </button>
          </Link>

          {/* Cart */}
          <Link href="/cart">
            <button className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[#3e3931] hover:bg-[#eee8dd] transition-colors">
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#24211d] text-[10px] font-bold text-white">
                  {itemCount}
                </span>
              )}
            </button>
          </Link>

          {/* User Account / Login */}
          <Link href={isAuthenticated ? (user?.role === "admin" || user?.role === "moderator" ? "/admin" : "/account") : "/admin-login"}>
            <Button variant="outline" size="sm" className="hidden sm:inline-flex rounded-xl gap-2 font-bold border-[#d5af58]/40 hover:border-[#d5af58]">
              <User className="h-4 w-4 text-[#a8822d]" />
              <span>{isAuthenticated ? (user?.role === "admin" ? "لوحة الإدارة" : user?.role === "moderator" ? "لوحة الموظف" : "حسابي") : "دخول"}</span>
            </Button>
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl text-[#3e3931] hover:bg-[#eee8dd]"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Expandable search bar */}
      {searchOpen && (
        <div className="border-t border-[#e8e2d8] bg-white px-4 py-3 shadow-inner">
          <div className="container mx-auto">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("ابحث عن ترابيزة استيل، مراية، كونسول، رفوف، أو كود الموديل...", "Search for steel tables, mirrors, console, shelves...")}
                className="flex-1 rounded-xl border border-[#d5af58]/40 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#d5af58]"
                autoFocus
              />
              <Button type="submit" className="bg-[#24211d] text-white hover:bg-[#a8822d]">
                {t("بحث", "Search")}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[113px] bottom-0 z-50 bg-[#fbf9f5] border-t border-[#e8e2d8] p-6 overflow-y-auto">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`text-lg font-bold py-2 border-b border-[#eee8dd] ${
                  location === link.href ? "text-[#a8822d]" : "text-[#24211d]"
                }`}
              >
                {lang === "ar" ? link.labelAr : link.labelEn}
              </Link>
            ))}
            <div className="pt-4 flex flex-col gap-3">
              <Link href={isAuthenticated ? "/account" : "/admin-login"} onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-[#24211d] text-white hover:bg-[#a8822d]">
                  <User className="ml-2 h-4 w-4" />
                  {isAuthenticated ? "لوحة التحكم / حسابي" : "تسجيل الدخول"}
                </Button>
              </Link>
              <a
                href={`https://wa.me/20${BUSINESS_PHONE.slice(1)}`}
                target="_blank"
                rel="noreferrer"
              >
                <Button variant="outline" className="w-full border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-bold">
                  تواصل عبر واتساب
                </Button>
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
