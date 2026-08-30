import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Loader2, RefreshCw, Phone, MapPin, Package, Search, 
  MessageCircle, Eye, Download, FileSpreadsheet, ExternalLink, 
  Tag, Palette, Ruler, CheckCircle2, UserCheck, Calendar
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { buildOrderWhatsAppUrl } from "@/lib/orderWhatsApp";
import { createOrderInvoicePdf, orderInvoiceFileName } from "@/lib/orderInvoicePdf";


const statusColors: Record<string, string> = {
  new: "bg-green-100 text-green-800 border-green-300",
  contacted: "bg-blue-100 text-blue-800 border-blue-300",
  confirmed: "bg-purple-100 text-purple-800 border-purple-300",
  shipped: "bg-cyan-100 text-cyan-800 border-cyan-300",
  delivered: "bg-amber-100 text-amber-800 border-amber-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
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
  const { data: contact } = trpc.contactInfo.get.useQuery();
  
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const updateStatus = trpc.orders.updateStatus.useMutation({
    onMutate: async ({ id, status, notes }) => {
      setUpdatingOrderId(id);
      await utils.orders.list.cancel();
      const previousOrders = utils.orders.list.getData();

      utils.orders.list.setData(undefined, (currentOrders) =>
        currentOrders?.map((order) => order.id === id ? { ...order, status, notes: notes ?? order.notes } : order),
      );

      return { previousOrders };
    },
    onSuccess: async () => {
      toast.success("تم تحديث حالة الطلب بنجاح");
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

  const handleStatusChange = (id: number, nextStatus: string, notes?: string) => {
    updateStatus.mutate({ id, status: nextStatus, notes });
  };

  const handleOpenDetails = (order: any) => {
    setSelectedOrder(order);
    setAdminNotes(order.notes ?? "");
  };

  const handleSaveNotes = () => {
    if (!selectedOrder) return;
    updateStatus.mutate({ id: selectedOrder.id, status: selectedOrder.status, notes: adminNotes });
    setSelectedOrder({ ...selectedOrder, notes: adminNotes });
  };

  const handleDownloadInvoice = async (order: any) => {
    try {
      setIsGeneratingPdf(true);
      const originalPrice = parseFloat(order.productPrice || "0") || 0;
      const discount = parseFloat(order.discountValue || "0") || 0;
      const finalPrice = parseFloat(order.totalAfterDiscount || order.productPrice || "0") || originalPrice;

      const blob = await createOrderInvoicePdf({
        orderId: order.id,
        createdAt: order.createdAt,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerAddress: order.customerAddress,
        productName: order.productName || "منتج استيل فاخر",
        selectedSize: order.selectedSize,
        selectedColor: order.selectedColor,
        originalTotal: originalPrice,
        discount: discount,
        finalTotal: finalPrice,
        couponCode: order.couponCode,
        status: statusLabels[order.status] ?? order.status,
        lang: "ar",
        contactPhone: contact?.phone || "01121748885",
      });

      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = orderInvoiceFileName(order.id);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("تم تنزيل الفاتورة PDF بنجاح");
    } catch (e: any) {
      toast.error("فشل إنشاء الفاتورة: " + (e.message || ""));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([
      utils.orders.list.invalidate(),
      utils.orders.stats.invalidate(),
    ]);
    await Promise.all([refetch(), refetchStats()]);
    toast.success("تم تحديث قائمة الطلبات");
  };

  const getCustomerWhatsAppUrl = (order: any) => buildOrderWhatsAppUrl({
    id: order.id,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    productName: `${order.productName || "الطلب"}${order.selectedSize ? ` (مقاس: ${order.selectedSize})` : ""}${order.selectedColor ? ` (لون: ${order.selectedColor})` : ""}`,
    status: order.status,
    orderUrl: `${window.location.origin}/account/orders/${order.id}`,
  });

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-8 text-center bg-[#faf8f5]">
        <div className="max-w-md w-full rounded-2xl border border-[#e0dacd] bg-white p-8 shadow-md">
          <h1 className="text-2xl font-bold text-[#24211d]">لوحة التحكم للإدارة فقط</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            يرجى تسجيل الدخول للوصول إلى إدارة الطلبات.
          </p>
          <Button className="mt-6 w-full bg-[#24211d] text-white hover:bg-[#ad842f]" onClick={() => window.location.assign("/admin-login")}>
            تسجيل الدخول للإدارة
          </Button>
        </div>
      </div>
    );
  }

  const filteredOrders = orders?.filter(order => {
    const matchesStatus = filterStatus === "all" || order.status === filterStatus;
    const matchesSearch = !searchQuery ||
      order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone?.includes(searchQuery) ||
      order.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.selectedSize?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.selectedColor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(order.id).includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  const getOrdersByStatus = (status: string) =>
    filteredOrders?.filter(o => o.status === status) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#24211d]">إدارة الطلبات والعملاء</h1>
            <p className="text-xs text-muted-foreground mt-1">عرض وتتبع تفاصيل كل طلب، المقاس واللون المختار، والفواتير</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleRefresh} disabled={isFetching} variant="outline" size="sm" className="gap-2">
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              {isFetching ? "جارٍ التحديث..." : "تحديث الطلبات"}
            </Button>
          </div>
        </div>

        {/* Stats Summary */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            {Object.entries(statusLabels).map(([key, label]) => {
              const count = (stats as any)[key] ?? (key === "new" ? stats.newCount : key === "contacted" ? stats.contactedCount : key === "confirmed" ? stats.confirmedCount : key === "shipped" ? stats.shippedCount : key === "delivered" ? stats.deliveredCount : key === "cancelled" ? stats.cancelledCount : 0) ?? 0;
              return (
                <button
                  key={key}
                  onClick={() => setFilterStatus(filterStatus === key ? "all" : key)}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer bg-white shadow-sm ${
                    filterStatus === key ? "ring-2 ring-[#ad842f] border-[#ad842f] scale-105" : "hover:border-gray-400"
                  }`}
                >
                  <div className={`p-2 rounded-lg mb-1 inline-block ${statusColors[key]}`}>
                    <span className="text-base">{statusIcons[key]}</span>
                  </div>
                  <p className="text-xs font-semibold text-gray-700">{label}</p>
                  <p className="text-lg font-black text-[#24211d]">{count}</p>
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
              placeholder="ابحث بالاسم، الهاتف، اسم المنتج، المقاس، أو اللون..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-[#d9d3c4] rounded-xl text-sm bg-white focus:ring-2 focus:ring-[#ad842f] focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px] bg-white border-[#d9d3c4] rounded-xl">
                <SelectValue placeholder="كل الحالات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات ({orders?.length ?? 0})</SelectItem>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{statusIcons[key]} {label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex border border-[#d9d3c4] rounded-xl overflow-hidden bg-white">
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-2 text-sm font-bold ${viewMode === "table" ? "bg-[#24211d] text-white" : "text-gray-600 hover:bg-gray-100"}`}
              >
                جدول
              </button>
              <button
                onClick={() => setViewMode("kanban")}
                className={`px-3 py-2 text-sm font-bold ${viewMode === "kanban" ? "bg-[#24211d] text-white" : "text-gray-600 hover:bg-gray-100"}`}
              >
                لوحة
              </button>
            </div>
          </div>
        </div>

        {/* Table View */}
        {viewMode === "table" && (
          <Card className="rounded-2xl border-[#e0dacd] shadow-sm overflow-hidden bg-white">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-[#ad842f]" />
                </div>
              ) : filteredOrders && filteredOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-[#f8f7f4]">
                      <TableRow>
                        <TableHead className="font-bold text-[#24211d] w-12 text-center">#</TableHead>
                        <TableHead className="font-bold text-[#24211d]">بيانات العميل</TableHead>
                        <TableHead className="font-bold text-[#24211d]">تفاصيل المنتج والخيارات المختارة</TableHead>
                        <TableHead className="font-bold text-[#24211d]">السعر والإجمالي</TableHead>
                        <TableHead className="font-bold text-[#24211d]">المصدر</TableHead>
                        <TableHead className="font-bold text-[#24211d]">حالة الطلب</TableHead>
                        <TableHead className="font-bold text-[#24211d]">التاريخ</TableHead>
                        <TableHead className="font-bold text-[#24211d] text-center">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order) => (
                        <TableRow key={order.id} className={`transition-colors hover:bg-[#faf8f5] ${order.status === 'new' ? 'bg-green-50/40' : ''}`}>
                          <TableCell className="font-bold text-center text-gray-700">{order.id}</TableCell>
                          
                          {/* Client Info */}
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-bold text-[#24211d] flex items-center gap-1.5">
                                <UserCheck className="h-3.5 w-3.5 text-[#ad842f]" />
                                {order.customerName}
                              </p>
                              <a href={`tel:${order.customerPhone}`} className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                <span dir="ltr">{order.customerPhone}</span>
                              </a>
                              {order.customerAddress && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 max-w-[200px] truncate" title={order.customerAddress}>
                                  <MapPin className="h-3 w-3 shrink-0 text-gray-400" />
                                  {order.customerAddress}
                                </p>
                              )}
                            </div>
                          </TableCell>

                          {/* Product & Options (Size, Color, Message) */}
                          <TableCell>
                            <div className="space-y-1.5 max-w-[280px]">
                              <p className="font-bold text-sm text-[#24211d] leading-snug">
                                {order.productName || "طلب مخصص"}
                              </p>

                              {/* Size and Color badges */}
                              <div className="flex flex-wrap items-center gap-1.5">
                                {order.selectedSize ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-[#8c681d] border border-amber-200">
                                    <Ruler className="h-3 w-3" />
                                    المقاس: {order.selectedSize}
                                  </span>
                                ) : null}

                                {order.selectedColor ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-zinc-100 text-zinc-800 border border-zinc-200">
                                    <Palette className="h-3 w-3 text-[#ad842f]" />
                                    اللون: {order.selectedColor}
                                  </span>
                                ) : null}
                              </div>

                              {order.message && (
                                <p className="text-[11px] text-gray-500 bg-gray-50 p-1.5 rounded-lg border border-gray-100 truncate" title={order.message}>
                                  💬 {order.message}
                                </p>
                              )}
                            </div>
                          </TableCell>

                          {/* Pricing & Discounts */}
                          <TableCell>
                            <div className="space-y-1 text-xs">
                              <p className="font-black text-sm text-[#24211d]">
                                {order.totalAfterDiscount || order.productPrice ? `${order.totalAfterDiscount || order.productPrice} ج.م` : "-"}
                              </p>
                              {order.discountValue && Number(order.discountValue) > 0 ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  <Tag className="h-2.5 w-2.5" />
                                  خصم {order.discountValue} ج {order.couponCode ? `(${order.couponCode})` : ""}
                                </span>
                              ) : null}
                            </div>
                          </TableCell>

                          {/* Source */}
                          <TableCell>
                            <span className="text-xs text-gray-500">
                              {order.utmSource ? (
                                <Badge variant="outline" className="text-[10px]">{order.utmSource}</Badge>
                              ) : order.utmCampaign ? (
                                <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700">{order.utmCampaign}</Badge>
                              ) : (
                                "مباشر"
                              )}
                            </span>
                          </TableCell>

                          {/* Order Status Select */}
                          <TableCell>
                            <Select
                              value={order.status}
                              disabled={updatingOrderId === order.id}
                              onValueChange={(val: string) => handleStatusChange(order.id, val)}
                            >
                              <SelectTrigger className={`w-[125px] h-8 text-xs font-bold border rounded-lg ${statusColors[order.status]}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(statusLabels).map(([key, label]) => (
                                  <SelectItem key={key} value={key} className="text-xs font-bold">
                                    {statusIcons[key]} {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>

                          {/* Date */}
                          <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                            {new Date(order.createdAt).toLocaleDateString("ar-EG", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </TableCell>

                          {/* Actions */}
                          <TableCell>
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Open Full Details Modal */}
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2 text-xs font-bold gap-1 border-[#ad842f]/40 hover:bg-[#ad842f]/10 text-[#8c681d]"
                                onClick={() => handleOpenDetails(order)}
                                title="عرض التفاصيل الكاملة والفاتورة"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                التفاصيل
                              </Button>

                              {/* WhatsApp Direct */}
                              {getCustomerWhatsAppUrl(order) ? (
                                <a
                                  href={getCustomerWhatsAppUrl(order)!}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#25d366] text-white hover:bg-[#20b859] transition-colors"
                                  title="مراسلة العميل على واتساب بتفاصيل طلبه"
                                >
                                  <MessageCircle className="h-4 w-4" />
                                </a>
                              ) : null}

                              {/* Direct Call */}
                              <a
                                href={`tel:${order.customerPhone}`}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                title="اتصال هاتفي"
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
                  <Package className="h-12 w-12 mb-4 opacity-50 text-[#ad842f]" />
                  <p className="text-lg font-bold text-[#24211d]">لا توجد طلبات{filterStatus !== "all" ? " بهذه الحالة" : ""}</p>
                  <p className="text-xs mt-1">ستظهر الطلبات هنا فور قيام العملاء بإتمام الشراء أو الطلب من المتجر</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Kanban Board View */}
        {viewMode === "kanban" && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(statusLabels).map(([statusKey, statusLabel]) => {
              const statusOrders = getOrdersByStatus(statusKey);
              return (
                <div key={statusKey} className="min-h-[400px]">
                  <Card className="h-full rounded-2xl border-[#e0dacd] shadow-sm bg-white">
                    <CardHeader className="pb-3 bg-[#f8f7f4] rounded-t-2xl border-b border-[#e0dacd]">
                      <CardTitle className="text-sm font-bold flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span>{statusIcons[statusKey]}</span>
                          {statusLabel}
                        </span>
                        <Badge className={`${statusColors[statusKey]} text-xs font-black`}>
                          {statusOrders.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 p-3 max-h-[650px] overflow-y-auto">
                      {isLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-[#ad842f]" />
                        </div>
                      ) : statusOrders.length > 0 ? (
                        statusOrders.map((order) => (
                          <Card 
                            key={order.id} 
                            onClick={() => handleOpenDetails(order)}
                            className="p-3.5 rounded-xl border border-gray-200 hover:border-[#ad842f] hover:shadow-md transition-all cursor-pointer bg-[#faf8f5]"
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between">
                                <p className="font-bold text-sm text-[#24211d]">{order.customerName}</p>
                                <span className="text-xs font-mono font-bold text-gray-500">#{order.id}</span>
                              </div>

                              <p className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                <span dir="ltr">{order.customerPhone}</span>
                              </p>

                              {/* Product Info */}
                              <div className="bg-white p-2 rounded-lg border border-gray-200 space-y-1">
                                <p className="text-xs font-bold text-[#24211d] line-clamp-1">
                                  {order.productName || "طلب مخصص"}
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {order.selectedSize ? (
                                    <span className="text-[10px] bg-amber-50 text-[#8c681d] px-1.5 py-0.5 rounded font-bold">
                                      📏 {order.selectedSize}
                                    </span>
                                  ) : null}
                                  {order.selectedColor ? (
                                    <span className="text-[10px] bg-zinc-100 text-zinc-800 px-1.5 py-0.5 rounded font-bold">
                                      🎨 {order.selectedColor}
                                    </span>
                                  ) : null}
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-1">
                                <span className="text-xs font-black text-[#24211d]">
                                  {order.totalAfterDiscount || order.productPrice ? `${order.totalAfterDiscount || order.productPrice} ج.م` : "-"}
                                </span>
                                <span className="text-[10px] text-gray-500">
                                  {new Date(order.createdAt).toLocaleDateString("ar-EG", { month: "short", day: "numeric" })}
                                </span>
                              </div>

                              <div className="flex gap-1.5 pt-1 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
                                <Select
                                  value={order.status}
                                  disabled={updatingOrderId === order.id}
                                  onValueChange={(val: string) => handleStatusChange(order.id, val)}
                                >
                                  <SelectTrigger className={`flex-1 h-7 text-[11px] font-bold ${statusColors[order.status]}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(statusLabels).map(([key, label]) => (
                                      <SelectItem key={key} value={key} className="text-xs font-bold">
                                        {statusIcons[key]} {label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>

                                {getCustomerWhatsAppUrl(order) ? (
                                  <a
                                    href={getCustomerWhatsAppUrl(order)!}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex h-7 w-7 items-center justify-center rounded bg-[#25d366] text-white hover:bg-[#20b859]"
                                    title="واتساب"
                                  >
                                    <MessageCircle className="h-3.5 w-3.5" />
                                  </a>
                                ) : null}
                              </div>
                            </div>
                          </Card>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground text-xs">
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

        {/* Order Details & Dossier Modal */}
        <Dialog open={Boolean(selectedOrder)} onOpenChange={(open) => !open && setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
            {selectedOrder ? (
              <div className="space-y-6 text-right" dir="rtl">
                <DialogHeader className="text-right border-b pb-4">
                  <div className="flex items-center justify-between">
                    <DialogTitle className="text-xl font-black text-[#24211d]">
                      تفاصيل الطلب #{selectedOrder.id}
                    </DialogTitle>
                    <Badge className={`text-xs font-bold px-3 py-1 ${statusColors[selectedOrder.status]}`}>
                      {statusIcons[selectedOrder.status]} {statusLabels[selectedOrder.status] ?? selectedOrder.status}
                    </Badge>
                  </div>
                  <DialogDescription className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    تاريخ الطلب: {new Date(selectedOrder.createdAt).toLocaleString("ar-EG")}
                  </DialogDescription>
                </DialogHeader>

                {/* Customer Information Card */}
                <div className="rounded-2xl border border-[#e0dacd] bg-[#fcfbf7] p-4 space-y-3">
                  <h3 className="font-bold text-sm text-[#8c681d] flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    بيانات العميل
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-xs text-gray-500 block">الاسم:</span>
                      <span className="font-bold text-[#24211d]">{selectedOrder.customerName}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">رقم الهاتف:</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-bold font-mono text-[#24211d]" dir="ltr">{selectedOrder.customerPhone}</span>
                        <a href={`tel:${selectedOrder.customerPhone}`} className="text-blue-600 hover:text-blue-800" title="اتصال">
                          <Phone className="h-3.5 w-3.5" />
                        </a>
                        {getCustomerWhatsAppUrl(selectedOrder) ? (
                          <a href={getCustomerWhatsAppUrl(selectedOrder)!} target="_blank" rel="noreferrer" className="text-green-600 hover:text-green-800" title="واتساب">
                            <MessageCircle className="h-3.5 w-3.5" />
                          </a>
                        ) : null}
                      </div>
                    </div>
                    {selectedOrder.customerEmail ? (
                      <div>
                        <span className="text-xs text-gray-500 block">البريد الإلكتروني:</span>
                        <span className="font-semibold text-gray-700 text-xs">{selectedOrder.customerEmail}</span>
                      </div>
                    ) : null}
                    {selectedOrder.customerAddress ? (
                      <div className="sm:col-span-2">
                        <span className="text-xs text-gray-500 block">عنوان الشحن والتوصيل:</span>
                        <span className="font-semibold text-[#24211d] text-sm flex items-start gap-1 mt-0.5">
                          <MapPin className="h-4 w-4 text-[#ad842f] shrink-0 mt-0.5" />
                          {selectedOrder.customerAddress}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Product & Selection Details Card */}
                <div className="rounded-2xl border border-[#e0dacd] bg-[#fcfbf7] p-4 space-y-3">
                  <h3 className="font-bold text-sm text-[#8c681d] flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    المنتج والخيارات المختارة بدقة
                  </h3>

                  <div className="bg-white rounded-xl border border-[#e8e2d5] p-3 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="font-black text-base text-[#24211d]">
                        {selectedOrder.productName || "طلب مخصص"}
                      </p>
                      {selectedOrder.productId ? (
                        <a 
                          href={`/product/${selectedOrder.productId}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-xs text-[#ad842f] hover:underline inline-flex items-center gap-1 font-bold"
                        >
                          معاينة المنتج بالمتجر
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : null}
                    </div>

                    {/* Detailed Specs Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-gray-100 text-xs">
                      <div className="p-2 rounded-lg bg-[#f8f7f4] border border-gray-200">
                        <span className="text-gray-500 block font-semibold">📏 المقاس المختار:</span>
                        <span className="font-black text-sm text-[#24211d] mt-0.5 block">
                          {selectedOrder.selectedSize || "قياسي"}
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-[#f8f7f4] border border-gray-200">
                        <span className="text-gray-500 block font-semibold">🎨 اللون المختار:</span>
                        <span className="font-black text-sm text-[#24211d] mt-0.5 block">
                          {selectedOrder.selectedColor || "ذهبي / افتراضي"}
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-[#f8f7f4] border border-gray-200">
                        <span className="text-gray-500 block font-semibold">💵 السعر الأساسي:</span>
                        <span className="font-black text-sm text-[#24211d] mt-0.5 block">
                          {selectedOrder.productPrice ? `${selectedOrder.productPrice} ج.م` : "-"}
                        </span>
                      </div>
                    </div>

                    {/* Discount & Coupon breakdown */}
                    {selectedOrder.discountValue && Number(selectedOrder.discountValue) > 0 ? (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
                        <span className="flex items-center gap-1">
                          <Tag className="h-3.5 w-3.5 text-emerald-600" />
                          كوبون الخصم: {selectedOrder.couponCode || "تخفيض خاص"}
                        </span>
                        <span>- {selectedOrder.discountValue} ج.م</span>
                      </div>
                    ) : null}

                    {/* Final Net Total */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200 font-black text-base text-[#24211d]">
                      <span>الإجمالي النهائي المطلوب:</span>
                      <span className="text-lg text-emerald-700">
                        {selectedOrder.totalAfterDiscount || selectedOrder.productPrice} ج.م
                      </span>
                    </div>
                  </div>

                  {selectedOrder.message ? (
                    <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200 text-xs">
                      <span className="font-bold text-amber-900 block mb-1">ملاحظات وطلب العميل الخاص:</span>
                      <p className="text-gray-700 leading-relaxed">{selectedOrder.message}</p>
                    </div>
                  ) : null}
                </div>

                {/* Admin Status & Notes Section */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">تغيير حالة الطلب:</Label>
                    <Select
                      value={selectedOrder.status}
                      onValueChange={(val) => {
                        handleStatusChange(selectedOrder.id, val, adminNotes);
                        setSelectedOrder({ ...selectedOrder, status: val });
                      }}
                    >
                      <SelectTrigger className="w-full bg-white border-[#d9d3c4] font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key} className="font-bold">
                            {statusIcons[key]} {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">ملاحظات الإدارة الداخلية (لا يراها العميل):</Label>
                    <Textarea
                      rows={2}
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="اكتب ملاحظاتك هنا (مثل: تم الاتفاق على ميعاد التسليم يوم الخميس...)"
                      className="bg-white border-[#d9d3c4] text-xs"
                    />
                    <Button size="sm" variant="outline" onClick={handleSaveNotes} className="mt-1 text-xs font-bold">
                      حفظ الملاحظات
                    </Button>
                  </div>
                </div>

                {/* Action Buttons: Invoice & WhatsApp */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="gap-2 border-[#ad842f] text-[#8c681d] font-bold"
                    onClick={() => handleDownloadInvoice(selectedOrder)}
                    disabled={isGeneratingPdf}
                  >
                    {isGeneratingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    تنزيل فاتورة الطلب PDF
                  </Button>

                  {getCustomerWhatsAppUrl(selectedOrder) ? (
                    <a
                      href={getCustomerWhatsAppUrl(selectedOrder)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-[#25d366] px-4 py-2 text-sm font-bold text-white shadow hover:bg-[#20b859]"
                    >
                      <MessageCircle className="h-4 w-4" />
                      مراسلة العميل بالطلب عبر واتساب
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
