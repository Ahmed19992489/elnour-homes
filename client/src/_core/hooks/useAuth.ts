import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";
6: type UseAuthOptions = {

redirectOnUnauthenticated?: boolean;
redirectPath?: string;
};
11: export function useAuth(options?: UseAuthOptions) {

// Login is started via startLogin() in the effect below, only when we actually
// navigate — never during render. startLogin() mints a one-time nonce + writes
// the state cookie, so calling it per render would overwrite the cookie and
// desync it from an in-flight login's `state`.
const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};
const utils = trpc.useUtils();
19:   const meQuery = trpc.auth.me.useQuery(undefined, {

retry: false,
refetchOnWindowFocus: false,
});
24:   const logoutMutation = trpc.auth.logout.useMutation({

onSuccess: () => {
utils.auth.me.setData(undefined, null);
},
});
30:   const logout = useCallback(async () => {

try {
await logoutMutation.mutateAsync();
} catch (error: unknown) {
if (
error instanceof TRPCClientError &&
error.data?.code === "UNAUTHORIZED"
) {
return;
}
throw error;
} finally {
// Clear the Preview auto-login token mirrored into sessionStorage, so
// header-based sessions (Safari ITP / WebView) are logged out too. The
// backend cookie is cleared by the logout mutation.
try {
sessionStorage.removeItem("manus-cookie");
} catch {}
utils.auth.me.setData(undefined, null);
await utils.auth.me.invalidate();
}
}, [logoutMutation, utils]);
53:   const state = useMemo(() => {

// SSR guard: renderToString runs useMemo callbacks without a browser
// globals layer — touching localStorage here throws "localStorage is not
// defined" and kills the whole SSR render.
if (typeof window !== "undefined") {
localStorage.setItem(
"manus-runtime-user-info",
JSON.stringify(meQuery.data)
);
}
return {
user: meQuery.data ?? null,
loading: meQuery.isLoading || logoutMutation.isPending,
error: meQuery.error ?? logoutMutation.error ?? null,
isAuthenticated: Boolean(meQuery.data),
};
}, [
meQuery.data,
meQuery.error,
meQuery.isLoading,
logoutMutation.error,
logoutMutation.isPending,
]);
77:   useEffect(() => {

if (!redirectOnUnauthenticated) return;
if (meQuery.isLoading || logoutMutation.isPending) return;
if (state.user) return;
if (typeof window === "undefined") return;
if (redirectPath && window.location.pathname === redirectPath) return;
84:     // Navigate at this moment only. startLogin() mints the nonce + cookie itself.

if (redirectPath) {
window.location.href = redirectPath;
} else {
startLogin();
}
}, [
redirectOnUnauthenticated,
redirectPath,
logoutMutation.isPending,
meQuery.isLoading,
state.user,
]);
98:   return {

...state,
refresh: () => meQuery.refetch(),
logout,
};
}
The above content shows the entire, complete file contents of the requested file.