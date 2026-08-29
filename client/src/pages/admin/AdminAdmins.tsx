import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, KeyRound, Power, PowerOff, Trash2, ShieldAlert, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
16: type AdminAccount = {
type AdminAccount = {
id: number;
phone: string;
displayName: string;
isActive: boolean;
createdAt: number;
};
24: export default function AdminAdmins() {

const [, setLocation] = useLocation();
const { data: accounts, isLoading, refetch } = trpc.adminAccounts.list.useQuery();
const { data: meData } = trpc.adminAuth.me.useQuery(undefined, { retry: false });
const isOwner = meData?.isOwne
  const isOwner = meData?.isOwner === true;

  const [addOpen, setAddOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);

  const [form, setForm] = useState<{ phone: string; displayName: string; password: string; role: "admin" | "moderator" }>({
    phone: "",
    displayName: "",
    password: "",
    role: "moderator",
  });
  const [pwForm, setPwForm] = useState({ password: "" });
  const [showPw, setShowPw] = useState(false);
  const [showAddPw, setShowAddPw] = useState(false);
  const [adding, setAdding] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    if (meData && !isOwner) {
      toast.error("إدارة حسابات المدراء متاحة لمالك الموقع فقط");
setAddOpen(false);
setForm({ phone: "", displayName: "", password: "" });
void refetch();
toast.success("تمت إضافة حساب المدير بنجاح");
},
onError: (error) => toast.error(String(error.message)),
onSettled: () => setAdding(false),
});
59:   const pwMutation = trpc.adminAccounts.updatePassword.useMutation({
      toast.success("تمت إضافة الحساب بنجاح");
onSuccess: () => {
setPwOpen(null);
setPwForm({ password: "" });
toast.success("تم تغيير كلمة المرور بنجاح");
},
onError: (error) => toast.error(String(error.message)),
onSettled: () => setSavingPw(false),
});
69:   const toggleMutation = trpc.adminAccounts.deactivate.useMutation({
      toast.success("تم تغيير كلمة المرور بنجاح");
onSuccess: () => {
void refetch();
toast.success("تم تعطيل الحساب — سيتم تسجيل خروجه من جميع الأجهزة");
},
onError: (error) => toast.error(String(error.message)),
});
const activateMutation = trpc.adminAccounts.activate.useMutation({
onSuccess: () => {
void refetch();
toast.success("تم تفعيل الحساب");
},
onError: (error) => toast.error(String(error.message)),
});
84:   const removeMutation = trpc.adminAccounts.remove.useMutation({
      void refetch();
onSuccess: () => {
setRemoveTarget(null);
void refetch();
toast.success("تم حذف الحساب نهائيًا");
},
onError: (error) => toast.error(String(error.message)),
});
93:   const handleAdd = () => {
      void refetch();
setAdding(true);
createMutation.mutate({
phone: form.phone,
password: form.password,
displayName: form.displayName,
});
};
    createMutation.mutate({
      phone: form.phone,
      password: form.password,
      displayName: form.displayName,
      role: form.role,
    });
  };

if (!accounts) return [];
return [...accounts].sort((a, b) => b.id - a.id);
}, [accounts]);
113:   return (

<div className="space-y-6">
<div className="flex flex-wrap items-center justify-between gap-3">
<div>
<h1 className="text-2xl font-semibold tracking-tight">حسابات المدراء</h1>
<p className="text-sm text-muted-foreground mt-1">
إدارة أرقام الدخول إلى لوحة التحكم — إضافة، تعطيل أو حذف. الحسابات المعطّلة لا يمكنها الدخول ويُسجّل خروجها تلقائيًا من جميع الأجهزة.
</p>
</div>
<Button
className="shadow-lg hover:shadow-xl transition-all"
onClick={() => setAddOpen(true)}
disabled={!isOwner}
>
<Plus className="ml-1 h-4 w-4" />
إضافة حساب مدير
</Button>
</div>
132:       {!isOwner ? (

<Card className="border-amber-500/40 bg-amber-50 dark:bg-amber-950/20">
<CardContent className="flex items-center gap-3 py-4">
<ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
<p className="text-sm text-amber-700 dark:text-amber-400">
هذه الصفحة متاحة لمالك الموقع فقط.
</p>
</CardContent>
</Card>
) : null}
143:       <Card>

<CardHeader>
<CardTitle className="text-lg">قائمة الحسابات</CardTitle>
<CardDescription>جميع الأرقام المسجلة للدخول إلى الإدارة</CardDescription>
</CardHeader>
<CardContent>
{isLoading ? (
<div className="flex items-center justify-center py-10">
<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
</div>
) : !sorted.length ? (
<p className="text-sm text-muted-foreground py-10 text-center">لا توجد حسابات مدراء مسجلة.</p>
) : (
<div className="overflow-x-auto">
<Table>
<TableHeader>
<TableRow>
) : !sorted.length ? (
<p className="text-sm text-muted-foreground py-10 text-center">لا توجد حسابات مدراء مسجلة.</p>
) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>رقم الهاتف</TableHead>
                    <TableHead>الدور والصلاحية</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>تاريخ الإضافة</TableHead>
                    <TableHead className="text-left">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {account.displayName}
                          {isOwner ? (
                            account.isActive ? (
                              <ShieldCheck className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <ShieldAlert className="h-4 w-4 text-amber-600" />
                            )
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell dir="ltr" className="text-right font-mono text-sm">
                        {account.phone}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={account.role === "admin" ? "bg-purple-50 text-purple-700 border-purple-300" : "bg-blue-50 text-blue-700 border-blue-300"}>
                          {account.role === "admin" ? "مدير نظام" : "مشرف / مودريتور"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={account.isActive ? "outline" : "secondary"} className={account.isActive ? "border-emerald-600 text-emerald-700" : ""}>
                          {account.isActive ? "نشط" : "معطّل"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(account.createdAt).toLocaleDateString("ar-EG")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5" dir="ltr">
                          <Button
                            size="icon"
                            variant="ghost"
                            title="تغيير كلمة المرور"
                            onClick={() => {
                              setPwOpen(account.phone);
                              setPwForm({ password: "" });
                            }}
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          {account.isActive ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              title="تعطيل الحساب"
                              onClick={() => toggleMutation.mutate({ phone: account.phone })}
                            >
                              <PowerOff className="h-4 w-4 text-amber-600" />
                            </Button>
                          ) : (
                            <Button
                              size="icon"
                              variant="ghost"
                              title="تفعيل الحساب"
                              onClick={() => activateMutation.mutate({ phone: account.phone })}
                            >
                              <Power className="h-4 w-4 text-emerald-600" />
                            </Button>
                          )}
                          {isOwner ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              title="حذف الحساب نهائيًا"
                              onClick={() => setRemoveTarget(account.phone)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add account dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة حساب جديد (مدير أو مشرف)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>رقم الهاتف</Label>
              <Input
                dir="ltr"
                placeholder="01112345678"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">رقم مصري من 11 رقمًا يبدأ بـ 01.</p>
            </div>
            <div className="space-y-2">
              <Label>اسم العرض</Label>
              <Input
                placeholder="مثال: Moderator أو أحمد علي"
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>الدور والصلاحية</Label>
              <Select
                value={form.role}
                onValueChange={(val: "admin" | "moderator") => setForm({ ...form, role: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="moderator">مشرف / مودريتور (إدارة الطلبات والرسائل وخدمة العملاء)</SelectItem>
                  <SelectItem value="admin">مدير نظام (تحكم كامل، تقارير، إعدادات)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>كلمة المرور</Label>
              <div className="relative">
                <Input
                  type={showAddPw ? "text" : "password"}
                  value={form.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, password: e.target.value })}
                  placeholder="8 أحرف على الأقل"
                />
                <button
                  type="button"
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowAddPw((v) => !v)}
                  aria-label={showAddPw ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                >
                  {showAddPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button className="w-full" onClick={handleAdd} disabled={adding}>
              {adding ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Plus className="ml-2 h-4 w-4" />}
              إضافة الحساب
            </Button>
>
{showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
</button>
</div>
</div>
<Button className="w-full" onClick={handlePwSave} disabled={savingPw}>
{savingPw ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <KeyRound className="ml-2 h-4 w-4" />}
حفظ كلمة المرور
</Button>
</div>
</DialogContent>
</Dialog>
335:       {/* Remove confirmation */}

<AlertDialog open={removeTarget !== null} onOpenChange={(open) => !open && setRemoveTarget(null)}>
<AlertDialogContent dir="rtl">
<AlertDialogHeader>
<AlertDialogTitle>حذف الحساب نهائيًا؟</AlertDialogTitle>
<AlertDialogDescription>
سيتم حذف هذا الحساب من قائمة المدراء بالكامل ولن يتمكن صاحبه من الدخول مرة أخرى. لا يمكن التراجع عن هذا الإجراء.
<span dir="ltr" className="block font-mono mt-2 text-sm">{removeTarget}</span>
</AlertDialogDescription>
</AlertDialogHeader>
<AlertDialogFooter>
<AlertDialogCancel>إلغاء</AlertDialogCancel>
<AlertDialogAction
className="bg-red-600 hover:bg-red-700"
onClick={() => removeTarget && removeMutation.mutate({ phone: removeTarget })}
>
نعم، احذف الحساب
</AlertDialogAction>
</AlertDialogFooter>
</AlertDialogContent>
</AlertDialog>
</div>
);
}
The above content does NOT show the entire file contents. If you need to view any lines of the file which were not shown to complete your task, call this tool again to view those lines.