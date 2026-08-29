import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BellRing, Check, Trash2, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export default function AdminStockAlerts() {
  const { data: alerts, isLoading, refetch } = trpc.restockAlerts.list.useQuery();

  const markSent = trpc.restockAlerts.markSent.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث حالة الإشعار");
      void refetch();
    },
  });

  const deleteAlert = trpc.restockAlerts.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الطلب");
      void refetch();
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#24211d]">طلبات إشعارات توفر المنتجات</h1>
          <p className="text-sm text-muted-foreground mt-1">العملاء الذين سجلوا رغبتهم في إشعارهم عند توفر قطع أو مقاسات معينة.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>قائمة الطلبات المسجلة ({alerts?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#d5af58]" />
              </div>
            ) : alerts && alerts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>معرف المنتج</TableHead>
                    <TableHead>رقم الهاتف</TableHead>
                    <TableHead>البريد الإلكتروني</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="text-left">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-bold">منتج #{a.productId}</TableCell>
                      <TableCell dir="ltr">{a.phone || "—"}</TableCell>
                      <TableCell dir="ltr">{a.email || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(a.createdAt)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={a.isSent ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}>
                          {a.isSent ? "تم الإشعار" : "قيد الانتظار"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2" dir="ltr">
                          {!a.isSent && (
                            <Button size="icon" variant="ghost" title="تحديد كتم الإشعار" onClick={() => markSent.mutate({ id: a.id })}>
                              <Check className="h-4 w-4 text-emerald-600" />
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" title="حذف" onClick={() => deleteAlert.mutate({ id: a.id })}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center py-10 text-muted-foreground">لا توجد طلبات إشعارات حالياً.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
