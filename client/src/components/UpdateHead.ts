import { useEffect } from "react";

const BASE_URL = "https://elnourhomes.com";

export interface UpdateHeadProps {
  title?: string;
  description?: string;
  image?: string;
  path?: string;
  jsonLd?: object | null;
}

/**
 * Updates document title, meta description, canonical URL, og tags and
 * (optionally) JSON-LD for per-page SEO. Call at the top of each page.
 */
export function UpdateHead({
  title = "Elnour Homes | ديكورات وأعمال الاستيل الفاخرة",
  description = "متجر Elnour Homes المتخصص في تصميم وتصنيع أرقى ديكورات الاستيل، ترابيزات، مرايات، قواطع، وتجهيزات المنازل العصرية بجودة فائقة وضمان حقيقي.",
  image,
  path = "",
  jsonLd,
}: UpdateHeadProps) {
  useEffect(() => {
    if (title) {
      document.title = title;
    }

    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement("meta");
        metaDesc.setAttribute("name", "description");
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute("content", description);
    }

    if (path !== undefined) {
      let canon = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!canon) {
        canon = document.createElement("link");
        canon.rel = "canonical";
        document.head.appendChild(canon);
      }
      canon.href = `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
    }

    const currentUrl = `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
    const ogPairs: [string, string][] = [
      ["og:title", title],
      ["og:description", description],
      ["og:url", currentUrl],
    ];
    if (image) {
      ogPairs.push(["og:image", image]);
    }
    ogPairs.forEach(([prop, content]) => {
      let el = document.querySelector<HTMLMetaElement>(`meta[property="${prop}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("property", prop);
        document.head.appendChild(el);
      }
      el.content = content;
    });

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
  }, [title, description, path, image, jsonLd]);
}
