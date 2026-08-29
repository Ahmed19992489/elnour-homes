import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "moderator"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  referralCode: varchar("referralCode", { length: 32 }),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Products table - steel decor items
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("nameAr", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  sizes: text("sizes"),
  sizeOptions: text("sizeOptions"),
  colorOptions: text("colorOptions"),
  pricingType: mysqlEnum("pricingType", ["fixed", "per_meter"]).default("fixed").notNull(),
  pricePerMeter: decimal("pricePerMeter", { precision: 10, scale: 2 }),
  category: varchar("category", { length: 100 }).default("home-decor"),
  specifications: text("specifications"),
  images: text("images"),
  isActive: mysqlEnum("isActive", ["yes", "no"]).default("yes").notNull(),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Product categories
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

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Orders table
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

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Order Notifications
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

export type OrderNotification = typeof orderNotifications.$inferSelect;
export type InsertOrderNotification = typeof orderNotifications.$inferInsert;

/**
 * Gallery
 */
export const gallery = mysqlTable("gallery", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  imageUrl: text("imageUrl").notNull(),
  category: varchar("category", { length: 100 }).default("أعمال منجزة"),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GalleryItem = typeof gallery.$inferSelect;
export type InsertGalleryItem = typeof gallery.$inferInsert;

/**
 * Pageviews
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

export type Pageview = typeof pageviews.$inferSelect;
export type InsertPageview = typeof pageviews.$inferInsert;

/**
 * Site Content
 */
export const siteContent = mysqlTable("siteContent", {
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

export type SiteContent = typeof siteContent.$inferSelect;
export type InsertSiteContent = typeof siteContent.$inferInsert;

/**
 * Coupons
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

export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = typeof coupons.$inferInsert;

/**
 * Product reviews
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

export type ProductReview = typeof productReviews.$inferSelect;
export type InsertProductReview = typeof productReviews.$inferInsert;

/**
 * Admin credentials
 */
export const adminCredentials = mysqlTable("adminCredentials", {
  id: int("id").autoincrement().primaryKey(),
  phone: varchar("phone", { length: 30 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  displayName: varchar("displayName", { length: 255 }),
  role: mysqlEnum("role", ["admin", "moderator"]).default("admin").notNull(),
  isActive: mysqlEnum("isActive", ["yes", "no"]).default("yes").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AdminCredential = typeof adminCredentials.$inferSelect;
export type InsertAdminCredential = typeof adminCredentials.$inferInsert;

/**
 * Admin sessions
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

export type AdminSession = typeof adminSessions.$inferSelect;
export type InsertAdminSession = typeof adminSessions.$inferInsert;

/**
 * Admin login attempts
 */
export const adminLoginAttempts = mysqlTable("adminLoginAttempts", {
  id: int("id").autoincrement().primaryKey(),
  ip: varchar("ip", { length: 60 }),
  phone: varchar("phone", { length: 30 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdminLoginAttempt = typeof adminLoginAttempts.$inferSelect;
export type InsertAdminLoginAttempt = typeof adminLoginAttempts.$inferInsert;

/**
 * Site settings
 */
export const siteSettings = mysqlTable("siteSettings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 64 }).notNull().unique(),
  settingValue: text("settingValue"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = typeof siteSettings.$inferInsert;

/**
 * Restock alerts
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

export type RestockAlert = typeof restockAlerts.$inferSelect;
export type InsertRestockAlert = typeof restockAlerts.$inferInsert;

/**
 * Contact inbox
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

export type ContactMessage = typeof contactInbox.$inferSelect;
export type InsertContactMessage = typeof contactInbox.$inferInsert;