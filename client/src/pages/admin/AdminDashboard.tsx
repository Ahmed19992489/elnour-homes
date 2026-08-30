import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, Users, TrendingUp, Package, BarChart3, Eye, ArrowUpRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();

  const { data: stats, isLoading } = trpc.orders.stats.useQuery();
  const { data: newCount } = trpc.orders.newCount.useQuery();

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-8 text-center bg-[#faf8f5]">
        <div className="max-w-md w-full rounded-2xl border border-[#e0dacd] bg-white p-8 shadow-md">
          <h1 className="text-2xl font-bold text-[#24211d]">لوحة التحكم للإدارة فقط</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            يرجى تسجيل الدخول برقم الهاتف وكلمة المرور الخاصة بالإدارة للوصول إلى لوحة التحكم.
          </p>
          <Button className="mt-6 w-full bg-[#24211d] text-white hover:bg-[#ad842f]" onClick={() => window.location.assign("/admin-login")}>
            تسجيل الدخول للإدارة
          </Button>
        </div>
      </div>
    );
  }


  if (user?.role !== 'admin') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
        <h1 className="text-xl font-bold">هذه الصفحة للإدارة فقط</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          يبدو أنك عميل لدى Elnour for STEEL — يمكنك متابعة طلباتك وتحديث بياناتك من صفحة حسابك.
        </p>
        <Button className="mt-6 bg-[#26231e] text-white hover:bg-[#ad842f]" onClick={() => window.location.assign("/account")}>
          فتح حسابي
        </Button>
      </div>
    );
  }

  const totalOrders = stats?.total ?? 0;
  const conversionRate = stats?.conversionRate ? stats.conversionRate.toFixed(2) : "0.00";
  const visitorCount = stats?.uniqueVisitors ?? 0;
  const pageviewCount = stats?.pageviews ?? 0;
  const todayVisitors = stats?.todayVisitors ?? 0;

  const cards = [
    {
      title: "إجمالي الطلبات",
      value: totalOrders,
      icon: ShoppingBag,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      title: "طلبات جديدة",
      value: newCount ?? 0,
      icon: Users,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "نسبة التحويل",
      value: `${conversionRate}%`,
      subtitle: visitorCount > 0 ? `${pageviewCount} مشاهدة / ${visitorCount} زائر` : "لا توجد بيانات بعد",
      icon: BarChart3,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      title: "تم التوصيل",
      value: stats?.delivered ?? 0,
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">لوحة التحكم</h1>
          {stats && (
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Eye className="h-4 w-4" />
                {pageviewCount} مشاهدة
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-4 w-4" />
                {visitorCount} زائر
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <ArrowUpRight className="h-4 w-4" />
                {todayVisitors} اليوم
              </span>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">جاري التحميل...</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {cards.map((card) => (
                <Card key={card.title}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${card.bg}`}>
                        <card.icon className={`h-6 w-6 ${card.color}`} />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{card.title}</p>
                        <p className="text-2xl font-bold">{card.value}</p>
                        {card.subtitle && (
                          <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">إحصائيات الطلبات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-green-700">طلبات جديدة</span>
                      <span className="font-bold text-green-800">{stats?.new ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-blue-700">تم التواصل</span>
                      <span className="font-bold text-blue-800">{stats?.contacted ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="text-purple-700">تم التأكيد</span>
                      <span className="font-bold text-purple-800">{stats?.confirmed ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                      <span className="text-amber-700">تم التوصيل</span>
                      <span className="font-bold text-amber-800">{stats?.delivered ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span className="text-red-700">ملغية</span>
                      <span className="font-bold text-red-800">{stats?.cancelled ?? 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">روابط سريعة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/admin/orders">
                    <Button variant="outline" className="w-full justify-start text-right" size="lg">
                      <ShoppingBag className="ml-2 h-5 w-5" />
                      إدارة الطلبات
                    </Button>
                  </Link>
                  <Link href="/admin/products">
                    <Button variant="outline" className="w-full justify-start text-right" size="lg">
                      <Package className="ml-2 h-5 w-5" />
                      إدارة المنتجات
                    </Button>
                  </Link>
                  <Link href="/admin/gallery">
                    <Button variant="outline" className="w-full justify-start text-right" size="lg">
                      <BarChart3 className="ml-2 h-5 w-5" />
                      معرض الأعمال
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
