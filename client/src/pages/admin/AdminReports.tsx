import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart3,
  Download,
  Loader2,
  Package,
  TrendingUp,
  Users,
  ShoppingCart,
  CheckCheck,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const formatPrice = (n: number | string) => {
  const v = typeof n === "string" ? parseFloat(n) || 0 : n || 0;
  return v.toLocaleString("en-US", { maximumFractionDigits: 0 });
};

type Filter = {
  status: string;
  from: string;
  to: string;
};

export default function AdminReports() {
  const [filter, setFilter] = useState<Filter>({ status: "all", from: "", to: "" });
  const [exporting, setExporting] = useState(false);

  const { data: report, isLoading } = trpc.reports.orderReport.useQuery();
  const exportQuery = trpc.reports.exportOrders.useQuery(
    {
      status: filter.status === "all" ? undefined : filter.status,
      from: filter.from ? new Date(filter.from) : undefined,
      to: filter.to ? new Date(filter.to) : undefined,
    },
    { enabled: false, retry: false }
  );

  const handleExport = async () => {
    try {
      setExporting(true);
      const rows = await exportQuery.refetch();
      const data = rows.data;
      if (!data || data.length === 0) {
        toast.warning("لا توجد طلبات مطابقة للفلاتر المحددة");
        return;
      }
      const excelData = [
        [
          "رقم الطلب",
          "العميل",
          "الهاتف",
          "البريد",
          "العنوان",
          "المنتج",
          "المقاس",
          "اللون",
          "سعر القطعة (ج.م)",
          "الكوبون",
          "قيمة الخصم (ج.م)",
          "الإجمالي بعد الخصم (ج.م)",
          "كود الإحالة",
          "المصدر",
          "المصدر التسويقي (utm)",
          "الحالة",
          "ملاحظة العميل",
          "تاريخ الطلب",
        ],
        ...data.map((r) => [
          r.order_id,
          r.customer_name,
          r.customer_phone,
          r.customer_email,
          r.customer_address,
          r.product_name,
          r.selected_size,
          r.selected_color,
          r.order_value_egp,
          r.coupon_code,
          r.discount_egp,
          r.total_after_discount_egp,
          r.referral_code,
          r.order_source,
          r.utm_source || "",
          r.status_ar,
          r.message,
          new Date(r.created_at).toLocaleString("ar-EG"),
        ]),
      ];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(excelData);
      ws["!cols"] = [{ wch: 10 }, { wch: 18 }, { wch: 14 }, { wch: 24 }, { wch: 26 }, { wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 12 }, { wch: 20 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, ws, "Orders");
      const fileName = `elnour-orders-${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast.success(`تم تنزيل ملف ${fileName}`);
    } catch (err) {
      toast.error("فشل تصدير الطلبات — حاول مرة أخرى");
    } finally {
      setExporting(false);
    }
  };

  const totals = report?.totals;
  const totalRevenue = (totals as { totalOrders?: number; totalRevenue?: number; cancelledRevenue?: number; uniqueCustomers?: number } | undefined)?.totalRevenue ?? 0;
  const totalOrders = (totals as { totalOrders?: number; totalRevenue?: number; cancelledRevenue?: number; uniqueCustomers?: number } | undefined)?.totalOrders ?? 0;
  const totalCustomers = (totals as { totalOrders?: number; totalRevenue?: number; cancelledRevenue?: number; uniqueCustomers?: number } | undefined)?.uniqueCustomers ?? 0;
  const cancelledRevenue = (totals as { totalOrders?: number; totalRevenue?: number; cancelledRevenue?: number; uniqueCustomers?: number } | undefined)?.cancelledRevenue ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-[#ad842f]" />
            التقارير والإحصائيات
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            ملخص أداء المبيعات والمنتجات الأكثر طلبًا
          </p>
        </div>
        <Button onClick={handleExport} disabled={exporting || isLoading} className="bg-[#16a34a] hover:bg-[#15803d] text-white">
          {exporting ? <Loader2 className="h-4 w-4 animate-spin ms-1" /> : <Download className="h-4 w-4 ms-1" />}
          تنزيل Excel
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">فلترة التصدير</CardTitle>
          <CardDescription>اختر نطاق التصدير قبل تنزيل ملف Excel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>حالة الطلب</Label>
              <Select value={filter.status} onValueChange={(v) => setFilter({ ...filter, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="pending">قيد الانتظار</SelectItem>
                  <SelectItem value="confirmed">تم التأكيد</SelectItem>
                  <SelectItem value="preparing">قيد التجهيز</SelectItem>
                  <SelectItem value="shipped">تم الشحن</SelectItem>
                  <SelectItem value="delivered">تم التسليم</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>من تاريخ</Label>
              <Input type="date" value={filter.from} onChange={(e) => setFilter({ ...filter, from: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>إلى تاريخ</Label>
              <Input type="date" value={filter.to} onChange={(e) => setFilter({ ...filter, to: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Totals */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الإيرادات</CardTitle>
            <TrendingUp className="h-4 w-4 text-[#ad842f]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#24211d]">{formatPrice(totalRevenue)} <span className="text-sm font-medium text-muted-foreground">ج.م</span></div>
            <p className="text-xs text-muted-foreground mt-1">للطلبات المدفوعة المؤكدة</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الطلبات</CardTitle>
            <ShoppingCart className="h-4 w-4 text-[#ad842f]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#24211d]">{formatPrice(totalOrders)}</div>
            <p className="text-xs text-muted-foreground mt-1">منذ بداية التسجيل</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">العملاء المميزون</CardTitle>
            <Users className="h-4 w-4 text-[#ad842f]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#24211d]">{formatPrice(totalCustomers)}</div>
            <p className="text-xs text-muted-foreground mt-1">عملاء بإيميلات/هواتف فريدة</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">الإيرادات الملغاة</CardTitle>
            <CheckCheck className="h-4 w-4 text-[#ad842f]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatPrice(cancelledRevenue)} <span className="text-sm font-medium text-muted-foreground">ج.م</span></div>
            <p className="text-xs text-muted-foreground mt-1">قيمة الطلبات الملغاة — غير محسوبة ضمن الإيراد</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by month */}
      {report?.revenueByMonth && report.revenueByMonth.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">الإيرادات الشهرية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الشهر</TableHead>
                    <TableHead>الطلبات</TableHead>
                    <TableHead className="text-end">الإيراد (ج.م)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.revenueByMonth.map((row) => (
                    <TableRow key={row.month}>
                      <TableCell className="font-medium" dir="ltr">{row.month}</TableCell>
                      <TableCell>{formatPrice(row.orders)}</TableCell>
                      <TableCell className="text-end font-bold text-[#ad842f]">{formatPrice(row.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top products */}
      {report?.topProducts && report.topProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-[#ad842f]" />
              المنتجات الأكثر طلبًا
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>المنتج</TableHead>
                    <TableHead>الطلبات</TableHead>
                    <TableHead className="text-end">الإيراد (ج.م)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.topProducts.map((row, idx) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-medium">{row.name || `منتج #${row.id}`}</TableCell>
                      <TableCell>{formatPrice(row.count)}</TableCell>
                      <TableCell className="text-end font-bold text-[#ad842f]">{formatPrice(row.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sources */}
      {report?.sourceStats && report.sourceStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">مصادر الطلبات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.sourceStats.map((row) => (
                <div key={row.source || "مباشر"} className="flex items-center justify-between rounded-lg border border-[#e3dbc9] bg-[#fcfbf7] px-4 py-2.5">
                  <span className="text-sm font-medium capitalize">{row.source === "web" ? "الموقع المباشر" : row.source || "غير محدد"}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">{formatPrice(row.orders)} طلب</span>
                    <span className="text-sm font-bold text-[#ad842f]">{formatPrice(row.revenue)} ج.م</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
