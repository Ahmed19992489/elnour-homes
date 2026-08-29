import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Ticket, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminCoupons() {
  const { data: coupons, isLoading, refetch } = trpc.coupons.list.useQuery();
  const [dialogOpen, setDialogOpen] = useState(false);

  const [form, setForm] = useState({
    code: "",
    discountPercent: 10,
    isActive: true,
  });

  const createCoupon = trpc.coupons.create.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء كود الخصم بنجاح");
      setDialogOpen(false);
      setForm({ code: "", discountPercent: 10, isActive: true });
      void refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteCoupon = trpc.coupons.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الكوبون");
      void refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) return;
    createCoupon.mutate({
      code: form.code.trim().toUpperCase(),
      discountPercent: Number(form.discountPercent),
      isActive: form.isActive,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#24211d]">إدارة كوبونات الخصم</h1>
            <p className="text-sm text-muted-foreground mt-1">إنشاء وإلغاء أكواد الخصم الترويجية لعملاء المتجر والحملات.</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="bg-[#24211d] text-white hover:bg-[#d5af58] hover:text-[#24211d] font-bold rounded-xl">
            <Plus className="ml-1.5 h-4 w-4" />
            إنشاء كود خصم جديد
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>الأكواد النشطة ({coupons?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#d5af58]" />
              </div>
            ) : coupons && coupons.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>كود الخصم</TableHead>
                    <TableHead>نسبة الخصم</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="text-left">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono font-bold text-base" dir="ltr">{c.code}</TableCell>
                      <TableCell className="font-black text-[#a8822d]">{c.discountPercent}%</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={c.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-300" : ""}>
                          {c.isActive ? "نشط" : "معطل"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2" dir="ltr">
                          <Button size="icon" variant="ghost" onClick={() => deleteCoupon.mutate({ id: c.id })}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center py-10 text-muted-foreground">لا توجد كوبونات مضافة بعد.</p>
            )}
          </CardContent>
        </Card>

        {/* Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>إنشاء كوبون خصم جديد</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-bold block mb-1">كود الخصم (Promo Code) *</label>
                <Input
                  dir="ltr"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="NOUR10"
                  className="font-mono font-bold uppercase"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1">نسبة الخصم (%) *</label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={form.discountPercent}
                  onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) })}
                  required
                />
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full bg-[#24211d] text-white hover:bg-[#d5af58] hover:text-[#24211d] font-bold">
                  إنشاء الكوبون
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
