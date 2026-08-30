import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

/**
 * After sign-in completes (OAuth callback lands back on the site), send each
 * role to the right place automatically:
 *   - admin  → /admin  (only when not already on an allowed public flow)
 *   - customer (or any other role) → /account
 *
 * Admins may freely browse public storefront pages (home, products, cart,
 * checkout, work, about, story) without being redirected to the dashboard.
 *
 * Only redirects when the user is currently on the *wrong* route for their
 * role, so navigation is never interrupted mid-session.
 */

// Public storefront flows admins may browse without being redirected to /admin.
const ADMIN_PUBLIC_FLOWS = [
  "/",
  "/products",
  "/catalog",
  "/work",
  "/about",
  "/story",
  "/cart",
  "/checkout",
  "/admin-login",
  "/offers",
  "/wishlist",
  "/contact",
  "/privacy",
  "/terms",
  "/returns",
];

function isAdminAllowedPath(path: string): boolean {
  if (ADMIN_PUBLIC_FLOWS.includes(path)) return true;
  if (
    path === "/catalog" ||
    path.startsWith("/products/") ||
    path.startsWith("/product/") ||
    path.startsWith("/work") ||
    path === "/account" ||
    path.startsWith("/account")
  )
    return true;
  return false;
}

export function useRoleRedirect() {
  const { user, loading } = useAuth();
  const [location] = useLocation();
  const [, setLocation] = useLocation();
  const wasLoading = useRef(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detect the moment authentication resolves (loading → done).
    const justResolved = wasLoading.current && !loading;
    wasLoading.current = loading;

    if (justResolved && !user) {
      // Auth resolved to "no user" on a protected page → send to home, but
      // keep phone-admin login page accessible (it has its own auth hook).
      if (location === "/account" || (location.startsWith("/admin") && location !== "/admin-login")) {
        setLocation("/");
      }
      return;
    }
    if (loading || !user) return;

    const isAdmin = user.role === "admin";

    if (isAdmin) {
      // Allow admin to browse public storefront pages (cart / checkout are
      // public flows); only redirect when on a route that is neither an admin
      // route nor an allowed public flow.
      const isOnAdminPath =
        location === "/admin" ||
        location.startsWith("/admin/") ||
        location === "/admin/orders" ||
        location === "/admin/products" ||
        location === "/admin/categories" ||
        location === "/admin/gallery" ||
        location === "/admin/content" ||
        location === "/admin/coupons" ||
        location === "/admin/media" ||
        location === "/admin/settings";
      if (!isOnAdminPath && !isAdminAllowedPath(location)) {
        setLocation("/admin");
        return;
      }
      // Admin on an allowed public flow: do not redirect at all.
      return;
    }

    // Customer rules: never expose the admin dashboard.
    if (location === "/admin" || location.startsWith("/admin/")) {
      setLocation("/account");
      return;
    }
    if (justResolved && !location.startsWith("/account")) {
      setLocation("/account");
      return;
    }
  }, [loading, user, location, setLocation]);
}
