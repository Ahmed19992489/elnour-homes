import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { MessageCircle, Phone } from "lucide-react";

const BUSINESS_PHONE = "01121748885";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[#faf8f5]">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />

      {/* Floating WhatsApp Action Button */}
      <a
        href={`https://wa.me/20${BUSINESS_PHONE.slice(1)}?text=${encodeURIComponent("مرحباً Elnour Homes، أود الاستفسار عن تفصيل وتصنيع أعمال الاستيل.")}`}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-2xl hover:bg-emerald-500 hover:scale-110 active:scale-95 transition-all group"
        aria-label="Contact on WhatsApp"
      >
        <MessageCircle className="h-7 w-7" />
        <span className="absolute right-16 hidden whitespace-nowrap rounded-xl bg-[#24211d] px-3.5 py-1.5 text-xs font-bold text-white shadow-lg group-hover:block">
          تواصل عبر واتساب
        </span>
      </a>
    </div>
  );
}
