import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Check, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminReviews() {
  const { data: reviews, isLoading, refetch } = trpc.reviews.list.useQuery();

  const approveReview = trpc.reviews.approve.useMutation({
    onSuccess: () => {
      toast.success("تمت الموافقة على التقييم ونشره");
      void refetch();
    },
  });

  const deleteReview = trpc.reviews.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف التقييم");
      void refetch();
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#24211d]">إدارة تقييمات العملاء</h1>
          <p className="text-sm text-muted-foreground mt-1">مراجعة الآراء والتقييمات المكتوبة والموافقة على نشرها في المتجر.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>التقييمات المسجلة ({reviews?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#d5af58]" />
              </div>
            ) : reviews && reviews.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العميل</TableHead>
                    <TableHead>المنتج</TableHead>
                    <TableHead>النجوم</TableHead>
                    <TableHead>التعليق</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="text-left">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-bold">{r.authorName}</TableCell>
                      <TableCell>منتج #{r.productId}</TableCell>
                      <TableCell>
                        <div className="flex text-amber-500">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-current" : "text-gray-200"}`} />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-xs">{r.content}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={r.isApproved ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}>
                          {r.isApproved ? "معتمد ومنشور" : "بانتظار المراجعة"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2" dir="ltr">
                          {!r.isApproved && (
                            <Button size="icon" variant="ghost" title="موافقة ونشر" onClick={() => approveReview.mutate({ id: r.id })}>
                              <Check className="h-4 w-4 text-emerald-600" />
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" title="حذف" onClick={() => deleteReview.mutate({ id: r.id })}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center py-10 text-muted-foreground">لا توجد تقييمات مسجلة.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
