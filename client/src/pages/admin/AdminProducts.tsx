import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Package, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function AdminProducts() {
  const { data: products, isLoading, refetch } = trpc.products.list.useQuery();
  const { data: categories } = trpc.categories.list.useQuery();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState<{
    name: string;
    nameAr: string;
    description: string;
    descriptionAr: string;
    category: string;
    price: number;
    pricePerMeter: number;
    isPerMeter: boolean;
    images: string;
    featured: boolean;
    inStock: boolean;
  }>({
    name: "",
    nameAr: "",
    description: "",
    descriptionAr: "",
    category: "tables",
    price: 0,
    pricePerMeter: 0,
    isPerMeter: false,
    images: "",
    featured: false,
    inStock: true,
  });

  const createProduct = trpc.products.create.useMutation({
    onSuccess: () => {
      toast.success("تمت إضافة المنتج بنجاح");
      setDialogOpen(false);
      void refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateProduct = trpc.products.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث بيانات المنتج بنجاح");
      setDialogOpen(false);
      void refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteProduct = trpc.products.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف المنتج");
      void refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      name: "",
      nameAr: "",
      description: "",
      descriptionAr: "",
      category: categories?.[0]?.slug || "tables",
      price: 0,
      pricePerMeter: 0,
      isPerMeter: false,
      images: "",
      featured: false,
      inStock: true,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (p: any) => {
    setEditingId(p.id);
    const imgStr = Array.isArray(p.images) ? p.images.join("\n") : p.images || "";
    setForm({
      name: p.name || "",
      nameAr: p.nameAr || "",
      description: p.description || "",
      descriptionAr: p.descriptionAr || "",
      category: p.category || "tables",
      price: Number(p.price || 0),
      pricePerMeter: Number(p.pricePerMeter || 0),
      isPerMeter: p.isPerMeter === true || p.isPerMeter === "true" || p.isPerMeter === "yes",
      images: imgStr,
      featured: p.featured === true || p.featured === "true",
      inStock: p.inStock === true || p.inStock === "true" || p.inStock === "yes",
    });
    setDialogOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const imagesArr = form.images
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingId) {
      updateProduct.mutate({
        id: editingId,
        name: form.name,
        nameAr: form.nameAr,
        description: form.description,
        descriptionAr: form.descriptionAr,
        category: form.category,
        price: form.price,
        pricePerMeter: form.pricePerMeter,
        isPerMeter: form.isPerMeter,
        images: imagesArr,
        featured: form.featured,
        inStock: form.inStock,
      });
    } else {
      createProduct.mutate({
        name: form.name,
        nameAr: form.nameAr,
        description: form.description,
        descriptionAr: form.descriptionAr,
        category: form.category,
        price: form.price,
        pricePerMeter: form.pricePerMeter,
        isPerMeter: form.isPerMeter,
        images: imagesArr,
        featured: form.featured,
        inStock: form.inStock,
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#24211d]">إدارة المنتجات والكتالوج</h1>
            <p className="text-sm text-muted-foreground mt-1">إضافة وتعديل المنتجات، أسعار المتر، والصور المعروضة.</p>
          </div>
          <Button onClick={handleOpenAdd} className="bg-[#24211d] text-white hover:bg-[#d5af58] hover:text-[#24211d] font-bold rounded-xl">
            <Plus className="ml-1.5 h-4 w-4" />
            إضافة منتج جديد
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>قائمة المنتجات المتاحة ({products?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#d5af58]" />
              </div>
            ) : products && products.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>اسم المنتج</TableHead>
                    <TableHead>الفئة</TableHead>
                    <TableHead>نوع السعر</TableHead>
                    <TableHead>السعر</TableHead>
                    <TableHead>مميز</TableHead>
                    <TableHead className="text-left">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-bold">{p.nameAr || p.name}</TableCell>
                      <TableCell>{p.category}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {p.isPerMeter ? "حسب المتر المربع" : "سعر ثابت"}
                        </Badge>
                      </TableCell>
                      <TableCell font-black dir="ltr">
                        {formatPrice(p.isPerMeter ? p.pricePerMeter : p.price)} ج.م
                      </TableCell>
                      <TableCell>{p.featured ? "⭐ نعم" : "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2" dir="ltr">
                          <Button size="icon" variant="ghost" onClick={() => handleOpenEdit(p)}>
                            <Edit2 className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => deleteProduct.mutate({ id: p.id })}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center py-10 text-muted-foreground">لا توجد منتجات مضافة بعد.</p>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>{editingId ? "تعديل بيانات المنتج" : "إضافة منتج استيل جديد"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold block mb-1">اسم المنتج بالعربية *</label>
                  <Input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} required />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">اسم المنتج بالإنجليزية</label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold block mb-1">الفئة / التصنيف *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-xl border border-input p-2.5 text-sm"
                  >
                    {categories?.map((c) => (
                      <option key={c.id} value={c.slug}>{c.nameAr}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-bold">
                    <input
                      type="checkbox"
                      checked={form.isPerMeter}
                      onChange={(e) => setForm({ ...form, isPerMeter: e.target.checked })}
                      className="rounded h-4 w-4"
                    />
                    <span>تسعير بالمتر المربع (للقواطع والتفصيل)</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {form.isPerMeter ? (
                  <div>
                    <label className="text-xs font-bold block mb-1">سعر المتر المربع (ج.م) *</label>
                    <Input
                      type="number"
                      value={form.pricePerMeter}
                      onChange={(e) => setForm({ ...form, pricePerMeter: Number(e.target.value) })}
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-bold block mb-1">السعر الثابت (ج.م) *</label>
                    <Input
                      type="number"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                      required
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">روابط الصور (رابط في كل سطر)</label>
                <Textarea
                  value={form.images}
                  onChange={(e) => setForm({ ...form, images: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  rows={3}
                />
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">وصف المنتج</label>
                <Textarea
                  value={form.descriptionAr}
                  onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="flex gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-bold">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                    className="rounded h-4 w-4"
                  />
                  <span>عرض في قسم المنتجات المميزة بالرئيسية</span>
                </label>
              </div>

              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full bg-[#24211d] text-white hover:bg-[#d5af58] hover:text-[#24211d] font-bold">
                  حفظ المنتج
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
