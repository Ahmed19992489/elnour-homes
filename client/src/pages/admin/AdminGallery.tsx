import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, Image, Upload } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

export default function AdminGallery() {
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    imageUrl: "",
    category: "أعمال منجزة",
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: items, isLoading, refetch } = trpc.gallery.list.useQuery();
  const utils = trpc.useUtils();

  const createItem = trpc.gallery.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة الصورة");
      setOpen(false);
      setForm({ title: "", imageUrl: "", category: "أعمال منجزة" });
      utils.gallery.list.invalidate();
    },
    onError: () => toast.error("حدث خطأ"),
  });

  const deleteItem = trpc.gallery.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الصورة");
      utils.gallery.list.invalidate();
    },
    onError: () => toast.error("حدث خطأ"),
  });

  const uploadImage = trpc.upload.uploadImage.useMutation({
    onSuccess: (data) => {
      setForm({ ...form, imageUrl: data.url });
      setUploading(false);
      toast.success("تم رفع الصورة - انقر إضافة لحفظها");
    },
    onError: () => {
      setUploading(false);
      toast.error("فشل رفع الصورة");
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن يكون أقل من 5 ميجابايت");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("يرجى اختيار ملف صورة");
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      uploadImage.mutate({
        filename: file.name,
        base64,
        contentType: file.type,
      });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createItem.mutate(form);
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return <div className="p-8 text-center">ليس لديك صلاحية الوصول</div>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">معرض الأعمال</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="ml-2 h-4 w-4" />
                إضافة صورة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>إضافة صورة للمعرض</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>عنوان الصورة</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>رفع صورة</Label>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  {uploading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      جاري رفع الصورة...
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>أو أدخل رابط الصورة مباشرة</Label>
                  <Input
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الفئة</Label>
                  <Input
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  />
                </div>
                {form.imageUrl && (
                  <div className="aspect-video rounded-lg overflow-hidden border">
                    <img src={form.imageUrl} alt="معاينة" className="w-full h-full object-cover" />
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={createItem.isPending || !form.imageUrl}>
                  {createItem.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                  إضافة
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : items && items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden group">
                <div className="aspect-square relative">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm("هل أنت متأكد؟")) {
                          deleteItem.mutate({ id: item.id });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.category}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Image className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg">لا توجد صور في المعرض</p>
              <p className="text-sm mt-2">أضف صور أعمالك المنجزة</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
