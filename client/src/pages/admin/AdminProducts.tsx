import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Pencil, Trash2, Image, Upload, X, Eye, EyeOff } from "lucide-react";
import { useEffect, useMemo, useState, useRef } from "react";
import { SQM_PRICE_EGP } from "@shared/const";
import { toast } from "sonner";
import { hasProductImage, parseProductImages, serializeProductImages } from "@/lib/productImages";

async function compressImageFile(file: File): Promise<{ filename: string; base64: string; contentType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("فشل قراءة الملف"));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error("ملف الصورة غير صالح"));
      img.onload = () => {
        const MAX_DIM = 1280;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return resolve({
            filename: file.name,
            base64: reader.result as string,
            contentType: file.type || "image/jpeg",
          });
        }

        ctx.drawImage(img, 0, 0, width, height);
        const base64 = canvas.toDataURL("image/jpeg", 0.82);
        resolve({
          filename: file.name.replace(/\.[^.]+$/, ".jpg"),
          base64,
          contentType: "image/jpeg",
        });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function AdminProducts() {
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    nameAr: "",
    description: "",
    price: "",
    originalPrice: "",
    sizes: "",
    colors: "",
    sizeOptions: "",
    colorOptions: "",
    pricingType: "fixed",
    pricePerMeter: "",
    category: "home-decor",
    images: "",
    isActive: true,
    sortOrder: 0,
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // --- Detailed specs editor: specs table shown on the product page ---
  const [specMaterial, setSpecMaterial] = useState("");
  const [specDimensions, setSpecDimensions] = useState("");
  const [specFinish, setSpecFinish] = useState("");
  const [specCare, setSpecCare] = useState("");
  const serializeSpecifications = () => {
    const specs: Record<string, string> = {};
    if (specMaterial.trim()) specs.material = specMaterial.trim();
    if (specDimensions.trim()) specs.dimensions = specDimensions.trim();
    if (specFinish.trim()) specs.finish = specFinish.trim();
    if (specCare.trim()) specs.care = specCare.trim();
    return Object.keys(specs).length ? JSON.stringify(specs) : "";
  };
  const hydrateSpecifications = (json?: string | null) => {
    let specs: Record<string, string> = {};
    try {
      if (json) specs = JSON.parse(json);
    } catch { /* leave empty */ }
    setSpecMaterial(specs.material ?? "");
    setSpecDimensions(specs.dimensions ?? "");
    setSpecFinish(specs.finish ?? "");
    setSpecCare(specs.care ?? "");
  };

  // --- Size options editor: friendly row-based editor (auto-syncs JSON) ---
  type SizeRow = { labelAr: string; labelEn: string; price: string; autoPrice: boolean };
  type ColorRow = { labelAr: string; labelEn: string; hex: string };

  // Site-wide SQM price from settings (editable in the product editor header)
  const settingsQuery = trpc.settings.get.useQuery();
  const sqmSetting = settingsQuery.data?.sqmPrice ?? SQM_PRICE_EGP;
  const [sqmInput, setSqmInput] = useState(String(sqmSetting));
  const [savingSqm, setSavingSqm] = useState(false);
  const setSqmPriceMutation = trpc.settings.setSqmPrice.useMutation({
    onSuccess: () => {
      void settingsQuery.refetch();
      toast.success("تم حفظ سعر المتر المربع الجديد");
    },
    onError: (error) => toast.error(String(error.message)),
  });

  // Keep the editable input in sync with the stored site-wide SQM price
  useEffect(() => {
    setSqmInput(String(sqmSetting));
  }, [sqmSetting]);

  const saveSqm = () => {
    const price = Math.round(Number(sqmInput));
    if (!Number.isFinite(price) || price < 100 || price > 100000) {
      toast.error("سعر المتر يجب أن يكون رقمًا بين 100 و100,000 جنيه");
      return;
    }
    setSavingSqm(true);
    setSqmPriceMutation.mutate({ price }, {
      onSettled: () => setSavingSqm(false),
    });
  };

  const sizeRows: SizeRow[] = useMemo(() => {
    try {
      if (form.sizeOptions) {
        const parsed = JSON.parse(form.sizeOptions);
        if (Array.isArray(parsed)) {
          return parsed.map((opt: any) => ({
            labelAr: String(opt.labelAr ?? ""),
            labelEn: String(opt.labelEn ?? ""),
            price: opt.autoPrice ? "auto" : String(opt.price ?? "0"),
            autoPrice: Boolean(opt.autoPrice),
          }));
        }
      }
    } catch { /* legacy text -> single row */ }
    // Legacy line format fallback: "Ar | En | price"
    return (form.sizeOptions || "")
      .split("\n")
      .map((line) => {
        const parts = line.split(/[|]/).map((s) => s.trim());
        return { labelAr: parts[0] || "", labelEn: parts[1] || parts[0] || "", price: parts[2] || "0", autoPrice: false };
      })
      .filter((row) => row.labelAr || row.price !== "0");
  }, [form.sizeOptions]);

  const colorRows: ColorRow[] = useMemo(() => {
    try {
      if (form.colorOptions) {
        const parsed = JSON.parse(form.colorOptions);
        if (Array.isArray(parsed)) {
          return parsed.map((opt: any) => ({
            labelAr: String(opt.labelAr ?? ""),
            labelEn: String(opt.labelEn ?? ""),
            hex: String(opt.hex ?? "#ad842f"),
          }));
        }
      }
    } catch { /* legacy text -> single row */ }
    return (form.colorOptions || "")
      .split("\n")
      .map((line) => {
        const parts = line.split(/[|]/).map((s) => s.trim());
        return { labelAr: parts[0] || "", labelEn: parts[1] || parts[0] || "", hex: parts[2] || "#ad842f" };
      })
      .filter((row) => row.labelAr);
  }, [form.colorOptions]);

  // Compute SQM price from Arabic label dims like "صغير 60×60 سم"
  const sqmPriceFor = (labelAr: string): number | null => {
    const match = labelAr.match(/(\d+(?:[.,]\d+)?)\s*[×xX*]\s*(\d+(?:[.,]\d+)?)/);
    if (!match) return null;
    const w = parseFloat(match[1]);
    const h = parseFloat(match[2]);
    return Math.round(((w * h) / 10000) * sqmSetting / 100) * 100;
  };

  const serializeSizeOptions = (rows: SizeRow[]) => {
    if (!rows.length) return "";
    return JSON.stringify(
      rows.map((row) => {
        const auto = row.autoPrice;
        const sqm = sqmPriceFor(row.labelAr);
        const priceNum = auto && sqm !== null ? sqm : parseFloat(row.price) || 0;
        return { labelAr: row.labelAr, labelEn: row.labelEn || row.labelAr, price: priceNum, autoPrice: auto };
      }),
    );
  };

  const serializeColorOptions = (rows: ColorRow[]) => {
    if (!rows.length) return "";
    return JSON.stringify(rows.map((row) => ({ labelAr: row.labelAr, labelEn: row.labelEn || row.labelAr, hex: row.hex })));
  };


  const addSizeRow = () => {
    const next = [...sizeRows, { labelAr: "", labelEn: "", price: "0", autoPrice: false }];
    setForm({ ...form, sizeOptions: serializeSizeOptions(next) });
  };

  const removeSizeRow = (index: number) => {
    const next = sizeRows.filter((_, i) => i !== index);
    setForm({ ...form, sizeOptions: serializeSizeOptions(next) });
  };

  const setColorRow = (index: number, patch: Partial<ColorRow>) => {
    const next = [...colorRows];
    next[index] = { ...next[index], ...patch };
    setForm({ ...form, colorOptions: serializeColorOptions(next) });
  };

  const addColorRow = () => {
    const next = [...colorRows, { labelAr: "", labelEn: "", hex: "#ad842f" }];
    setForm({ ...form, colorOptions: serializeColorOptions(next) });
  };

  const removeColorRow = (index: number) => {
    const next = colorRows.filter((_, i) => i !== index);
    setForm({ ...form, colorOptions: serializeColorOptions(next) });
  };

  const { data: products, isLoading, refetch } = trpc.products.list.useQuery();
  const { data: categories } = trpc.categories.list.useQuery();
  const utils = trpc.useUtils();

  const createProduct = trpc.products.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة المنتج");
      setOpen(false);
      resetForm();
      utils.products.list.invalidate();
    },
    onError: () => toast.error("حدث خطأ"),
  });

  const updateProduct = trpc.products.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث المنتج");
      setOpen(false);
      resetForm();
      setEditId(null);
      utils.products.list.invalidate();
    },
    onError: () => toast.error("حدث خطأ"),
  });

  const deleteProduct = trpc.products.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف المنتج");
      utils.products.list.invalidate();
    },
    onError: () => toast.error("حدث خطأ"),
  });

  // Quick publish/unpublish toggle straight from the products table
  const toggleActive = trpc.products.update.useMutation({
    onMutate: async ({ id, isActive }) => {
      await utils.products.list.cancel();
      const previous = utils.products.list.getData();
      utils.products.list.setData(undefined, (old) =>
        (old ?? []).map((product) =>
          product.id === id ? { ...product, isActive: isActive ? "yes" : "no" } : product,
        ),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      utils.products.list.setData(undefined, ctx?.previous);
      toast.error("تعذر تغيير حالة المنتج");
    },
    onSuccess: () => toast.success("تم تحديث حالة النشر"),
  });

  const uploadImage = trpc.upload.uploadImage.useMutation({
    onSuccess: (data) => {
      const currentImages = parseProductImages(form.images);
      const newImages = [...currentImages, data.url];
      setForm({ ...form, images: serializeProductImages(newImages) });
      setUploading(false);
      toast.success("تم رفع الصورة");
    },
    onError: () => {
      setUploading(false);
      toast.error("فشل رفع الصورة");
    },
  });

  const resetForm = () => {
    setForm({
      name: "",
      nameAr: "",
      description: "",
      price: "",
      originalPrice: "",
      sizes: "",
      colors: "",
      sizeOptions: "",
      colorOptions: "",
      pricingType: "fixed",
      pricePerMeter: "",
      category: "home-decor",
      images: "",
      isActive: true,
      sortOrder: 0,
    });
    setSpecMaterial("");
    setSpecDimensions("");
    setSpecFinish("");
    setSpecCare("");
  };

  const [directImageUrl, setDirectImageUrl] = useState("");

  const handleAddDirectUrl = () => {
    const url = directImageUrl.trim();
    if (!url) return;
    const currentImages = parseProductImages(form.images);
    const newImages = [...currentImages, url];
    setForm({ ...form, images: serializeProductImages(newImages) });
    setDirectImageUrl("");
    toast.success("تمت إضافة رابط الصورة بنجاح");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("يرجى اختيار ملف صورة صالح");
      return;
    }

    setUploading(true);

    try {
      const optimized = await compressImageFile(file);
      uploadImage.mutate({
        filename: optimized.filename,
        base64: optimized.base64,
        contentType: optimized.contentType,
      });
    } catch (err: any) {
      setUploading(false);
      toast.error(err?.message || "تعذر معالجة الصورة، يرجى المحاولة مرة أخرى");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.isActive && !hasProductImage(form.images)) {
      toast.error("تنبيه: لتفعيل المنتج ونشره في المتجر يجب إضافة صورة واحدة على الأقل، أو يمكنك إلغاء تفعيل 'منتج نشط' لحفظ التعديلات كمسودة الآن.");
      return;
    }
    const origPriceNum = form.originalPrice ? parseFloat(form.originalPrice) : null;
    const data = {
      name: form.name,
      nameAr: form.nameAr,
      description: form.description || undefined,
      price: parseFloat(form.price),
      originalPrice: origPriceNum !== null && !isNaN(origPriceNum) && origPriceNum > 0 ? origPriceNum : null,
      sizes: form.sizes || undefined,
      colors: form.colors || undefined,
      sizeOptions: serializeSizeOptions(sizeRows) || undefined,
      colorOptions: serializeColorOptions(colorRows) || undefined,
      pricingType: form.pricingType as "fixed" | "per_meter",
      pricePerMeter: form.pricingType === "per_meter" && form.pricePerMeter ? parseFloat(form.pricePerMeter) : undefined,
      category: form.category,
      specifications: serializeSpecifications() || undefined,
      images: form.images || undefined,
      isActive: form.isActive ? "yes" as const : "no" as const,
      sortOrder: form.sortOrder,
    };

    if (editId) {
      updateProduct.mutate({ id: editId, ...data });
    } else {
      createProduct.mutate(data);
    }
  };

  const openEdit = (product: any) => {
    setEditId(product.id);
    setForm({
      name: product.name,
      nameAr: product.nameAr,
      description: product.description || "",
      price: String(product.price ?? ""),
      originalPrice: (product as any).originalPrice ? String((product as any).originalPrice) : "",
      sizes: product.sizes || "",
      colors: product.colors || "",
      sizeOptions: product.sizeOptions || "",
      colorOptions: product.colorOptions || "",
      pricingType: product.pricingType === "per_meter" ? "per_meter" : "fixed",
      pricePerMeter: product.pricePerMeter ? String(product.pricePerMeter) : "",
      category: product.category || "home-decor",
      images: product.images || "",
      isActive: product.isActive === "yes",
      sortOrder: product.sortOrder || 0,
    });
    hydrateSpecifications(product.specifications);
    setOpen(true);
  };

  const removeImage = (index: number) => {
    const currentImages = parseProductImages(form.images);
    currentImages.splice(index, 1);
    setForm({ ...form, images: serializeProductImages(currentImages) });
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return <div className="p-8 text-center">ليس لديك صلاحية الوصول</div>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">إدارة المنتجات</h1>
          <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) { resetForm(); setEditId(null); } }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="ml-2 h-4 w-4" />
                إضافة منتج
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editId ? "تعديل المنتج" : "إضافة منتج جديد"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>اسم المنتج (عربي)</Label>
                  <Input
                    value={form.nameAr}
                    onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                    required
                    placeholder="مثال: لوحة قرآن كريم"
                  />
                </div>
                <div className="space-y-2">
                  <Label>اسم المنتج (إنجليزي)</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    placeholder="e.g. Quran Calligraphy Panel"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الوصف</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="وصف المنتج..."
                    rows={3}
                  />
                </div>
                <div className="rounded-md border bg-muted/40 p-3">
                  <Label className="mb-2 block">مواصفات تفصيلية (تظهر كجدول مواصفات في صفحة المنتج)</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">المادة</Label>
                      <Input value={specMaterial} onChange={(e) => setSpecMaterial(e.target.value)} placeholder="مثال: ستيل مطلي إلكتروستاتيك" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">الأبعاد (سم)</Label>
                      <Input value={specDimensions} onChange={(e) => setSpecDimensions(e.target.value)} placeholder="مثال: 60×80 سم" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">التشطيب / الطلاء</Label>
                      <Input value={specFinish} onChange={(e) => setSpecFinish(e.target.value)} placeholder="مثال: دهان إلكتروستاتيك ذهبي" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">العناية بالتنظيف</Label>
                      <Input value={specCare} onChange={(e) => setSpecCare(e.target.value)} placeholder="مثال: يمسح بقطنة قماش ناعمة" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700">السعر قبل الخصم (ج.م)</span>
                      <span className="text-[11px] text-muted-foreground font-normal">(اختياري - في حال وجود خصم)</span>
                    </Label>
                    <Input
                      type="number"
                      value={form.originalPrice}
                      onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                      min="0"
                      placeholder="مثال: 2500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center justify-between">
                      <span className="font-bold text-amber-700">السعر بعد الخصم / سعر البيع (ج.م) *</span>
                      <span className="text-[11px] text-emerald-600 font-medium">(السعر الفعلي المطلوب)</span>
                    </Label>
                    <Input
                      type="number"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      required
                      min="0"
                      placeholder="مثال: 1950"
                    />
                  </div>
                </div>

                {/* مؤشر الخصم المباشر التفاعلي */}
                {(() => {
                  const orig = parseFloat(form.originalPrice);
                  const curr = parseFloat(form.price);
                  if (!isNaN(orig) && !isNaN(curr) && orig > curr && curr > 0) {
                    const diff = Math.round(orig - curr);
                    const pct = Math.round((diff / orig) * 100);
                    return (
                      <div className="rounded-xl border border-emerald-300 bg-emerald-50/80 p-3 text-xs text-emerald-900 flex flex-wrap items-center justify-between gap-2 shadow-sm">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-emerald-600 text-white font-bold px-2 py-0.5 text-[11px]">
                            خصم {pct}%
                          </span>
                          <span className="font-medium">
                            سيظهر للعميل كعرض تخفيض مع شطب السعر الأصلي ({orig.toLocaleString()} ج.م).
                          </span>
                        </div>
                        <span className="font-bold text-emerald-700">
                          قيمة التوفير: {diff.toLocaleString()} ج.م
                        </span>
                      </div>
                    );
                  }
                  if (!isNaN(orig) && !isNaN(curr) && orig <= curr && orig > 0) {
                    return (
                      <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-2 text-xs text-amber-800">
                        ⚠️ ملاحظة: السعر قبل الخصم أصغر من أو يساوي سعر البيع. لن تظهر شارة الخصم للعميل إلا إذا كان السعر قبل الخصم أعلى من سعر البيع.
                      </div>
                    );
                  }
                  return null;
                })()}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الفئة</Label>
                    <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الفئة" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((category) => (
                          <SelectItem key={category.id} value={category.slug}>
                            {category.nameAr} — {category.nameEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">يمكنك إضافة أو تعديل الفئات من قسم «الفئات» في القائمة.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>نوع التسعير</Label>
                    <Select value={form.pricingType} onValueChange={(value) => setForm({ ...form, pricingType: value })}>
                      <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">سعر ثابت</SelectItem>
                        <SelectItem value="per_meter">تسعير بالمتر (للتنفيذ حسب الطلب)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {form.pricingType === "per_meter" ? (
                    <div className="space-y-2">
                      <Label>سعر المتر (ج.م)</Label>
                      <Input
                        type="number"
                        value={form.pricePerMeter}
                        onChange={(e) => setForm({ ...form, pricePerMeter: e.target.value })}
                        min="0"
                        placeholder="مثال: 450"
                      />
                      <p className="text-xs text-muted-foreground">السعر الابتدائي للمتر. السعر النهائي يحسب من قياسات العميل.</p>
                    </div>
                  ) : null}
                </div>
                <div className="flex items-end gap-3 rounded-md border bg-muted/40 p-3">
                  <div className="space-y-2 flex-1">
                    <Label>سعر المتر المربع (ج.م) — للحساب التلقائي</Label>
                    <Input
                      type="number"
                      min="100"
                      max="100000"
                      value={sqmInput}
                      placeholder="مثال: 3000"
                      onChange={(e) => setSqmInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveSqm(); } }}
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={savingSqm || Number.isNaN(Number(sqmInput)) || Number(sqmInput) < 100}
                    onClick={saveSqm}
                  >
                    {savingSqm ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    حفظ سعر المتر
                  </Button>
                  <p className="hidden md:block text-xs text-muted-foreground pb-2">
                    السعر الحالي: {sqmSetting.toLocaleString("en-US")} ج.م/م² — يُستخدم تلقائيًا لحساب أسعار المقاسات في المنتجات.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="!mb-0">المقاسات بأسماء وأسعار (حتى ثلاثة مقاسات)</Label>
                    {sizeRows.length < 3 ? (
                      <Button type="button" size="sm" variant="outline" onClick={addSizeRow}>
                        <Plus className="ml-1 h-3.5 w-3.5" /> مقاس
                      </Button>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    {sizeRows.map((row, i) => {
                      const sqm = sqmPriceFor(row.labelAr);
                      return (
                        <div key={i} className="grid grid-cols-12 gap-1.5 items-center">
                          <Input
                            className="col-span-4"
                            value={row.labelAr}
                            placeholder="مثال: 60×60 سم"
                            onChange={(e) => {
                              const label = e.target.value;
                              let next = { ...row, labelAr: label };
                              if (row.autoPrice) next = { ...next, price: sqmPriceFor(label) !== null ? String(sqmPriceFor(label)) : "0" };
                              const rows = sizeRows.map((r, j) => (j === i ? next : r));
                              setForm({ ...form, sizeOptions: serializeSizeOptions(rows) });
                            }}
                          />
                          <Input
                            className="col-span-3"
                            value={row.labelEn}
                            placeholder="e.g. 60×60 cm"
                            onChange={(e) => {
                              const rows = sizeRows.map((r, j) => (j === i ? { ...r, labelEn: e.target.value } : r));
                              setForm({ ...form, sizeOptions: serializeSizeOptions(rows) });
                            }}
                          />
                          <Input
                            className="col-span-3"
                            type="number"
                            min="0"
                            value={row.price === "auto" ? "" : row.price}
                            placeholder={sqm !== null ? `تلقائي ≈ ${sqm.toLocaleString("en-US")}` : "السعر ج.م"}
                            onChange={(e) => {
                              const rows = sizeRows.map((r, j) => (j === i ? { ...r, price: e.target.value, autoPrice: false } : r));
                              setForm({ ...form, sizeOptions: serializeSizeOptions(rows) });
                            }}
                          />
                          <div className="col-span-2 flex items-center gap-1">
                            <Button type="button" size="sm" variant="outline" onClick={() => {
                              const next = { ...row, autoPrice: !row.autoPrice };
                              if (next.autoPrice && sqm !== null) next.price = String(sqm);
                              const rows = sizeRows.map((r, j) => (j === i ? next : r));
                              setForm({ ...form, sizeOptions: serializeSizeOptions(rows) });
                            }} title={`احسب السعر تلقائيًا: م² × ${sqmSetting.toLocaleString("en-US")} ج`}>
                              {sqm !== null ? <>{row.autoPrice ? `✓ ${sqm.toLocaleString("en-US")}` : sqm.toLocaleString("en-US")}</> : `م²×${sqmSetting.toLocaleString("en-US")}`}
                            </Button>
                            <button type="button" onClick={() => removeSizeRow(i)} className="text-red-500 hover:text-red-700" title="حذف">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {!sizeRows.length ? <p className="text-xs text-muted-foreground">لا توجد مقاسات — أضف حتى 3 مقاسات، ولكل مقاس سعره الخاص أو احسبه تلقائيًا (م² × {sqmSetting.toLocaleString("en-US")} ج).</p> : null}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <Label className="!mb-0">ألوان الاستيل المتاحة (ذهبي - سيلفر - أسود)</Label>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="text-xs h-7"
                        onClick={() => {
                          const standard = [
                            { labelAr: "ذهبي ملكي PVD", labelEn: "Royal Gold PVD", hex: "#D4AF37" },
                            { labelAr: "سيلفر / فضي كروم", labelEn: "Silver Chrome", hex: "#C0C0C0" },
                            { labelAr: "أسود مطفي فاخر", labelEn: "Luxury Matte Black", hex: "#1F1F1F" },
                          ];
                          setForm({ ...form, colorOptions: serializeColorOptions(standard) });
                        }}
                      >
                        الألوان الثلاثة القياسية
                      </Button>
                      {colorRows.length < 3 ? (
                        <Button type="button" size="sm" variant="outline" className="h-7" onClick={addColorRow}>
                          <Plus className="ml-1 h-3.5 w-3.5" /> لون
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {colorRows.map((row, i) => (
                      <div key={i} className="grid grid-cols-12 gap-1.5 items-center">
                        <Input
                          className="col-span-4"
                          value={row.labelAr}
                          placeholder="مثال: ذهبي"
                          onChange={(e) => {
                            const rows = colorRows.map((r, j) => (j === i ? { ...r, labelAr: e.target.value } : r));
                            setForm({ ...form, colorOptions: serializeColorOptions(rows) });
                          }}
                        />
                        <Input
                          className="col-span-3"
                          value={row.labelEn}
                          placeholder="e.g. Gold"
                          onChange={(e) => {
                            const rows = colorRows.map((r, j) => (j === i ? { ...r, labelEn: e.target.value } : r));
                            setForm({ ...form, colorOptions: serializeColorOptions(rows) });
                          }}
                        />
                        <input
                          type="color"
                          value={row.hex}
                          onChange={(e) => {
                            const rows = colorRows.map((r, j) => (j === i ? { ...r, hex: e.target.value } : r));
                            setForm({ ...form, colorOptions: serializeColorOptions(rows) });
                          }}
                          className="col-span-2 h-9 w-full rounded border cursor-pointer"
                        />
                        <span className="col-span-2 text-xs text-muted-foreground truncate">{row.hex}</span>
                        <button type="button" onClick={() => removeColorRow(i)} className="col-span-1 text-red-500 hover:text-red-700" title="حذف">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {!colorRows.length ? <p className="text-xs text-muted-foreground">لا توجد ألوان — أضف حتى 3 ألوان لتظهر للعميل كأزرار بأيقونة دائرية.</p> : null}
                  </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-2 rounded-lg border p-3 bg-muted/10">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold">صور المنتج</Label>
                    <span className="text-xs text-muted-foreground">
                      {parseProductImages(form.images).length} صورة مضافة
                    </span>
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">
                    يمكنك رفع صور مباشرة من الموبايل (الكاميرا أو المعرض) أو اللابتوب. صورة الغلاف الأولى هي التي تظهر في الكتالوج.
                  </p>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={uploading}
                        className="flex-1 cursor-pointer"
                      />
                    </div>

                    <div className="flex gap-2 items-center">
                      <Input
                        value={directImageUrl}
                        onChange={(e) => setDirectImageUrl(e.target.value)}
                        placeholder="أو الصق رابط صورة مباشر (https://...)"
                        className="text-xs"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleAddDirectUrl}
                        disabled={!directImageUrl.trim()}
                        className="whitespace-nowrap text-xs"
                      >
                        إضافة رابط
                      </Button>
                    </div>

                    {uploading && (
                      <div className="flex items-center gap-2 text-sm text-amber-600 font-medium">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        جاري معالجة ورفع الصورة وحفظها بالسيرفر...
                      </div>
                    )}
                    {parseProductImages(form.images).length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {parseProductImages(form.images).map((img, i) => (
                          <div key={i} className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
                            <img src={img} alt={`صورة ${i + 1}`} className="w-full h-full object-cover" />
                            {i === 0 ? <span className="absolute bottom-1 left-1 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">الغلاف</span> : null}
                            <button
                              type="button"
                              onClick={() => removeImage(i)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow"
                              title="حذف الصورة"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/20">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold cursor-pointer" htmlFor="product-active-switch">
                      منتج نشط في المتجر
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {form.isActive ? (
                        hasProductImage(form.images) ? (
                          <span className="text-emerald-600 font-medium">✓ المنتج منشور ومتاح للشراء في المتجر</span>
                        ) : (
                          <span className="text-amber-600 font-medium">⚠️ يحتاج صورة واحدة على الأقل ليظهر للعملاء في الكتالوج</span>
                        )
                      ) : (
                        <span>مسودة غير معروضة في المتجر (يمكنك الحفظ الآن كمسودة)</span>
                      )}
                    </p>
                  </div>
                  <Switch
                    id="product-active-switch"
                    checked={form.isActive}
                    onCheckedChange={(val) => setForm({ ...form, isActive: val })}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={createProduct.isPending || updateProduct.isPending}>
                  {(createProduct.isPending || updateProduct.isPending) ? (
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  ) : (
                    editId ? "تحديث المنتج" : "إضافة المنتج"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : products && products.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>الصورة</TableHead>
                      <TableHead>الاسم</TableHead>
                      <TableHead>الفئة</TableHead>
                      <TableHead>السعر</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => {
                      const images = parseProductImages(product.images);
                      return (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.id}</TableCell>
                          <TableCell>
                            {images[0] ? (
                              <img src={images[0]} alt={product.nameAr} className="w-12 h-12 object-cover rounded-lg" />
                            ) : (
                              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                                <Image className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">{product.nameAr}</p>
                            <p className="text-xs text-muted-foreground">{product.name}</p>
                          </TableCell>
                          <TableCell>{categories?.find((category) => category.slug === product.category)?.nameAr || product.category || "—"}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-bold text-amber-600">{product.price} ج.م</span>
                              {(product as any).originalPrice && Number((product as any).originalPrice) > Number(product.price) && (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-xs text-muted-foreground line-through">
                                    {(product as any).originalPrice} ج.م
                                  </span>
                                  <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1 rounded">
                                    {Math.round((((Number((product as any).originalPrice) - Number(product.price)) / Number((product as any).originalPrice)) * 100))}%-
                                  </span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={product.isActive === "yes" ? "default" : "secondary"}>
                              {product.isActive === "yes" ? "منشور" : "غير منشور"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (product.isActive === "yes") {
                                    toggleActive.mutate({ id: product.id, isActive: "no" });
                                  } else {
                                    if (!hasProductImage(product.images || "")) {
                                      toast.error("أضف صورة واحدة على الأقل قبل نشر المنتج");
                                      return;
                                    }
                                    toggleActive.mutate({ id: product.id, isActive: "yes" });
                                  }
                                }}
                                title={product.isActive === "yes" ? "إيقاف المنتج (إخفاءه عن المتجر)" : "نشر المنتج في المتجر"}
                              >
                                {product.isActive === "yes" ? (
                                  <EyeOff className="h-4 w-4 text-amber-600" />
                                ) : (
                                  <Eye className="h-4 w-4 text-emerald-600" />
                                )}
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => openEdit(product)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
                                    deleteProduct.mutate({ id: product.id });
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Image className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg">لا توجد منتجات</p>
                <p className="text-sm mt-2">أضف أول منتج من الزر أعلاه</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
