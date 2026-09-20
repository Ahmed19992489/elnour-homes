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
  Clock,
  CheckCircle2,
  XCircle,
  Banknote,
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

  const totals = report?.totals as {
    totalOrders?: number;
    totalRevenue?: number;
    deliveredRevenue?: number;
    pendingRevenue?: number;
    cancelledRevenue?: number;
    grossSales?: number;
    deliveredOrders?: number;
    pendingOrders?: number;
    cancelledOrders?: number;
    uniqueCustomers?: number;
  } | undefined;

  const deliveredRevenue = totals?.deliveredRevenue ?? totals?.totalRevenue ?? 0;
  const pendingRevenue = totals?.pendingRevenue ?? 0;
  const grossSales = totals?.grossSales ?? 0;
  const totalOrders = totals?.totalOrders ?? 0;
  const deliveredOrders = totals?.deliveredOrders ?? 0;
  const pendingOrders = totals?.pendingOrders ?? 0;
  const cancelledOrders = totals?.cancelledOrders ?? 0;
  const totalCustomers = totals?.uniqueCustomers ?? 0;
  const cancelledRevenue = totals?.cancelledRevenue ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-[#ad842f]" />
            التقارير والإحصائيات المالية
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            متابعة الإيرادات المحصلة بالخزينة، المبيعات قيد التحصيل، والمنتجات الأكثر طلباً
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
                  <SelectItem value="new">طلب جديد</SelectItem>
                  <SelectItem value="contacted">تم التواصل</SelectItem>
                  <SelectItem value="confirmed">تم التأكيد</SelectItem>
                  <SelectItem value="shipped">تم الشحن</SelectItem>
                  <SelectItem value="delivered">تم التسليم (محصل)</SelectItem>
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

      {/* Financial Totals */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: الإيرادات المحصلة (تم التسليم) */}
        <Card className="border-emerald-300 bg-gradient-to-br from-emerald-50/60 to-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-emerald-900">الإيراد المحصل الفعلي (الخزينة)</CardTitle>
            <Banknote className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-700">
              {formatPrice(deliveredRevenue)} <span className="text-sm font-medium text-emerald-800">ج.م</span>
            </div>
            <p className="mt-1 text-xs text-emerald-700 font-medium">
              للطلبات المسلّمة للعميل بالفعل ({deliveredOrders} طلب تم تسليمه)
            </p>
          </CardContent>
        </Card>

        {/* Card 2: مبيعات قيد التحصيل (مؤكدة وقيد الشحن والتوصيل) */}
        <Card className="border-amber-300 bg-gradient-to-br from-amber-50/60 to-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-amber-900">مبيعات قيد التحصيل والتسليم</CardTitle>
            <Clock className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-700">
              {formatPrice(pendingRevenue)} <span className="text-sm font-medium text-amber-800">ج.م</span>
            </div>
            <p className="mt-1 text-xs text-amber-700 font-medium">
              طلبات جديدة ومؤكدة وقيد الشحن ({pendingOrders} طلب جارٍ توصيله)
            </p>
          </CardContent>
        </Card>

        {/* Card 3: إجمالي قيمة المبيعات والطلبات */}
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي قيمة المبيعات (الكل)</CardTitle>
            <ShoppingCart className="h-5 w-5 text-[#ad842f]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#24211d]">
              {formatPrice(grossSales)} <span className="text-sm font-medium text-muted-foreground">ج.م</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              المحصلة + قيد التحصيل (إجمالي {totalOrders} طلب)
            </p>
          </CardContent>
        </Card>

        {/* Card 4: الطلبات الملغاة */}
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">الطلبات الملغاة</CardTitle>
            <XCircle className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatPrice(cancelledRevenue)} <span className="text-sm font-medium text-muted-foreground">ج.م</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {cancelledOrders} طلب ملغي — غير محسوبة في الخزينة
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by month */}
      {report?.revenueByMonth && report.revenueByMonth.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex flex-wrap items-center justify-between gap-2">
              <span>الإيرادات والمبيعات الشهرية</span>
              <span className="text-xs font-normal text-muted-foreground">مقارنة المبالغ المحصلة في الخزينة بالمبالغ قيد التحصيل</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الشهر</TableHead>
                    <TableHead>عدد الطلبات</TableHead>
                    <TableHead className="text-center font-bold text-emerald-800">المحصل بالخزينة (تم التسليم)</TableHead>
                    <TableHead className="text-center font-bold text-amber-800">قيد التحصيل والتسليم</TableHead>
                    <TableHead className="text-end font-bold">إجمالي المبيعات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.revenueByMonth.map((row: any) => {
                    const delivered = row.revenue || 0;
                    const pending = row.pendingRevenue || 0;
                    const totalMonth = delivered + pending;
                    return (
                      <TableRow key={row.month}>
                        <TableCell className="font-medium" dir="ltr">{row.month}</TableCell>
                        <TableCell>{formatPrice(row.orders)}</TableCell>
                        <TableCell className="text-center font-bold text-emerald-700">{formatPrice(delivered)} ج.م</TableCell>
                        <TableCell className="text-center font-bold text-amber-700">{formatPrice(pending)} ج.م</TableCell>
                        <TableCell className="text-end font-bold text-[#ad842f]">{formatPrice(totalMonth)} ج.م</TableCell>
                      </TableRow>
                    );
                  })}
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
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Package className="h-4 w-4 text-[#ad842f]" />
                المنتجات الأكثر طلباً وتحصيلاً
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>المنتج</TableHead>
                    <TableHead>إجمالي الطلبات</TableHead>
                    <TableHead className="text-center font-bold text-emerald-800">المحصل بالخزينة (تم التسليم)</TableHead>
                    <TableHead className="text-center font-bold text-amber-800">قيد التحصيل</TableHead>
                    <TableHead className="text-end font-bold">إجمالي القيمة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.topProducts.map((row: any, idx: number) => {
                    const delivered = row.revenue || 0;
                    const pending = row.pendingRevenue || 0;
                    const totalVal = row.totalValue || (delivered + pending);
                    return (
                      <TableRow key={row.id}>
                        <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="font-medium">{row.name || `منتج #${row.id}`}</TableCell>
                        <TableCell>
                          <span>{formatPrice(row.count)}</span>
                          {row.deliveredCount > 0 ? (
                            <span className="ms-2 rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-semibold text-emerald-800">
                              {row.deliveredCount} مسلّم
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-center font-bold text-emerald-700">{formatPrice(delivered)} ج.م</TableCell>
                        <TableCell className="text-center font-bold text-amber-700">{formatPrice(pending)} ج.م</TableCell>
                        <TableCell className="text-end font-bold text-[#ad842f]">{formatPrice(totalVal)} ج.م</TableCell>
                      </TableRow>
                    );
                  })}
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
