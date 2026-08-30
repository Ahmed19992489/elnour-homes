import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { cartTotals } from "@/lib/cart";
import { trpc } from "@/lib/trpc";
function formatPrice(price: number) {
  return price.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function priceDisplay(price: number, lang: string) {
  return `${formatPrice(price)} ${lang === "ar" ? "ج.م" : "EGP"}`;
}
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Link } from "wouter";
import PublicLayout from "@/components/storefront/PublicLayout";
import { useEffect, useMemo, useState } from "react";

type ProductSummary = { id: number; name: string; nameAr: string; imageUrl?: string | null; isActive?: string | null } | undefined;

function CartLine({
  item,
  product,
}: {
  item: { productId: number; selectedSize?: string; selectedColor?: string; quantity: number; unitPrice: number };
  product: ProductSummary;
}) {
  const { lang } = useLanguage();
  const { removeItem, setQuantity } = useCart();
  const variant = useMemo(
    () => [item.selectedSize, item.selectedColor].filter(Boolean).join(" • "),
    [item],
  );

  if (!product) {
    return (
      <div className="flex items-center gap-4 border-b border-border/60 py-4">
        <div className="h-20 w-20 shrink-0 rounded-md bg-muted" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 border-b border-border/60 py-4">
      <Link href={`/product/${product.id}`} className="block h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
        {product.imageUrl && (
          <img
            src={typeof product.imageUrl === "string" ? product.imageUrl : undefined}
            alt={lang === "ar" ? product.nameAr : product.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          href={`/product/${product.id}`}
          className="block truncate font-medium text-foreground hover:underline"
        >
          {lang === "ar" ? product.nameAr : product.name}
        </Link>
        {variant && (
          <p dir="auto" className="mt-1 text-sm text-muted-foreground">
            {variant}
          </p>
        )}
        <p className="mt-1 font-semibold">
          {priceDisplay(item.unitPrice * item.quantity, lang)}
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            ({priceDisplay(item.unitPrice, lang)} × {item.quantity})
          </span>
        </p>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={item.quantity <= 1}
          onClick={() => setQuantity(item, item.quantity - 1)}
          aria-label="decrease quantity"
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={item.quantity >= 99}
          onClick={() => setQuantity(item, item.quantity + 1)}
          aria-label="increase quantity"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive hover:bg-destructive/10"
        onClick={() => removeItem(item)}
        aria-label="remove item"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function CartPage() {
  const { lang, t } = useLanguage();
  const { items, refresh } = useCart();
  const [hydrated, setHydrated] = useState(false);

  const productIds = useMemo(
    () => Array.from(new Set(items.map((i) => i.productId))),
    [items],
  );

  const { data: products } = trpc.products.active.useQuery(undefined, {
    enabled: hydrated && productIds.length > 0,
  });

  useEffect(() => {
    setHydrated(true);
  }, []);

  const { subtotal, itemCount } = cartTotals(items);

  const productById = useMemo(() => {
    const map = new Map<number, NonNullable<typeof products>[number]>();
    (products ?? []).forEach((p) => map.set(p.id, p));
    return map;
  }, [products]);

  const unavailable = useMemo(
    () => items.filter((i) => !productById.get(i.productId) || productById.get(i.productId)?.isActive !== "yes"),
    [items, productById],
  );

  if (!hydrated || items.length === 0) {
    return (
      <PublicLayout>
        <div className="container py-12 text-center">
          <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">
            {lang === "ar" ? "سلتك فارغة" : "Your cart is empty"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {lang === "ar"
              ? "لم تضف أي منتجات إلى السلة بعد. تصفح الكتالوج لاختيار ما يناسبك."
              : "You haven't added any products yet. Browse the catalog to find what you love."}
          </p>
          <Button asChild className="mt-6">
            <Link href="/products">{lang === "ar" ? "تصفح المنتجات" : "Browse products"}</Link>
          </Button>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="container max-w-3xl py-10">
        <h1 className="text-2xl font-bold">
          {lang === "ar" ? "سلة المشتريات" : "Shopping Cart"}
          <Badge variant="secondary" className="mr-2 rtl:ml-2">
            {itemCount}
          </Badge>
        </h1>

        {unavailable.length > 0 && (
          <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            {lang === "ar"
              ? "بعض المنتجات في سلتك لم تعد متاحة (نفدت أو أصبحت غير نشطة) ولن تُدرج في الطلب."
              : "Some items in your cart are no longer available and will not be included in the order."}
            {products && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 p-0 text-amber-800 underline"
                onClick={refresh}
              >
                {lang === "ar" ? "تحديث" : "Refresh"}
              </Button>
            )}
          </div>
        )}

        <div className="mt-6">
          {items.map((item) => (
            <CartLine key={`${item.productId}|${item.selectedSize ?? ""}|${item.selectedColor ?? ""}`} item={item} product={productById.get(item.productId)} />
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-muted/50 p-4">
        <p className="text-lg font-bold">
          {lang === "ar" ? "الإجمالي" : "Subtotal"}: {priceDisplay(subtotal, lang)}
        </p>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/products">{lang === "ar" ? "متابعة التسوق" : "Continue shopping"}</Link>
            </Button>
            <Button asChild>
              <Link href="/checkout">{lang === "ar" ? "إتمام الطلب" : "Checkout"}</Link>
            </Button>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
