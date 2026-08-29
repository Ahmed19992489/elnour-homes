import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UploadCloud, Copy, Check, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

export default function AdminMedia() {
  const [fileData, setFileData] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [uploadedUrl, setUploadedUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const uploadMedia = trpc.media.upload.useMutation({
    onSuccess: (data) => {
      setUploadedUrl(data.url);
      toast.success("تم رفع الصورة بنجاح وتوليد الرابط!");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = () => {
    if (!fileData) {
      toast.error("يرجى اختيار صورة أولاً");
      return;
    }
    uploadMedia.mutate({
      name: fileName,
      dataUrl: fileData,
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(uploadedUrl);
    setCopied(true);
    toast.success("تم نسخ الرابط إلى الحافظة!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#24211d]">مكتبة ورفع الوسائط والصور</h1>
          <p className="text-sm text-muted-foreground mt-1">رفع صور المنتجات والمشاريع والحصول على روابط مباشرة لاستخدامها في الكتالوج.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>رفع صورة جديدة</CardTitle>
            <CardDescription>اختر صورة من جهازك لرفعها فورياً.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-[#d5af58]/40 bg-[#faf8f5] rounded-3xl p-8 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d5af58]/15 text-[#a8822d]">
                <UploadCloud className="h-8 w-8" />
              </div>
              <div>
                <input
                  type="file"
                  id="media-file-input"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="media-file-input">
                  <Button type="button" variant="outline" className="font-bold border-[#d5af58] cursor-pointer" onClick={() => document.getElementById("media-file-input")?.click()}>
                    اختيار ملف صورة
                  </Button>
                </label>
                {fileName && <p className="text-xs font-bold text-[#24211d] mt-2">{fileName}</p>}
              </div>
            </div>

            {fileData && (
              <div className="flex justify-center">
                <img src={fileData} alt="Preview" className="max-h-48 rounded-xl object-contain border border-[#eee8dd]" />
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!fileData || uploadMedia.isPending}
              className="w-full bg-[#24211d] text-white hover:bg-[#d5af58] hover:text-[#24211d] font-bold h-12 rounded-xl"
            >
              {uploadMedia.isPending ? "جاري الرفع..." : "رفع الصورة الآن"}
            </Button>

            {uploadedUrl && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 space-y-2">
                <span className="text-xs font-bold text-emerald-800 block">رابط الصورة المباشر:</span>
                <div className="flex gap-2">
                  <Input dir="ltr" readOnly value={uploadedUrl} className="bg-white font-mono text-xs" />
                  <Button size="sm" onClick={handleCopy} className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold shrink-0">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
