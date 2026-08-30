import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Loader2, Trash2, Images, ShoppingBag, Eye, X } from "lucide-react";
import { toast } from "sonner";

export default function AdminMedia() {
  const utils = trpc.useUtils();
  const { data: productImages, isLoading: loadingProducts } = trpc.mediaLibrary.productImages.useQuery();
  const { data: galleryImages, isLoading: loadingGallery } = trpc.mediaLibrary.galleryImages.useQuery();

  const removeProductMutation = trpc.mediaLibrary.removeProductImage.useMutation({
    onSuccess: (res, vars) => {
      utils.mediaLibrary.productImages.invalidate();
      toast.success("تم حذف الصورة من المنتج");
      if (res.remainingCount === 0) {
        toast.warning("هذا المنتج أصبح بلا صور — سيُعرض العنصر البديل");
      }
      setSelectedProduct(null);
    },
    onError: (error) => toast.error("فشل الحذف: " + error.message),
  });
  const removeGalleryMutation = trpc.mediaLibrary.removeGalleryImage.useMutation({
    onSuccess: () => {
      utils.mediaLibrary.galleryImages.invalidate();
      toast.success("تم حذف الصورة من المعرض");
      setDeleteGalleryId(null);
    },
    onError: (error) => toast.error("فشل الحذف: " + error.message),
  });

  const [selectedProduct, setSelectedProduct] = useState<{ productId: number; url: string } | null>(null);
  const [deleteGalleryId, setDeleteGalleryId] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Images className="h-6 w-6 text-primary" />
          مكتبة الصور
        </h1>
        <p className="text-muted-foreground mt-1">
          احذف أي صورة من الموقع: صور منتجات، صور معرض الأعمال. الصور المحذوفة لا يمكن استعادتها.
        </p>
      </div>

      <Tabs defaultValue="products">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="products" className="gap-2">
            <ShoppingBag className="h-4 w-4" />
            صور المنتجات ({productImages?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="gallery" className="gap-2">
            <Images className="h-4 w-4" />
            معرض الأعمال ({galleryImages?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <Card>
            <CardContent className="pt-6">
              {loadingProducts ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : productImages && productImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {productImages.map(img => (
                    <div key={`${img.productId}-${img.url}`} className="group relative rounded-lg border overflow-hidden bg-muted">
                      <button
                        type="button"
                        onClick={() => setPreviewUrl(img.url)}
                        className="w-full aspect-square"
                        title="معاينة"
                      >
                        <img
                          src={img.url}
                          alt={img.productNameAr || img.productName}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </button>
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-xs text-white truncate">
                          {img.productNameAr || img.productName}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 bg-white/90 hover:bg-white text-foreground"
                            onClick={() => setPreviewUrl(img.url)}
                            title="معاينة"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => setSelectedProduct({ productId: img.productId, url: img.url })}
                            title="حذف الصورة"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>لا توجد صور منتجات</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gallery">
          <Card>
            <CardContent className="pt-6">
              {loadingGallery ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : galleryImages && galleryImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {galleryImages.map(img => (
                    <div key={img.galleryId} className="group relative rounded-lg border overflow-hidden bg-muted">
                      <button
                        type="button"
                        onClick={() => setPreviewUrl(img.url)}
                        className="w-full aspect-square"
                        title="معاينة"
                      >
                        <img
                          src={img.url}
                          alt={img.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </button>
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-xs text-white truncate">{img.title}</p>
                        <div className="flex items-center justify-between mt-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 bg-white/90 hover:bg-white text-foreground"
                            onClick={() => setPreviewUrl(img.url)}
                            title="معاينة"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => setDeleteGalleryId(img.galleryId)}
                            title="حذف الصورة"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Images className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>لا توجد صور في المعرض</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview dialog */}
      <AlertDialog open={previewUrl !== null} onOpenChange={open => !open && setPreviewUrl(null)}>
        <AlertDialogContent className="max-w-3xl p-0 overflow-hidden">
          <button
            type="button"
            onClick={() => setPreviewUrl(null)}
            className="absolute top-2 left-2 z-10 h-8 w-8 rounded-full bg-black/60 text-white flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
          {previewUrl && (
            <img src={previewUrl} alt="معاينة" className="w-full h-auto max-h-[80vh] object-contain" />
          )}
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm dialogs */}
      <AlertDialog open={selectedProduct !== null} onOpenChange={open => !open && setSelectedProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف صورة المنتج</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذه الصورة؟ لن تظهر في صفحة المنتج ولا في البطاقات.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => selectedProduct && removeProductMutation.mutate(selectedProduct)}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteGalleryId !== null} onOpenChange={open => !open && setDeleteGalleryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف صورة من المعرض</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذه الصورة من معرض الأعمال؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteGalleryId !== null && removeGalleryMutation.mutate({ galleryId: deleteGalleryId })}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
