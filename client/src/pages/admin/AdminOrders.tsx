import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, RefreshCw, Phone, MapPin, Package, Search, Filter, ChevronDown, MessageCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { buildOrderWhatsAppUrl } from "@/lib/orderWhatsApp";

const statusColors: Record<string, string> = {
  new: "bg-green-100 text-green-800",
  contacted: "bg-blue-100 text-blue-800",
  confirmed: "bg-purple-100 text-purple-800",
  shipped: "bg-cyan-100 text-cyan-800",
  delivered: "bg-amber-100 text-amber-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  new: "جديد",
  contacted: "تم التواصل",
  confirmed: "تم التأكيد",
  shipped: "تم الشحن",
  delivered: "تم التوصيل",
  cancelled: "ملغى",
};

const statusIcons: Record<string, string> = {
  new: "🆕",
  contacted: "📞",
  confirmed: "✅",
  shipped: "🚚",
  delivered: "📦",
  cancelled: "❌",
};

type StatusType = "new" | "contacted" | "confirmed" | "shipped" | "delivered" | "cancelled";

export default function AdminOrders() {
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const { data: orders, isLoading, isFetching, refetch } = trpc.orders.list.useQuery();
  const { data: stats, refetch: refetchStats } = trpc.orders.stats.useQuery();
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const updateStatus = trpc.orders.updateStatus.useMutation({
    onMutate: async ({ id, status }) => {
      setUpdatingOrderId(id);
      await utils.orders.list.cancel();
      const previousOrders = utils.orders.list.getData();

      // Reflect the selected state immediately in both table and Kanban views.
      utils.orders.list.setData(undefined, (currentOrders) =>
        currentOrders?.map((order) => order.id === id ? { ...order, status } : order),
      );

      return { previousOrders };
    },
    onSuccess: async () => {
      toast.success("تم تحديث حالة الطلب");
      // Reconcile the optimistic UI with the saved database state and refresh the counts.
      await Promise.all([
        utils.orders.list.invalidate(),
        utils.orders.stats.invalidate(),
      ]);
    },
    onError: (_error, _input, context) => {
      if (context?.previousOrders) {
        utils.orders.list.setData(undefined, context.previousOrders);
      }
      toast.error("حدث خطأ في تحديث الحالة");
    },
    onSettled: () => setUpdatingOrderId(null),
  });

  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const handleStatusChange = (id: number, currentStatus: StatusType, nextStatus: string) => {
    if (nextStatus === currentStatus || updatingOrderId === id) return;
    updateStatus.mutate({ id, status: nextStatus as StatusType });
  };

  const handleRefresh = async () => {
    await Promise.all([
      utils.orders.list.invalidate(),
      utils.orders.stats.invalidate(),
    ]);
    await Promise.all([refetch(), refetchStats()]);
    toast.success("تم تحميل أحدث الطلبات");
  };

  const getCustomerWhatsAppUrl = (order: NonNullable<typeof orders>[number]) => buildOrderWhatsAppUrl({
    id: order.id,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    productName: order.productName,
    status: order.status,
    orderUrl: `${window.location.origin}/account/orders/${order.id}`,
  });

  if (!isAuthenticated || user?.role !== 'admin') {
    return <div className="p-8 text-center">ليس لديك صلاحية الوصول</div>;
  }

  const filteredOrders = orders?.filter(order => {
    const matchesStatus = filterStatus === "all" || order.status === filterStatus;
    const matchesSearch = !searchQuery ||
      order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone?.includes(searchQuery) ||
      order.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(order.id).includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  const getOrdersByStatus = (status: string) =>
    filteredOrders?.filter(o => o.status === status) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-2xl font-bold">إدارة الطلبات</h1>
          <div className="flex items-center gap-3">
            <Button onClick={handleRefresh} disabled={isFetching} variant="outline" size="sm">
              <RefreshCw className={`ml-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              {isFetching ? "جارٍ التحديث..." : "تحديث"}
            </Button>
          </div>
        </div>

        {/* Stats Summary */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Object.entries(statusLabels).map(([key, label]) => {
              const count = (stats as any)[key] ?? 0;
              return (
                <button
                  key={key}
                  onClick={() => setFilterStatus(filterStatus === key ? "all" : key)}
                  className={`p-3 rounded-xl text-center transition-all cursor-pointer ${
                    filterStatus === key ? "ring-2 ring-amber-400 scale-105" : "hover:scale-102"
                  }`}
                >
                  <div className={`p-2 rounded-lg mb-1 ${statusColors[key]}`}>
                    <span className="text-lg">{statusIcons[key]}</span>
                  </div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xl font-bold">{count}</p>
                </button>
              );
            })}
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="ابحث بالاسم أو الهاتف أو المنتج..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="كل الحالات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{statusIcons[key]} {label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-2 text-sm font-medium ${viewMode === "table" ? "bg-amber-50 text-amber-700" : "bg-white text-muted-foreground hover:bg-gray-50"}`}
              >
                جدول
              </button>
              <button
                onClick={() => setViewMode("kanban")}
                className={`px-3 py-2 text-sm font-medium ${viewMode === "kanban" ? "bg-amber-50 text-amber-700" : "bg-white text-muted-foreground hover:bg-gray-50"}`}
              >
                لوحة
              </button>
            </div>
          </div>
        </div>

        {/* Table View */}
        {viewMode === "table" && (
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredOrders && filteredOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>العميل</TableHead>
                        <TableHead>الهاتف</TableHead>
                        <TableHead>المنتج</TableHead>
                        <TableHead>السعر</TableHead>
                        <TableHead>المصدر</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>إجراء</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order) => (
                        <TableRow key={order.id} className={order.status === 'new' ? 'bg-green-50/50' : ''}>
                          <TableCell className="font-medium">{order.id}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{order.customerName}</p>
                              {order.customerAddress && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                  <MapPin className="h-3 w-3" />
                                  {order.customerAddress}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <a href={`tel:${order.customerPhone}`} className="text-blue-600 hover:underline flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {order.customerPhone}
                            </a>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{order.productName || "-"}</p>
                              {order.message && (
                                <p className="text-xs text-muted-foreground mt-1 max-w-[200px] truncate">{order.message}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{order.productPrice ? `${order.productPrice} ج.م` : "-"}</TableCell>
                          <TableCell>
                            {order.utmSource ? (
                              <Badge variant="outline" className="text-xs">{order.utmSource}</Badge>
                            ) : order.utmCampaign ? (
                              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">{order.utmCampaign}</Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">مباشر</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={order.status}
                              disabled={updatingOrderId === order.id}
                              onValueChange={(val: string) => handleStatusChange(order.id, order.status as StatusType, val)}
                            >
                              <SelectTrigger className={`w-[120px] h-8 text-xs ${statusColors[order.status]}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(statusLabels).map(([key, label]) => (
                                  <SelectItem key={key} value={key}>
                                    {statusIcons[key]} {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString("ar-EG", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {getCustomerWhatsAppUrl(order) ? (
                                <a
                                  href={getCustomerWhatsAppUrl(order)!}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-2 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700"
                                  title="يفتح محادثة العميل برسالة حالة الطلب الجاهزة"
                                >
                                  <MessageCircle className="h-4 w-4" />
                                  أرسل واتساب
                                </a>
                              ) : null}
                              <a
                                href={`tel:${order.customerPhone}`}
                                className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"
                                title="اتصل"
                              >
                                <Phone className="h-4 w-4" />
                              </a>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Package className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg">لا توجد طلبات{filterStatus !== "all" ? " بهذه الحالة" : ""}</p>
                  <p className="text-sm mt-2">ستظهر الطلبات هنا عندما يقوم العملاء بملء نموذج الطلب</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Kanban Board View */}
        {viewMode === "kanban" && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(statusLabels).map(([statusKey, statusLabel]) => {
              const statusOrders = getOrdersByStatus(statusKey);
              return (
                <div key={statusKey} className="min-h-[400px]">
                  <Card className="h-full">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span>{statusIcons[statusKey]}</span>
                          {statusLabel}
                        </span>
                        <Badge className={statusColors[statusKey]}>
                          {statusOrders.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                      {isLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : statusOrders.length > 0 ? (
                        statusOrders.map((order) => (
                          <Card key={order.id} className="p-3 border-2 hover:border-amber-300 transition-colors cursor-pointer">
                            <div className="space-y-2">
                              <div className="flex items-start justify-between">
                                <p className="font-medium text-sm">{order.customerName}</p>
                                <span className="text-xs text-muted-foreground">#{order.id}</span>
                              </div>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {order.customerPhone}
                              </p>
                              {order.productName && (
                                <p className="text-xs bg-amber-50 rounded px-2 py-1 text-amber-800">
                                  {order.productName}
                                </p>
                              )}
                              {order.productPrice && (
                                <p className="text-xs font-medium">{order.productPrice} ج.م</p>
                              )}
                              {order.customerAddress && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  <span className="truncate">{order.customerAddress}</span>
                                </p>
                              )}
                              <div className="flex items-center justify-between pt-2 border-t">
                                <span className="text-xs text-muted-foreground">
                                  {new Date(order.createdAt).toLocaleDateString("ar-EG", { month: "short", day: "numeric" })}
                                </span>
                                <Select
                                  value={order.status}
                                  disabled={updatingOrderId === order.id}
                                  onValueChange={(val: string) => handleStatusChange(order.id, order.status as StatusType, val)}
                                >
                                  <SelectTrigger className="w-[100px] h-7 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(statusLabels).map(([key, label]) => (
                                      <SelectItem key={key} value={key}>
                                        {statusIcons[key]} {label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex gap-1">
                                {getCustomerWhatsAppUrl(order) ? (
                                  <a
                                    href={getCustomerWhatsAppUrl(order)!}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 flex items-center justify-center gap-1 rounded bg-green-600 p-1.5 text-xs text-white transition-colors hover:bg-green-700"
                                    title="يفتح محادثة العميل برسالة حالة الطلب الجاهزة"
                                  >
                                    <MessageCircle className="h-3 w-3" />
                                    أرسل واتساب
                                  </a>
                                ) : null}
                                <a
                                  href={`tel:${order.customerPhone}`}
                                  className="flex-1 flex items-center justify-center gap-1 p-1.5 rounded text-xs bg-blue-50 text-blue-700 hover:bg-blue-100"
                                >
                                  <Phone className="h-3 w-3" />
                                  اتصل
                                </a>
                              </div>
                            </div>
                          </Card>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          لا توجد طلبات
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        )}

        {/* Order Status Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">دليل حالات الطلبات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                { key: "new", label: "جديد", desc: "طلب وصل حديثاً ولم يتم التواصل مع العميل بعد", color: "border-green-300 bg-green-50" },
                { key: "contacted", label: "تم التواصل", desc: "تم الاتصال بالعميل ومناقشة الطلب", color: "border-blue-300 bg-blue-50" },
                { key: "confirmed", label: "تم التأكيد", desc: "العميل أكد الطلب وتم الاتفاق على التفاصيل", color: "border-purple-300 bg-purple-50" },
                { key: "delivered", label: "تم التوصيل", desc: "تم تسليم المنتج للعميل بنجاح", color: "border-amber-300 bg-amber-50" },
                { key: "cancelled", label: "ملغى", desc: "تم إلغاء الطلب من العميل أو منك", color: "border-red-300 bg-red-50" },
              ].map((item) => (
                <div key={item.key} className={`p-3 rounded-lg border ${item.color}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span>{statusIcons[item.key]}</span>
                    <span className="font-medium text-sm">{item.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
