import { useEffect } from "react";

const BASE_URL = "https://elnoursteel-eexiztdb.manus.space";

interface UpdateHeadProps {
  title: string;
  description: string;
  path: string;
  /** JSON-LD product schema applied on product detail pages */
  jsonLd?: object | null;
}

/**
 * Updates document title, meta description, canonical URL, og tags and
 * (optionally) JSON-LD for per-page SEO. Call at the top of each page.
 */
export function UpdateHead({ title, description, path, jsonLd }: UpdateHeadProps) {
  useEffect(() => {
    document.title = title;

    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", description);

    let canon = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canon) {
      canon = document.createElement("link");
      canon.rel = "canonical";
      document.head.appendChild(canon);
    }
    canon.href = `${BASE_URL}${path}`;

    const ogPairs: [string, string][] = [
      ["og:title", title],
      ["og:description", description],
      ["og:url", `${BASE_URL}${path}`],
    ];
    ogPairs.forEach(([prop, content]) => {
      let el = document.querySelector<HTMLMetaElement>(`meta[property="${prop}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("property", prop);
        document.head.appendChild(el);
      }
      el.content = content;
    });

    // Clean up previous page-level JSON-LD (keep the site-wide HomeGoodsStore one).
    // Also drop the SSR-injected product JSON-LD (no data attribute) — the client
    // build (below) supersedes it and may include reviews; keep the first match
    // only so we never emit duplicate Product blocks.
    const pageLd = Array.from(document.querySelectorAll<HTMLScriptElement>('head > script[type="application/ld+json"]'));
    let kept = false;
    pageLd.forEach((s) => {
      if (s.hasAttribute("data-page-jsonld")) { s.remove(); return; }
      try {
        const d = JSON.parse(s.textContent || "");
        const types = Array.isArray(d?.["@type"]) ? d["@type"] : [d?.["@type"]];
        if (types.includes("Product")) {
          if (kept) s.remove();
          else kept = true;
        }
      } catch { /* leave non-JSON scripts alone */ }
    });
    if (jsonLd) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-page-jsonld", "1");
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [title, description, path, jsonLd]);

  return null;
}
