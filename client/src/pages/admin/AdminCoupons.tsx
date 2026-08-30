import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Loader2, Plus, Pencil, Trash2, Pause, Play, Ticket, Copy, CheckCircle } from "lucide-react";
import { toast } from "sonner";

type CouponForm = {
  code: string;
  description: string;
  discountType: "percent" | "fixed";
  discountValue: string;
  minOrderValue: string;
  maxUsage: string;
  startsAt: string;
  expiresAt: string;
};

const emptyForm: CouponForm = {
  code: "",
  description: "",
  discountType: "percent",
  discountValue: "",
  minOrderValue: "0",
  maxUsage: "",
  startsAt: "",
  expiresAt: "",
};

export default function AdminCoupons() {
  const utils = trpc.useUtils();
  const { data: coupons, isLoading } = trpc.coupons.list.useQuery();
  const createMutation = trpc.coupons.create.useMutation({
    onSuccess: () => {
      utils.coupons.list.invalidate();
      toast.success("تم إنشاء الكوبون بنجاح");
      setDialogOpen(false);
      setForm(emptyForm);
      setEditingId(null);
    },
    onError: (error) => toast.error("فشل الإنشاء: " + error.message),
  });
  const updateMutation = trpc.coupons.update.useMutation({
    onSuccess: () => {
      utils.coupons.list.invalidate();
      toast.success("تم حفظ التعديلات");
      setDialogOpen(false);
      setForm(emptyForm);
      setEditingId(null);
    },
    onError: (error) => toast.error("فشل الحفظ: " + error.message),
  });
  const toggleMutation = trpc.coupons.toggle.useMutation({
    onSuccess: () => utils.coupons.list.invalidate(),
    onError: (error) => toast.error("فشل التبديل: " + error.message),
  });
  const deleteMutation = trpc.coupons.delete.useMutation({
    onSuccess: () => {
      utils.coupons.list.invalidate();
      toast.success("تم حذف الكوبون");
      setDeleteId(null);
    },
    onError: (error) => toast.error("فشل الحذف: " + error.message),
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (coupon: NonNullable<typeof coupons>[number]) => {
    setForm({
      code: coupon.code,
      description: coupon.description ?? "",
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      minOrderValue: String(coupon.minOrderValue ?? "0"),
      maxUsage: coupon.maxUsage !== null ? String(coupon.maxUsage) : "",
      startsAt: coupon.startsAt ? new Date(coupon.startsAt).toISOString().slice(0, 16) : "",
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 16) : "",
    });
    setEditingId(coupon.id);
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(form.discountValue);
    const min = parseFloat(form.minOrderValue) || 0;
    const max = form.maxUsage ? parseInt(form.maxUsage, 10) : undefined;
    if (isNaN(value) || value <= 0) {
      toast.error("أدخل قيمة خصم صحيحة أكبر من صفر");
      return;
    }
    if (form.discountType === "percent" && value > 100) {
      toast.error("الخصم المئوي لا يمكن أن يتجاوز 100%");
      return;
    }
    const data = {
      code: form.code,
      description: form.description || undefined,
      discountType: form.discountType,
      discountValue: value,
      minOrderValue: min,
      maxUsage: max,
      startsAt: form.startsAt ? new Date(form.startsAt) : undefined,
      expiresAt: form.expiresAt ? new Date(form.expiresAt) : undefined,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...data });
    } else {
      createMutation.mutate(data as any);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      toast.success("تم نسخ رمز الكوبون");
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Ticket className="h-6 w-6 text-primary" />
            أكواد الخصم (الكوبونات)
          </h1>
          <p className="text-muted-foreground mt-1">
            أنشئ أكواد خصم بتاريخ بداية ونهاية، وأوقفها في أي وقت أو أعد إصدارها.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              كوبون جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? "تعديل الكوبون" : "كوبون جديد"}</DialogTitle>
              <DialogDescription>
                {editingId ? "عدّل بيانات الكوبون." : "أنشئ كوبوناً جديداً: نسبة مئوية أو مبلغ ثابت."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>رمز الكوبون</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                  placeholder="مثال: EID2026"
                  dir="ltr"
                  maxLength={50}
                  required
                />
                <p className="text-xs text-muted-foreground">حروف إنجليزية وأرقام وشرطة فقط</p>
              </div>
              <div className="space-y-2">
                <Label>وصف (اختياري)</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="مثال: خصم العيد"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>نوع الخصم</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={form.discountType === "percent" ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => setForm(p => ({ ...p, discountType: "percent" }))}
                    >
                      نسبة مئوية %
                    </Button>
                    <Button
                      type="button"
                      variant={form.discountType === "fixed" ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => setForm(p => ({ ...p, discountType: "fixed" }))}
                    >
                      مبلغ ثابت ج.م
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{form.discountType === "percent" ? "نسبة الخصم (%)" : "قيمة الخصم (ج.م)"}</Label>
                  <Input
                    type="number"
                    min={0}
                    max={form.discountType === "percent" ? 100 : undefined}
                    value={form.discountValue}
                    onChange={(e) => setForm(p => ({ ...p, discountValue: e.target.value }))}
                    placeholder="10"
                    dir="ltr"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الحد الأدنى للطلب (ج.م)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.minOrderValue}
                    onChange={(e) => setForm(p => ({ ...p, minOrderValue: e.target.value }))}
                    placeholder="0"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>حد الاستخدام الكلي (اختياري)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.maxUsage}
                    onChange={(e) => setForm(p => ({ ...p, maxUsage: e.target.value }))}
                    placeholder="100"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>يبدأ في (اختياري)</Label>
                  <Input
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={(e) => setForm(p => ({ ...p, startsAt: e.target.value }))}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>ينتهي في (اختياري)</Label>
                  <Input
                    type="datetime-local"
                    value={form.expiresAt}
                    onChange={(e) => setForm(p => ({ ...p, expiresAt: e.target.value }))}
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="gap-2">
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingId ? "حفظ التعديلات" : "إنشاء الكوبون"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          {coupons && coupons.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الرمز</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>القيمة</TableHead>
                    <TableHead>الاستخدام</TableHead>
                    <TableHead>الفترة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="text-left">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map(coupon => (
                    <TableRow key={coupon.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold" dir="ltr">{coupon.code}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(coupon.code)}
                            className="text-muted-foreground hover:text-primary transition-colors"
                            title="نسخ الرمز"
                          >
                            {copiedCode === coupon.code ? (
                              <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                        {coupon.description && (
                          <p className="text-xs text-muted-foreground">{coupon.description}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {coupon.discountType === "percent" ? "نسبة مئوية" : "مبلغ ثابت"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {coupon.discountType === "percent"
                          ? `${coupon.discountValue}%`
                          : `${coupon.discountValue} ج.م`}
                      </TableCell>
                      <TableCell>
                        {coupon.usedCount}
                        {coupon.maxUsage !== null ? ` / ${coupon.maxUsage}` : ""}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {coupon.startsAt ? new Date(coupon.startsAt).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" }) : "من الآن"}
                        <br />
                        حتى {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" }) : "لا نهاية"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={coupon.isActive === "yes" ? "default" : "destructive"}>
                          {coupon.isActive === "yes" ? "نشط" : "متوقف"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            title={coupon.isActive === "yes" ? "إيقاف الكوبون" : "تفعيل الكوبون"}
                            onClick={() => toggleMutation.mutate({ id: coupon.id, isActive: coupon.isActive === "yes" ? "no" : "yes" })}
                            disabled={toggleMutation.isPending}
                          >
                            {coupon.isActive === "yes" ? (
                              <Pause className="h-4 w-4 text-amber-600" />
                            ) : (
                              <Play className="h-4 w-4 text-green-600" />
                            )}
                          </Button>
                          <Button variant="ghost" size="icon" title="تعديل" onClick={() => openEdit(coupon)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="حذف"
                            onClick={() => setDeleteId(coupon.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Ticket className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>لا توجد كوبونات بعد</p>
              <p className="text-sm">اضغط "كوبون جديد" لإنشاء أول كود خصم</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteId !== null} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الكوبون</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا الكوبون؟ سيُفقد الرمز ولن يعمل بعد الحذف.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId !== null && deleteMutation.mutate({ id: deleteId })}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
