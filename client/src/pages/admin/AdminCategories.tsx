import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, Tags, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminCategories() {
  const { data: categories, isLoading, refetch } = trpc.categories.list.useQuery();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    name: "",
    nameAr: "",
    slug: "",
    description: "",
    descriptionAr: "",
  });

  const createCat = trpc.categories.create.useMutation({
    onSuccess: () => {
      toast.success("تمت إضافة الفئة بنجاح");
      setDialogOpen(false);
      void refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateCat = trpc.categories.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث الفئة بنجاح");
      setDialogOpen(false);
      void refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteCat = trpc.categories.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الفئة");
      void refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({ name: "", nameAr: "", slug: "", description: "", descriptionAr: "" });
    setDialogOpen(true);
  };

  const handleOpenEdit = (c: any) => {
    setEditingId(c.id);
    setForm({
      name: c.name || "",
      nameAr: c.nameAr || "",
      slug: c.slug || "",
      description: c.description || "",
      descriptionAr: c.descriptionAr || "",
    });
    setDialogOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateCat.mutate({ id: editingId, ...form });
    } else {
      createCat.mutate(form);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#24211d]">إدارة الفئات والأقسام</h1>
            <p className="text-sm text-muted-foreground mt-1">ترابيزات، كونسول، مرايات، قواطع، ديكورات.</p>
          </div>
          <Button onClick={handleOpenAdd} className="bg-[#24211d] text-white hover:bg-[#d5af58] hover:text-[#24211d] font-bold rounded-xl">
            <Plus className="ml-1.5 h-4 w-4" />
            إضافة فئة جديدة
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>الفئات المسجلة ({categories?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#d5af58]" />
              </div>
            ) : categories && categories.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>اسم الفئة (عربي)</TableHead>
                    <TableHead>اسم الفئة (إنجليزي)</TableHead>
                    <TableHead>الرابط (Slug)</TableHead>
                    <TableHead className="text-left">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-bold">{c.nameAr}</TableCell>
                      <TableCell>{c.name}</TableCell>
                      <TableCell dir="ltr" className="font-mono text-xs text-muted-foreground">{c.slug}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2" dir="ltr">
                          <Button size="icon" variant="ghost" onClick={() => handleOpenEdit(c)}>
                            <Edit2 className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => deleteCat.mutate({ id: c.id })}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center py-10 text-muted-foreground">لا توجد فئات مسجلة.</p>
            )}
          </CardContent>
        </Card>

        {/* Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>{editingId ? "تعديل الفئة" : "إضافة فئة جديدة"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-bold block mb-1">اسم الفئة بالعربية *</label>
                <Input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} required />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1">اسم الفئة بالإنجليزية</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1">الرابط الفريد (Slug) *</label>
                <Input dir="ltr" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="tables" required />
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full bg-[#24211d] text-white hover:bg-[#d5af58] hover:text-[#24211d] font-bold">
                  حفظ الفئة
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
