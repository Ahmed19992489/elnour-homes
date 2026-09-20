import { Toaster } from "@/components/ui/sonner";
import React, { Suspense, lazy } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useRoleRedirect } from "@/hooks/useRoleRedirect";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { CartProvider } from "./contexts/CartContext";
import { WishlistProvider } from "./contexts/WishlistContext";

// ── Lazy-loaded pages (each becomes a separate JS chunk) ──
const Home = lazy(() => import("./pages/Home"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const CatalogPage = lazy(() => import("./pages/CatalogPage"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const ContentPage = lazy(() => import("./pages/ContentPage"));
const WorkPage = lazy(() => import("./pages/WorkPage"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const MyAccount = lazy(() => import("./pages/MyAccount"));
const OrderDetails = lazy(() => import("./pages/OrderDetails"));
const CartPage = lazy(() => import("./pages/CartPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const OffersPage = lazy(() => import("./pages/OffersPage"));
const WishlistPage = lazy(() => import("./pages/WishlistPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const LegalPage = lazy(() => import("./pages/LegalPages"));
const NotFound = lazy(() => import("./pages/NotFound"));

// ── Admin pages (heavy, only loaded when admin navigates) ──
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminGallery = lazy(() => import("./pages/admin/AdminGallery"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminContent = lazy(() => import("./pages/admin/AdminContent"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminCoupons = lazy(() => import("./pages/admin/AdminCoupons"));
const AdminMedia = lazy(() => import("./pages/admin/AdminMedia"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminStockAlerts = lazy(() => import("./pages/admin/AdminStockAlerts"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminAdmins = lazy(() => import("./pages/admin/AdminAdmins"));
const CookieConsent = lazy(() => import("./components/storefront/CookieConsent"));

// ── Loading spinner for lazy pages ──
function PageLoader() {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "60vh",
    }}>
      <div style={{
        width: 40,
        height: 40,
        border: "4px solid #e5e7eb",
        borderTop: "4px solid #d4a853",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Router() {
  useRoleRedirect();
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/products" component={CatalogPage} />
        <Route path="/catalog" component={CatalogPage} />
        <Route path="/products/:slug" component={CategoryPage} />
        <Route path="/product/:id" component={ProductDetail} />
        <Route path="/about" component={() => <ContentPage sectionKey="about" />} />
        <Route path="/story" component={() => <ContentPage sectionKey="story" />} />
        <Route path="/work" component={WorkPage} />
        <Route path="/our-work" component={WorkPage} />
        <Route path="/admin-login" component={AdminLogin} />
        <Route path="/admin/orders" component={AdminOrders} />
        <Route path="/admin/products" component={AdminProducts} />
        <Route path="/admin/categories" component={AdminCategories} />
        <Route path="/admin/gallery" component={AdminGallery} />
        <Route path="/admin/content" component={AdminContent} />
        <Route path="/admin/coupons" component={AdminCoupons} />
        <Route path="/admin/media" component={AdminMedia} />
        <Route path="/admin/reviews" component={AdminReviews} />
        <Route path="/admin/reports" component={AdminReports} />
        <Route path="/admin/stock-alerts" component={AdminStockAlerts} />
        <Route path="/admin/settings" component={AdminSettings} />
        <Route path="/admin/admins" component={AdminAdmins} />
        <Route path="/cart" component={CartPage} />
        <Route path="/checkout" component={CheckoutPage} />
        <Route path="/offers" component={OffersPage} />
        <Route path="/wishlist" component={WishlistPage} />
        <Route path="/contact" component={ContactPage} />
        <Route path="/privacy" component={() => <LegalPage page="privacy" />} />
        <Route path="/terms" component={() => <LegalPage page="terms" />} />
        <Route path="/returns" component={() => <LegalPage page="returns" />} />
        <Route path="/account/orders/:id" component={OrderDetails} />
        <Route path="/account" component={MyAccount} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <LanguageProvider>
          <CartProvider>
          <WishlistProvider>
          <TooltipProvider>
            <Toaster richColors closeButton position="top-center" />
            <Router />
            <Suspense fallback={null}>
              <CookieConsent />
            </Suspense>
          </TooltipProvider>
          </WishlistProvider>
          </CartProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

