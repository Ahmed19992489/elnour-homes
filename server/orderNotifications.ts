import type { Order } from "../drizzle/schema";

type NotificationEvent = "status_changed" | "customer_cancelled";

const statusCopy: Record<string, { ar: string; en: string }> = {
  new: { ar: "تم استلام طلبك", en: "Your order was received" },
  contacted: { ar: "تم التواصل بشأن طلبك", en: "We contacted you about your order" },
  confirmed: { ar: "تم تأكيد طلبك", en: "Your order was confirmed" },
  shipped: { ar: "تم شحن طلبك", en: "Your order was shipped" },
  delivered: { ar: "تم تسليم طلبك", en: "Your order was delivered" },
  cancelled: { ar: "تم إلغاء طلبك", en: "Your order was cancelled" },
};

export function getNotificationCopy(order: Order, event: NotificationEvent) {
  const state = statusCopy[order.status] || statusCopy.new;
  const name = order.customerName || "عميلنا العزيز";
  const title =
    event === "customer_cancelled"
      ? `تم إلغاء طلبك #${order.id}`
      : `${state.ar} — طلب #${order.id}`;
  const message =
    event === "customer_cancelled"
      ? `مرحبًا ${name}، تم استلام طلب إلغاء طلبك رقم #${order.id}.`
      : `مرحبًا ${name}، ${state.ar}. رقم الطلب #${order.id}${
          order.productName ? ` — ${order.productName}` : ""
        }.`;
  return { title, message, statusLabel: state.ar };
}

export async function notifyOrderCustomer(
  order: Order,
  event: NotificationEvent
) {
  const copy = getNotificationCopy(order, event);
  console.log(`[Notification] Order #${order.id} event: ${event} - ${copy.title}`);
  return { delivered: true } as const;
}
