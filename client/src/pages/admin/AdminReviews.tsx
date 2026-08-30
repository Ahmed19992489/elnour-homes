import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StarRatingDisplay } from "@/components/storefront/StarRating";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, MessageSquare, Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
export default function AdminReviews() {
  const { lang } = useLanguage();
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.reviews.adminList.useQuery();

  const deleteReview = trpc.reviews.adminDelete.useMutation({
    onSuccess: () => {
      toast.success(lang === "ar" ? "تم حذف التقييم" : "Review deleted");
      void utils.reviews.invalidate();
    },
    onError: (error) => toast.error(lang === "ar" ? "فشل الحذف: " + error.message : "Delete failed: " + error.message),
  });

  const reviews = data?.reviews ?? [];
  const usersById = new Map((data?.users ?? []).map((u: any) => [u.id, u]));
  const productsById = new Map((data?.products ?? []).map((p: any) => [p.id, p]));

  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);

  const filtered = reviews;

  return (
    <DashboardLayout>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Star className="h-6 w-6 text-[#ad842f]" />
          <h1 className="text-xl font-bold">{t("تقييمات العملاء", "Customer Reviews")}</h1>
          <Badge variant="outline">{reviews.length}</Badge>
        </div>

      </div>

      <Card className="mt-6">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#ad842f]" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              <MessageSquare className="mx-auto h-8 w-8 opacity-40" />
              <p className="mt-3">{t("لا توجد تقييمات", "No reviews found")}</p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((review: any) => {
                const user = usersById.get(review.userId);
                const product = productsById.get(review.productId);
                return (
                  <div key={review.id} className="flex flex-wrap items-center gap-4 p-4">
                    <Avatar className="h-10 w-10 bg-[#e6e0d2]">
                      <AvatarFallback className="text-xs font-bold text-[#8b6821]">
                        {(review.userName || user?.name || "?").trim().charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{review.userName || user?.name || t("عميل", "Customer")}</span>
                        {user?.email ? <span className="text-xs text-muted-foreground">{user.email}</span> : null}
                        <StarRatingDisplay value={review.rating} />
                      </div>
                      {product ? (
                        <Link href={`/product/${product.id}`} className="mt-0.5 inline-block truncate text-xs text-[#ad842f] hover:underline" dir="ltr">
                          {lang === "ar" ? product.nameAr : product.name}
                        </Link>
                      ) : null}
                      {review.comment ? <p className="mt-1 max-w-xl text-sm text-muted-foreground">{review.comment}</p> : null}
                      <p className="mt-0.5 text-xs text-muted-foreground" dir="ltr">
                        {new Date(review.createdAt as string).toLocaleString(lang === "ar" ? "ar-EG" : "en-US")}
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10">
                          <Trash2 className="h-3.5 w-3.5" />
                          {t("حذف", "Delete")}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t("حذف التقييم؟", "Delete this review?")}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("سيتم حذف التقييم نهائيًا ولن يظهر للعملاء.", "The review will be permanently removed and no longer visible to customers.")}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t("إلغاء", "Cancel")}</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-white hover:bg-destructive/90"
                            onClick={() => deleteReview.mutate({ id: review.id })}
                          >
                            {deleteReview.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("حذف", "Delete")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
