import type { Order } from "../drizzle/schema";
import * as db from "./db";
import { publishAccountNotification } from "./notificationStream";

type NotificationEvent = "status_changed" | "customer_cancelled";
type OrderNotificationOptions = { includeInApp?: boolean };

const statusCopy: Record<string, { ar: string; en: string }> = {
  new: { ar: "تم استلام طلبك", en: "Your order was received" },
  contacted: { ar: "تم التواصل بشأن طلبك", en: "We contacted you about your order" },
  confirmed: { ar: "تم تأكيد طلبك", en: "Your order was confirmed" },
  shipped: { ar: "تم شحن طلبك", en: "Your order was shipped" },
  delivered: { ar: "تم تسليم طلبك", en: "Your order was delivered" },
  cancelled: { ar: "تم إلغاء طلبك", en: "Your order was cancelled" },
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  }[char] || char));
}

export function getNotificationCopy(order: Order, event: NotificationEvent) {
  const state = statusCopy[order.status] || statusCopy.new;
  const name = order.customerName || "عميلنا العزيز";
  const title = event === "customer_cancelled"
    ? `تم إلغاء طلبك #${order.id}`
    : `${state.ar} — طلب #${order.id}`;
  const message = event === "customer_cancelled"
    ? `مرحبًا ${name}، تم استلام طلب إلغاء الطلب رقم #${order.id}.`
    : `مرحبًا ${name}، ${state.ar}. رقم الطلب #${order.id}${order.productName ? ` — ${order.productName}` : ""}.`;
  return { title, message, statusLabel: state.ar };
}

/** Creates the customer-visible site notification before any external delivery attempt. */
export async function createOrderInAppNotification(order: Order, event: NotificationEvent) {
  if (!order.userId) return { delivered: false, reason: "no_account" } as const;
  const copy = getNotificationCopy(order, event);
  await db.createOrderNotification({
    orderId: order.id,
    userId: order.userId,
    channel: "in_app",
    eventType: event,
    status: order.status,
    title: copy.title,
    message: copy.message,
    deliveryStatus: "in_app",
  });
  publishAccountNotification(order.userId);
  return { delivered: true } as const;
}

/**
 * Writes an in-account notification, then attempts email delivery without
 * allowing provider errors to interrupt the state transition of an order.
 */
export async function notifyOrderCustomer(order: Order, event: NotificationEvent, options: OrderNotificationOptions = {}) {
  const copy = getNotificationCopy(order, event);

  if (options.includeInApp !== false) {
    await createOrderInAppNotification(order, event);
  }

  const account = order.userId ? await db.getUserById(order.userId) : undefined;
  const recipient = order.customerEmail || account?.email || undefined;
  const sender = process.env.RESEND_FROM_EMAIL;

  if (!recipient || !sender || !process.env.RESEND_API_KEY) {
    await db.createOrderNotification({
      orderId: order.id,
      userId: order.userId || null,
      channel: "email",
      eventType: event,
      status: order.status,
      title: copy.title,
      message: copy.message,
      recipient: recipient || null,
      deliveryStatus: "skipped",
    });
    return { delivered: false, reason: !recipient ? "no_recipient" : "email_not_configured" } as const;
  }

  const origin = process.env.CANONICAL_ORIGIN || "https://elnoursteel-eexiztdb.manus.space";
  const orderUrl = `${origin}/account/orders/${order.id}`;
  const safeName = escapeHtml(order.customerName || "عميلنا العزيز");
  const safeProduct = escapeHtml(order.productName || "طلبك");
  const html = `
    <main dir="rtl" style="font-family:Arial,sans-serif;color:#1d1b18;max-width:620px;margin:auto;padding:32px">
      <h1 style="margin:0 0 16px;color:#9f711b;font-size:24px">${escapeHtml(copy.title)}</h1>
      <p>مرحبًا ${safeName}،</p>
      <p>${escapeHtml(copy.message)}</p>
      <section style="background:#f7f2e8;border-radius:12px;padding:18px;margin:22px 0">
        <p style="margin:0 0 8px"><strong>رقم الطلب:</strong> #${order.id}</p>
        <p style="margin:0 0 8px"><strong>المنتج:</strong> ${safeProduct}</p>
        <p style="margin:0"><strong>الحالة الحالية:</strong> ${escapeHtml(copy.statusLabel)}</p>
      </section>
      <a href="${orderUrl}" style="display:inline-block;background:#9f711b;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px">عرض تفاصيل الطلب</a>
      <p style="color:#68625a;font-size:12px;margin-top:28px">Elnour for STEEL</p>
    </main>`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: sender,
        to: [recipient],
        subject: copy.title,
        html,
        text: `${copy.message}\n\nرقم الطلب: #${order.id}\nالحالة: ${copy.statusLabel}\n${orderUrl}`,
      }),
    });
    const payload = await response.json().catch(() => ({})) as { id?: string; message?: string };
    if (!response.ok) throw new Error(payload.message || `Resend response ${response.status}`);
    await db.createOrderNotification({
      orderId: order.id,
      userId: order.userId || null,
      channel: "email",
      eventType: event,
      status: order.status,
      title: copy.title,
      message: copy.message,
      recipient,
      deliveryStatus: "sent",
      providerMessageId: payload.id || null,
    });
    return { delivered: true } as const;
  } catch (error) {
    console.warn("[Order notifications] Email delivery failed", error);
    await db.createOrderNotification({
      orderId: order.id,
      userId: order.userId || null,
      channel: "email",
      eventType: event,
      status: order.status,
      title: copy.title,
      message: copy.message,
      recipient,
      deliveryStatus: "failed",
    });
    return { delivered: false, reason: "delivery_failed" } as const;
  }
}
