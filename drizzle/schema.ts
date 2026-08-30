import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  serial,
} from "drizzle-orm/pg-core";

// ─── Enums ──────────────────────────────────────────────────────────────────
export const roleEnum = pgEnum("role", ["user", "admin", "moderator"]);
export const isActiveEnum = pgEnum("is_active", ["yes", "no"]);
export const pricingTypeEnum = pgEnum("pricing_type", ["fixed", "per_meter"]);
export const orderStatusEnum = pgEnum("order_status", ["new", "contacted", "confirmed", "shipped", "delivered", "cancelled"]);
export const cancelledByEnum = pgEnum("cancelled_by", ["customer", "admin"]);
export const notifChannelEnum = pgEnum("notif_channel", ["email", "in_app"]);
export const notifEventEnum = pgEnum("notif_event", ["status_changed", "customer_cancelled"]);
export const notifDeliveryEnum = pgEnum("notif_delivery", ["sent", "failed", "in_app", "skipped"]);
export const discountTypeEnum = pgEnum("discount_type", ["percent", "fixed"]);
export const adminRoleEnum = pgEnum("admin_role", ["admin", "moderator"]);

// ─── Tables ──────────────────────────────────────────────────────────────────

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  referralCode: varchar("referralCode", { length: 32 }),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Products table - steel decor items
 */
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("nameAr", { length: 255 }).notNull(),
  description: text("description"),
  descriptionAr: text("descriptionAr"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  sizes: text("sizes"),
  sizeOptions: text("sizeOptions"),
  colorOptions: text("colorOptions"),
  pricingType: pricingTypeEnum("pricingType").default("fixed").notNull(),
  pricePerMeter: decimal("pricePerMeter", { precision: 10, scale: 2 }),
  category: varchar("category", { length: 100 }).default("home-decor"),
  specifications: text("specifications"),
  images: text("images"),
  featured: boolean("featured").default(false),
  isActive: isActiveEnum("isActive").default("yes").notNull(),
  sortOrder: integer("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Product categories
 */
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  nameAr: varchar("nameAr", { length: 120 }).notNull(),
  nameEn: varchar("nameEn", { length: 120 }).notNull(),
  descriptionAr: text("descriptionAr"),
  descriptionEn: text("descriptionEn"),
  isActive: isActiveEnum("isActive").default("yes").notNull(),
  sortOrder: integer("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Orders table
 */
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 50 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }),
  customerAddress: text("customerAddress"),
  productId: integer("productId"),
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
  status: orderStatusEnum("status").default("new").notNull(),
  cancelledBy: cancelledByEnum("cancelledBy"),
  cancellationReason: text("cancellationReason"),
  userId: integer("userId"),
  couponCode: varchar("couponCode", { length: 50 }),
  discountType: varchar("discountType", { length: 20 }),
  discountValue: decimal("discountValue", { precision: 10, scale: 2 }),
  totalAfterDiscount: decimal("totalAfterDiscount", { precision: 10, scale: 2 }),
  notes: text("notes"),
  notificationSent: boolean("notificationSent").default(false),
  referralCodeUsed: varchar("referralCodeUsed", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Order Notifications
 */
export const orderNotifications = pgTable("orderNotifications", {
  id: serial("id").primaryKey(),
  orderId: integer("orderId").notNull(),
  userId: integer("userId"),
  channel: notifChannelEnum("channel").notNull(),
  eventType: notifEventEnum("eventType").notNull(),
  status: varchar("status", { length: 32 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  recipient: varchar("recipient", { length: 320 }),
  deliveryStatus: notifDeliveryEnum("deliveryStatus").notNull(),
  providerMessageId: varchar("providerMessageId", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderNotification = typeof orderNotifications.$inferSelect;
export type InsertOrderNotification = typeof orderNotifications.$inferInsert;

/**
 * Gallery
 */
export const gallery = pgTable("gallery", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  imageUrl: text("imageUrl").notNull(),
  category: varchar("category", { length: 100 }).default("أعمال منجزة"),
  sortOrder: integer("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GalleryItem = typeof gallery.$inferSelect;
export type InsertGalleryItem = typeof gallery.$inferInsert;

/**
 * Pageviews
 */
export const pageviews = pgTable("pageviews", {
  id: serial("id").primaryKey(),
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
export const siteContent = pgTable("siteContent", {
  id: serial("id").primaryKey(),
  sectionKey: varchar("sectionKey", { length: 100 }).notNull().unique(),
  titleAr: text("titleAr"),
  titleEn: text("titleEn"),
  contentAr: text("contentAr"),
  contentEn: text("contentEn"),
  subtitleAr: text("subtitleAr"),
  subtitleEn: text("subtitleEn"),
  isActive: isActiveEnum("isActive").default("yes").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type SiteContent = typeof siteContent.$inferSelect;
export type InsertSiteContent = typeof siteContent.$inferInsert;

/**
 * Coupons
 */
export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: varchar("description", { length: 255 }),
  discountType: discountTypeEnum("discountType").notNull(),
  discountValue: decimal("discountValue", { precision: 10, scale: 2 }).notNull(),
  minOrderValue: decimal("minOrderValue", { precision: 10, scale: 2 }).default("0"),
  maxUsage: integer("maxUsage"),
  usedCount: integer("usedCount").default(0).notNull(),
  isActive: isActiveEnum("isActive").default("yes").notNull(),
  startsAt: timestamp("startsAt"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = typeof coupons.$inferInsert;

/**
 * Product reviews
 */
export const productReviews = pgTable("productReviews", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  productId: integer("productId").notNull(),
  orderId: integer("orderId"),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  userName: varchar("userName", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ProductReview = typeof productReviews.$inferSelect;
export type InsertProductReview = typeof productReviews.$inferInsert;

/**
 * Admin credentials
 */
export const adminCredentials = pgTable("adminCredentials", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 30 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  displayName: varchar("displayName", { length: 255 }),
  role: adminRoleEnum("role").default("admin").notNull(),
  isActive: isActiveEnum("isActive").default("yes").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type AdminCredential = typeof adminCredentials.$inferSelect;
export type InsertAdminCredential = typeof adminCredentials.$inferInsert;

/**
 * Admin sessions
 */
export const adminSessions = pgTable("adminSessions", {
  id: serial("id").primaryKey(),
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
export const adminLoginAttempts = pgTable("adminLoginAttempts", {
  id: serial("id").primaryKey(),
  ip: varchar("ip", { length: 60 }),
  phone: varchar("phone", { length: 30 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdminLoginAttempt = typeof adminLoginAttempts.$inferSelect;
export type InsertAdminLoginAttempt = typeof adminLoginAttempts.$inferInsert;

/**
 * Site settings
 */
export const siteSettings = pgTable("siteSettings", {
  id: serial("id").primaryKey(),
  settingKey: varchar("settingKey", { length: 64 }).notNull().unique(),
  settingValue: text("settingValue"),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = typeof siteSettings.$inferInsert;

/**
 * Restock alerts
 */
export const restockAlerts = pgTable("restockAlerts", {
  id: serial("id").primaryKey(),
  productId: integer("productId").notNull(),
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
export const contactInbox = pgTable("contactInbox", {
  id: serial("id").primaryKey(),
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