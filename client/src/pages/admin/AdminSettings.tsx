import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, Phone, Mail, MapPin, DollarSign, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminSettings() {
  const { data: settings, isLoading, refetch } = trpc.settings.list.useQuery();

  const [form, setForm] = useState({
    siteName: "Elnour Homes",
    businessPhone: "01121748885",
    notificationEmail: "ahmadhashemalam964@gmail.com",
    globalMeterPrice: 3500,
    address: "جمهورية مصر العربية - التوصيل لكافة المحافظات",
  });

  useEffect(() => {
    if (settings) {
      const sMap: Record<string, string> = {};
      settings.forEach((item: any) => {
        sMap[item.key] = item.value;
      });
      setForm((prev) => ({
        ...prev,
        siteName: sMap["site_name"] || prev.siteName,
        businessPhone: sMap["business_phone"] || prev.businessPhone,
        notificationEmail: sMap["notification_email"] || prev.notificationEmail,
        globalMeterPrice: sMap["global_meter_price"] ? Number(sMap["global_meter_price"]) : prev.globalMeterPrice,
        address: sMap["address"] || prev.address,
      }));
    }
  }, [settings]);

  const updateSetting = trpc.settings.update.useMutation({
    onSuccess: () => {
      toast.success("تم حفظ وتحديث الإعدادات بنجاح");
      void refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSetting.mutate({
      settings: [
        { key: "site_name", value: form.siteName },
        { key: "business_phone", value: form.businessPhone },
        { key: "notification_email", value: form.notificationEmail },
        { key: "global_meter_price", value: String(form.globalMeterPrice) },
        { key: "address", value: form.address },
      ],
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#24211d]">إعدادات المتجر العامة</h1>
          <p className="text-sm text-muted-foreground mt-1">تحديد رقم التواصل الموحد، سعر المتر الأساسي، وبيانات الإشعارات.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>بيانات التواصل والمتجر</CardTitle>
              <CardDescription>البيانات التي تظهر للعملاء في الهيدر والفوتر ورسائل الواتساب.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold block mb-1.5">اسم المتجر / البراند</label>
                  <Input value={form.siteName} onChange={(e) => setForm({ ...form, siteName: e.target.value })} required />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1.5">رقم الهاتف والواتساب الموحد *</label>
                  <Input dir="ltr" value={form.businessPhone} onChange={(e) => setForm({ ...form, businessPhone: e.target.value })} required />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold block mb-1.5">بريد استلام إشعارات الطلبات *</label>
                  <Input dir="ltr" value={form.notificationEmail} onChange={(e) => setForm({ ...form, notificationEmail: e.target.value })} required />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1.5">السعر الافتراضي للمتر المربع (ج.م)</label>
                  <Input type="number" value={form.globalMeterPrice} onChange={(e) => setForm({ ...form, globalMeterPrice: Number(e.target.value) })} required />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold block mb-1.5">العنوان ومناطق التغطية</label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={updateSetting.isPending} className="bg-[#24211d] text-white hover:bg-[#d5af58] hover:text-[#24211d] font-bold px-8 h-12 rounded-xl">
            <Save className="ml-2 h-4 w-4" />
            {updateSetting.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
}
