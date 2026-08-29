import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { formatPrice } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, TrendingUp, DollarSign, ShoppingBag, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminReports() {
  const { data: report, isLoading } = trpc.reports.orderReport.useQuery();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#24211d]">تقارير المبيعات والأداء المالي</h1>
          <p className="text-sm text-muted-foreground mt-1">إحصائيات الإيرادات الشهرية، المنتجات الأكثر طلباً، ومصادر التحويل الإعلاني.</p>
        </div>

        {/* Stats KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-muted-foreground">إجمالي الإيرادات</CardTitle>
              <DollarSign className="h-4 w-4 text-[#a8822d]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-[#24211d]" dir="ltr">
                {formatPrice(report?.totals?.revenue || 0)} ج.م
              </div>
              <p className="text-xs text-muted-foreground mt-1">من كافة الطلبات المؤكدة والمسلمة</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-muted-foreground">إجمالي الطلبات الناجحة</CardTitle>
              <ShoppingBag className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-[#24211d]">
                {report?.totals?.orderCount || 0} طلب
              </div>
              <p className="text-xs text-muted-foreground mt-1">طلب مكتمل</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-muted-foreground">متوسط قيمة الطلب</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-[#24211d]" dir="ltr">
                {formatPrice(
                  report?.totals?.orderCount
                    ? Number(report.totals.revenue || 0) / Number(report.totals.orderCount)
                    : 0
                )} ج.م
              </div>
              <p className="text-xs text-muted-foreground mt-1">AOV المتوسط</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue by Month Table */}
        <Card>
          <CardHeader>
            <CardTitle>الإيرادات الشهرية</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-[#d5af58]" />
              </div>
            ) : report?.revenueByMonth && report.revenueByMonth.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الشهر</TableHead>
                    <TableHead>عدد الطلبات</TableHead>
                    <TableHead>إجمالي المبيعات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.revenueByMonth.map((m: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-bold">{m.month}</TableCell>
                      <TableCell>{m.count} طلب</TableCell>
                      <TableCell font-black dir="ltr">{formatPrice(m.total)} ج.م</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center py-8 text-muted-foreground">لا توجد بيانات مبيعات كافية بعد.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
