import React, { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { formatPrice, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Loader2,
  RefreshCw,
  Phone,
  MapPin,
  Package,
  Search,
  MessageCircle,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

type StatusType = "new" | "contacted" | "confirmed" | "shipped" | "delivered" | "cancelled";

const STATUS_CONFIG: Record<
  StatusType,
  { label: string; bg: string; text: string; icon: any }
> = {
  new: { label: "جديد", bg: "bg-blue-50", text: "text-blue-700", icon: Clock },
  contacted: { label: "تم التواصل", bg: "bg-amber-50", text: "text-amber-700", icon: Phone },
  confirmed: { label: "مؤكد", bg: "bg-purple-50", text: "text-purple-700", icon: CheckCircle2 },
  shipped: { label: "جاري الشحن", bg: "bg-indigo-50", text: "text-indigo-700", icon: Truck },
  delivered: { label: "تم التوصيل", bg: "bg-emerald-50", text: "text-emerald-700", icon: CheckCircle2 },
  cancelled: { label: "ملغى", bg: "bg-red-50", text: "text-red-700", icon: XCircle },
};

export default function AdminOrders() {
  const utils = trpc.useUtils();
  const { data: orders, isLoading, isFetching, refetch } = trpc.orders.list.useQuery();
  const { data: stats, refetch: refetchStats } = trpc.orders.stats.useQuery();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const updateStatus = trpc.orders.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث حالة الطلب بنجاح");
      void utils.orders.list.invalidate();
      void utils.orders.stats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    let list = [...orders];

    if (filterStatus !== "all") {
      list = list.filter((o) => o.status === filterStatus);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (o) =>
          o.id.toString().includes(q) ||
          (o.customerName && o.customerName.toLowerCase().includes(q)) ||
          (o.customerPhone && o.customerPhone.includes(q)) ||
          (o.customerAddress && o.customerAddress.toLowerCase().includes(q))
      );
    }

    return list;
  }, [orders, filterStatus, searchQuery]);

  const handleRefresh = async () => {
    await Promise.all([refetch(), refetchStats()]);
    toast.success("تم تحديث قائمة الطلبات");
  };

  const openWhatsApp = (order: any) => {
    const phone = order.customerPhone.replace(/[^0-9]/g, "");
    const formattedPhone = phone.startsWith("0") ? `2${phone}` : phone;
    const message = `مرحباً أستاذ ${order.customerName}، معك فريق Elnour Homes بخصوص طلبك رقم #${order.id}.`;
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header & Refresh */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#24211d]">إدارة ومتابعة الطلبات</h1>
            <p className="text-sm text-muted-foreground mt-1">متابعة الحجوزات، تحديث الحالات، والتواصل المباشر مع العملاء.</p>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm" className="font-bold border-[#d5af58]">
            <RefreshCw className={`ml-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            تحديث البيانات
          </Button>
        </div>

        {/* Stats KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {(["new", "contacted", "confirmed", "shipped", "delivered", "cancelled"] as StatusType[]).map((st) => {
            const cfg = STATUS_CONFIG[st];
            const count = stats?.[st] || 0;
            return (
              <div
                key={st}
                onClick={() => setFilterStatus(filterStatus === st ? "all" : st)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  filterStatus === st ? "border-[#24211d] ring-2 ring-[#d5af58] bg-white" : "border-[#e8e2d8] bg-white/70 hover:bg-white"
                }`}
              >
                <span className="text-xs font-bold text-muted-foreground block">{cfg.label}</span>
                <span className="text-xl font-black text-[#24211d] mt-1 block">{count}</span>
              </div>
            );
          })}
        </div>

        {/* Filter and Search Bar */}
        <Card>
          <CardHeader className="p-4 border-b border-[#eee8dd]">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث برقم الطلب، اسم العميل، أو الهاتف..."
                  className="pr-9"
                />
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="rounded-xl border border-input bg-background px-3 py-2 text-sm font-bold w-full sm:w-auto"
                >
                  <option value="all">كافة الحالات</option>
                  <option value="new">طلبات جديدة</option>
                  <option value="contacted">تم التواصل</option>
                  <option value="confirmed">تم التأكيد</option>
                  <option value="shipped">جاري الشحن</option>
                  <option value="delivered">تم التوصيل</option>
                  <option value="cancelled">ملغاة</option>
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-[#d5af58]" />
              </div>
            ) : filteredOrders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الطلب</TableHead>
                    <TableHead>العميل</TableHead>
                    <TableHead>الهاتف</TableHead>
                    <TableHead>العنوان والمحافظة</TableHead>
                    <TableHead>الإجمالي</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead className="text-left">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((o: any) => {
                    const stCfg = STATUS_CONFIG[o.status as StatusType] || STATUS_CONFIG.new;
                    return (
                      <TableRow key={o.id}>
                        <TableCell className="font-bold text-[#24211d]">#{o.id}</TableCell>
                        <TableCell className="font-bold">{o.customerName}</TableCell>
                        <TableCell dir="ltr" className="text-xs">{o.customerPhone}</TableCell>
                        <TableCell className="max-w-[180px] truncate text-xs text-muted-foreground">{o.customerAddress}</TableCell>
                        <TableCell font-black dir="ltr">{formatPrice(o.totalAmount)} ج.م</TableCell>
                        <TableCell>
                          <select
                            value={o.status}
                            onChange={(e) => updateStatus.mutate({ id: o.id, status: e.target.value as StatusType })}
                            className={`text-xs font-bold rounded-lg border px-2 py-1 ${stCfg.bg} ${stCfg.text}`}
                          >
                            <option value="new">جديد</option>
                            <option value="contacted">تم التواصل</option>
                            <option value="confirmed">تم التأكيد</option>
                            <option value="shipped">جاري الشحن</option>
                            <option value="delivered">تم التوصيل</option>
                            <option value="cancelled">ملغى</option>
                          </select>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(o.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5" dir="ltr">
                            <Button size="icon" variant="ghost" title="عرض التفاصيل" onClick={() => setSelectedOrder(o)}>
                              <Eye className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button size="icon" variant="ghost" title="محادثة واتساب" onClick={() => openWhatsApp(o)}>
                              <MessageCircle className="h-4 w-4 text-emerald-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="p-12 text-center text-muted-foreground">لا توجد طلبات تطابق البحث.</div>
            )}
          </CardContent>
        </Card>

        {/* Order Details Modal */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>تفاصيل الطلب #{selectedOrder?.id}</DialogTitle>
            </DialogHeader>

            {selectedOrder && (
              <div className="space-y-4 pt-2 text-sm">
                <div className="grid grid-cols-2 gap-4 bg-[#faf8f5] p-4 rounded-xl border border-[#eee8dd]">
                  <div>
                    <span className="text-xs text-muted-foreground block">العميل:</span>
                    <p className="font-bold text-[#24211d]">{selectedOrder.customerName}</p>
                    <p dir="ltr" className="text-xs mt-0.5">{selectedOrder.customerPhone}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">العنوان:</span>
                    <p className="text-xs leading-relaxed">{selectedOrder.customerAddress}</p>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                    <strong>ملاحظات العميل:</strong> {selectedOrder.notes}
                  </div>
                )}

                <div>
                  <h4 className="font-bold text-xs text-[#a8822d] uppercase tracking-wider mb-2">قائمة المنتجات</h4>
                  <div className="space-y-2">
                    {(Array.isArray(selectedOrder.items)
                      ? selectedOrder.items
                      : typeof selectedOrder.items === "string"
                      ? JSON.parse(selectedOrder.items || "[]")
                      : []
                    ).map((it: any, i: number) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-[#eee8dd] text-xs">
                        <div>
                          <span className="font-bold">{it.productName || it.name}</span>
                          <span className="text-muted-foreground mr-2">
                            (الكمية: {it.quantity} {it.size ? `· ${it.size}` : ""} {it.isPerMeter ? `· ${it.meters}م²` : ""})
                          </span>
                        </div>
                        <span className="font-bold" dir="ltr">{formatPrice(it.price * (it.quantity || 1))} ج.م</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 text-base font-black border-t border-[#eee8dd]">
                  <span>الإجمالي:</span>
                  <span className="text-[#a8822d]" dir="ltr">{formatPrice(selectedOrder.totalAmount)} ج.م</span>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}