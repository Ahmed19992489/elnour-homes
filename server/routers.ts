import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { COOKIE_NAME, ADMIN_COOKIE_NAME } from "../shared/const";
import { ENV } from "./_core/env";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, adminProcedure, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { hasProductImage, parseProductImages, serializeProductImages } from "../client/src/lib/productImages";
import { z } from "zod";
import * as db from "./db";
import * as orderNotifications from "./orderNotifications";
import { notifyOwner } from "./_core/notification";
import { computeCartItemPrice, isOptionAvailable } from "../shared/cartPricing";
16: const couponReasons = {

invalidCode: "رمز الكوبون غير صحيح",
inactive: "هذا الكوبون متوقف عن العمل",
notStarted: "هذا الكوبون لم يبدأ بعد",
expired: "انتهت صلاحية هذا الكوبون",
exhausted: "تم استنفاد استخدامات هذا الكوبون",
belowMinimum: "الحد الأدنى للطلب لم يتحقق",
};
25: const legacyCategorySlugs: Record<string, string> = {

"أعمال ديكور": "home-decor",
"لوحات قرآنية": "wall-art",
"لوحات إسلامية": "wall-art",
"لوحات جدارية": "wall-art",
"طرابيزة": "tables",
"ابواب": "doors",
"سلم حدي
};
35: function normalizeCategorySlug(category: string) {

return legacyCategorySlugs[category.trim()] || category.trim();
}
39: function parseProductOptions(value?: string | null) {

return (value || "").split(",").map(option => option.trim()).filter(Boolean);
}
43: /**

* Owner/master-admin check. The site owner may sign in two ways:
* 1) Manus OAuth — ctx.user.openId === OWNER_OPEN_ID
* 2) Phone-based admin login — the admin credential created FIRST in the
*    credentials table is treated as the master admin (it holds ownership
*    privileges such as the SQM price and deleting admin accounts).
*/
let masterAdminOpenIdCache: { value: string | null; at: number } = { value: null, at: 0 };
52: /** Reset the master-admin cache — used by tests to isolate each scenario. */

export function __resetMasterAdminCache(): void {
masterAdminOpenIdCache = { value: null, at: 0 };
}
57: async function getMasterAdminOpenId(): Promise<string | null> {

const now = Date.now();
if (masterAdminOpenIdCache.value !== null && now - masterAdminOpenIdCache.at < 5 * 60 * 1000) {
return masterAdminOpenIdCache.value;
}
try {
const creds = await db.getAllAdminCredentials();
const first = [...creds]
.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
.find(c => c.isActive === "yes");
masterAdminOpenIdCache = { value: first ? `admin-${first.phone}` : null, at: now };
return masterAdminOpenIdCache.value;
} catch {
return null;
}
}
74: async function isOwnerOrMasterAdmin(user: { openId: string | null } | null, ownerOpenId: string): Promise<boolean> {

if (!user) return false;
if (user.openId === ownerOpenId) return true;
const master = await getMasterAdminOpenId();
return master !== null && user.openId === master;
}
81: function isAvailableOption(options: string[], selected?: string) {

if (!options.length) return !selected;
if (!selected) return false;
return options.some(option => option.toLocaleLowerCase() === selected.trim().toLocaleLowerCase());
}
87: export const appRouter = router({

system: systemRouter,
auth: router({
me: publicProcedure.query(opts => opts.ctx.user),
logout: publicProcedure.mutation(({ ctx }) => {
const cookieOptions = getSessionCookieOptions(ctx.req);
ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
return { success: true } as const;
}),
}),
98:   products: router({

list: publicProcedure.query(async () => {
return db.getAllProducts();
}),
active: publicProcedure
.input(z.object({ category: z.string().min(1).optional() }).optional())
.query(async ({ input }) => {
return input?.category
? db.getActiveProductsByCategory(input.category)
: db.getActiveProducts();
}),
byId: publicProcedure
.input(z.object({ id: z.number() }))
.query(async ({ input }) => {
return db.getProductById(input.id);
}),
create: adminProcedure
.input(z.object({
name: z.string().min(1),
nameAr: z.string().min(1),
description: z.string().optional(),
price: z.number().min(0),
sizes: z.string().optional(),
<truncated 4614 bytes>
sizeOptions: z.string().optional(),
colorOptions: z.string().optional(),
pricingType: z.enum(["fixed", "per_meter"]).optional(),
pricePerMeter: z.number().min(0).optional(),
category: z.string().min(1).default("home-decor"),
specifications: z.string().optional(),
images: z.string().optional(),
isActive: z.enum(["yes", "no"]).default("yes"),
sortOrder: z.number().default(0),
}))
.mutation(async ({ input }) => {
const category = normalizeCategorySlug(input.category);
if (!await db.categorySlugExists(category)) {
throw new Error("يرجى اختيار فئة صالحة من الفئات المُدارة في لوحة التحكم");
}
if (input.isActive === "yes" && !hasProductImage(input.images)) {
throw new Error("أضف صورة واحدة على الأقل قبل نشر المنتج في المتجر");
}
await db.createProduct({
...input,
category,
price: String(input.price),
pricePerMeter: input.pricePerMeter !== undefined ? String(input.pricePerMeter) : undefined,
pricingType: input.pricingType ?? "fixed",
});
return { success: true };
}),
update: adminProcedure
.input(z.object({
id: z.number(),
name: z.string().min(1).optional(),
nameAr: z.string().min(1).optional(),
description: z.string().optional(),
price: z.number().min(0).optional(),
sizes: z.string().optional(),
colors: z.string().optional(),
sizeOptions: z.string().optional(),
colorOptions: z.string().optional(),
pricingType: z.enum(["fixed", "per_meter"]).optional(),
pricePerMeter: z.number().min(0).optional(),
category: z.string().min(1).optional(),
specifications: z.string().optional(),
images: z.string().optional(),
isActive: z.enum(["yes", "no"]).optional(),
sortOrder: z.number().optional(),
}))
.mutation(async ({ input }) => {
const { id, ...data } = input;
const existingProduct = await db.getProductById(id);
if (!existingProduct) throw new Error("المنتج غير موجود");
const updateData: any = { ...data };
if (updateData.price !== undefined) updateData.price = String(updateData.price);
if (updateData.pricePerMeter !== undefined) updateData.pricePerMeter = String(updateData.pricePerMeter);
if (updateData.category !== undefined) {
updateData.category = normalizeCategorySlug(updateData.category);
if (!await db.categorySlugExists(updateData.category)) {
throw new Error("يرجى اختيار فئة صالحة من الفئات المُدارة في لوحة التحكم");
}
}
const effectiveStatus = updateData.isActive ?? existingProduct.isActive;
const effectiveImages = updateData.images ?? existingProduct.images;
if (effectiveStatus === "yes" && !hasProductImage(effectiveImages)) {
throw new Error("أضف صورة واحدة على الأقل قبل نشر المنتج في المتجر");
}
await db.updateProduct(id, updateData);
return { success: true };
}),
delete: adminProcedure
.input(z.object({ id: z.number() }))
.mutation(async ({ input }) => {
await db.deleteProduct(input.id);
return { success: true };
}),
}),
197:   categories: router({

list: publicProcedure.query(async () => {
return db.getAllCategories();
}),
active: publicProcedure.query(async () => {
return db.getActiveCategories();
}),
create: adminProcedure
.input(z.object({
slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9-]+$/, "استخدم حروفاً إنجليزية صغيرة وأرقاماً وشرطة فقط"),
nameAr: z.string().trim().min(1).max(120),
nameEn: z.string().trim().min(1).max(120),
descriptionAr: z.string().optional(),
descriptionEn: z.string().optional(),
isActive: z.enum(["yes", "no"]).default("yes"),
sortOrder: z.number().int().default(0),
}))
.mutation(async ({ input }) => {
await db.createCategory(input);
return { success: true };
}),
update: adminProcedure
.input(z.object({
id: z.number(),
slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9-]+$/, "استخدم حروفاً إنجليزية صغيرة وأرقاماً وشرطة فقط").optional(),
nameAr: z.string().trim().min(1).max(120).optional(),
nameEn: z.string().trim().min(1).max(120).optional(),
descriptionAr: z.string().optional(),
descriptionEn: z.string().optional(),
isActive: z.enum(["yes", "no"]).optional(),
sortOrder: z.number().int().optional(),
}))
.mutation(async ({ input }) => {
const { id, ...data } = input;
await db.updateCategory(id, data);
return { success: true };
}),
delete: adminProcedure
.input(z.object({ id: z.number() }))
.mutation(async ({ input }) => {
await db.deleteCategory(input.id);
return { success: true };
}),
}),
242:   orders: router({

create: publicProcedure
.input(z.object({
customerName: z.string().min(1, "الاسم مطلوب"),
customerPhone: z.string().min(5, "رقم الهاتف مطلوب"),
customerEmail: z.string().trim().email("يرجى إدخال بريد إلكتروني صحيح").optional(),
customerAddress: z.string().optional(),
productId: z.number().optional(),
productName: z.string().optional(),
productPrice: z.number().optional(),
selectedSize: z.string().trim().min(1).max(120).optional(),
selectedColor: z.string().trim().min(1).max(120).optional(),
message: z.string().optional(),
orderSource: z.string().default("web"),
couponCode: z.string().optional(),
orderValue: z.number().min(0).optional(),
utmSource: z.string().optional(),
utmMedium: z.string().optional(),
utmCampaign: z.string().optional(),
utmContent: z.string().optional(),
utmTerm: z.string().optional(),
referrer: z.string().optional(),
userAgent: z.string().optional(),
referralCode: z.string().trim().max(32).optional(),
}))
.mutation(async ({ ctx, input }) => {
const product = input.productId ? await db.getProductById(input.productId) : undefined;
if (input.productId && !product) throw new Error("المنتج غير متاح حاليًا");
// Validate size/color against legacy comma lists AND the JSON options (per-size prices)
const legacySizes = parseProductOptions(product?.sizes);
if (!isAvailableOption(legacySizes, input.selectedSize) && !isOptionAvailable(product?.sizes, product?.sizeOptions, "labelAr", input.selectedSize) && !isOptionAvailable(product?.sizes, product?.sizeOptions, "labelEn", input.selectedSize)) {
throw new Error("يرجى اختيار مقاس متاح للمنتج");
<truncated 8848 bytes>
const legacyColors = parseProductOptions(product?.colors);
if (!isAvailableOption(legacyColors, input.selectedColor) && !isOptionAvailable(product?.colors, product?.colorOptions, "labelAr", input.selectedColor) && !isOptionAvailable(product?.colors, product?.colorOptions, "labelEn", input.selectedColor)) {
throw new Error("يرجى اختيار لون متاح للمنتج");
}
280:         // Validate coupon if provided

let couponApplied = {
valid: false,
reason: "",
discount: 0,
} as { valid: boolean; reason: string; discount: number };
if (input.couponCode && input.couponCode.trim()) {
const now = new Date();
const coupon = await db.getCouponByCode(input.couponCode.trim());
const invalidReason =
!coupon ? "رمز الكوبون غير صحيح" :
coupon.isActive !== "yes" ? "هذا الكوبون متوقف عن العمل" :
coupon.startsAt && coupon.startsAt > now ? "هذا الكوبون لم يبدأ بعد" :
coupon.expiresAt && coupon.expiresAt < now ? "انتهت صلاحية هذا الكوبون" :
coupon.maxUsage !== null && coupon.usedCount >= coupon.maxUsage ? "تم استنفاد استخدامات هذا الكوبون" :
input.orderValue && input.orderValue < Number(coupon.minOrderValue) ? `الحد الأدنى للطلب ${Number(coupon.minOrderValue)} جنيه` :
null;
if (invalidReason) throw new Error(invalidReason);
const orderValue = input.orderValue ?? input.productPrice ?? 0;
const discount = coupon!.discountType === "percent"
? Math.min(orderValue, Math.round((orderValue * Number(coupon!.discountValue)) / 100))
: Math.min(orderValue, Number(coupon!.discountValue));
couponApplied = { valid: true, reason: "", discount };
await db.incrementCouponUsage(input.couponCode.trim());
}
306:         // Track referral code if provided (must belong to another existing customer)

let appliedReferralCode: string | undefined;
if (input.referralCode && input.referralCode.trim()) {
const normalizedRef = input.referralCode.trim().toUpperCase();
const referrer = await db.getReferralByCode(normalizedRef);
if (referrer) {
const selfReferral = ctx.user && referrer.userId === ctx.user.id;
if (!selfReferral) {
appliedReferralCode = normalizedRef;
}
}
}
319:         // Create the order (exclude client-only referralCode from the insert payload)

const { referralCode: _referralCode, ...restInput } = input;
const orderResult = await db.createOrder({
...restInput,
productName: product?.nameAr ?? input.productName,
productPrice: product ? String(product.price) : (input.productPrice ? String(input.productPrice) : undefined),
userId: ctx.user?.id,
couponCode: couponApplied.valid ? input.couponCode?.trim().toUpperCase() : undefined,
discountType: couponApplied.valid ? (couponApplied.discount > 0 ? "percent" : "none") : undefined,
discountValue: couponApplied.valid ? String(couponApplied.discount) : undefined,
referralCodeUsed: appliedReferralCode,
totalAfterDiscount: couponApplied.valid
? String(Math.max(0, (input.orderValue ?? input.productPrice ?? 0) - couponApplied.discount))
: undefined,
});
335:         // Send notification to owner

let notificationSent = false;
try {
const orderDetails = [
`العميل: ${input.customerName}`,
`الهاتف: ${input.customerPhone}`,
input.customerAddress ? `العنوان: ${input.customerAddress}` : "",
input.productName ? `المنتج: ${input.productName}` : "",
input.productPrice ? `السعر: ${input.productPrice} ج.م` : "",
input.message ? `رسالة: ${input.message}` : "",
input.utmSource ? `مصدر الإعلان: ${input.utmSource}` : "",
].filter(Boolean).join("\n");
348:           await notifyOwner({

title: "طلب جديد - Elnour for STEEL",
content: orderDetails,
});
notificationSent = true;
} catch (e) {
console.warn("Failed to send notification:", e);
}
357:         // Update notification status

if (orderResult[0]) {
const orderId = typeof orderResult[0].insertId === 'number' ? orderResult[0].insertId : undefined;
if (orderId) {
await db.updateOrderNotificationStatus(orderId, notificationSent);
const createdOrder = await db.getOrderById(orderId);
if (createdOrder) {
try {
await orderNotifications.createOrderInAppNotification(createdOrder, "status_changed");
} catch (error) {
console.warn("[Order notifications] Failed to create in-app notification after order creation", error);
}
void orderNotifications.notifyOrderCustomer(createdOrder, "status_changed", { includeInApp: false }).catch((error) => {
console.warn("[Order notifications] Failed after order creation", error);
});
}
}
}
376:         return { success: true, notificationSent };

}),
/**
* Multi-item cart checkout. Each item is validated against the live
* product configuration (sizeOptions / colorOptions / legacy fields).
* Coupons are applied to the cart subtotal exactly like single orders.
* Returns one order record whose productName is a human-readable summary
* so existing admin flows (list, stats, WhatsApp notifications) keep working.
*/
createCart: publicProcedure
.input(z.object({
customerName: z.string().min(1, "الاسم مطلوب"),
customerPhone: z.string().min(5, "رقم الهاتف مطلوب"),
customerEmail: z.string().trim().email("يرجى إدخال بريد إلكتروني صحيح").optional(),
customerAddress: z.string().optional(),
items: z.array(z.object({
productId: z.number(),
selectedSize: z.string().trim().min(1).max(120).optional(),
selectedColor: z.string().trim().min(1).max(120).optional(),
quantity: z.number().int().min(1).max(99),
})).min(1, "السلة فارغة").max(50),
message: z.string().optional(),
orderSource: z.string().default("web"),
couponCode: z.string().optional(),
orderValue: z.number().min(0).optional(),
utmSource: z.string().optional(),
utmMedium: z.string().optional(),
utmCampaign: z.string().optional(),
utmContent: z.string().optional(),
utmTerm: z.string().optional(),
referrer: z.string().optional(),
userAgent: z.string().optional(),
}))
.mutation(async ({ ctx, input }) => {
// 1. Load & validate every product, compute line totals
const items = await Promise.all(
input.items.map(async (item, index) => {
const product = await db.getProductById(item.productId);
if (!product) throw new Error(`المنتج رقم ${item.productId} غير متاح حاليًا`);
if (product.isActive !== "yes") throw new Error(`المنتج «${product.nameAr}» لم يعد متاحًا`);
const hasJsonSizes = Boolean(product.sizeOptions && product.sizeOptions.trim());
const legacySizes = parseProductOptions(product.sizes);
if ((hasJsonSizes || legacySizes.length) && !item.selectedSize) {
throw new Error(`يرجى اختيار مقاس للمنتج «${product.nameAr}»`);
}
const legacyColors = parseProductOptions(product.colors);
const hasJsonColors = Boolean(product.colorOptions && product.colorOptions.trim());
if ((hasJsonColors || legacyColors.length) && !item.selectedColor) {
throw new Error(`يرجى اختيار لون للمنتج «${product.nameAr}»`);
}
if (!isAvailableOption(legacySizes, item.selectedSize) && !isOptionAvailable(product.sizes, product.sizeOptions, "labelAr", item.selectedSize) && !isOptionAvailable(product.sizes, product.sizeOptions, "labelEn", item.selectedSize)) {
throw new Error(`المقاس المختار غير متاح للمنتج «${product.nameAr}»`);
}
if (!isAvailableOption(legacyColors, item.selectedColor) && !isOptionAvailable(product.colors, product.colorOptions, "labelAr", item.selectedColor) && !isOptionAvailable(product.colors, product.colorOptions, "labelEn", item.selectedColor)) {
throw new Error(`اللون المختار غير متاح للمنتج «${product.nameAr}»`);
}
const unitPrice = computeCartItemPrice(product, item.selectedSize, item.selectedColor);
const lineTotal = Math.round(unitPrice * item.quantity * 100) / 100;
return {
product,
selectedSize: item.selectedSize,
selectedColor: item.selectedColor,
quantity: item.quantity,
unitPrice,
lineTotal,
};
}),
);
445:         const subtotal = Math.round(items.reduce((sum, i) => sum + i.lineTotal, 0) * 100) / 100;

447:         // 2. Validate & apply coupon on the subtotal

let couponApplied = { valid: false, discount: 0 } as { valid: boolean; discount: number };
if (input.couponCode && input.couponCode.trim()) {
const now = new Date();
const coupon = await db.getCouponByCode(input.couponCode.trim());
const invalidReason =
!coupon ? couponReasons.invalidCode :
coupon.isActive !== "yes" ? couponReasons.inactive :
coupon.startsAt && coupon.startsAt > now ? couponReasons.notStarted :
coupon.expiresAt && coupon.expiresAt < now ? couponReasons.expired :
coupon.maxUsage !== null && coupon.usedCount >= coupon.maxUsage ? couponReasons.exhausted :
subtotal < Number(coupon.minOrderValue) ? `${couponReasons.belowMinimum} ${Number(coupon.minOrderValue)} جنيه` :
null;
if (invalidReason) throw new Error(invalidReason);
const discount = coupon!.discountType === "percent"
? Math.min(subtotal, Math.round((subtotal * Number(coupon!.discountValue)) / 100))
: Math.min(subtotal, Number(coupon!.discountValue));
couponApplied = { valid: true, discount };
await db.incrementCouponUsage(input.couponCode.trim());
}
468:         // 3. Build a human-readable summary for the single order record

const itemSummary = items.map((i) =>
`«${i.product.nameAr}»${i.selectedSize ? ` (${i.selectedSize})` : ""}${i.selectedColor ? ` — ${i.selectedColor}` : ""} × ${i.quantity}`,
);
const beforeDiscount = items.reduce((sum, i) => sum + i.lineTotal, 0);
474:         // 4. Create the order

const orderRes
customerName: input.customerName,
customerPhone: input.customerPhone,
customerEmail: input.customerEmail,
customerAddress: input.customerAddress || undefined,
productId: items[0].product.id,
productName: itemSummary.join(" | "),
productPrice: String(Math.max(0, beforeDiscount - couponApplied.discount)),
selectedSize: itemSummary.join(" | ").slice(0, 120),
selectedColor: undefined,
message: [input.message || ""].filter(Boolean).join(" ") || undefined,
orderSource: input.orderSource,
couponCode: couponApplied.valid ? input.couponCode?.trim().toUpperCase() : undefined,
discountType: couponApplied.valid ? (couponApplied.discount > 0 ? "percent" : "none") : undefined,
discountValue: couponApplied.valid ? String(couponApplied.discount) : undefined,
totalAfterDiscount: couponApplied.valid
? String(Math.max(0, subtotal - couponApplied.discount))
: undefined,
userId: ctx.user?.id,
utmSource: input.utmSource,
utmMedium: input.utmMedium,
utmCampaign: input.utmCampaign,
utmContent: input.utmContent,
utmTerm: input.utmTerm,
referrer: input.referrer,
userAgent: input.userAgent,
});
503:         // 5. Notify the owner

let notificationSent = false;
try {
const orderDetails = [
`طلب سلة مشتريات — ${items.length} صنف`,
`العميل: ${input.customerName}`,
`الهاتف: ${input.customerPhone}`,
input.customerAddress ? `العنوان: ${input.customerAddress}` : "",
...items.map((i) => `• ${i.product.nameAr} | ${i.selectedSize || "—"} | ${i.selectedColor || "—"} | ×${i.quantity} | ${i.lineTotal} ج.م`),
`الإجمالي: ${subtotal} ج.م` + (couponApplied.valid ? ` (خصم ${couponApplied.discount} ج.م)` : ""),
input.utmSource ? `مصدر الإعلان: ${input.utmSource}` : "",
].filter(Boolean).join("\n");
516:           await notifyOwner({

title: "طلب سلة جديد - Elnour for STEEL",
content: orderDetails,
});
notificationSent = true;
} catch (e) {
console.warn("Failed to send notification:", e);
}
525:         // 6. In-app + customer notifications

if (orderResult[0]) {
const orderId = typeof orderResult[0].insertId === "number" ? orderResult[0].insertId : undefined;
if (orderId) {
await db.updateOrderNotificationStatus(orderId, notificationSent);
const createdOrder = await db.getOrderById(orderId);
if (createdOrder) {
try {
await orderNotifications.createOrderInAppNotification(createdOrder, "status_changed");
} catch (error) {
console.warn("[Order notifications] Failed to create in-app notification after cart order creation", error);
}
void orderNotifications.notifyOrderCustomer(createdOrder, "status_changed", { includeInApp: false }).catch((error) => {
console.warn("[Order notifications] Failed after cart order creation", error);
});
}
}
}
544:         return { success: true, notificationSent, orderId: typeof orderResult[0]?.insertId === "number" ? (orderResult[0].insertId as number) : undefined, subtotal, discount: couponApplied.discount };

}),
    list: staffProcedure.query(async () => {
      return db.getOrders();
    }),
    byId: staffProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getOrderById(input.id);
      }),
    updateStatus: staffProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["new", "contacted", "confirmed", "shipped", "delivered", "cancelled"]),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const previousOrder = await db.getOrderById(input.id);
        if (!previousOrder) throw new Error("الطلب غير موجود");
        if (previousOrder.status === input.status) return { success: true };
        await db.updateOrderStatus(input.id, input.status, input.notes);
        const updatedOrder = await db.getOrderById(input.id);
        if (updatedOrder) {
          try {
              await orderNotifications.createOrderInAppNotification(updatedOrder, "status_changed");
          } catch (error) {
            console.warn("[Order notifications] Failed to create in-app notification after status update", error);
          }
            void orderNotifications.notifyOrderCustomer(updatedOrder, "status_changed", { includeInApp: false }).catch((error) => {
            console.warn("[Order notifications] Failed after status update", error);
          });
        }
        return { success: true };
      }),
    stats: staffProcedure.query(async () => {
      const orderStats = await db.getOrderStats();
      const pageviewStats = await db.getPageviewStats();
      return {
        ...orderStats,
        pageviews: pageviewStats.total,
        uniqueVisitors: pageviewStats.unique,
        todayVisitors: pageviewStats.today,
        conversionRate: pageviewStats.unique > 0
          ? ((orderStats.total / pageviewStats.unique) * 100)
          : 0,
        visitorBasedConversion: pageviewStats.unique > 0
          ? ((orderStats.total / pageviewStats.unique) * 100)
          : 0,
      };
    }),
    newCount: staffProcedure.query(async () => {
      return db.getNewOrdersCount();
    }),
}),
reviews: router({
create: protectedProcedure
.input(z.object({
productId: z.number().int().positive(),
rating: z.number().int().min(1).max(5),
comment: z.string().trim().max(1000).optional(),
}))
.mutation(async ({ ctx, input }) => {
// Only customers who bought the product may review it.
const userOrders = await db.getOrdersByUserId(ctx.user.id);
const bought = userOrders.some(
(order) => order.productId === input.productId && order.status !== "cancelled",
);
if (!bought) {
throw new Error("يمكنك تقييم المنتجات التي اشتريتها من المتجر فقط");
}
const existing = await db.getReviewByUserAndProduct(ctx.user.id, input.productId);
if (existing) {
throw new Error("لقد قمت بتقييم هذا المنتج من قبل");
}
await db.createProductReview({
userId: ctx.user.id,
productId: input.productId,
rating: input.rating,
comment: input.comment || null,
userName: ctx.user.name || null,
});
return { success: true } as const;
}),
forProduct: publicProcedure
.input(z.object({ productId: z.number().int().positive() }))
.query(async ({ input }) => {
const [stats, reviews] = await Promise.all([
db.getProductReviewStats(input.productId),
db.getProductReviewsByProductId(input.productId),
]);
return { stats, reviews };
}),
my: protectedProcedure.query(async ({ ctx }) => {
const userOrders = await db.getOrdersByUserId(ctx.user.id);
const productIds = Array.from(
new Set(
userOrders
.filter((order) => order.status !== "cancelled" && order.productId)
.map((order) => order.productId as number),
),
);
const eligible = await db.getActiveProductsByIds ? await db.getActiveProductsByIds(productIds) : (await db.getActiveProducts()).filter((product) => productIds.includes(product.id));
const reviews = await Promise.all(
eligible.map((product) =>
db.getReviewByUserAndProduct(ctx.user.id, product.id).then((review) => ({
product,
review,
})),
),
);
return reviews;
}),
adminList: adminProcedure.query(async () => {
const [reviews, users, products] = await Promise.all([
db.getAllProductReviews(),
db.getAllUsers(),
db.getAllProducts(),
]);
return { reviews, users, products };
}),
adminDelete: adminProcedure
.input(z.object({ id: z.number().int().positive() }))
.mutation(async ({ input }) => {
await db.deleteProductReview(input.id);
return { success: true } as const;
}),
}),
672:   pageviews: router({

track: publicProcedure
.input(z.object({
sessionId: z.string().optional(),
path: z.string().optional().default("/"),
referrer: z.string().optional(),
userAgent: z.string().optional(),
utmSource: z.string().optional(),
utmMedium: z.string().optional(),
utmCampaign: z.string().optional(),
}))
.mutation(async ({ input }) => {
await db.trackPageview(input);
return { success: true };
}),
}),
689:   gallery: router({

list: publicProcedure.query(async () => {
return db.getGalleryItems();
}),
create: adminProcedure
.input(z.object({
title: z.string().min(1),
imageUrl: z.string().min(1),
category: z.string().default("أعمال منجزة"),
sortOrder: z.number().default(0),
}))
.mutation(async ({ input }) => {
await db.createGalleryItem(input);
return { success: true };
}),
delete: adminProcedure
.input(z.object({ id: z.number() }))
.mutation(async ({ input }) => {
await db.deleteGalleryItem(input.id);
return { success: true };
}),
}),
712:   coupons: router({

list: adminProcedure.query(async () => {
return db.getAllCoupons();
}),
create: adminProcedure
.input(z.object({
code: z.string().trim().min(2).max(50).regex(/^[A-Za-z0-9-]+$/, "استخدم حروفاً إنجليزية وأرقاماً وشرطة فقط"),
description: z.string().optional(),
discountType: z.enum(["percent", "fixed"]),
discountValue: z.number().min(0),
minOrderValue: z.number().min(0).default(0),
maxUsage: z.number().int().min(1).optional(),
isActive: z.enum(["yes", "no"]).default("yes"),
startsAt: z.date().optional(),
expiresAt: z.date().optional(),
}))
.mutation(async ({ input }) => {
if (input.discountType === "percent" && input.discountValue > 100) {
throw new Error("الخصم المئوي لا يتجاوز 100%");
}
if (input.expiresAt && input.startsAt && input.expiresAt < input.startsAt) {
throw new Error("تاريخ النهاية يجب أن يكون بعد تاريخ البداية");
}
const existing = await db.getCouponByCode(input.code);
if (existing) throw new Error("رمز الكوبون مستخدم بالفعل، اختر رمزاً مختلفاً");
await db.createCoupon({
...input,
code: input.code.toUpperCase(),
discountValue: String(input.discountValue),
minOrderValue: String(input.minOrderValue),
});
return { success: true };
}),
update: adminProcedure
.input(z.object({
id: z.number(),
description: z.string().optional(),
discountType: z.enum(["percent", "fixed"]).optional(),
discountValue: z.number().min(0).optional(),
minOrderValue: z.number().min(0).optional(),
maxUsage: z.number().int().min(1).optional(),
isActive: z.enum(["yes", "no"]).optional(),
startsAt: z.date().optional(),
expiresAt: z.date().optional(),
}))
.mutation(async ({ input }) => {
const { id, ...data } = input;
const updateData: any = { ...data };
if (updateData.discountValue !== undefined) updateData.discountValue = String(updateData.discountValue);
if (updateData.minOrderValue !== undefined) updateData.minOrderValue = String(updateData.minOrderValue);
await db.updateCoupon(id, updateData);
return { success: true };
}),
toggle: adminProcedure
.input(z.object({ id: z.number(), isActive: z.enum(["yes", "no"]) }))
.mutation(async ({ input }) => {
await db.updateCoupon(input.id, { isActive: input.isActive });
return { success: true };
}),
delete: adminProcedure
.input(z.object({ id: z.number() }))
.mutation(async ({ input }) => {
await db.deleteCoupon(input.id);
return { success: true };
}),
/**
* Public active offers — coupons that are enabled and currently within their
* validity window, shown on /offers so customers can copy redeemable codes.
*/
getOffers: publicProcedure.query(async () => {
const now = new Date();
const coupons = 
return coupons
.filter((c) => {
if (c.isActive !== "yes") return false;
if (c.startsAt && c.startsAt > now) return false;
if (c.expiresAt && c.expiresAt < now) return false;
if (c.maxUsage !== null && c.usedCount >= c.maxUsage) return false;
return true;
})
.map((c) => ({
code: c.code,
discountType: c.discountType,
discountValue: Number(c.discountValue),
minOrderValue: Number(c.minOrderValue ?? 0),
expiresAt: c.expiresAt ? c.expiresAt.getTime() : null,
startsAt: c.startsAt ? c.startsAt.getTime() : null,
note: c.description ?? "",
}));
}),
validate: publicProcedure
.input(z.object({ code: z.string().min(1), orderValue: z.number().min(0) }))
.mutation(async ({ input }) => {
const now = new Date();
const coupon = await db.getCouponByCode(input.code);
if (!coupon) return { valid: false, reason: "رمز الكوبون غير صحيح", discount: 0 } as const;
if (coupon.isActive !== "yes") return { valid: false, reason: "هذا الكوبون متوقف عن العمل", discount: 0 } as const;
if (coupon.startsAt && coupon.startsAt > now) return { valid: false, reason: "هذا الكوبون لم يبدأ بعد", discount: 0 } as const;
if (coupon.expiresAt && coupon.expiresAt < now) return { valid: false, reason: "انتهت صلاحية هذا الكوبون", discount: 0 } as const;
if (coupon.maxUsage !== null && coupon.usedCount >= coupon.maxUsage) return { valid: false, reason: "تم استنفاد استخدامات هذا الكوبون", discount: 0 } as const;
if (input.orderValue < Number(coupon.minOrderValue)) return { valid: false, reason: `الحد الأدنى للطلب ${Number(coupon.minOrderValue)} جنيه`, discount: 0 } as const;
const discount = coupon.discountType === "percent"
? Math.min(input.orderValue, Math.round((input.orderValue * Number(coupon.discountValue)) / 100))
: Math.min(input.orderValue, Number(coupon.discountValue));
return { valid: true, reason: "", discount } as const;
}),
}),
820:   account: router({

me: protectedProcedure.query(async ({ ctx }) => {
return { id: ctx.user.id, name: ctx.user.name, email: ctx.user.email, phone: ctx.user.phone, address: ctx.user.address };
}),
orders: protectedProcedure.query(async ({ ctx }) => {
return db.getOrdersByUserId(ctx.user.id);
}),
notifications: protectedProcedure.query(async ({ ctx }) => {
return db.getOrderNotificationsByUserId(ctx.user.id);
}),
orderDetails: protectedProcedure
.input(z.object({ id: z.number().int().positive() }))
.query(async ({ ctx, input }) => {
const details = await db.getOrderDetailsByUserId(input.id, ctx.user.id);
if (!details) {
// Identical response for missing and unowned records avoids leaking
// whether a different customer's order number exists.
throw new Error("الطلب غير موجود أو لا تملك صلاحية الاطلاع عليه");
}
return details;
}),
updateProfile: protectedProcedure
.input(z.object({
name: z.string().min(1).optional(),
phone: z.string().min(5).optional(),
address: z.string().optional(),
}))
.mutation(async ({ ctx, input }) => {
await db.updateUserProfile(ctx.user.id, input);
return { success: true };
}),
cancelOrder: protectedProcedure
.input(z.object({ id: z.number().int().positive(), reason: z.string().trim().max(500).optional() }))
.mutation(async ({ ctx, input }) => {
const details = await db.getOrderDetailsByUserId(input.id, ctx.user.id);
if (!details) throw new Error("الطلب غير موجود أو لا تملك صلاحية إلغائه");
if (!["new", "contacted", "confirmed"].includes(details.order.status)) {
throw new Error("لا يمكن إلغاء الطلب بعد بدء الشحن أو التسليم");
}
const cancelled = await db.cancelOrderByCustomer(input.id, ctx.user.id, input.reason);
if (!cancelled) throw new Error("تعذر إلغاء الطلب. يرجى تحديث الصفحة والمحاولة مرة أخرى");
const cancelledOrder = await db.getOrderById(input.id);
if (cancelledOrder) {
try {
await orderNotifications.createOrderInAppNotification(cancelledOrder, "customer_cancelled");
} catch (error) {
console.warn("[Order notifications] Failed to create in-app notification after customer cancellation", error);
}
void orderNotifications.notifyOrderCustomer(cancelledOrder, "customer_cancelled", { includeInApp: false }).catch((error) => {
console.warn("[Order notifications] Failed after customer cancellation", error);
});
}
return { success: true };
}),
}),
876:   siteContent: router({

list: publicProcedure.query(async () => {
return db.getSiteContent();
}),
update: adminProcedure
.input(z.object({
sectionKey: z.string().min(1),
titleAr: z.string().optional(),
titleEn: z.string().optional(),
contentAr: z.string().optional(),
contentEn: z.string().optional(),
subtitleAr: z.string().optional(),
subtitleEn: z.string().optional(),
}))
.mutation(async ({ input }) => {
const { sectionKey, ...data } = input;
await db.updateSiteContent(sectionKey, data);
return { success: true };
}),
}),
897:   contactInfo: router({

get: publicProcedure.query(async () => {
const row = await db.getSiteContentByKey("contact");
if (!row) {
return { facebookUrl: "", instagramUrl: "", telegramUrl: "", whatsappNumber: "", whatsAppMessage: "", phone: "" };
}
return {
facebookUrl: row.titleAr ?? "",
instagramUrl: row.titleEn ?? "",
telegramUrl: row.contentAr ?? "",
whatsappNumber: row.contentEn ?? "",
whatsAppMessage: row.subtitleAr ?? "",
phone: row.subtitleEn ?? "",
};
}),
update: adminProcedure
.input(z.object({
facebookUrl: z.string().optional(),
instagramUrl: z.string().optional(),
telegramUrl: z.string().optional(),
whatsappNumber: z.string().optional(),
whatsAppMessage: z.string().optional(),
phone: z.string().optional(),
}))
.mutation(async ({ input }) => {
if (input.facebookUrl !== undefined && !/^https:\/\/.+/i.test(input.facebookUrl)) {
throw new Error("أدخل رابط فيسبوك صحيحاً يبدأ بـ https");
}
await db.updateSiteContent("contact", {
titleAr: input.facebookUrl ?? null,
titleEn: input.instagramUrl ?? null,
contentAr: input.telegramUrl ?? null,
contentEn: input.whatsappNumber ?? null,
subtitleAr: input.whatsAppMessage ?? null,
subtitleEn: input.phone ?? null,
});
return { success: true };
}),
}),
937:   mediaLibrary: router({

productImages: publicProcedure.query(async () => {
const allProducts = await db.getAllProducts();
return allProducts.flatMap(product =>
parseProductImages(product.images).map(url => ({
url,
productId: product.id,
productNameAr: product.nameAr,
productName: product.name,
}))
);
}),
galleryImages: publicProcedure.query(async () => {
const items = await db.getGalleryItems();
return items.map(item => ({ url: item.imageUrl, galleryId: item.id, title: item.title }));
}),
removeProductImage: adminProcedure
.input(z.object({ productId: z.number(), url: z.string().min(1) }))
.mutation(async ({ input }) => {
const product = await db.getProductById(input.productId);
if (!product) throw new Error("المنتج غير موجود");
const remaining = parseProductImages(product.images).filter(u => u !== input.url);
await db.updateProduct(input.productId, { images: serializeProductImages(remaining) });
return { success: true, remainingCount: remaining.length };
}),
removeGalleryImage: adminProcedure
.input(z.object({ galleryId: z.number() }))
.mutation(async ({ input }) => {
await db.deleteGalleryItem(input.galleryId);
return { success: true };
}),
}),
970:   upload: router({

uploadImage: adminProcedure
.input(z.object({
filename: z.string().min(1),
base64: z.string().min(1),
contentType: z.string().default("image/jpeg"),
}))
.mutation(async ({ input }) => {
const { storagePut } = await import("./storage");
const key = `uploads/${Date.now()}_${input.filename}`;
// Decode base64 to bytes
const base64Data = input.base64.replace(/^data:[^;]+;base64,/, '');
const buffer = Buffer.from(base64Data, 'base64');
const result = await storagePut(key, buffer, input.contentType);
return { key: result.key, url: result.url };
}),
}),
988:   /**

* Phone-based admin login — independent from Manus OAuth.
* Only the two authorized phone numbers can log in, and only the site owner
* (OWNER_OPEN_ID via adminProcedure) can create/update their credentials.
*/
adminAuth: router({
/**
* Seed or update an admin credential. Only callable by the owner (adminProcedure).
* Requires the env password value ADMIN_PHONE_1_PASSWORD / ADMIN_PHONE_2_PASSWORD
* to match the supplied password so a leaked token can never silently reassign it.
*/
setup: adminProcedure
.input(
z.object({
phone: z.string().min(1),
password: z.string().min(8),
displayName: z.string().min(1),
})
)
.mutation(async ({ input }) => {
const normalized = db.normalizePhone(input.phone);
const expected =
normalized === db.normalizePhone("01118182424")
? process.env.ADMIN_PHONE_1_PASSWORD
: normalized === db.normalizePhone("01121748885")
? process.env.ADMIN_PHONE_2_PASSWORD
: undefined;
if (!expected || expected !== input.password) {
throw new Error(
"كلمة المرور لا تتطابق مع كلمة المرور المسجلة لهذا الرقم في إعدادات الموقع"
);
}
const hash = await bcrypt.hash(input.password, 10);
await db.upsertAdminCredential({
phone:
passwordHash: hash,
displayName: input.displayName,
});
return { success: true, phone: normalized };
}),
1029:     /** Public login: phone + password → signed admin session cookie. */

login: publicProcedure
.input(
z.object({
phone: z.string().min(1),
password: z.string().min(1),
rememberMe: z.boolean().optional(),
})
)
.mutation(async ({ 
const cookieOptions = getSessionCookieOptions(ctx.req);
const ip =
(ctx.req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
ctx.req.ip ||
"";
const normalized = db.normalizePhone(input.phone);
1046:         const rateLimit = 5;

const recentFailures = await db.countRecentFailedAdminAttempts(
ip,
15 * 60 * 1000
);
if (recentFailures >= rateLimit) {
await db.recordFailedAdminLogin(ip, normalized);
throw new Error(
"عدد محاولات الدخول الخاطئة كبير، انتظر 15 دقيقة ثم حاول مرة أخرى"
);
}
1058:         const credential = await db.getAdminCredentialByPhone(normalized);

if (!credential || credential.isActive !== "yes") {
await db.recordFailedAdminLogin(ip, normalized);
throw new Error("رقم الهاتف أو كلمة المرور غير صحيحة");
}
1064:         const match = await bcrypt.compare(input.password, credential.passwordHash);

if (!match) {
await db.recordFailedAdminLogin(ip, normalized);
throw new Error("رقم الهاتف أو كلمة المرور غير صحيحة");
}
1070:         const jti = crypto.randomUUID();

const rememberMe = Boolean(input.rememberMe);
const days = rememberMe ? 30 : 7;
const sessionExpiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
const sessionPayload = {
openId: `admin-${normalized}`,
appId: ENV.appId,
name: credential.displayName || normalized,
jti,
};
const secretKey = new TextEncoder().encode(ENV.cookieSecret);
const token = await new SignJWT(sessionPayload)
.setProtectedHeader({ alg: "HS256", typ: "JWT" })
.setExpirationTime(Math.floor(sessionExpiresAt.getTime() / 1000))
.sign(secretKey);
1086:         await db.createAdminSession({

adminPhone: normalized,
jti,
userAgent: ctx.req.headers["user-agent"] || null,
ip,
expiresAt: sessionExpiresAt,
});
1094:         // Invalidate stale sessions for this phone so only one device stays signed in.

await db.deleteAdminSessionsByPhone(normalized);
await db.createAdminSession({
adminPhone: normalized,
jti,
userAgent: ctx.req.headers["user-agent"] || null,
ip,
expiresAt: sessionExpiresAt,
});
1104:         ctx.res.cookie(ADMIN_COOKIE_NAME, token, {

...cookieOptions,
maxAge: days * 24 * 60 * 60,
});
return { success: true, name: credential.displayName || normalized };
}),
1111:     me: publicProcedure.query(async ({ ctx }) => {
    me: publicProcedure.query(async ({ ctx }) => {
if (!ctx.user || ctx.user.role !== "admin") return null;
const owner = await isOwnerOrMasterAdmin(ctx.user, ENV.ownerOpenId);
return {
openId: ctx.user.openId,
name: ctx.user.name,
phone: ctx.user.phone || null,
loginMethod: ctx.user.loginMethod || "admin_phone",
isOwner: owner,
};
}),
1123:     logout: publicProcedure.mutation(({ ctx }) => {

const cookieOptions = getSessionCookieOptions(ctx.req);
ctx.res.clearCookie(ADMIN_COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
return { success: true } as const;
}),
}),
1130:   /**

  /**
   * Site-wide settings (e.g. the SQM price used for size-based auto pricing).
   * Readable publicly (the storefront uses it) but only writable by admins.
   */
  settings: router({
    get: publicProcedure.query(async () => {
      const sqm = await db.getSetting("sqm_price");
      const price = sqm?.settingValue ? parseInt(sqm.settingValue, 10) : 3000;
      return { sqmPrice: Number.isFinite(price) ? price : 3000 };
    }),
    setSqmPrice: adminProcedure
      .input(z.object({ price: z.number().int().min(100).max(100000) }))
      .mutation(async ({ ctx, input }) => {
        if (!await isOwnerOrMasterAdmin(ctx.user, ENV.ownerOpenId)) {
          throw new Error("تغيير سعر المتر متاح لمالك الموقع فقط");
        }
        await db.upsertSetting("sqm_price", String(input.price));
        return { success: true, sqmPrice: input.price };
      }),
  }),

  /**
   * Admin account management — list, add, change password, disable/enable and
   * remove phone-based admin logins. Only the site owner (OWNER_OPEN_ID) may delete accounts.
   */
  adminAccounts: router({
    list: adminProcedure.query(async () => {
      const creds = await db.getAllAdminCredentials();
      return creds.map((c) => ({
        id: c.id,
        phone: c.phone,
        displayName: c.displayName,
        role: (c as any).role || "admin",
        isActive: c.isActive,
        createdAt: c.createdAt.getTime(),
      }));
    }),
    create: adminProcedure
      .input(
        z.object({
          phone: z.string().min(9),
          password: z.string().min(8),
          displayName: z.string().min(1).max(120),
          role: z.enum(["admin", "moderator"]).default("admin"),
        })
      )
      .mutation(async ({ input }) => {
        const normalized = db.normalizePhone(input.phone);
        if (!/^01[0-9]{9}$/.test(normalized)) {
          throw new Error("رقم الهاتف غير صالح — يجب أن يكون رقمًا مصريًا يبدأ بـ 01 ويتكون من 11 رقمًا");
        }
        const existing = await db.getAdminCredentialByPhone(normalized);
        if (existing) {
          throw new Error("يوجد حساب بهذا الرقم بالفعل — استخدم تغيير كلمة المرور أو إعادة التفعيل");
        }
        const hash = await bcrypt.hash(input.password, 10);
        await db.upsertAdminCredential({
          phone: normalized,
          passwordHash: hash,
          displayName: input.displayName.trim(),
          role: input.role,
        });
        return { success: true, phone: normalized };
      }),
    updatePassword: adminProcedure
      .input(z.object({ phone: z.string().min(9), password: z.string().min(8) }))
      .mutation(async ({ input }) => {
        const normalized = db.normalizePhone(input.phone);
        const existing = await db.getAdminCredentialByPhone(normalized);
        if (!existing) throw new Error("لا يوجد حساب مدراء بهذا الرقم");
        const hash = await bcrypt.hash(input.password, 10);
        await db.upsertAdminCredential({ phone: normalized, passwordHash: hash, displayName: existing.displayName, role: existing.role });
        return { success: true };
      }),
    deactivate: adminProcedure
      .input(z.object({ phone: z.string().min(9) }))
      .mutation(async ({ input }) => {
        const normalized = db.normalizePhone(input.phone);
        await db.deactivateAdminCredential(normalized);
        await db.deleteAdminSessionsByPhone(normalized);
        return { success: true };
      }),
    activate: adminProcedure
      .input(z.object({ phone: z.string().min(9) }))
      .mutation(async ({ input }) => {
        await db.activateAdminCredential(db.normalizePhone(input.phone));
        return { success: true };
      }),
    remove: adminProcedure
      .input(z.object({ phone: z.string().min(9) }))
      .mutation(async ({ ctx, input }) => {
        if (!await isOwnerOrMasterAdmin(ctx.user, ENV.ownerOpenId)) {
          throw new Error("حذف حسابات المدراء متاح لمالك الموقع فقط");
        }
        const normalized = db.normalizePhone(input.phone);
        await db.deleteAdminCredential(normalized);
        return { success: true };
      }),
  }),
*/
restockAlerts: router({
create: publicProcedure
.input(z.object({
productId: z.number().int().positive(),
size: z.string().trim().min(1).max(120),
email: z.string().trim().email("بريد إلكتروني غير صحيح").optional(),
phone: z.string().trim().min(5).max(20).optional(),
}))
.mutation(async ({ input }) => {
if (!input.email && !input.phone) {
throw new Error("يرجى إدخال البريد الإلكتروني أو رقم الهاتف ليصلك إشعار التوفر");
}
const product = await db.getProductById(input.productId);
await db.createRestockAlert({
productId: input.productId,
productName: product?.nameAr ?? undefined,
size: input.size,
email: input.email || undefined,
phone: input.phone || undefined,
});
void notifyOwner({
title: "طلب إشعار توفر منتج",
content: [
`المنتج: ${product?.nameAr ?? `رقم ${input.productId}`}`,
`المقاس المطلوب: ${input.size}`,
input.email ? `البريد: ${input.email}` : "",
input.phone ? `الهاتف: ${input.phone}` : "",
].filter(Boolean).join("\n"),
}).catch((e) => console.warn("Failed to notify owner about restock alert", e));
input.email ? `البريد: ${input.email}` : "",
input.phone ? `الهاتف: ${input.phone}` : "",
].filter(Boolean).join("\n"),
}).catch((e) => console.warn("Failed to notify owner about restock alert", e));
return { success: true };
}),
    list: staffProcedure.query(async () => {
      return db.getRestockAlerts();
    }),
    markSent: staffProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        await db.markRestockAlertSent(input.id);
        return { success: true };
      }),
    delete: staffProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        await db.deleteRestockAlert(input.id);
        return { success: true };
      }),
  }),

  /**
   * Customer referral code — each logged-in customer gets a personal code
   * (generated once if missing) and can see how many orders used it.
   */
  referral: router({
    mine: protectedProcedure.query(async ({ ctx }) => {
      let code = ctx.user.referralCode;
      if (!code) {
        const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
        code = `ELN-${rand}`;
        await db.setReferralCode(ctx.user.id, code);
      }
      const usage = await db.getReferralUsageCount(code);
      return { code, usage };
    }),
  }),

  /**
   * Sales analytics for the admin panel — revenue by month, top products,
   * acquisition source stats and grand totals. Writable only by admins.
   */
  reports: router({
    orderReport: adminProcedure.query(async () => {
      const report = await db.getOrderReport();
      return {
        revenueByMonth: report.revenueByMonth,
        topProducts: report.topProducts.slice(0, 10),
        sourceStats: report.sourceStats,
        totals: report.totals,
      };
    }),
    exportOrders: adminProcedure
      .input(z.object({
        status: z.string().optional(),
        from: z.date().optional(),
        to: z.date().optional(),
      }))
      .query(async ({ input }) => {
        return db.getOrdersForExport(input);
      }),
  }),

  /**
   * Public contact form submissions — rate limited per IP to prevent spam.
   */
  contact: router({
email: z.string().trim().email("بريد إلكتروني غير صحيح").optional(),
subject: z.string().trim().max(200).optional(),
message: z.string().trim().min(10).max(5000),
}))
.mutation(async ({ input }) => {
await db.createContactMessage(input);
void notifyOwner({
title: "رسالة جديدة من نموذج اتصل بنا",
content: [
`الاسم: ${input.name}`,
input.phone ? `الهاتف: ${input.phone}` : "",
input.email ? `البريد: ${input.email}` : "",
input.subject ? `الموضوع: ${input.subject}` : "",
`الرسالة: ${input.message}`,
].filter(Boolean).join("\n"),
}).catch((e) => console.warn("Failed to notify owner about contact message", e));
return { success: true };
}),
}),
1349:   /**
        return { success: true };
* Admin inbox — read, mark as read, and delete contact form messages.
*/
contactInbox: router({
list: adminProcedure.query(async () => db.getContactMessages()),
markRead: adminProcedure
.input(z.object({ id: z.number().int().positive() }))
.mutation(async ({ input }) => {
await db.markContactMessageRead(input.id);
return { success: true };
}),
delete: adminProcedure
.input(z.object({ id: z.number().int().positive() }))
.mutation(async ({ input }) => {
await db.deleteContactMessage(input.id);
return { success: true };
}),
}),
});
1369: export type AppRouter = typeof appRouter;
      }),
The above content does NOT show the entire file contents. If you need to view any lines of the file which were not shown to complete your task, call this tool again to view those lines.