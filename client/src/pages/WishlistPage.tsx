import { trpc } from "@/lib/trpc";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Loader2, Heart, ShoppingCart, Trash2, PackageOpen } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import PublicLayout from "@/components/storefront/PublicLayout";
import { UpdateHead } from "@/components/UpdateHead";
import { getPrimaryProductImage } from "@/lib/productImages";

export default function WishlistPage() {
  const { lang } = useLanguage();
  const { items, toggle, clear } = useWishlist();
  const { addItem } = useCart();

  const ids = items.map((it) => it.productId);
  const { data: products, isLoading } = trpc.products.active.useQuery(undefined, {
    enabled: ids.length > 0,
  });
  const shown = (products ?? []).filter((p) => ids.includes(p.id));

  UpdateHead({
    title: lang === "ar" ? "قائمة المفضلة | Elnour for STEEL" : "Wishlist | Elnour for STEEL",
    description: lang === "ar" ? "منتجاتك المفضلة في Elnour for STEEL." : "Your saved favourites at Elnour for STEEL.",
    path: "/wishlist",
  });

  const moveAllToCart = () => {
    shown.forEach((p) => addItem({ productId: p.id, quantity: 1, unitPrice: Number(p.price || 0) }));
    toast.success(lang === "ar" ? `تم نقل ${shown.length} منتج إلى السلة — اختر المقاس واللون من صفحة المنتج` : `${shown.length} products added to cart — pick size and colour on the product page`);
  };

  return (
    <PublicLayout>
      <div className="container py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">{lang === "ar" ? "قائمة المفضلة" : "Wishlist"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {lang === "ar" ? "المنتجات التي أعجبتك — محفوظة في هذا الجهاز." : "The products you loved — saved on this device."}
            </p>
          </div>
          {shown.length > 1 && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => { clear(); toast.success(lang === "ar" ? "تم إفراغ المفضلة" : "Wishlist cleared"); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-[#ad842f] to-[#c9a24a] text-white font-bold" onClick={moveAllToCart}>
                <ShoppingCart className="h-4 w-4" />
                {lang === "ar" ? "نقل الكل إلى السلة" : "Move all to cart"}
              </Button>
            </div>
          )}
        </div>

        {isLoading && ids.length > 0 ? (
          <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : shown.length === 0 ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
            <Heart className="h-14 w-14 text-[#d9d1c0]" />
            <p className="text-lg font-bold text-muted-foreground">{lang === "ar" ? "قائمتك المفضلة فارغة" : "Your wishlist is empty"}</p>
            <Link href="/products"><Button className="border-2 border-[#ad842f] text-[#8b6821]" variant="outline">{lang === "ar" ? "تصفح المنتجات" : "Browse products"}</Button></Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((p) => {
              const image = getPrimaryProductImage(p.images);
              const title = lang === "ar" ? p.nameAr : p.name;
              return (
                <article key={p.id} className="overflow-hidden rounded-2xl border border-[#e0dacd] bg-white shadow-sm transition-all hover:shadow-lg">
                  <Link href={`/product/${p.id}`} className="relative block aspect-[4/3] overflow-hidden bg-[#eee9df]">
                    {image ? <img src={image} alt={title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[#ad842f]"><PackageOpen className="h-10 w-10" /></div>}
                  </Link>
                  <div className="space-y-3 p-4">
                    <Link href={`/product/${p.id}`} className="block truncate text-lg font-bold text-[#24211d] hover:text-[#ad842f]">{title}</Link>
                    <div className="flex items-end justify-between gap-3">
                      <p className="text-base font-black text-[#24211d]">{Number(p.price || 0).toLocaleString(lang === "ar" ? "ar-EG" : "en-US")} <span className="text-xs font-medium">{lang === "ar" ? "ج.م" : "EGP"}</span></p>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          aria-label={lang === "ar" ? "أضف إلى السلة" : "Add to cart"}
                          onClick={() => {
                            addItem({ productId: p.id, quantity: 1, unitPrice: Number(p.price || 0) });
                            toast.success(lang === "ar" ? `تمت إضافة «${title}» إلى السلة — اختر المقاس واللون من صفحة المنتج` : `“${title}” added — pick size and colour on the product page`);
                          }}
                          className="inline-flex h-8 items-center rounded-md border border-[#ad842f] px-2 text-[#8b6821] transition-colors hover:bg-[#fdf9ee]"
                        >
                          <ShoppingCart className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={lang === "ar" ? "إزالة من المفضلة" : "Remove from wishlist"}
                          onClick={() => toggle(p.id)}
                          className="inline-flex h-8 items-center rounded-md border border-red-200 px-2 text-red-500 transition-colors hover:bg-red-50"
                        >
                          <Heart className="h-4 w-4 fill-current" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
