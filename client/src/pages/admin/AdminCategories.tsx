import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type CategoryForm = {
  slug: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  sortOrder: string;
  isActive: boolean;
};

const emptyForm: CategoryForm = {
  slug: "",
  nameAr: "",
  nameEn: "",
  descriptionAr: "",
  descriptionEn: "",
  sortOrder: "0",
  isActive: true,
};

export default function AdminCategories() {
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const { data: categories, isLoading } = trpc.categories.list.useQuery();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
  };

  const closeDialog = () => {
    setOpen(false);
    resetForm();
  };

  const invalidateCatalogData = async () => {
    await Promise.all([
      utils.categories.list.invalidate(),
      utils.categories.active.invalidate(),
      utils.products.active.invalidate(),
    ]);
  };

  const createCategory = trpc.categories.create.useMutation({
    onSuccess: async () => {
      toast.success("تمت إضافة الفئة");
      await invalidateCatalogData();
      closeDialog();
    },
    onError: (error) => toast.error(error.message || "تعذر إضافة الفئة"),
  });

  const updateCategory = trpc.categories.update.useMutation({
    onSuccess: async () => {
      toast.success("تم تحديث الفئة");
      await invalidateCatalogData();
      closeDialog();
    },
    onError: (error) => toast.error(error.message || "تعذر تحديث الفئة"),
  });

  const deleteCategory = trpc.categories.delete.useMutation({
    onSuccess: async () => {
      toast.success("تم حذف الفئة");
      await invalidateCatalogData();
    },
    onError: (error) => toast.error(error.message || "لا يمكن حذف هذه الفئة"),
  });

  const openEdit = (category: NonNullable<typeof categories>[number]) => {
    setEditId(category.id);
    setForm({
      slug: category.slug,
      nameAr: category.nameAr,
      nameEn: category.nameEn,
      descriptionAr: category.descriptionAr || "",
      descriptionEn: category.descriptionEn || "",
      sortOrder: String(category.sortOrder ?? 0),
      isActive: category.isActive === "yes",
    });
    setOpen(true);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      slug: form.slug.trim().toLowerCase(),
      nameAr: form.nameAr.trim(),
      nameEn: form.nameEn.trim(),
      descriptionAr: form.descriptionAr.trim() || undefined,
      descriptionEn: form.descriptionEn.trim() || undefined,
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive ? "yes" as const : "no" as const,
    };
    if (editId) {
      updateCategory.mutate({ id: editId, ...payload });
    } else {
      createCategory.mutate(payload);
    }
  };

  if (!isAuthenticated || user?.role !== "admin") {
    return <div className="p-8 text-center">ليس لديك صلاحية الوصول</div>;
  }

  const isSaving = createCategory.isPending || updateCategory.isPending;

  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">إدارة الفئات</h1>
            <p className="mt-1 text-sm text-muted-foreground">قسّم الكتالوج إلى فئات واضحة تظهر للعميل في صفحة المنتجات.</p>
          </div>
          <Dialog open={open} onOpenChange={(value) => value ? setOpen(true) : closeDialog()}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="ml-2 h-4 w-4" />
                إضافة فئة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editId ? "تعديل الفئة" : "إضافة فئة جديدة"}</DialogTitle>
              </DialogHeader>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category-name-ar">اسم الفئة بالعربية</Label>
                    <Input id="category-name-ar" value={form.nameAr} onChange={(event) => setForm({ ...form, nameAr: event.target.value })} placeholder="مثال: طاولات" required />
                  </div>
                  <div className="space-y-2" dir="ltr">
                    <Label htmlFor="category-name-en">Category name in English</Label>
                    <Input id="category-name-en" value={form.nameEn} onChange={(event) => setForm({ ...form, nameEn: event.target.value })} placeholder="e.g. Tables" required />
                  </div>
                </div>
                <div className="space-y-2" dir="ltr">
                  <Label htmlFor="category-slug">رابط الفئة المختصر</Label>
                  <Input id="category-slug" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value.toLowerCase().replace(/\s+/g, "-") })} placeholder="tables" required />
                  <p className="text-xs text-muted-foreground" dir="rtl">استخدم حروفاً إنجليزية صغيرة وأرقاماً وشرطة (-) فقط. لا تغيّره بعد ربط منتجات بالفئة.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category-description-ar">وصف عربي مختصر</Label>
                    <Textarea id="category-description-ar" value={form.descriptionAr} onChange={(event) => setForm({ ...form, descriptionAr: event.target.value })} rows={3} />
                  </div>
                  <div className="space-y-2" dir="ltr">
                    <Label htmlFor="category-description-en">English description</Label>
                    <Textarea id="category-description-en" value={form.descriptionEn} onChange={(event) => setForm({ ...form, descriptionEn: event.target.value })} rows={3} />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
                  <div className="space-y-2">
                    <Label htmlFor="category-sort">ترتيب الظهور</Label>
                    <Input id="category-sort" type="number" min="0" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: event.target.value })} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                    <Label htmlFor="category-active">إظهار الفئة للعملاء</Label>
                    <Switch id="category-active" checked={form.isActive} onCheckedChange={(value) => setForm({ ...form, isActive: value })} />
                  </div>
                </div>
                <Button className="w-full" type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
                  {editId ? "حفظ التعديلات" : "إضافة الفئة"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Tags className="h-5 w-5 text-amber-600" />فئات الكتالوج</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /></div>
            ) : categories?.length ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الفئة</TableHead>
                      <TableHead>الرابط</TableHead>
                      <TableHead>الترتيب</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-left">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          <p className="font-medium">{category.nameAr}</p>
                          <p className="text-xs text-muted-foreground" dir="ltr">{category.nameEn}</p>
                        </TableCell>
                        <TableCell><code className="rounded bg-muted px-2 py-1 text-xs">{category.slug}</code></TableCell>
                        <TableCell>{category.sortOrder ?? 0}</TableCell>
                        <TableCell><Badge variant={category.isActive === "yes" ? "default" : "secondary"}>{category.isActive === "yes" ? "ظاهرة" : "مخفية"}</Badge></TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(category)} aria-label={`تعديل ${category.nameAr}`}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => { if (confirm(`حذف فئة «${category.nameAr}»؟`)) deleteCategory.mutate({ id: category.id }); }} aria-label={`حذف ${category.nameAr}`}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="px-6 py-12 text-center text-muted-foreground">لا توجد فئات بعد.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
