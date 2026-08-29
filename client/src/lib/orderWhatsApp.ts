export type OrderWhatsAppMessageInput = {
  id: number;
  customerName?: string | null;
  customerPhone?: string | null;
  productName?: string | null;
  status: string;
  orderUrl?: string;
};

export const DEFAULT_BUSINESS_WHATSAPP = "01121748885";
export const DEFAULT_BUSINESS_WHATSAPP_MESSAGE = "مرحباً، أرغب في الاستفسار عن أعمال Elnour Homes Luxury Steel";

const STATUS_COPY: Record<string, string> = {
  new: "تم استلام طلبك",
  contacted: "تم التواصل بشأن طلبك",
  confirmed: "تم تأكيد طلبك",
  shipped: "تم شحن طلبك",
  delivered: "تم تسليم طلبك",
  cancelled: "تم إلغاء طلبك",
};

export function normalizeWhatsAppRecipient(phone?: string | null) {
  const digits = (phone || "").replace(/\D/g, "").replace(/^0020/, "20");
  if (!digits) return "";
  if (digits.startsWith("0") && digits.length === 11) return `20${digits.slice(1)}`;
  if (digits.length === 10 && digits.startsWith("1")) return `20${digits}`;
  if (digits.length === 12 && digits.startsWith("201")) return digits;
  return "";
}

export function buildBusinessWhatsAppUrl(phone?: string | null, message = DEFAULT_BUSINESS_WHATSAPP_MESSAGE) {
  const recipient = normalizeWhatsAppRecipient(phone) || normalizeWhatsAppRecipient(DEFAULT_BUSINESS_WHATSAPP);
  return `https://wa.me/${recipient}?text=${encodeURIComponent(message)}`;
}

export function buildOrderWhatsAppMessage(order: OrderWhatsAppMessageInput) {
  const name = order.customerName?.trim() || "عميلنا العزيز";
  const status = STATUS_COPY[order.status] || "تم تحديث طلبك";
  const product = order.productName?.trim() ? `\nالمنتج: ${order.productName.trim()}` : "";
  const details = order.orderUrl ? `\nلمتابعة التفاصيل: ${order.orderUrl}` : "";
  return `مرحبًا ${name}،\n${status}.\nرقم الطلب: #${order.id}${product}${details}\n\nElnour Homes`;
}

export function buildOrderWhatsAppUrl(order: OrderWhatsAppMessageInput) {
  const recipient = normalizeWhatsAppRecipient(order.customerPhone);
  if (!recipient) return null;
  return `https://wa.me/${recipient}?text=${encodeURIComponent(buildOrderWhatsAppMessage(order))}`;
}
