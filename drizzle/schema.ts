import {
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  serial,
} from "drizzle-orm/pg-core";

// ─── Tables (column names match actual Neon snake_case columns) ───────────────

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("open_id", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  loginMethod: varchar("login_method", { length: 64 }),
  role: varchar("role", { length: 32 }).default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
  referralCode: varchar("referral_code", { length: 32 }),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("name_ar", { length: 255 }).notNull(),
  description: text("description"),
  descriptionAr: text("description_ar"),
  price: varchar("price", { length: 50 }).notNull(),
  sizes: text("sizes"),
  sizeOptions: text("size_options"),
  colorOptions: text("color_options"),
  pricingType: varchar("pricing_type", { length: 32 }).default("fixed").notNull(),
  pricePerMeter: varchar("price_per_meter", { length: 50 }),
  category: varchar("category", { length: 100 }).default("home-decor"),
  specifications: text("specifications"),
  images: text("images"),
  featured: boolean("featured").default(false),
  isActive: varchar("is_active", { length: 10 }).default("yes").notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  nameAr: varchar("name_ar", { length: 120 }).notNull(),
  nameEn: varchar("name_en", { length: 120 }).notNull(),
  descriptionAr: text("description_ar"),
  descriptionEn: text("description_en"),
  isActive: varchar("is_active", { length: 10 }).default("yes").notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 50 }).notNull(),
  customerEmail: varchar("customer_email", { length: 320 }),
  customerAddress: text("customer_address"),
  productId: integer("product_id"),
  productName: varchar("product_name", { length: 255 }),
  productPrice: varchar("product_price", { length: 50 }),
  selectedSize: varchar("selected_size", { length: 120 }),
  selectedColor: varchar("selected_color", { length: 120 }),
  message: text("message"),
  orderSource: varchar("order_source", { length: 50 }).default("web"),
  utmSource: varchar("utm_source", { length: 255 }),
  utmMedium: varchar("utm_medium", { length: 255 }),
  utmCampaign: varchar("utm_campaign", { length: 255 }),
  utmContent: varchar("utm_content", { length: 255 }),
  utmTerm: varchar("utm_term", { length: 255 }),
  referrer: text("referrer"),
  userAgent: text("user_agent"),
  status: varchar("status", { length: 32 }).default("new").notNull(),
  cancelledBy: varchar("cancelled_by", { length: 32 }),
  cancellationReason: text("cancellation_reason"),
  userId: integer("user_id"),
  couponCode: varchar("coupon_code", { length: 50 }),
  discountType: varchar("discount_type", { length: 20 }),
  discountValue: varchar("discount_value", { length: 50 }),
  totalAfterDiscount: varchar("total_after_discount", { length: 50 }),
  notes: text("notes"),
  notificationSent: boolean("notification_sent").default(false),
  referralCodeUsed: varchar("referral_code_used", { length: 32 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

export const orderNotifications = pgTable("order_notifications", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  userId: integer("user_id"),
  channel: varchar("channel", { length: 32 }).notNull(),
  eventType: varchar("event_type", { length: 64 }).notNull(),
  status: varchar("status", { length: 32 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  recipient: varchar("recipient", { length: 320 }),
  deliveryStatus: varchar("delivery_status", { length: 32 }).notNull(),
  providerMessageId: varchar("provider_message_id", { length: 128 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type OrderNotification = typeof orderNotifications.$inferSelect;
export type InsertOrderNotification = typeof orderNotifications.$inferInsert;

export const gallery = pgTable("gallery", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  imageUrl: text("image_url").notNull(),
  category: varchar("category", { length: 100 }).default("أعمال منجزة"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type GalleryItem = typeof gallery.$inferSelect;
export type InsertGalleryItem = typeof gallery.$inferInsert;

export const pageviews = pgTable("pageviews", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 64 }),
  path: varchar("path", { length: 255 }).default("/"),
  referrer: text("referrer"),
  userAgent: text("user_agent"),
  utmSource: varchar("utm_source", { length: 255 }),
  utmMedium: varchar("utm_medium", { length: 255 }),
  utmCampaign: varchar("utm_campaign", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Pageview = typeof pageviews.$inferSelect;
export type InsertPageview = typeof pageviews.$inferInsert;

export const siteContent = pgTable("site_content", {
  id: serial("id").primaryKey(),
  sectionKey: varchar("section_key", { length: 100 }).notNull().unique(),
  titleAr: text("title_ar"),
  titleEn: text("title_en"),
  contentAr: text("content_ar"),
  contentEn: text("content_en"),
  subtitleAr: text("subtitle_ar"),
  subtitleEn: text("subtitle_en"),
  isActive: varchar("is_active", { length: 10 }).default("yes").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type SiteContent = typeof siteContent.$inferSelect;
export type InsertSiteContent = typeof siteContent.$inferInsert;

export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: varchar("description", { length: 255 }),
  discountType: varchar("discount_type", { length: 20 }).notNull(),
  discountValue: varchar("discount_value", { length: 50 }).notNull(),
  minOrderValue: varchar("min_order_value", { length: 50 }).default("0"),
  maxUsage: integer("max_usage"),
  usedCount: integer("used_count").default(0).notNull(),
  isActive: varchar("is_active", { length: 10 }).default("yes").notNull(),
  startsAt: timestamp("starts_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = typeof coupons.$inferInsert;

export const productReviews = pgTable("product_reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  productId: integer("product_id").notNull(),
  orderId: integer("order_id"),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  userName: varchar("user_name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ProductReview = typeof productReviews.$inferSelect;
export type InsertProductReview = typeof productReviews.$inferInsert;

export const adminCredentials = pgTable("admin_credentials", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 30 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 255 }),
  role: varchar("role", { length: 20 }).default("admin").notNull(),
  isActive: varchar("is_active", { length: 10 }).default("yes").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AdminCredential = typeof adminCredentials.$inferSelect;
export type InsertAdminCredential = typeof adminCredentials.$inferInsert;

export const adminSessions = pgTable("admin_sessions", {
  id: serial("id").primaryKey(),
  adminPhone: varchar("admin_phone", { length: 30 }).notNull(),
  jti: varchar("jti", { length: 64 }).notNull().unique(),
  userAgent: text("user_agent"),
  ip: varchar("ip", { length: 60 }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AdminSession = typeof adminSessions.$inferSelect;
export type InsertAdminSession = typeof adminSessions.$inferInsert;

export const adminLoginAttempts = pgTable("admin_login_attempts", {
  id: serial("id").primaryKey(),
  ip: varchar("ip", { length: 60 }),
  phone: varchar("phone", { length: 30 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AdminLoginAttempt = typeof adminLoginAttempts.$inferSelect;
export type InsertAdminLoginAttempt = typeof adminLoginAttempts.$inferInsert;

export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  settingKey: varchar("setting_key", { length: 64 }).notNull().unique(),
  settingValue: text("setting_value"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = typeof siteSettings.$inferInsert;

export const restockAlerts = pgTable("restock_alerts", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  productName: varchar("product_name", { length: 255 }),
  size: varchar("size", { length: 120 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type RestockAlert = typeof restockAlerts.$inferSelect;
export type InsertRestockAlert = typeof restockAlerts.$inferInsert;

export const contactInbox = pgTable("contact_inbox", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 40 }),
  email: varchar("email", { length: 180 }),
  subject: varchar("subject", { length: 200 }),
  message: text("message").notNull(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ContactMessage = typeof contactInbox.$inferSelect;
export type InsertContactMessage = typeof contactInbox.$inferInsert;