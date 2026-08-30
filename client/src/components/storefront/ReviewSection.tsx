import React, { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { StarRatingDisplay, InteractiveRating } from "./StarRating";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, MessageSquareQuote } from "lucide-react";
import { toast } from "sonner";

/**
 * Public review block for a single product: average + list of verified reviews,
 * and a review form visible only to the logged-in customer who bought it.
 */
export default function ReviewSection({ productId, title }: { productId: number; title: string }) {
  const { lang } = useLanguage();
  const utils = trpc.useUtils();
  const { data: forProduct, isLoading } = trpc.reviews.forProduct.useQuery({ productId });
  const { data: accountMe } = trpc.account.me.useQuery(undefined, { refetchOnWindowFocus: false });
  const { data: myEligible } = trpc.reviews.my.useQuery(undefined, {
    enabled: !!accountMe,
    staleTime: 60_000,
  });

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const stats = forProduct?.stats;
  const reviews = forProduct?.reviews ?? [];

  /** True when the signed-in customer has purchased this product and hasn't reviewed it yet. */
  const canReview = useMemo(() => {
    if (!accountMe || !myEligible) return false;
    return myEligible.some((item) => (item as any).product?.id === productId);
  }, [accountMe, myEligible, productId]);

  const alreadyReviewed = useMemo(() => {
    if (!accountMe || !myEligible) return null;
    const item = myEligible.find((item: any) => (item as any).product?.id === productId);
    return item && item.review ? (item as any).review : null;
  }, [accountMe, myEligible, productId]);

  const needsLogin = !accountMe;

  useEffect(() => {
    setComment("");
    setRating(5);
  }, [productId]);

  const createReview = trpc.reviews.create.useMutation({
    onSuccess: () => {
      toast.success(lang === "ar" ? "شكرًا لك! تمت إضافة تقييمك وسيُعرض بعد المراجعة" : "Thank you! Your review was added and will appear shortly");
      setComment("");
      void utils.reviews.invalidate();
      void utils.account.invalidate();
    },
  });

  const submit = async () => {
    setSubmitting(true);
    try {
      await createReview.mutateAsync({
        productId,
        rating,
        comment: comment.trim() || undefined,
      });
    } catch (error: any) {
      const message = error?.message ?? "";
      if (message.includes("لقد قمت بتقييم") || message.includes("reviewed")) {
        toast.info(lang === "ar" ? "لقد قيّمت هذا المنتج من قبل — يظهر تقييمك في القائمة" : "You already reviewed this product");
      } else if (message.includes("لم تقم بشراء")) {
        toast.error(lang === "ar" ? "التقييم متاح للعملاء الذين اشتروا هذا المنتج فقط" : "Only customers who purchased this product can review it");
      } else {
        toast.error(lang === "ar" ? "تعذر حفظ التقييم: " + message : "Could not save review: " + message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-10" aria-label={lang === "ar" ? "تقييمات المنتج" : "Product reviews"}>
      <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-[#24211d]">
        <MessageSquareQuote className="h-5 w-5 text-[#ad842f]" />
        {lang === "ar" ? "تقييمات العملاء" : "Customer Reviews"}
      </h2>

      {isLoading ? (
        <div className="flex items-center justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-[#ad842f]" /></div>
      ) : (
        <>
          {/* Summary */}
          <Card className="mb-4 bg-[#fbfaf7]">
            <CardContent className="flex flex-wrap items-center gap-4 py-4">
              {stats && stats.count > 0 ? (
                <>
                  <div className="text-center">
                    <p className="text-3xl font-black text-[#24211d]" dir="ltr">{stats.average.toFixed(1)}</p>
                    <StarRatingDisplay value={stats.average} />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {lang === "ar" ? `من ${stats.count} تقييم` : `From ${stats.count} reviews`}
                    </p>
                  </div>
                  <div className="hidden h-10 w-px bg-border sm:block" />
                </>
              ) : null}
              <p className="text-sm text-muted-foreground">
                {stats && stats.count > 0
                  ? (lang === "ar" ? "تقييمات من عملاء اشتروا المنتج فعليًا" : "Verified reviews from customers who bought this product")
                  : (lang === "ar"
                      ? "لا توجد تقييمات حتى الآن — كن أول من يقيّم هذا المنتج"
                      : "No reviews yet — be the first to review this product")}
              </p>
            </CardContent>
          </Card>

          {/* Review form for verified buyers */}
          {canReview && !alreadyReviewed ? (
            <Card className="mb-4 border-[#ad842f]/40 bg-[#fdfcf8]">
              <CardContent className="space-y-3 py-4">
                <p className="text-sm font-medium text-[#24211d]">
                  {lang === "ar" ? `شاركنا رأيك في «${title}»` : `Share your thoughts about “${title}”`}
                </p>
                <InteractiveRating
                  value={rating}
                  onChange={setRating}
                  labelAr={lang === "ar" ? "التقييم" : "Rating"}
                />
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder={lang === "ar" ? "اكتب تعليقك (اختياري)" : "Write a comment (optional)"}
                />
                <Button
                  onClick={submit}
                  disabled={submitting}
                  className="gap-2 bg-[#26231e] text-white hover:bg-[#ad842f]"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {lang === "ar" ? "إرسال التقييم" : "Submit Review"}
                </Button>
              </CardContent>
            </Card>
          ) : alreadyReviewed ? (
            <Card className="mb-4 bg-emerald-50">
              <CardContent className="py-4 text-sm text-emerald-800">
                {lang === "ar" ? "✓ شكرًا لك — لقد قيّمت هذا المنتج مسبقًا." : "✓ Thank you — you have already reviewed this product."}
              </CardContent>
            </Card>
          ) : needsLogin ? (
            <Card className="mb-4 bg-muted/60">
              <CardContent className="py-4 text-sm text-muted-foreground">
                {lang === "ar"
                  ? "التقييم متاح للعملاء فقط — سجّل دخولك بعد شراء المنتج لتقييمه."
                  : "Reviews are available to customers only — sign in after purchasing to review."}
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-4 bg-muted/60">
              <CardContent className="py-4 text-sm text-muted-foreground">
                {lang === "ar"
                  ? "التقييم متاح للعملاء الذين اشتروا هذا المنتج من الموقع."
                  : "Reviewing is available to customers who bought this product from the store."}
              </CardContent>
            </Card>
          )}

          {/* Review list */}
          <div className="space-y-3">
            {reviews.map((review: any) => (
              <Card key={review.id} className="bg-white">
                <CardContent className="flex gap-3 py-4">
                  <Avatar className="h-9 w-9 shrink-0 bg-[#e6e0d2]">
                    <AvatarFallback className="text-xs font-bold text-[#8b6821]">
                      {((review.userName as string) || "؟").trim().charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-[#24211d]">{review.userName || (lang === "ar" ? "عميل" : "Customer")}</span>
                      <StarRatingDisplay value={review.rating} />
                      <span className="text-xs text-muted-foreground" dir="ltr">
                        {new Date(review.createdAt as string).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US")}
                      </span>
                      {review.verified ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          {lang === "ar" ? "مشتري موثّق" : "Verified buyer"}
                        </span>
                      ) : null}
                    </div>
                    {review.comment ? <p className="mt-1.5 text-sm leading-relaxed text-[#3b3832]">{review.comment}</p> : null}
                  </div>
                </CardContent>
              </Card>
            ))}
            {!isLoading && reviews.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {lang === "ar" ? "لا توجد تقييمات بعد" : "No reviews yet"}
              </p>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}
