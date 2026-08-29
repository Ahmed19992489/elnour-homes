import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";
3: /**

* Core user table backing auth flow.
* Extend this file with additional tables as your product grows.
* Columns use camelCase to match both database fields and generated types.
*/
export const users = mysqlTable("users", {
id: int("id").autoincrement().primaryKey(),
openId: varchar("openId", { length: 64 }).notNull().unique(),
name: text("name"),
email: varchar("email", { length: 320 }),
phone: varchar("phone", { length: 50 }),
address: text("address"),
loginMethod: varchar("loginMethod", { length: 64 }),
role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
createdAt: timestamp("createdAt").defaultNow().notNull(),
updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
referralCode: varchar("referralCode", { length: 32 }),
});
23: export type User = typeof users.$inferSelect;

export type InsertUser = typeof users.$inferInsert;
26: /**

* Products table - steel decor items
*/
export const products = mysqlTable("products", {
id: int("id").autoincrement().primaryKey(),
name: varchar("name", { length: 255 }).notNull(),
nameAr: varchar("nameAr", { length: 255 }).notNull(),
description: text("description"),
price: decimal("price", { precision: 10, scale: 2 }).notNull(),
sizes: text("sizes"),
<truncated 3955 bytes>
/**
* JSON-encoded list of up to 3 size options, each with its own price:
* [{ "labelAr": "صغير", "labelEn": "Small", "price": "1500.00" }, ...]
* Kept as text(JSON) so existing rows stay compatible; parsed at runtime.
*/
sizeOptions: text("sizeOptions"),
/**
* JSON-encoded list of up to 3 color options:
* [{ "labelAr": "ذهبي", "labelEn": "Gold", "hex": "#D4AF37" }, ...]
*/
colorOptions: text("colorOptions"),
/**
* How the product is priced: "fixed" (single price / size-based),
* "per_meter" (pricing by linear meter, color per customer design).
*/
pricingType: mysqlEnum("pricingType", ["fixed", "per_meter"]).default("fixed").notNull(),
pricePerMeter: decimal("pricePerMeter", { precision: 10, scale: 2 }),
category: varchar("category", { length: 100 }).default("home-decor"),
/**
* JSON-encoded detailed specs table shown on the product page:
* { "material": "...", "dimensions": "...", "finish": "...", "care": "..." }
*/
specifications: text("specifications"),
images: text("images"),
isActive: mysqlEnum("isActive", ["yes", "no"]).default("yes").notNull(),
sortOrder: int("sortOrder").default(0),
createdAt: timestamp("createdAt").defaultNow().notNull(),
updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
67: export type Product = typeof products.$inferSelect;

export type InsertProduct = typeof products.$inferInsert;
70: /**

* Product categories - reusable bilingual catalog groupings
*/
export const categories = mysqlTable("categories", {
id: int("id").autoincrement().primaryKey(),
slug: varchar("slug", { length: 100 }).notNull().unique(),
nameAr: varchar("nameAr", { length: 120 }).notNull(),
nameEn: varchar("nameEn", { length: 120 }).notNull(),
descriptionAr: text("descriptionAr"),
descriptionEn: text("descriptionEn"),
isActive: mysqlEnum("isActive", ["yes", "no"]).default("yes").notNull(),
sortOrder: int("sortOrder").default(0),
createdAt: timestamp("createdAt").defaultNow().notNull(),
updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
86: export type Category = typeof categories.$inferSelect;

export type InsertCategory = typeof categories.$inferInsert;
89: /**

* Orders table - customer orders/leads
*/
export const orders = mysqlTable("orders", {
id: int("id").autoincrement().primaryKey(),
customerName: varchar("customerName", { length: 255 }).notNull(),
customerPhone: varchar("customerPhone", { length: 50 }).notNull(),
customerEmail: varchar("customerEmail", { length: 320 }),
customerAddress: text("customerAddress"),
productId: int("productId"),
productName: varchar("productName", { length: 255 }),
productPrice: decimal("productPrice", { precision: 10, scale: 2 }),
selectedSize: varchar("selectedSize", { length: 120 }),
selectedColor: varchar("selectedColor", { length: 120 }),
message: text("message"),
orderSource: varchar("orderSource", { length: 50 }).default("web"),
utmSource: varchar("utmSource", { length: 255 }),
utmMedium: varchar("utmMedium", { length: 255 }),
utmCampaign: varchar("utmCampaign", { length: 255 }),
utmContent: varchar("utmContent", { length: 255 }),
utmTerm: varchar("utmTerm", { length: 255 }),
referrer: text("referrer"),
userAgent: text("userAgent"),
status: mysqlEnum("status", ["new", "contacted", "confirmed", "shipped", "delivered", "cancelled"]).default("new").notNull(),
cancelledBy: mysqlEnum("cancelledBy", ["customer", "admin"]),
cancellationReason: text("cancellationReason"),
userId: int("userId"),
couponCode: varchar("couponCode", { length: 50 }),
discountType: varchar("discountType", { length: 20 }),
discountValue: decimal("discountValue", { precision: 10, scale: 2 }),
totalAfterDiscount: decimal("totalAfterDiscount", { precision: 10, scale: 2 }),
notes: text("notes"),
notificationSent: boolean("notificationSent").default(false),
referralCodeUsed: varchar("referralCodeUsed", { length: 32 }),
createdAt: timestamp("createdAt").defaultNow().notNull(),
updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
127: export type Order = typeof orders.$inferSelect;

export type InsertOrder = typeof orders.$inferInsert;
130: /**

* Delivery log for status messages. Delivery failures are recorded but never
* prevent the order status itself from being safely updated.
*/
export const orderNotifications = mysqlTable("orderNotifications", {
id: int("id").autoincrement().primaryKey(),
orderId: int("orderId").notNull(),
userId: int("userId"),
channel: mysqlEnum("channel", ["email", "in_app"]).notNull(),
eventType: mysqlEnum("eventType", ["status_changed", "customer_cancelled"]).notNull(),
status: varchar("status", { length: 32 }).notNull(),
title: varchar("title", { length: 255 }).notNull(),
message: text("message").notNull(),
recipient: varchar("recipient", { length: 320 }),
deliveryStatus: mysqlEnum("deliveryStatus", ["sent", "failed", "in_app", "skipped"]).notNull(),
providerMessageId: varchar("providerMessageId", { length: 128 }),
createdAt: timestamp("createdAt").defaultNow().notNull(),
});
149: export type OrderNotification = typeof orderNotifications.$inferSelect;

export type InsertOrderNotification = typeof orderNotifications.$inferInsert;
152: /**

* Gallery table - completed project images
*/
export const gallery = mysqlTable("gallery", {
id: int("id").autoincrement().primaryKey(),
title: varchar("title", { length: 255 }).notNull(),
imageUrl: text("imageUrl").notNull(),
category: varchar("category", { length: 100 }).default("أعمال منجزة"),
sortOrder: int("sortOrder").default(0),
createdAt: timestamp("createdAt").defaultNow().notNull(),
});
164: export type GalleryItem = typeof gallery.$inferSelect;

export type InsertGalleryItem = typeof gallery.$inferInsert;
167: /**

* Pageviews table - tracks visitor page views for conversion tracking
*/
export const pageviews = mysqlTable("pageviews", {
id: int("id").autoincrement().primaryKey(),
sessionId: varchar("sessionId", { length: 64 }),
path: varchar("path", { length: 255 }).default("/"),
referrer: text("referrer"),
userAgent: text("userAgent"),
utmSource: varchar("utmSource", { length: 255 }),
utmMedium: varchar("utmMedium", { length: 255 }),
utmCampaign: varchar("utmCampaign", { length: 255 }),
createdAt: timestamp("createdAt").defaultNow().notNull(),
});
182: export type Pageview = typeof pageviews.$inferSelect;

export type InsertPageview = typeof pageviews.$inferInsert;
185: /**

* Site Content table - editable sections for the public site
* sectionKey: 'hero', 'about', 'work', 'footer', 'features'
*/
export const siteContent = mysqlT
id: int("id").autoincrement().primaryKey(),
sectionKey: varchar("sectionKey", { length: 100 }).notNull().unique(),
titleAr: text("titleAr"),
titleEn: text("titleEn"),
contentAr: text("contentAr"),
contentEn: text("contentEn"),
subtitleAr: text("subtitleAr"),
subtitleEn: text("subtitleEn"),
isActive: mysqlEnum("isActive", ["yes", "no"]).default("yes").notNull(),
updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
202: export type SiteContent = typeof siteContent.$inferSelect;

export type InsertSiteContent = typeof siteContent.$inferInsert;
205: /**

* Coupons table - discount codes with validity windows, usage control,
* and activation toggle so the owner can pause or retire codes anytime.
*/
export const coupons = mysqlTable("coupons", {
id: int("id").autoincrement().primaryKey(),
code: varchar("code", { length: 50 }).notNull().unique(),
description: varchar("description", { length: 255 }),
discountType: mysqlEnum("discountType", ["percent", "fixed"]).notNull(),
discountValue: decimal("discountValue", { precision: 10, scale: 2 }).notNull(),
minOrderValue: decimal("minOrderValue", { precision: 10, scale: 2 }).default("0"),
maxUsage: int("maxUsage"),
usedCount: int("usedCount").default(0).notNull(),
isActive: mysqlEnum("isActive", ["yes", "no"]).default("yes").notNull(),
startsAt: timestamp("startsAt"),
expiresAt: timestamp("expiresAt"),
createdAt: timestamp("createdAt").defaultNow().notNull(),
updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
225: export type Coupon = typeof coupons.$inferSelect;

export type InsertCoupon = typeof coupons.$inferInsert;
228: /**

* Product reviews table - verified-purchase reviews: a customer may review a
* product only after purchasing it (an order containing the product exists
* for their account), and only once per product.
*/
export const productReviews = mysqlTable("productReviews", {
id: int("id").autoincrement().primaryKey(),
userId: int("userId").notNull(),
productId: int("productId").notNull(),
orderId: int("orderId"),
rating: int("rating").notNull(),
comment: text("comment"),
userName: varchar("userName", { length: 255 }),
createdAt: timestamp("createdAt").defaultNow().notNull(),
updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
245: export type ProductReview = typeof productReviews.$inferSelect;

export type InsertProductReview = typeof productReviews.$inferInsert;
248: /**
/**
* Phone-based admin accounts — independent of Manus OAuth.
* Each allowed admin phone number has its own bcrypt-hashed password.
* Phone is stored normalized (digits only) so leading-zero formatting does
* not break login matching.
*/
export const adminCredentials = mysqlTable("adminCredentials", {
id: int("id").autoincrement().primaryKey(),
phone: varchar("phone", { length: 30 }).notNull().unique(),
/** bcrypt hash of the admin password */
passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
/** Full name shown in the admin panel and order actions */
displayName: varchar("displayName", { length: 255 }),
isActive: mysqlEnum("isActive", ["yes", "no"]).default("yes").notNull(),
createdAt: timestamp("createdAt").defaultNow().notNull(),
updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
266: export type AdminCredential = typeof adminCredentials.$inferSelect;

export type InsertAdminCredential = typeof adminCredentials.$inferInsert;
269: /**

* Phone-admin sessions — JWT sessions issued on successful phone login.
* A session is valid only while a matching active row exists, so logout
* (or owner revocation) instantly destroys it.
*/
export const adminSessions = mysqlTable("adminSessions", {
id: int("id").autoincrement().primaryKey(),
adminPhone: varchar("adminPhone", { length: 30 }).notNull(),
jti: varchar("jti", { length: 64 }).notNull().unique(),
userAgent: text("userAgent"),
ip: varchar("ip", { length: 60 }),
expiresAt: timestamp("expiresAt").notNull(),
createdAt: timestamp("createdAt").defaultNow().notNull(),
});
284: export type AdminSession = typeof adminSessions.$inferSelect;

export type InsertAdminSession = typeof adminSessions.$inferInsert;
287: /**

* Failed phone-login attempts — used for lightweight brute-force protection.
*/
export const adminLoginAttempts = mysqlTable("adminLoginAttempts", {
id: int("id").autoincrement().primaryKey(),
ip: varchar("ip", { length: 60 }),
phone: varchar("phone", { length: 30 }),
createdAt: timestamp("createdAt").defaultNow().notNull(),
});
297: export type AdminLoginAttempt = typeof adminLoginAttempts.$inferSelect;

export type InsertAdminLoginAttempt = typeof adminLoginAttempts.$inferInsert;
300: /**

* Site-wide settings stored as key/value pairs (e.g. the SQM price for
* size-based pricing). Values are plain text; parsed at runtime.
*/
export const siteSettings = mysqlTable("siteSettings", {
id: int("id").autoincrement().primaryKey(),
settingKey: varchar("settingKey", { length: 64 }).notNull().unique(),
settingValue: text("settingValue"),
updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = typeof siteSettings.$inferInsert;
313: /**

* Restock alerts - customers request a notification when a specific product
* size becomes available. Sent alerts are tracked (sentAt) so the admin can
* clear them after following up.
*/
export const restockAlerts = mysqlTable("restockAlerts", {
id: int("id").autoincrement().primaryKey(),
productId: int("productId").notNull(),
productName: varchar("productName", { length: 255 }),
size: varchar("size", { length: 120 }).notNull(),
email: varchar("email", { length: 320 }),
phone: varchar("phone", { length: 50 }),
sentAt: timestamp("sentAt"),
createdAt: timestamp("createdAt").defaultNow().notNull(),
});
329: export type RestockAlert = typeof restockAlerts.$inferSelect;

export type InsertRestockAlert = typeof restockAlerts.$inferInsert;
332: /**

* Contact inbox — messages from the public contact form.
* readAt = null means unread; admin marks as read after replying.
*/
export const contactInbox = mysqlTable("contactInbox", {
id: int("id").autoincrement().primaryKey(),
name: varchar("name", { length: 160 }).notNull(),
phone: varchar("phone", { length: 40 }),
email: varchar("email", { length: 180 }),
subject: varchar("subject", { length: 200 }),
message: text("message").notNull(),
readAt: timestamp("readAt"),
createdAt: timestamp("createdAt").defaultNow().notNull(),
});
347: export type ContactMessage = typeof contactInbox.$inferSelect;

export type InsertContactMessage = typeof contactInbox.$inferInsert;
The above content does NOT show the entire file contents. If you need to view any lines of the file which were not shown to complete your task, call this tool again to view those lines.