import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { buildSsrPrefetch } from "./ssrCaller";
import type { HeadMeta } from "../../client/src/ssr/prefetch";

// SECURITY: head values may originate from the database (CMS titles, excerpts).
// Interpolating them into raw HTML bypasses React's auto-escaping, so a stored
// title like `</title><script>…</script>` becomes stored XSS executing on every
// visit. escapeHtml() EVERY value that goes into headTags — no exceptions.
const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Canonical origin for og:url / canonical. Configure per deployment (env var);
// never derive it from req.host (client-spoofable).
const CANONICAL_ORIGIN = process.env.CANONICAL_ORIGIN ?? "";
// SITE_NAME feeds og:site_name and the prod-fallback default title. Must be set
// in the DEPLOYMENT environment — a missing value triggers a startup warning.
const SITE_NAME = process.env.SITE_NAME ?? "";
if (process.env.NODE_ENV === "production" && (!CANONICAL_ORIGIN || !SITE_NAME)) {
  if (!CANONICAL_ORIGIN)
    console.warn(
      "[SSR] CANONICAL_ORIGIN is not set — canonical/og:url/og:image tags will be omitted site-wide"
    );
  if (!SITE_NAME)
    console.warn(
      "[SSR] SITE_NAME is not set — og:site_name will be omitted and the prod-fallback title degrades to the hardcoded placeholder"
    );
}
const OG_LOCALE = process.env.OG_LOCALE ?? "ar_EG";

// Normalize head text that may come from UGC/CMS records. TITLES get
// whitespace-collapse + truncation ONLY (no md-strip — it would corrupt
// legitimate titles like "async/await in C#").
const clampText = (s: string, max: number) => {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.lastIndexOf(" ", max);
  if (cut > max * 0.6) return t.slice(0, cut) + "…";
  // Hard cut on a spaceless run: slice by CODE POINT, not UTF-16 code unit,
  // or a cut landing mid-surrogate leaves a lone "" at the tail of the tag.
  return Array.from(t).slice(0, max).join("") + "…";
};
// Description path: cheap markdown-token strip on top (kills #/*/_/`~ noise).
// Never use on titles.
const metaText = (s: string, max: number) => clampText(s.replace(/[#*_`~]+/g, ""), max);

function buildHeadTags(head: HeadMeta, siteName: string): string {
  const title = escapeHtml(clampText(head.title, 70) || siteName);
  const desc = escapeHtml(metaText(head.description, 200));
  const url =
    head.canonicalPath && CANONICAL_ORIGIN
      ? escapeHtml(CANONICAL_ORIGIN + head.canonicalPath)
      : "";
  // Template storage URLs are RELATIVE (/manus-storage/...) by design, but the
  // OG protocol requires ABSOLUTE URLs — scrapers ignore relative og:image.
  const img = head.ogImage?.startsWith("//")
    ? "https:" + head.ogImage
    : head.ogImage?.startsWith("/")
      ? CANONICAL_ORIGIN
        ? CANONICAL_ORIGIN + head.ogImage
        : undefined
      : head.ogImage;
  const tags = [
    `<title>${title}</title>`,
    `<meta name="description" content="${desc}" />`,
    `<meta property="og:type" content="${head.ogType ?? "website"}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${desc}" />`,
    `<meta property="og:locale" content="${escapeHtml(head.locale ?? OG_LOCALE)}" />`,
    `<meta name="twitter:card" content="${img ? "summary_large_image" : "summary"}" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${desc}" />`,
  ];
  if (siteName)
    tags.push(
      `<meta property="og:site_name" content="${escapeHtml(siteName)}" />`
    );
  if (img) {
    tags.push(`<meta property="og:image" content="${escapeHtml(img)}" />`);
    tags.push(`<meta name="twitter:image" content="${escapeHtml(img)}" />`);
    if (head.ogImageWidth)
      tags.push(
        `<meta property="og:image:width" content="${head.ogImageWidth}" />`
      );
    if (head.ogImageHeight)
      tags.push(
        `<meta property="og:image:height" content="${head.ogImageHeight}" />`
      );
    if (head.ogImageAlt)
      tags.push(
        `<meta property="og:image:alt" content="${escapeHtml(head.ogImageAlt)}" />`
      );
  }
  if (head.ogType === "article") {
    if (head.publishedTime)
      tags.push(
        `<meta property="article:published_time" content="${escapeHtml(head.publishedTime)}" />`
      );
    if (head.modifiedTime)
      tags.push(
        `<meta property="article:modified_time" content="${escapeHtml(head.modifiedTime)}" />`
      );
  }
  if (url) {
    tags.push(`<meta property="og:url" content="${url}" />`);
    tags.push(`<link rel="canonical" href="${url}" />`);
  }
  if (head.notFound || head.noindex) {
    tags.push(`<meta name="robots" content="noindex, follow" />`);
  }
  if (head.jsonLd) {
    // JSON-LD must never contain unescaped user text — stringify and strip
    // any embedded </script> boundary to keep SSR output valid.
    const safe = JSON.stringify(head.jsonLd)
      .replace(/</g, "\\u003c")
      .replace(/<\\\/script>/gi, "\\u003c/script");
    tags.push(`<script type="application/ld+json">${safe}</script>`);
  }
  return tags.join("\n");
}

function composeHtml(
  template: string,
  appHtml: string,
  head: HeadMeta,
  dehydratedState: unknown
) {
  const headTags = buildHeadTags(head, SITE_NAME);
  // escape for safe interpolation inside the script element
  const esc = (s: string) => s.replace(/</g, "\\u003c");
  const stateScript = `<script>window.__RQ_STATE__ = ${esc(JSON.stringify(dehydratedState))}</script>`;
  // IMPORTANT: replacement values MUST be functions — string-form .replace
  // interprets $$, $&, $`, $' inside content as special patterns ("$$50" →
  // "$50", "$`" splices the whole page into itself). ORDER: inject the state
  // script BEFORE appHtml — app content can legally contain "</body>"
  // (dangerouslySetInnerHTML / JSON-LD), and replacing it afterwards would
  // relocate the state script into the middle of #root.
  return template
    .replace("</body>", () => `${stateScript}</body>`)
    .replace("<!--app-head-->", () => headTags)
    .replace("<!--app-html-->", () => appHtml);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  // DEV SSR catch-all
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      // Retarget the template's nanoid cache-buster to the new entry
      template = template.replace(
        `src="/src/entry-client.tsx"`,
        `src="/src/entry-client.tsx?v=${nanoid()}"`
      );
      // transformIndexHtml is NOT optional: %VITE_*% env replacement + plugins
      // (vite-plugin-manus-runtime, debug collector) break without it.
      template = await vite.transformIndexHtml(url, template);
      // Dev-only blocking CSS so the SSR'd first paint is styled
      template = template.replace(
        "</head>",
        `<link rel="stylesheet" href="/src/index.css?direct" data-ssr-dev-css></head>`
      );
      const { render } = await vite.ssrLoadModule("/src/entry-server.tsx");
      const prefetch = await buildSsrPrefetch(req, res);
      const { html, dehydratedState, head } = await render(url, prefetch);
      if (head.redirect) return res.redirect(301, head.redirect);
      res
        .status(head.notFound ? 404 : 200)
        .set("Cache-Control", "no-cache")
        .type("html")
        .end(composeHtml(template, html, head, dehydratedState));
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      console.error("[SSR] dev render failed:", e);
      next(e); // dev: surface the error (Vite overlay)
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  // Prod: a direct request to /index.html would otherwise hit express.static
  // and leak the raw template (unreplaced placeholders, HTTP 200). Redirect
  // into the SSR handler BEFORE mounting static — and 301-normalize trailing
  // slashes while we're here.
  app.use((req, res, next) => {
    if (req.path === "/index.html") return res.redirect(301, "/");
    if (req.path !== "/" && /\/+$/.test(req.path)) {
      const query = req.originalUrl.slice(req.path.length);
      // SECURITY: collapse leading slashes too — "GET //evil.com/" must
      // redirect to the LOCAL path "/evil.com", never protocol-relative.
      const target = (req.path.replace(/\/+$/, "") || "/").replace(
        /^\/\/+/,
        "/"
      );
      return res.redirect(301, target + query);
    }
    next();
  });
  // redirect:false is REQUIRED: serve-static's default directory 301
  // (/assets -> /assets/) would ping-pong with the trailing-slash 301 into an
  // infinite redirect loop (dist/public/assets/ always exists — Vite's
  // default assetsDir).
  app.use(express.static(distPath, { index: false, redirect: false }));
  // SSR owns HTML:
  const serverEntryPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(
          import.meta.dirname,
          "../..",
          "dist",
          "server-ssr",
          "entry-server.js"
        )
      : path.resolve(import.meta.dirname, "server-ssr", "entry-server.js");
  const prodTemplatePath = path.resolve(
    distPath,
    "index.html"
  ); // dist/public — the BUILT template
  app.use("*", async (req, res) => {
    try {
      const template = await fs.promises.readFile(prodTemplatePath, "utf-8");
      // This import must stay DYNAMIC with a runtime-variable path: the SSR
      // bundle only exists after build, and esbuild leaves variable-path
      // imports unbundled.
      const { render } = await import(serverEntryPath);
      const prefetch = await buildSsrPrefetch(req, res);
      const { html, dehydratedState, head } = await render(
        req.originalUrl,
        prefetch
      );
      if (head.redirect) return res.redirect(301, head.redirect);
      res
        .status(head.notFound ? 404 : 200)
        .set("Cache-Control", "no-cache")
        .type("html")
        .end(composeHtml(template, html, head, dehydratedState));
    } catch (e) {
      // ALERT on this log line in monitoring: failure here is invisible to
      // human QA (users get a working SPA) while crawlers get the degraded
      // fallback. The SPA still works because the shell ships full HTML and
      // the client hydrates normally.
      console.error("[SSR] prod render failed — falling back to SPA shell:", e);
      res
        .status(200)
        .set("Cache-Control", "no-cache")
        .type("html")
        .sendFile(prodTemplatePath);
    }
  });
}
