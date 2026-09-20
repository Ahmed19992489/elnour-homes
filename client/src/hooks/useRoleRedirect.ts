import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

/**
 * Role-based routing and protection:
 *   - Protects /admin and /admin/* so only authenticated admins can enter.
 *   - Customers and unauthenticated users are never exposed to the admin CRM.
 *   - Normal customers browsing the storefront are never forcibly redirected.
 */
export function useRoleRedirect() {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();
  const wasLoading = useRef(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const justResolved = wasLoading.current && !loading;
    wasLoading.current = loading;

    const isAdminLogin = location === "/admin/login" || location === "/admin-login";
    const isAdminRoute = (location === "/admin" || location.startsWith("/admin/")) && !isAdminLogin;

    // 1. If someone tries to access protected admin CRM pages:
    if (isAdminRoute) {
      if (justResolved && !user) {
        setLocation("/admin/login");
        return;
      }
      if (user && user.role !== "admin") {
        // Customer tried to enter admin CRM → send them to their customer account
        setLocation("/account");
        return;
      }
    }

    // 2. If an authenticated admin visits the admin login screen, skip directly to the CRM:
    if (user && user.role === "admin" && isAdminLogin) {
      setLocation("/admin");
      return;
    }
  }, [loading, user, location, setLocation]);
}
