import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, BellRing, CheckCircle, Trash2, Mail, Phone, Package } from "lucide-react";
import { toast } from "sonner";

export default function AdminStockAlerts() {
  const utils = trpc.useUtils();
  const { data: alerts, isLoading } = trpc.restockAlerts.list.useQuery();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const markSent = trpc.restockAlerts.markSent.useMutation({
    onSuccess: () => {
      utils.restockAlerts.list.invalidate();
      toast.success("تم تعليم الإشعار كمُرسل");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteAlert = trpc.restockAlerts.delete.useMutation({
    onSuccess: () => {
      utils.restockAlerts.list.invalidate();
      setDeleteId(null);
      toast.success("تم حذف الإشعار");
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRing className="h-5 w-5 text-[#ad842f]" />
          إشعارات توفر المنتجات
        </CardTitle>
        <CardDescription>
          العملاء الذين تركوا بياناتهم لمتابعة توفر منتج معين. عند إعادة توفر المنتج في المخزون، تواصل معهم وأشر إلى إشعارهم هنا.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !alerts || alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
            <BellRing className="h-8 w-8 opacity-40" />
            <p>لا توجد إشعارات توفر حتى الآن</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المنتج</TableHead>
                  <TableHead>المقاس المطلوب</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>الهاتف</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead className="text-end">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => {
                  const isSent = Boolean(alert.sentAt);
                  return (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{alert.productName || `منتج #${alert.productId}`}</p>
                          <p className="text-xs text-muted-foreground">رقم المنتج: {alert.productId}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{alert.size}</TableCell>
                    <TableCell>
                      {alert.email ? (
                        <span className="inline-flex items-center gap-1.5 text-sm" dir="ltr">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          {alert.email}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {alert.phone ? (
                        <span className="inline-flex items-center gap-1.5 text-sm" dir="ltr">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          {alert.phone}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isSent ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="h-3 w-3 ms-1" /> تم الإشعار
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          بانتظار الإشعار
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground" dir="ltr">
                      {new Date(alert.createdAt).toLocaleDateString("ar-EG")}
                    </TableCell>
                    <TableCell className="text-end">
                      <div className="flex justify-end gap-1.5">
                        {!isSent && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-green-700 border-green-200 hover:bg-green-50"
                            onClick={() => markSent.mutate({ id: alert.id })}
                            disabled={markSent.isPending}
                          >
                            <CheckCircle className="h-3.5 w-3.5 ms-1" />
                            تم الإشعار
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-destructive hover:bg-red-50"
                          onClick={() => setDeleteId(alert.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>حذف إشعار التوفر</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من حذف هذا الإشعار؟ لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deleteId && deleteAlert.mutate({ id: deleteId })}
              >
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
