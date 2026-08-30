import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Facebook, Instagram, Send, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";

export default function AdminSettings() {
  const utils = trpc.useUtils();
  const { data: contact, isLoading } = trpc.contactInfo.get.useQuery();
  const updateMutation = trpc.contactInfo.update.useMutation({
    onSuccess: () => {
      utils.contactInfo.get.invalidate();
      toast.success("تم حفظ إعدادات التواصل");
    },
    onError: (error) => toast.error("فشل الحفظ: " + error.message),
  });

  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [telegramUrl, setTelegramUrl] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsAppMessage, setWhatsAppMessage] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (contact) {
      setFacebookUrl(contact.facebookUrl);
      setInstagramUrl(contact.instagramUrl);
      setTelegramUrl(contact.telegramUrl);
      setWhatsappNumber(contact.whatsappNumber);
      setWhatsAppMessage(contact.whatsAppMessage);
      setPhone(contact.phone);
    }
  }, [contact]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      facebookUrl,
      instagramUrl,
      telegramUrl,
      whatsappNumber,
      whatsAppMessage,
      phone,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          إعدادات التواصل ووسائل التواصل
        </h1>
        <p className="text-muted-foreground mt-1">
          عدّل روابط فيسبوك والواتساب وأرقام التواصل. التغييرات تظهر على الموقع فوراً.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>روابط التواصل</CardTitle>
          <CardDescription>
            أضف رابط صفحة فيسبوك ليظهر في الشريط العلوي والتذييل والزر العائم.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Facebook className="h-4 w-4 text-blue-600" />
                رابط صفحة فيسبوك
              </Label>
              <Input
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
                placeholder="https://www.facebook.com/..."
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Instagram className="h-4 w-4 text-pink-600" />
                رابط إنستجرام (اختياري)
              </Label>
              <Input
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://www.instagram.com/..."
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Send className="h-4 w-4 text-sky-500" />
                رابط تليجرام (اختياري)
              </Label>
              <Input
                value={telegramUrl}
                onChange={(e) => setTelegramUrl(e.target.value)}
                placeholder="https://t.me/..."
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-green-600" />
                رقم الواتساب (واتساب أعمال)
              </Label>
              <Input
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="01118182424"
                dir="ltr"
              />
              <p className="text-xs text-muted-foreground">اكتب الرقم بصيغة 0XXXXXXXXXX</p>
            </div>
            <div className="space-y-2">
              <Label>الرسالة الافتراضية في واتساب (اختياري)</Label>
              <Textarea
                value={whatsAppMessage}
                onChange={(e) => setWhatsAppMessage(e.target.value)}
                placeholder="مرحباً، أود الاستفسار عن منتجاتكم..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                رقم الهاتف (اختياري)
              </Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01118182424"
                dir="ltr"
              />
            </div>
            <Button type="submit" disabled={updateMutation.isPending} className="gap-2">
              {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4" />
              حفظ الإعدادات
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
