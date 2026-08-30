import { Toaster } from "@/components/ui/sonner";
import React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useRoleRedirect } from "@/hooks/useRoleRedirect";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { CartProvider } from "./contexts/CartContext";
import { WishlistProvider } from "./contexts/WishlistContext";
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import CatalogPage from "./pages/CatalogPage";
import CategoryPage from "./pages/CategoryPage";
import ContentPage from "./pages/ContentPage";
import WorkPage from "./pages/WorkPage";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminGallery from "./pages/admin/AdminGallery";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminContent from "./pages/admin/AdminContent";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminMedia from "./pages/admin/AdminMedia";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminReports from "./pages/admin/AdminReports";
import AdminStockAlerts from "./pages/admin/AdminStockAlerts";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminAdmins from "./pages/admin/AdminAdmins";
import AdminLogin from "./pages/AdminLogin";
import MyAccount from "./pages/MyAccount";
import OrderDetails from "./pages/OrderDetails";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OffersPage from "./pages/OffersPage";
import WishlistPage from "./pages/WishlistPage";
import ContactPage from "./pages/ContactPage";
import LegalPage from "./pages/LegalPages";

function Router() {
  useRoleRedirect();
  return (
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
          </TooltipProvider>
          </WishlistProvider>
          </CartProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
