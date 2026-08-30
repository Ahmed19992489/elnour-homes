import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { buildBusinessWhatsAppUrl } from "@/lib/orderWhatsApp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Facebook, Heart, Instagram, Menu, MessageCircle, Search, Send, ShoppingCart, X } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { cartTotals } from "@/lib/cart";
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";

const DEFAULT_WHATSAPP = "01118182424";
const DEFAULT_WHATSAPP_MESSAGE = "مرحباً، أرغب في الاستفسار عن أعمال Elnour for STEEL";
const DEFAULT_FACEBOOK = "https://www.facebook.com/share/19KhMom9Sq/";

function buildWhatsAppLink(number: string, message: string) {
  return buildBusinessWhatsAppUrl(number, message || DEFAULT_WHATSAPP_MESSAGE);
}

const navItems = [
  { href: "/products", ar: "المنتجات", en: "Products" },
  { href: "/work", ar: "أعمالنا", en: "Our Work" },
  { href: "/about", ar: "من نحن", en: "About Us" },
  { href: "/story", ar: "قصتنا", en: "Our Story" },
  { href: "/offers", ar: "العروض", en: "Offers" },
];

function getTrackingInput(path: string) {
  const params = new URLSearchParams(window.location.search);
  let sessionId = sessionStorage.getItem("_sessionId");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("_sessionId", sessionId);
  }
  return {
    sessionId,
    path,
    referrer: document.referrer || undefined,
    userAgent: navigator.userAgent || undefined,
    utmSource: params.get("utm_source") || undefined,
    utmMedium: params.get("utm_medium") || undefined,
    utmCampaign: params.get("utm_campaign") || undefined,
  };
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { lang, isRTL, setLang } = useLanguage();
  const { user, loading, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const cartCtx = useCart();
  const cartCount = cartTotals(cartCtx.items).itemCount;
  const wishlistCtx = useWishlist();
  const wishCount = wishlistCtx.items.length;
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const trackPageview = trpc.pageviews.track.useMutation();
  const { data: contact } = trpc.contactInfo.get.useQuery();
  const { data: searchProducts } = trpc.products.active.useQuery();
  const { data: searchCategories } = trpc.categories.active.useQuery();

  const normalizedSearchQuery = searchQuery.trim().toLocaleLowerCase();
  const productSearchResults = useMemo(() => {
    if (!normalizedSearchQuery) return [];
    return (searchProducts ?? []).filter((product) => [
      product.name,
      product.nameAr,
      product.description,
      product.category,
      product.sizes,
      product.colors,
    ].some((value) => value?.toLocaleLowerCase().includes(normalizedSearchQuery))).slice(0, 4);
  }, [normalizedSearchQuery, searchProducts]);
  const categorySearchResults = useMemo(() => {
    if (!normalizedSearchQuery) return [];
    return (searchCategories ?? []).filter((category) => [
      category.nameAr,
      category.nameEn,
      category.descriptionAr,
      category.descriptionEn,
      category.slug,
    ].some((value) => value?.toLocaleLowerCase().includes(normalizedSearchQuery))).slice(0, 3);
  }, [normalizedSearchQuery, searchCategories]);

  const whatsappNumber = contact?.whatsappNumber ?? DEFAULT_WHATSAPP;
  const whatsAppMessage = contact?.whatsAppMessage ?? DEFAULT_WHATSAPP_MESSAGE;
  const WHATSAPP_LINK = buildWhatsAppLink(whatsappNumber, whatsAppMessage);
  const FACEBOOK_LINK = contact?.facebookUrl || DEFAULT_FACEBOOK;

  useEffect(() => {
    trackPageview.mutate(getTrackingInput(location));
  }, [location]);

  const isAdmin = user?.role === "admin";

  const copy = lang === "ar" ? {
    home: "الرئيسية", contact: "تواصل معنا", login: "دخول / حساب جديد", account: "حسابي",
    dashboard: "لوحة التحكم", logout: "خروج", adminLogin: "دخول الإدارة",
    language: "EN", footer: "ديكورات وأثاث استيل مصمم ليرتقي بتفاصيل مساحتك.", rights: "جميع الحقوق محفوظة.",
    facebook: "تابعنا على فيسبوك", whatsapp: "تحدث معنا على واتساب",
  } : {
    home: "Home", contact: "Contact us", login: "Sign in / Create account", account: "My account",
    dashboard: "Dashboard", logout: "Sign out", adminLogin: "Admin login",
    language: "ع", footer: "Steel décor and furniture designed to elevate every detail of your space.", rights: "All rights reserved.",
    facebook: "Follow us on Facebook", whatsapp: "Chat with us on WhatsApp",
  };

  const handleNav = (href: string) => {
    setMenuOpen(false);
    setLocation(href);
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const query = searchQuery.trim();
    setMenuOpen(false);
    setLocation(query ? `/products?q=${encodeURIComponent(query)}` : "/products");
  };

  const openProductSearchResult = (productId: number) => {
    setSearchQuery("");
    setMenuOpen(false);
    setLocation(`/product/${productId}`);
  };

  const openCategorySearchResult = (slug: string) => {
    setSearchQuery("");
    setMenuOpen(false);
    setLocation(`/products/${slug}`);
  };

  const renderSearchSuggestions = () => {
    if (!normalizedSearchQuery) return null;
    const hasResults = productSearchResults.length > 0 || categorySearchResults.length > 0;
    return <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-[#d9d3c4] bg-white p-2 shadow-xl" role="status" aria-live="polite">
      {productSearchResults.length ? <div>
        <p className="px-2 pb-1 pt-1 text-[11px] font-bold tracking-wide text-[#9c762a]">{lang === "ar" ? "المنتجات المطابقة" : "Matching products"}</p>
        {productSearchResults.map((product) => <button key={product.id} type="button" onClick={() => openProductSearchResult(product.id)} className="flex w-full flex-col rounded-lg px-3 py-2 text-right transition hover:bg-[#f2eee5]">
          <span className="text-sm font-bold text-[#24211d]">{lang === "ar" ? product.nameAr || product.name : product.name || product.nameAr}</span>
          {product.category ? <span className="mt-0.5 text-xs text-[#746c60]">{product.category}</span> : null}
        </button>)}
      </div> : null}
      {categorySearchResults.length ? <div className={productSearchResults.length ? "mt-2 border-t border-[#eee9df] pt-2" : ""}>
        <p className="px-2 pb-1 pt-1 text-[11px] font-bold tracking-wide text-[#9c762a]">{lang === "ar" ? "الفئات المطابقة" : "Matching categories"}</p>
        {categorySearchResults.map((category) => <button key={category.id} type="button" onClick={() => openCategorySearchResult(category.slug)} className="flex w-full flex-col rounded-lg px-3 py-2 text-right transition hover:bg-[#f2eee5]">
          <span className="text-sm font-bold text-[#24211d]">{lang === "ar" ? category.nameAr : category.nameEn}</span>
        </button>)}
      </div> : null}
      {!hasResults ? <p className="px-3 py-3 text-sm text-[#746c60]">{lang === "ar" ? "لا توجد منتجات أو فئات مطابقة." : "No matching products or categories."}</p> : null}
      <button type="submit" className="mt-2 w-full rounded-lg border border-[#ded6c8] px-3 py-2 text-xs font-bold text-[#5f5547] transition hover:border-[#ad842f] hover:text-[#8b6821]">{lang === "ar" ? `عرض نتائج البحث عن «${searchQuery.trim()}»` : `View all results for “${searchQuery.trim()}”`}</button>
    </div>;
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-[#161614]" dir={isRTL ? "rtl" : "ltr"}>
      <header className="sticky top-0 z-40 border-b border-[#d9d3c4] bg-[#f8f7f4]/95 backdrop-blur">
        <div className="container flex h-18 items-center justify-between gap-4 py-3">
          <div className="flex min-w-0 items-center gap-5">
            <Link href="/" className="shrink-0 leading-none">
              <span className="block text-lg font-black tracking-[0.16em] text-[#26231e]">ELNOUR</span>
              <span className="block text-[9px] font-bold tracking-[0.34em] text-[#ad842f]">FOR STEEL</span>
            </Link>
            <nav className="hidden items-center gap-5 lg:flex">
              <Link href="/" className={`text-sm transition-colors hover:text-[#ad842f] ${location === "/" ? "font-bold text-[#ad842f]" : "text-[#514c42]"}`}>{copy.home}</Link>
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className={`text-sm transition-colors hover:text-[#ad842f] ${location.startsWith(item.href) ? "font-bold text-[#ad842f]" : "text-[#514c42]"}`}>
                  {lang === "ar" ? item.ar : item.en}
                </Link>
              ))}
            </nav>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <form onSubmit={handleSearch} className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#958b7e]" />
              <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="h-9 w-48 xl:w-56 border-[#d9d3c4] bg-white pl-9 text-sm" placeholder={lang === "ar" ? "ابحث عن منتج..." : "Search products..."} aria-label={lang === "ar" ? "البحث في المنتجات" : "Search products"} />
              {renderSearchSuggestions()}
            </form>
            <Link href="/wishlist" aria-label={lang === "ar" ? "المفضلة" : "Wishlist"} className="relative inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-[#514c42] transition-colors hover:text-red-500">
              <Heart className={`h-5 w-5 ${wishCount > 0 ? "fill-red-500 text-red-500" : ""}`} />
              {wishCount > 0 ? <span className="absolute -top-1.5 -end-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">{wishCount}</span> : null}
            </Link>
            <Link href="/cart" aria-label={lang === "ar" ? "سلة المشتريات" : "Shopping cart"} className="relative inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-[#514c42] transition-colors hover:text-[#ad842f]">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 ? <span className="absolute -top-1.5 -end-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#ad842f] px-1 text-[10px] font-black text-white">{cartCount}</span> : null}
            </Link>
            <Button variant="ghost" size="sm" className="font-semibold" onClick={() => setLang(lang === "ar" ? "en" : "ar")}>{copy.language}</Button>
            <Button variant="ghost" size="sm" onClick={() => setLocation("/admin-login")} className="text-[#8b6821]">{copy.adminLogin}</Button>
            {user ? <>
              <Button variant="outline" size="sm" onClick={() => setLocation(isAdmin ? "/admin" : "/account")}>{isAdmin ? copy.dashboard : copy.account}</Button>
              <Button variant="ghost" size="sm" onClick={logout}>{copy.logout}</Button>
            </> : !loading ? <Button variant="outline" size="sm" onClick={startLogin}>{copy.login}</Button> : null}
            <Button size="sm" className="bg-[#26231e] text-white hover:bg-[#ad842f]" onClick={() => window.open(WHATSAPP_LINK, "_blank", "noopener,noreferrer")}>{copy.contact}</Button>
          </div>
          <div className="flex items-center gap-1 md:hidden">
            <Link href="/wishlist" aria-label={lang === "ar" ? "المفضلة" : "Wishlist"} className="relative inline-flex h-9 w-9 items-center justify-center text-[#514c42] transition-colors hover:text-red-500">
              <Heart className={`h-5 w-5 ${wishCount > 0 ? "fill-red-500 text-red-500" : ""}`} />
              {wishCount > 0 ? <span className="absolute -top-1.5 -end-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">{wishCount}</span> : null}
            </Link>
            <Link href="/cart" aria-label={lang === "ar" ? "سلة المشتريات" : "Shopping cart"} className="relative inline-flex h-9 w-9 items-center justify-center text-[#514c42] transition-colors hover:text-[#ad842f]">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 ? <span className="absolute -top-1.5 -end-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#ad842f] px-1 text-[10px] font-black text-white">{cartCount}</span> : null}
            </Link>
            <Button variant="ghost" size="icon" onClick={() => setLang(lang === "ar" ? "en" : "ar")} aria-label="Change language">{copy.language}</Button>
            <Button variant="ghost" size="icon" onClick={() => setMenuOpen((value) => !value)} aria-label="Open menu">{menuOpen ? <X /> : <Menu />}</Button>
          </div>
        </div>
        {menuOpen ? <div className="border-t border-[#d9d3c4] bg-[#f8f7f4] px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            <form onSubmit={handleSearch} className="relative mb-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#958b7e]" />
              <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="h-10 border-[#d9d3c4] bg-white pl-9" placeholder={lang === "ar" ? "ابحث عن منتج أو لون أو مقاس..." : "Search products, colour or size..."} aria-label={lang === "ar" ? "البحث في المنتجات" : "Search products"} />
              {renderSearchSuggestions()}
            </form>
            <button className="rounded-md px-3 py-2 text-right hover:bg-[#eee9dd]" onClick={() => handleNav("/wishlist")}>{lang === "ar" ? `المفضلة (${wishCount})` : `Wishlist (${wishCount})`}</button>
            <button className="rounded-md px-3 py-2 text-right hover:bg-[#eee9dd]" onClick={() => handleNav("/offers")}>{lang === "ar" ? "العروض والكوبونات" : "Offers & Coupons"}</button>
            <button className="rounded-md px-3 py-2 text-right hover:bg-[#eee9dd]" onClick={() => handleNav("/cart")}>{lang === "ar" ? `سلة المشتريات (${cartCount})` : `Cart (${cartCount})`}</button>
            <button className="rounded-md px-3 py-2 text-right hover:bg-[#eee9dd]" onClick={() => handleNav("/")}>{copy.home}</button>
            {navItems.map((item) => <button key={item.href} className="rounded-md px-3 py-2 text-right hover:bg-[#eee9dd]" onClick={() => handleNav(item.href)}>{lang === "ar" ? item.ar : item.en}</button>)}
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-[#d9d3c4] pt-3">
              <Button variant="ghost" className="text-[#8b6821]" onClick={() => handleNav("/admin-login")}>{copy.adminLogin}</Button>
              {user ? <><Button variant="outline" onClick={() => handleNav(isAdmin ? "/admin" : "/account")}>{isAdmin ? copy.dashboard : copy.account}</Button><Button variant="ghost" onClick={logout}>{copy.logout}</Button></> : <Button variant="outline" className="col-span-2" onClick={startLogin}>{copy.login}</Button>}
              <Button className="col-span-2 bg-[#26231e] text-white" onClick={() => window.open(WHATSAPP_LINK, "_blank", "noopener,noreferrer")}>{copy.contact}</Button>
            </div>
          </nav>
        </div> : null}
      </header>

      <main>{children}</main>

      <div className="fixed bottom-5 right-5 z-30 flex flex-col gap-3" dir="ltr">
        <a
          href="https://www.facebook.com/NOOURSTEEL"
          target="_blank"
          rel="noreferrer"
          title={lang === "ar" ? "راسلنا على ماسنجر / فيسبوك" : "Message us on Messenger / Facebook"}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0084ff] text-white shadow-xl transition-transform hover:scale-105"
          aria-label={lang === "ar" ? "راسلنا على ماسنجر" : "Message us on Messenger"}
        >
          <Send className="h-5 w-5" />
        </a>
        <a
          href={WHATSAPP_LINK}
          target="_blank"
          rel="noreferrer"
          title={copy.whatsapp}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-xl transition-transform hover:scale-105"
          aria-label={copy.whatsapp}
        >
          <MessageCircle className="h-6 w-6" />
        </a>
      </div>

      <footer className="mt-16 bg-[#24211d] text-[#f8f7f4]">
        <div className="container grid gap-8 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="text-xl font-black tracking-[0.16em]">ELNOUR</p>
            <p className="mt-1 text-xs font-bold tracking-[0.32em] text-[#d5af58]">FOR STEEL</p>
            <p className="mt-4 max-w-sm text-sm leading-7 text-[#d6d0c7]">{copy.footer}</p>
          </div>
          <div>
            <p className="text-sm font-bold text-[#d5af58]">{lang === "ar" ? "استكشف" : "Explore"}</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-[#d6d0c7]">
              {navItems.map((item) => <Link key={item.href} href={item.href} className="hover:text-white">{lang === "ar" ? item.ar : item.en}</Link>)}
              <Link href="/contact" className="hover:text-white">{lang === "ar" ? "اتصل بنا" : "Contact us"}</Link>
              <Link href="/offers" className="hover:text-white">{lang === "ar" ? "العروض" : "Offers"}</Link>
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-[#d5af58]">{lang === "ar" ? "قانوني" : "Legal"}</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-[#d6d0c7]">
              <Link href="/privacy" className="hover:text-white">{lang === "ar" ? "سياسة الخصوصية" : "Privacy Policy"}</Link>
              <Link href="/terms" className="hover:text-white">{lang === "ar" ? "الشروط والأحكام" : "Terms & Conditions"}</Link>
              <Link href="/returns" className="hover:text-white">{lang === "ar" ? "الإرجاع والاستبدال" : "Returns & Exchange"}</Link>
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-[#d5af58]">{lang === "ar" ? "تواصل" : "Contact"}</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-[#d6d0c7]">
              <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-white">{copy.whatsapp}</a>
              {FACEBOOK_LINK ? <a href={FACEBOOK_LINK} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-white">{copy.facebook}</a> : null}
              {contact?.instagramUrl ? (
                <a href={contact.instagramUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-white" aria-label="Instagram">
                  <Instagram className="h-4 w-4" />
                  Instagram
                </a>
              ) : null}
              {contact?.telegramUrl ? (
                <a href={contact.telegramUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-white" aria-label="Telegram">
                  <Send className="h-4 w-4" />
                  Telegram
                </a>
              ) : null}
              {contact?.phone ? <a href={`tel:${contact.phone}`} className="flex items-center gap-2 hover:text-white" dir="ltr">{contact.phone}</a> : null}
            </div>
          </div>
        </div>
        <div className="border-t border-white/10"><div className="container py-4 text-xs text-[#a9a196]">© {new Date().getFullYear()} Elnour for STEEL — {copy.rights}</div></div>
      </footer>
    </div>
  );
}
