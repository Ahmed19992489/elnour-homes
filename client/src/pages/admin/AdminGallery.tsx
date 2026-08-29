import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Image, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminGallery() {
  const { data: galleryItems, isLoading, refetch } = trpc.gallery.list.useQuery();
  const [dialogOpen, setDialogOpen] = useState(false);

  const [form, setForm] = useState({
    title: "",
    category: "ترابيزات",
    imageUrl: "",
  });

  const addItem = trpc.gallery.add.useMutation({
    onSuccess: () => {
      toast.success("تمت إضافة الصورة إلى المعرض بنجاح");
      setDialogOpen(false);
      setForm({ title: "", category: "ترابيزات", imageUrl: "" });
      void refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteItem = trpc.gallery.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الصورة من المعرض");
      void refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.imageUrl.trim()) {
      toast.error("يرجى إدخال عنوان ورابط الصورة");
      return;
    }
    addItem.mutate(form);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#24211d]">إدارة معرض الأعمال</h1>
            <p className="text-sm text-muted-foreground mt-1">الصور المنفذة التي تظهر في صفحة أعمالنا وسابقة المشاريع.</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="bg-[#24211d] text-white hover:bg-[#d5af58] hover:text-[#24211d] font-bold rounded-xl">
            <Plus className="ml-1.5 h-4 w-4" />
            إضافة عمل جديد
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>الأعمال المعروضة ({galleryItems?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#d5af58]" />
              </div>
            ) : galleryItems && galleryItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {galleryItems.map((item) => (
                  <div key={item.id} className="group relative rounded-2xl border border-[#eee8dd] bg-white overflow-hidden shadow-xs">
                    <img src={item.imageUrl} alt={item.title} className="aspect-4/3 w-full object-cover" />
                    <div className="p-4">
                      <span className="text-xs font-bold text-[#a8822d] block">{item.category}</span>
                      <h4 className="font-bold text-sm text-[#24211d] mt-1 truncate">{item.title}</h4>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteItem.mutate({ id: item.id })}
                        className="mt-3 w-full rounded-xl text-xs font-bold"
                      >
                        <Trash2 className="ml-1.5 h-3.5 w-3.5" />
                        حذف الصورة
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-10 text-muted-foreground">لا توجد صور مضافة بعد في المعرض.</p>
            )}
          </CardContent>
        </Card>

        {/* Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>إضافة عمل / صورة إلى المعرض</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-bold block mb-1">عنوان العمل / الوصف القصير *</label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثال: ترابيزة صالون استيل ذهبي 304" required />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1">القسم / التصنيف *</label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="ترابيزات / مرايات / قواطع..." required />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1">رابط الصورة (Image URL) *</label>
                <Input dir="ltr" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." required />
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full bg-[#24211d] text-white hover:bg-[#d5af58] hover:text-[#24211d] font-bold">
                  إضافة للمعرض
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
