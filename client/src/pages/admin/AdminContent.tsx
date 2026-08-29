import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { toast } from "sonner";

export default function AdminContent() {
  const { data: contentList, isLoading, refetch } = trpc.content.list.useQuery();

  const [heroTitleAr, setHeroTitleAr] = useState("أرقى ديكورات وأعمال الاستيل الفاخرة");
  const [heroSubtitleAr, setHeroSubtitleAr] = useState("تصميم وتصنيع ترابيزات، مرايات، قواطع، وتجهيزات استانلس 304 بأعلى دقة.");
  const [aboutStoryAr, setAboutStoryAr] = useState("نحن في Elnour Homes نجمع بين دقة الهندسة وجمال الفن العصري لنقدم لك قطع ديكور استانلس تعيش معك عمراً كاملاً.");

  useEffect(() => {
    if (contentList) {
      const cMap: Record<string, string> = {};
      contentList.forEach((c: any) => {
        cMap[c.key] = c.value;
      });
      if (cMap["hero_title_ar"]) setHeroTitleAr(cMap["hero_title_ar"]);
      if (cMap["hero_subtitle_ar"]) setHeroSubtitleAr(cMap["hero_subtitle_ar"]);
      if (cMap["about_story_ar"]) setAboutStoryAr(cMap["about_story_ar"]);
    }
  }, [contentList]);

  const updateContent = trpc.content.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث نصوص المتجر بنجاح");
      void refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateContent.mutate({
      items: [
        { key: "hero_title_ar", value: heroTitleAr },
        { key: "hero_subtitle_ar", value: heroSubtitleAr },
        { key: "about_story_ar", value: aboutStoryAr },
      ],
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#24211d]">إدارة محتوى ونصوص المتجر</h1>
          <p className="text-sm text-muted-foreground mt-1">تعديل نصوص الصفحة الرئيسية وقسم من نحن والبانرات الترويجية.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>البانر الرئيسي (Hero Section)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-bold block mb-1.5">العنوان الرئيسي</label>
                <Input value={heroTitleAr} onChange={(e) => setHeroTitleAr(e.target.value)} required />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1.5">العنوان الفرعي / الوصف</label>
                <Textarea value={heroSubtitleAr} onChange={(e) => setHeroSubtitleAr(e.target.value)} rows={2} required />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>نبذة من نحن وقصة المصنع</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea value={aboutStoryAr} onChange={(e) => setAboutStoryAr(e.target.value)} rows={4} required />
            </CardContent>
          </Card>

          <Button type="submit" disabled={updateContent.isPending} className="bg-[#24211d] text-white hover:bg-[#d5af58] hover:text-[#24211d] font-bold px-8 h-12 rounded-xl">
            <Save className="ml-2 h-4 w-4" />
            {updateContent.isPending ? "جاري الحفظ..." : "حفظ النصوص"}
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
}
