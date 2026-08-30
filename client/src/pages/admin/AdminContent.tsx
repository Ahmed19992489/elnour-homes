import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, CheckCircle } from "lucide-react";
import { toast } from "sonner";

type SectionContent = {
  id: number;
  sectionKey: string;
  titleAr: string | null;
  titleEn: string | null;
  contentAr: string | null;
  contentEn: string | null;
  subtitleAr: string | null;
  subtitleEn: string | null;
};

const sectionLabels: Record<string, { ar: string; en: string }> = {
  hero: { ar: "الصفحة الرئيسية (الهيرو)", en: "Home Page (Hero)" },
  about: { ar: "من نحن", en: "About Us" },
  story: { ar: "قصتنا وتاريخنا", en: "Our Story & History" },
  work: { ar: "أعمالنا", en: "Our Work" },
};

export default function AdminContent() {
  const utils = trpc.useUtils();
  const { data: contentList, isLoading } = trpc.siteContent.list.useQuery();
  const updateMutation = trpc.siteContent.update.useMutation({
    onSuccess: () => {
      utils.siteContent.list.invalidate();
      toast.success("تم حفظ التعديلات بنجاح");
    },
    onError: (error) => {
      toast.error("فشل في حفظ التعديلات: " + error.message);
    },
  });

  const [activeSection, setActiveSection] = useState("about");
  const [formData, setFormData] = useState({
    titleAr: "", titleEn: "", contentAr: "", contentEn: "",
    subtitleAr: "", subtitleEn: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (contentList) {
      const section = contentList.find(c => c.sectionKey === activeSection);
      setFormData(section ? {
        titleAr: section.titleAr || "",
        titleEn: section.titleEn || "",
        contentAr: section.contentAr || "",
        contentEn: section.contentEn || "",
        subtitleAr: section.subtitleAr || "",
        subtitleEn: section.subtitleEn || "",
      } : {
        titleAr: "", titleEn: "", contentAr: "", contentEn: "", subtitleAr: "", subtitleEn: "",
      });
    }
  }, [contentList, activeSection]);

  const handleSave = () => {
    updateMutation.mutate({
      sectionKey: activeSection,
      ...formData,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">محتوى الموقع</h1>
        <p className="text-muted-foreground mt-1">
          عدّل محتوى الصفحات العامة: الرئيسية، من نحن، قصتنا، وأعمالنا.
        </p>
      </div>

      {/* Section Tabs */}
      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 md:grid-cols-4">
          {Object.entries(sectionLabels).map(([key, labels]) => (
            <TabsTrigger key={key} value={key} className="text-sm">
              {labels.ar}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(sectionLabels).map(([key, labels]) => (
          <TabsContent key={key} value={key}>
            <Card>
              <CardHeader>
                <CardTitle>{labels.ar} - {labels.en}</CardTitle>
                <CardDescription>
                  عدّل المحتوى بالعربي والإنجليزي. المحتوى العربي يظهر عندما يكون الموقع بالعربي، والإنجليزي عند التبديل للإنجليزية.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Arabic Content */}
                <div className="space-y-4 border rounded-lg p-4 bg-blue-50/50">
                  <h3 className="font-semibold text-blue-800">المحتوى بالعربي 🇪🇬</h3>
                  
                  <div className="space-y-2">
                    <Label>العنوان العربي</Label>
                    <Input
                      value={formData.titleAr}
                      onChange={(e) => setFormData(prev => ({ ...prev, titleAr: e.target.value }))}
                      placeholder="مثال: من نحن"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>العنوان الفرعي العربي</Label>
                    <Input
                      value={formData.subtitleAr}
                      onChange={(e) => setFormData(prev => ({ ...prev, subtitleAr: e.target.value }))}
                      placeholder="مثال: خبرة واحترافية"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>المحتوى العربي</Label>
                    <Textarea
                      value={formData.contentAr}
                      onChange={(e) => setFormData(prev => ({ ...prev, contentAr: e.target.value }))}
                      placeholder="اكتب محتوى القسم هنا..."
                      rows={5}
                    />
                  </div>
                </div>

                {/* English Content */}
                <div className="space-y-4 border rounded-lg p-4 bg-green-50/50">
                  <h3 className="font-semibold text-green-800">المحتوى بالإنجليزية 🇺🇸</h3>
                  
                  <div className="space-y-2">
                    <Label>English Title</Label>
                    <Input
                      value={formData.titleEn}
                      onChange={(e) => setFormData(prev => ({ ...prev, titleEn: e.target.value }))}
                      placeholder="e.g., About Us"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>English Subtitle</Label>
                    <Input
                      value={formData.subtitleEn}
                      onChange={(e) => setFormData(prev => ({ ...prev, subtitleEn: e.target.value }))}
                      placeholder="e.g., Expertise & Professionalism"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>English Content</Label>
                    <Textarea
                      value={formData.contentEn}
                      onChange={(e) => setFormData(prev => ({ ...prev, contentEn: e.target.value }))}
                      placeholder="Write the section content here..."
                      rows={5}
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex items-center gap-3">
                  <Button onClick={handleSave} disabled={updateMutation.isPending} className="gap-2">
                    {updateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : saved ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {updateMutation.isPending ? "جاري الحفظ..." : saved ? "تم الحفظ" : "حفظ التعديلات"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
