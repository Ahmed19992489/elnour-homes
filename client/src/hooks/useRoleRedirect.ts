import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../_core/hooks/useAuth";

export function useRoleRedirect() {
  const { user, isAuthenticated, loading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (loading) return;

    // If user is trying to access admin pages while logged out
    if (location.startsWith("/admin") && !isAuthenticated) {
      if (location !== "/admin-login") {
        setLocation("/admin-login");
      }
    }
  }, [user, isAuthenticated, loading, location, setLocation]);
}
