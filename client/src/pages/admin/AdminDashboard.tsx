import React from "react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { formatPrice, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBag,
  Clock,
  Truck,
  CheckCircle2,
  Package,
  Layers,
  ArrowLeft,
  Loader2,
  Users,
  Eye,
  MessageCircle,
} from "lucide-react";

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const { data: stats, isLoading: statsLoading } = trpc.orders.stats.useQuery();
  const { data: orders, isLoading: ordersLoading } = trpc.orders.list.useQuery();

  const totalOrders =
    (stats?.new || 0) +
    (stats?.contacted || 0) +
    (stats?.confirmed || 0) +
    (stats?.shipped || 0) +
    (stats?.delivered || 0) +
    (stats?.cancelled || 0);

  const recentOrders = orders?.slice(0, 5) || [];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Banner */}
        <div className="rounded-3xl bg-[#24211d] text-[#f8f5ee] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#d5af58] uppercase tracking-wider">
                لوحة المتابعة والتحكم
              </span>
              <Badge variant="gold" className="text-[10px] px-2 py-0.5">
                {user?.role === "admin" ? "مدير النظام (Owner/Admin)" : "موظف المتجر (Moderator)"}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">
              أهلاً بك، {user?.name || (user?.role === "admin" ? "المدير العام" : "الموظف")}
            </h1>
            <p className="text-xs text-[#b8b0a2]">
              متابعة طلبات واستفسارات متجر Elnour Homes فورياً.
            </p>
          </div>

          <Link href="/admin/orders">
            <Button className="bg-[#d5af58] text-[#24211d] hover:bg-[#e0be6c] font-black rounded-xl text-sm">
              <ShoppingBag className="ml-2 h-4 w-4" />
              عرض كافة الطلبات
            </Button>
          </Link>
        </div>

        {/* Metric KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground">إجمالي الطلبات</CardTitle>
              <ShoppingBag className="h-4 w-4 text-[#a8822d]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-[#24211d]">{totalOrders}</div>
              <p className="text-[11px] text-muted-foreground mt-1">كافة الحجوزات المسجلة</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground">طلبات جديدة بانتظار التواصل</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-blue-700">{stats?.new || 0}</div>
              <p className="text-[11px] text-muted-foreground mt-1">تحتاج لتواصل سريع</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground">جاري التجهيز والشحن</CardTitle>
              <Truck className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-purple-700">{(stats?.confirmed || 0) + (stats?.shipped || 0)}</div>
              <p className="text-[11px] text-muted-foreground mt-1">قيد التصنيع والتسليم</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground">تم التسليم بنجاح</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-emerald-700">{stats?.delivered || 0}</div>
              <p className="text-[11px] text-muted-foreground mt-1">طلبات مكتملة</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Shortcuts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link href="/admin/products" className="group">
            <div className="p-4 rounded-2xl border border-[#e8e2d8] bg-white hover:border-[#d5af58] hover:shadow-md transition-all text-center">
              <Package className="h-6 w-6 mx-auto text-[#a8822d] group-hover:scale-110 transition-transform" />
              <span className="font-bold text-xs text-[#24211d] mt-2 block">إدارة المنتجات</span>
            </div>
          </Link>

          <Link href="/admin/categories" className="group">
            <div className="p-4 rounded-2xl border border-[#e8e2d8] bg-white hover:border-[#d5af58] hover:shadow-md transition-all text-center">
              <Layers className="h-6 w-6 mx-auto text-[#a8822d] group-hover:scale-110 transition-transform" />
              <span className="font-bold text-xs text-[#24211d] mt-2 block">إدارة الأقسام</span>
            </div>
          </Link>

          <Link href="/admin/gallery" className="group">
            <div className="p-4 rounded-2xl border border-[#e8e2d8] bg-white hover:border-[#d5af58] hover:shadow-md transition-all text-center">
              <Eye className="h-6 w-6 mx-auto text-[#a8822d] group-hover:scale-110 transition-transform" />
              <span className="font-bold text-xs text-[#24211d] mt-2 block">معرض الأعمال</span>
            </div>
          </Link>

          <Link href="/admin/coupons" className="group">
            <div className="p-4 rounded-2xl border border-[#e8e2d8] bg-white hover:border-[#d5af58] hover:shadow-md transition-all text-center">
              <Users className="h-6 w-6 mx-auto text-[#a8822d] group-hover:scale-110 transition-transform" />
              <span className="font-bold text-xs text-[#24211d] mt-2 block">كوبونات الخصم</span>
            </div>
          </Link>
        </div>

        {/* Recent Orders Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>أحدث الطلبات المستلمة</CardTitle>
              <CardDescription>آخر 5 طلبات مسجلة على المتجر</CardDescription>
            </div>
            <Link href="/admin/orders">
              <Button variant="ghost" size="sm" className="text-xs font-bold text-[#a8822d]">
                عرض الكل ←
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-[#d5af58]" />
              </div>
            ) : recentOrders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الطلب</TableHead>
                    <TableHead>اسم العميل</TableHead>
                    <TableHead>الهاتف</TableHead>
                    <TableHead>الإجمالي</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((o: any) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-bold">#{o.id}</TableCell>
                      <TableCell>{o.customerName}</TableCell>
                      <TableCell dir="ltr" className="text-xs">{o.customerPhone}</TableCell>
                      <TableCell font-black dir="ltr">{formatPrice(o.totalAmount)} ج.م</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[11px]">
                          {o.status === "new" ? "جديد" : o.status === "contacted" ? "تم التواصل" : o.status === "confirmed" ? "مؤكد" : o.status === "shipped" ? "جاري الشحن" : o.status === "delivered" ? "تم التوصيل" : "ملغى"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(o.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center py-8 text-muted-foreground">لا توجد طلبات جديدة حالياً.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}