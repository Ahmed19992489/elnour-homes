import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
DropdownMenu,
DropdownMenuContent,
DropdownMenuItem,
DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
Sidebar,
SidebarContent,
SidebarFooter,
SidebarHeader,
SidebarInset,
SidebarMenu,
SidebarMenuButton,
SidebarMenuItem,
SidebarProvider,
SidebarTrigger,
useSidebar,
} from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { LayoutDashboard, LogOut, PanelLeft, Users, Package, ShoppingBag, Image, FileText, Tags, Ticket, Settings2, Images, Star, BellRing, BarChart3 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
31: const menuItems = [

{ icon: LayoutDashboard, label: "الرئيسية", path: "/admin" },
{ icon: ShoppingBag, label: "الطلبات", path: "/admin/orders" },
{ icon: Package, label: "المنتجات", path: "/admin/products" },
{ icon: Tags, label: "الفئات", path: "/admin/categories" },
{ icon: BellRing, label: "إشعارات التوفر", path: "/admin/stock-alerts" },
{ icon: BarChart3, label: "التقارير", path
{ icon: Image, label: "المعرض", path: "/admin/gallery" },
{ icon: FileText, label: "محتوى الموقع", path: "/admin/content" },
{ icon: Ticket, label: "الكوبونات", path: "/admin/coupons" },
{ icon: Images, label: "مكتبة الصور", path: "/admin/media" },
{ icon: Star, label: "التقييمات", path: "/admin/reviews" },
{ icon: Settings2, label: "الإعدادات", path: "/admin/settings" },
];
46: const SIDEBAR_WIDTH_KEY = "sidebar-width";

const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;
51: export default function DashboardLayout({

children,
}: {
children: React.ReactNode;
}) {
const [sidebarWidth, setSidebarWidth] = useState(() => {
if (typeof localStorage === "undefined") return DEFAULT_WIDTH;
const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
});
const { loading, user, logout } = useAuth();
const [, setLocation] = useLocation();
64:   useEffect(() => {

if (typeof localStorage !== "undefined") {
localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
}
}, [sidebarWidth]);
70:   if (loading) {

return <DashboardLayoutSkeleton />
}
74:   if (!user) {
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl font-semibold tracking-tight text-center">
سجل الدخول للمتابعة
</h1>
<p className="text-sm text-muted-foreground text-center max-w-sm">
الوصول إلى لوحة التحكم يتطلب تسجيل الدخول. اضغط للمتابعة.
</p>
</div>
<Button
onClick={() => startLogin()}
size="lg"
className="w-full shadow-lg hover:shadow-xl transition-all"
>
تسجيل الدخول
</Button>
</div>
</div>
);
}
if (user.role !== "admin") {
return (
<div className="flex items-center justify-center min-h-screen">
<div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
<div className="flex flex-col items-center gap-6">
<h1 className="text-2xl font-semibold tracking-tight text-center">
لوحة التحكم للإدارة فقط
</h1>
<p className="text-sm text-muted-foreground text-center max-w-sm">
حسابك حساب عميل. لعرض طلباتك ومشترياتك استخدم صفحة حسابي.
</p>
</div>
<div className="flex w-full flex-col gap-3 sm:flex-row">
<Button
onClick={() => setLocation("/account")}
size="lg"
className="flex-1 shadow-lg hover:shadow-xl transition-all"
>
فتح حسابي
</Button>
<Button
variant="outline"
size="lg"
onClick={() => logout()}
className="flex-1 shadow-lg hover:shadow-xl transition-all"
>
تسجيل خروج
</Button>
</div>
</div>
</div>
);
}
131:   return (
  return (
<SidebarProvider
style={
{
"--sidebar-width": `${sidebarWidth}px`,
} as CSSProperties
}
>
<DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
{children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  // Only the site owner may manage admin accounts
  const { data: meData } = trpc.adminAuth.me.useQuery(undefined, { retry: false });
  const isOwner = meData?.isOwner === true;
  const isModerator = user?.role === "moderator";

  const effectiveMenuItems = isModerator
    ? [
        { icon: LayoutDashboard, label: "الرئيسية", path: "/admin" },
        { icon: ShoppingBag, label: "الطلبات والحجوزات", path: "/admin/orders" },
        { icon: BellRing, label: "إشعارات التوفر", path: "/admin/stock-alerts" },
        { icon: Package, label: "المنتجات", path: "/admin/products" },
        { icon: Image, label: "المعرض", path: "/admin/gallery" },
        { icon: Star, label: "التقييمات", path: "/admin/reviews" },
      ]
    : isOwner
      ? [...menuItems, { icon: Users, label: "حسابات المدراء والموظفين", path: "/admin/admins" }]
      : menuItems;
180:       const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;

const newWidth = e.clientX - sidebarLeft;
if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
setSidebarWidth(newWidth);
}
};
187:     const handleMouseUp = () => {

setIsResizing(false);
};
191:     if (isResizing) {

document.addEventListener("mousemove", handleMouseMove);
document.addEventListener("mouseup", handleMouseUp);
document.body.style.cursor = "col-resize";
document.body.style.userSelect = "none";
}
198:     return () => {

document.removeEventListener("mousemove", handleMouseMove);
document.removeEventListener("mouseup", handleMouseUp);
document.body.style.cursor = "";
document.body.style.userSelect = "";
};
}, [isResizing, setSidebarWidth]);
206:   return (

<>
<div className="relative" ref={sidebarRef}>
<Sidebar
collapsible="icon"
className="border-r-0"
disableTransition={isResizing}
>
<SidebarHeader className="h-16 justify-center">
<div className="flex items-center gap-3 px-2 transition-all w-full">
<button
onClick={toggleSidebar}
className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
aria-label="Toggle navigation"
>
<PanelLeft className="h-4 w-4 text-muted-foreground" />
</button>
{!isCollapsed ? (
<div className="flex items-center gap-2 min-w-0">
<span className="font-semibold tracking-tight truncate">
لوحة التحكم
</span>
</div>
) : null}
>
<PanelLeft className="h-4 w-4 text-muted-foreground" />
</button>
{!isCollapsed ? (
<div className="flex items-center gap-2 min-w-0">
<span className="font-semibold tracking-tight truncate">
لوحة التحكم
</span>
</div>
) : null}
</div>
</SidebarHeader>
243:           <SidebarContent className="gap-0">
          <SidebarContent className="gap-0">
            <SidebarMenu className="px-2 py-1">
              {effectiveMenuItems.map(item => {
const isActive = location === item.path;
return (
<SidebarMenuItem key={item.path}>
<SidebarMenuButton
isActive={isActive}
onClick={() => setLocation(item.path)}
tooltip={item.label}
className={`h-10 transition-all font-normal`}
>
<item.icon
className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
/>
<span>{item.label}</span>
</SidebarMenuButton>
</SidebarMenuItem>
);
})}
</SidebarMenu>
</SidebarContent>
266:           <SidebarFooter className="p-3">

<DropdownMenu>
<DropdownMenuTrigger asChild>
<button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
<Avatar className="h-9 w-9 border shrink-0">