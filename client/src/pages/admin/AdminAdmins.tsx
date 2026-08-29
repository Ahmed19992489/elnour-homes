import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, ShieldCheck, KeyRound, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminAdmins() {
  const { data: accounts, isLoading, refetch } = trpc.adminAccounts.list.useQuery();
  const [addOpen, setAddOpen] = useState(false);

  const [form, setForm] = useState<{
    phone: string;
    displayName: string;
    password: string;
    role: "admin" | "moderator";
  }>({
    phone: "",
    displayName: "",
    password: "",
    role: "moderator",
  });

  const createAccount = trpc.adminAccounts.create.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء الحساب بنجاح");
      setAddOpen(false);
      setForm({ phone: "", displayName: "", password: "", role: "moderator" });
      void refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const removeAccount = trpc.adminAccounts.remove.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الحساب");
      void refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.phone.trim() || !form.password.trim()) {
      toast.error("يرجى إدخال رقم الهاتف وكلمة المرور");
      return;
    }
    createAccount.mutate(form);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#24211d]">حسابات الإدارة والمشرفين</h1>
            <p className="text-sm text-muted-foreground mt-1">إدارة مستخدمي لوحة التحكم وصلاحيات المدراء والمشرفين (Moderators).</p>
          </div>
          <Button onClick={() => setAddOpen(true)} className="bg-[#24211d] text-white hover:bg-[#d5af58] hover:text-[#24211d] font-bold rounded-xl">
            <Plus className="ml-1.5 h-4 w-4" />
            إضافة حساب جديد
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>الحسابات المصرح لها ({accounts?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#d5af58]" />
              </div>
            ) : accounts && accounts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>رقم الهاتف</TableHead>
                    <TableHead>الدور والصلاحية</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="text-left">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((acc: any) => (
                    <TableRow key={acc.phone}>
                      <TableCell className="font-bold">{acc.displayName || acc.phone}</TableCell>
                      <TableCell dir="ltr" className="font-mono text-xs">{acc.phone}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={acc.role === "admin" ? "bg-amber-50 text-amber-800 border-amber-300 font-bold" : "bg-blue-50 text-blue-800 border-blue-300"}>
                          {acc.role === "admin" ? "مدير عام (Admin)" : "مشرف / موظف (Moderator)"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={acc.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}>
                          {acc.isActive ? "نشط" : "معطل"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeAccount.mutate({ phone: acc.phone })}
                          title="حذف الحساب"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center py-8 text-muted-foreground">لا توجد حسابات مسجلة.</p>
            )}
          </CardContent>
        </Card>

        {/* Add Dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>إضافة حساب إدارة / موظف جديد</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-bold block mb-1">الاسم أو المسمى الوظيفي *</label>
                <Input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="مثال: Moderator / موظف المبيعات" required />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1">رقم الهاتف للدخول *</label>
                <Input dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="01118182424" required />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1">كلمة المرور *</label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" required />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1">نوع الصلاحية *</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as any })}
                  className="w-full rounded-xl border border-input p-2.5 text-sm font-bold"
                >
                  <option value="moderator">مشرف / موظف (Moderator) - متابعة الطلبات والكتالوج</option>
                  <option value="admin">مدير عام (Admin) - كامل الصلاحيات والتقارير</option>
                </select>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" disabled={createAccount.isPending} className="w-full bg-[#24211d] text-white hover:bg-[#d5af58] hover:text-[#24211d] font-bold">
                  {createAccount.isPending ? "جاري الإنشاء..." : "إنشاء الحساب"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}