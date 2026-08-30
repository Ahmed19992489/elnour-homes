import type { Request, Response } from "express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import type { SsrPrefetch } from "../../client/src/ssr/prefetch";

// Allowlist of public procedures reachable from SSR prefetch — mutations and
// admin procedures stay out.
export async function buildSsrPrefetch(req: Request, res: Response): Promise<SsrPrefetch> {
  // ctx.user is preserved — so procedures exposed here should return
  // viewer-independent data for public routes.
  const ctx = await createContext({ req, res } as any);
  const caller = appRouter.createCaller(ctx);
  return {
    siteContentList: () => caller.siteContent.list(),
    categoriesActive: () => caller.categories.active(),
    productsActive: (category) => caller.products.active(category ? { category } : undefined),
    productsById: (id) => caller.products.byId({ id }),
    galleryList: () => caller.gallery.list(),
  };
}
