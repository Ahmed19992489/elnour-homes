import { and, desc, eq, gt, gte, lte, inArray, lt, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import {
  InsertUser,
  users,
  products,
  categories,
  orders,
  gallery,
  pageviews,
  siteContent,
  coupons,
  orderNotifications,
  productReviews,
  adminCredentials,
  adminSessions,
  adminLoginAttempts,
  siteSettings,
  restockAlerts,
  contactInbox,
} from "../drizzle/schema";
import type {
  InsertProduct,
  InsertCategory,
  InsertOrder,
  InsertGalleryItem,
  InsertPageview,
  InsertCoupon,
  InsertOrderNotification,
  InsertProductReview,
  InsertAdminCredential,
  InsertAdminSession,
  InsertSiteSetting,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!_db) {
    const url =
      process.env.DATABASE_URL ||
      "postgresql://neondb_owner:npg_VM4tSBwN5PGd@ep-plain-rice-auzortld-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require";
    try {
      const client = neon(url);
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    for (const field of textFields) {
      const value = user[field];
      if (value === undefined) continue;
      values[field] = value ?? null;
      updateSet[field] = value ?? null;
    }
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

    // PostgreSQL: use ON CONFLICT DO UPDATE
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = getDb();
  if (!db) { console.warn("[Database] Cannot get user: database not available"); return undefined; }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getAllUsers(limit = 500) {
  const db = getDb();
  if (!db) return [];
  return db
    .select({ id: users.id, name: users.name, email: users.email, phone: users.phone, role: users.role })
    .from(users)
    .orderBy(desc(users.id))
    .limit(limit);
}

export async function updateUserProfile(userId: number, data: Partial<InsertUser>) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const updateSet: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && key !== "openId" && key !== "role") updateSet[key] = value;
  }
  await db.update(users).set(updateSet).where(eq(users.id, userId));
}

// ===== PHONE-BASED ADMIN LOGIN =====

export function normalizePhone(phone: string): string {
  return (phone || "").replace(/[^0-9]/g, "");
}

export async function getAdminCredentialByPhone(phone: string) {
  const db = getDb();
  if (!db) { console.warn("[Database] Cannot get admin credential: database not available"); return undefined; }
  const result = await db
    .select()
    .from(adminCredentials)
    .where(eq(adminCredentials.phone, normalizePhone(phone)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertAdminCredential(data: InsertAdminCredential) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const normalized = { ...data, phone: normalizePhone(data.phone) };
  await db.insert(adminCredentials).values(normalized).onConflictDoUpdate({
    target: adminCredentials.phone,
    set: {
      passwordHash: normalized.passwordHash,
      displayName: normalized.displayName ?? null,
      isActive: "yes",
    },
  });
  return getAdminCredentialByPhone(normalized.phone);
}

export async function deactivateAdminCredential(phone: string) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.update(adminCredentials).set({ isActive: "no" }).where(eq(adminCredentials.phone, normalizePhone(phone)));
}

export async function activateAdminCredential(phone: string) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.update(adminCredentials).set({ isActive: "yes" }).where(eq(adminCredentials.phone, normalizePhone(phone)));
}

export async function createAdminSession(data: InsertAdminSession) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(adminSessions).values(data);
  return data.jti;
}

export async function getActiveAdminSession(jti: string, now: Date = new Date()) {
  const db = getDb();
  if (!db) { console.warn("[Database] Cannot get admin session: database not available"); return undefined; }
  const result = await db
    .select()
    .from(adminSessions)
    .where(and(eq(adminSessions.jti, jti), gt(adminSessions.expiresAt, now)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function deleteAdminSession(jti: string) {
  const db = getDb();
  if (!db) return;
  await db.delete(adminSessions).where(eq(adminSessions.jti, jti));
}

export async function deleteAdminSessionsByPhone(phone: string) {
  const db = getDb();
  if (!db) return;
  await db.delete(adminSessions).where(eq(adminSessions.adminPhone, normalizePhone(phone)));
}

export async function recordFailedAdminLogin(ip: string, phone: string) {
  const db = getDb();
  if (!db) return;
  await db.insert(adminLoginAttempts).values({ ip, phone: normalizePhone(phone) });
}

export async function countRecentFailedAdminAttempts(ip: string, windowMs: number) {
  const db = getDb();
  if (!db) return 0;
  const since = new Date(Date.now() - windowMs);
  const result = await db
    .select()
    .from(adminLoginAttempts)
    .where(and(eq(adminLoginAttempts.ip, ip), gt(adminLoginAttempts.createdAt, since)));
  return result.length;
}

export async function getAllAdminCredentials() {
  const db = getDb();
  if (!db) { console.warn("[Database] Cannot list admin credentials: database not available"); return []; }
  return db.select().from(adminCredentials).orderBy(desc(adminCredentials.createdAt));
}

export async function deleteAdminCredential(phone: string) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const normalized = normalizePhone(phone);
  await db.delete(adminSessions).where(eq(adminSessions.adminPhone, normalized));
  await db.delete(adminCredentials).where(eq(adminCredentials.phone, normalized));
}

export async function purgeOldAdminData(olderThanMs = 1000 * 60 * 60 * 24 * 30) {
  const db = getDb();
  if (!db) return;
  const cutoff = new Date(Date.now() - olderThanMs);
  try {
    await db.delete(adminLoginAttempts).where(lt(adminLoginAttempts.createdAt, cutoff));
    await db.delete(adminSessions).where(lt(adminSessions.expiresAt, cutoff));
  } catch (error) {
    console.warn("[Database] Failed to purge old admin data:", error);
  }
}

// ===== SITE SETTINGS =====

export async function getSetting(key: string) {
  const db = getDb();
  if (!db) { console.warn("[Database] Cannot get setting: database not available"); return undefined; }
  const result = await db.select().from(siteSettings).where(eq(siteSettings.settingKey, key)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertSetting(key: string, value: string | null) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const data: InsertSiteSetting = { settingKey: key, settingValue: value };
  await db.insert(siteSettings).values(data).onConflictDoUpdate({
    target: siteSettings.settingKey,
    set: { settingValue: value },
  });
  return getSetting(key);
}

// ===== PRODUCTS =====

export async function getActiveProducts() {
  const db = getDb();
  if (!db) return [];
  return db.select().from(products).where(eq(products.isActive, "yes")).orderBy(products.sortOrder);
}

export async function getActiveProductsByCategory(categorySlug: string) {
  const db = getDb();
  if (!db) return [];
  return db.select().from(products)
    .where(and(eq(products.isActive, "yes"), eq(products.category, categorySlug)))
    .orderBy(products.sortOrder);
}

export async function getAllProducts() {
  const db = getDb();
  if (!db) return [];
  return db.select().from(products).orderBy(products.sortOrder);
}

export async function getProductById(id: number) {
  const db = getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createProduct(data: InsertProduct) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(products).values(data).returning();
}

export async function updateProduct(id: number, data: Partial<InsertProduct>) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const updateSet: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) updateSet[key] = value;
  }
  await db.update(products).set(updateSet).where(eq(products.id, id));
}

export async function deleteProduct(id: number) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(products).where(eq(products.id, id));
}

export async function getActiveProductsByIds(ids: number[]) {
  const db = getDb();
  if (!db || !ids.length) return [];
  return db
    .select()
    .from(products)
    .where(and(eq(products.isActive, "yes"), inArray(products.id, ids)));
}

// ===== CATEGORIES =====

export async function getActiveCategories() {
  const db = getDb();
  if (!db) return [];
  return db.select().from(categories).where(eq(categories.isActive, "yes")).orderBy(categories.sortOrder);
}

export async function getAllCategories() {
  const db = getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(categories.sortOrder);
}

export async function getCategoryBySlug(slug: string) {
  const db = getDb();
  if (!db) return undefined;
  const result = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function categorySlugExists(slug: string) {
  const db = getDb();
  if (!db) return false;
  const result = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, slug)).limit(1);
  return result.length > 0;
}

export async function createCategory(data: InsertCategory) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(categories).values(data).returning();
}

export async function updateCategory(id: number, data: Partial<InsertCategory>) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const updateSet: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) updateSet[key] = value;
  }
  await db.update(categories).set(updateSet).where(eq(categories.id, id));
}

export async function deleteCategory(id: number) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const category = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  if (!category[0]) return;
  const usage = await db.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.category, category[0].slug));
  if (Number(usage[0]?.count ?? 0) > 0) {
    throw new Error("لا يمكن حذف فئة مرتبطة بمنتجات. انقل المنتجات إلى فئة أخرى أولاً.");
  }
  await db.delete(categories).where(eq(categories.id, id));
}

// ===== ORDERS =====

export async function createOrder(data: InsertOrder) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(orders).values(data).returning();
}

export async function getOrders(limit = 100) {
  const db = getDb();
  if (!db) return [];
  return db.select().from(orders).orderBy(desc(orders.createdAt)).limit(limit);
}

export async function getOrderById(id: number) {
  const db = getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateOrderStatus(id: number, status: string, notes?: string) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const updateSet: Record<string, unknown> = { status };
  if (notes !== undefined) updateSet.notes = notes;
  await db.update(orders).set(updateSet).where(eq(orders.id, id));
}

export async function cancelOrderByCustomer(orderId: number, userId: number, reason?: string) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.update(orders).set({
    status: "cancelled",
    cancelledBy: "customer",
    cancellationReason: reason?.trim() || null,
  }).where(and(
    eq(orders.id, orderId),
    eq(orders.userId, userId),
    inArray(orders.status, ["new", "contacted", "confirmed"]),
  )).returning();
  return result.length > 0;
}

export async function createOrderNotification(data: InsertOrderNotification) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(orderNotifications).values(data);
}

export async function getOrderNotificationsByUserId(userId: number, limit = 30) {
  const db = getDb();
  if (!db) return [];
  return db.select()
    .from(orderNotifications)
    .where(and(eq(orderNotifications.userId, userId), eq(orderNotifications.channel, "in_app")))
    .orderBy(desc(orderNotifications.createdAt))
    .limit(limit);
}

export async function getNewOrdersCount() {
  const db = getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.status, "new"));
  return Number(result[0]?.count ?? 0);
}

export async function getOrdersBySource(utmSource: string) {
  const db = getDb();
  if (!db) return [];
  return db.select().from(orders).where(eq(orders.utmSource, utmSource)).orderBy(desc(orders.createdAt));
}

export async function getTotalOrdersCount() {
  const db = getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(orders);
  return Number(result[0]?.count ?? 0);
}

export async function getOrderStats() {
  const db = getDb();
  if (!db) return { total: 0, new: 0, contacted: 0, confirmed: 0, shipped: 0, delivered: 0, cancelled: 0 };
  const result = await db.select({
    total: sql<number>`count(*)`,
    newCount: sql<number>`sum(case when status = 'new' then 1 else 0 end)`,
    contactedCount: sql<number>`sum(case when status = 'contacted' then 1 else 0 end)`,
    confirmedCount: sql<number>`sum(case when status = 'confirmed' then 1 else 0 end)`,
    shippedCount: sql<number>`sum(case when status = 'shipped' then 1 else 0 end)`,
    deliveredCount: sql<number>`sum(case when status = 'delivered' then 1 else 0 end)`,
    cancelledCount: sql<number>`sum(case when status = 'cancelled' then 1 else 0 end)`,
  }).from(orders);
  const row = result[0];
  return {
    total: Number(row?.total ?? 0),
    new: Number(row?.newCount ?? 0),
    contacted: Number(row?.contactedCount ?? 0),
    confirmed: Number(row?.confirmedCount ?? 0),
    shipped: Number(row?.shippedCount ?? 0),
    delivered: Number(row?.deliveredCount ?? 0),
    cancelled: Number(row?.cancelledCount ?? 0),
  };
}

export async function updateOrderNotificationStatus(id: number, sent: boolean) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.update(orders).set({ notificationSent: sent }).where(eq(orders.id, id));
}

export async function getOrdersByUserId(userId: number) {
  const db = getDb();
  if (!db) return [];
  return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
}

export async function getOrderDetailsByUserId(orderId: number, userId: number) {
  const db = getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .limit(1);
  const order = result[0];
  if (!order) return undefined;
  const product = order.productId ? await getProductById(order.productId) : undefined;
  return { order, product };
}

export async function updateOrderUserId(orderId: number, userId: number) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.update(orders).set({ userId }).where(eq(orders.id, orderId));
}

// ===== GALLERY =====

export async function getGalleryItems() {
  const db = getDb();
  if (!db) return [];
  return db.select().from(gallery).orderBy(gallery.sortOrder, desc(gallery.createdAt));
}

export async function createGalleryItem(data: InsertGalleryItem) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(gallery).values(data);
}

export async function deleteGalleryItem(id: number) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(gallery).where(eq(gallery.id, id));
}

// ===== PAGEVIEWS =====

export async function trackPageview(data: InsertPageview) {
  const db = getDb();
  if (!db) return;
  try {
    await db.insert(pageviews).values(data);
  } catch { /* non-critical */ }
}

export async function getPageviewStats() {
  const db = getDb();
  if (!db) return { total: 0, unique: 0, today: 0 };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const result = await db.select({
    total: sql<number>`count(*)`,
    unique: sql<number>`count(distinct session_id)`,
    today: sql<number>`sum(case when created_at >= ${today} then 1 else 0 end)`,
  }).from(pageviews);
  const row = result[0];
  return {
    total: Number(row?.total ?? 0),
    unique: Number(row?.unique ?? 0),
    today: Number(row?.today ?? 0),
  };
}

// ===== SITE CONTENT =====

export async function getSiteContent() {
  const db = getDb();
  if (!db) return [];
  return db.select().from(siteContent).where(eq(siteContent.isActive, "yes"));
}

export async function getSiteContentByKey(sectionKey: string) {
  const db = getDb();
  if (!db) return undefined;
  const result = await db.select().from(siteContent).where(eq(siteContent.sectionKey, sectionKey)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateSiteContent(sectionKey: string, data: Record<string, string | null>) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const updateSet: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) updateSet[key] = value;
  }
  if (Object.keys(updateSet).length > 0) {
    const existing = await db.select({ id: siteContent.id }).from(siteContent).where(eq(siteContent.sectionKey, sectionKey)).limit(1);
    if (existing.length > 0) {
      await db.update(siteContent).set(updateSet).where(eq(siteContent.sectionKey, sectionKey));
    } else {
      await db.insert(siteContent).values({ sectionKey, ...data } as any);
    }
  }
}

// ===== COUPONS =====

export async function getAllCoupons() {
  const db = getDb();
  if (!db) return [];
  return db.select().from(coupons).orderBy(desc(coupons.createdAt));
}

export async function getCouponByCode(code: string) {
  const db = getDb();
  if (!db) return undefined;
  const result = await db.select().from(coupons).where(eq(coupons.code, code.trim())).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCoupon(data: InsertCoupon) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(coupons).values(data);
}

export async function updateCoupon(id: number, data: Partial<InsertCoupon>) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const updateSet: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) updateSet[key] = value;
  }
  await db.update(coupons).set(updateSet).where(eq(coupons.id, id));
}

export async function deleteCoupon(id: number) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(coupons).where(eq(coupons.id, id));
}

export async function incrementCouponUsage(code: string) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.update(coupons).set({ usedCount: sql<number>`used_count + 1` }).where(eq(coupons.code, code.trim()));
}

// ===== PRODUCT REVIEWS =====

export async function getReviewByUserAndProduct(userId: number, productId: number) {
  const db = getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(productReviews)
    .where(and(eq(productReviews.userId, userId), eq(productReviews.productId, productId)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getProductReviewStats(productId: number) {
  const db = getDb();
  if (!db) return { count: 0, average: 0 };
  const rows = await db
    .select({ count: sql<number>`COUNT(*)`, average: sql<number>`COALESCE(AVG(rating), 0)` })
    .from(productReviews)
    .where(eq(productReviews.productId, productId))
    .limit(1);
  const row = rows[0];
  return { count: Number(row?.count ?? 0), average: Number(row?.average ?? 0) };
}

export async function getProductReviewsByProductId(productId: number, limit = 50) {
  const db = getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: productReviews.id,
      userId: productReviews.userId,
      rating: productReviews.rating,
      comment: productReviews.comment,
      userName: productReviews.userName,
      createdAt: productReviews.createdAt,
    })
    .from(productReviews)
    .where(eq(productReviews.productId, productId))
    .orderBy(desc(productReviews.createdAt))
    .limit(limit);
  return rows.map((row) => ({ ...row, verified: true }));
}

export async function createProductReview(data: InsertProductReview) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(productReviews).values(data).returning();
}

export async function deleteProductReview(id: number) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(productReviews).where(eq(productReviews.id, id));
}

export async function getAllProductReviews() {
  const db = getDb();
  if (!db) return [];
  return db.select().from(productReviews).orderBy(desc(productReviews.createdAt));
}

// ===== RESTOCK ALERTS =====

export async function createRestockAlert(data: { productId: number; productName?: string; size: string; email?: string; phone?: string; }) {
  const db = getDb();
  if (!db) return null;
  return db.insert(restockAlerts).values(data);
}

export async function getRestockAlerts() {
  const db = getDb();
  if (!db) return [];
  return db.select().from(restockAlerts).orderBy(desc(restockAlerts.id));
}

export async function markRestockAlertSent(id: number) {
  const db = getDb();
  if (!db) return;
  return db.update(restockAlerts).set({ sentAt: new Date() }).where(eq(restockAlerts.id, id));
}

export async function deleteRestockAlert(id: number) {
  const db = getDb();
  if (!db) return;
  return db.delete(restockAlerts).where(eq(restockAlerts.id, id));
}

// ===== REFERRAL CODES =====

export async function getReferralByCode(code: string) {
  const db = getDb();
  if (!db) return null;
  const rows = await db
    .select({ userId: users.id, name: users.name, email: users.email, referralCode: users.referralCode })
    .from(users)
    .where(eq(users.referralCode, code));
  return rows[0] ?? null;
}

export async function setReferralCode(userId: number, code: string) {
  const db = getDb();
  if (!db) return;
  return db.update(users).set({ referralCode: code }).where(eq(users.id, userId));
}

export async function getReferralUsageCount(referralCode: string) {
  const db = getDb();
  if (!db) return 0;
  const rows = await db
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.referralCodeUsed, referralCode));
  return rows.length;
}

// ===== REPORTS =====

export async function getOrderReport() {
  const db = getDb();
  if (!db) return { revenueByMonth: [], topProducts: [], sourceStats: [], totals: { totalOrders: 0, totalRevenue: 0, cancelledRevenue: 0 } };

  const all = await db
    .select({
      id: orders.id,
      orderValue: orders.totalAfterDiscount,
      productId: orders.productId,
      productName: orders.productName,
      utmSource: orders.utmSource,
      customerEmail: orders.customerEmail,
      customerPhone: orders.customerPhone,
      status: orders.status,
      createdAt: orders.createdAt,
    })
    .from(orders);

  const customerKeys = new Set<string>();
  const totals = { totalOrders: all.length, totalRevenue: 0, cancelledRevenue: 0, uniqueCustomers: 0 };
  const revenueByMonth: { month: string; revenue: number; orders: number }[] = [];
  const topMap = new Map<number, { id: number; name: string; count: number; revenue: number }>();
  const sourceMap = new Map<string, { source: string; orders: number; revenue: number }>();
  const monthMap = new Map<string, { revenue: number; orders: number }>();

  for (const o of all) {
    const key = [o.customerEmail || "", o.customerPhone || ""].filter(Boolean).join("|");
    if (key) customerKeys.add(key);
    const value = Number(o.orderValue ?? 0) || 0;
    if (o.status === "cancelled") { totals.cancelledRevenue += value; continue; }
    totals.totalRevenue += value;
    const monthKey = o.createdAt
      ? `${o.createdAt.getFullYear()}-${String(o.createdAt.getMonth() + 1).padStart(2, "0")}`
      : "unknown";
    const m = monthMap.get(monthKey) ?? { revenue: 0, orders: 0 };
    m.revenue += value; m.orders += 1;
    monthMap.set(monthKey, m);
    const pid = o.productId ?? -1;
    const t = topMap.get(pid) ?? { id: pid, name: o.productName ?? "Unknown", count: 0, revenue: 0 };
    t.count += 1; t.revenue += value;
    topMap.set(pid, t);
    const src = o.utmSource || "direct";
    const s = sourceMap.get(src) ?? { source: src, orders: 0, revenue: 0 };
    s.orders += 1; s.revenue += value;
    sourceMap.set(src, s);
  }

  const monthNames: Record<string, string> = {
    "01": "يناير", "02": "فبراير", "03": "مارس", "04": "أبريل", "05": "مايو", "06": "يونيو",
    "07": "يوليو", "08": "أغسطس", "09": "سبتمبر", "10": "أكتوبر", "11": "نوفمبر", "12": "ديسمبر",
  };
  Array.from(monthMap.entries()).sort(([a], [b]) => a.localeCompare(b)).forEach(([key, v]) => {
    const [y, m] = key.split("-");
    revenueByMonth.push({ month: monthNames[m] ? `${monthNames[m]} ${y}` : key, revenue: Math.round(v.revenue), orders: v.orders });
  });

  const topProducts = Array.from(topMap.values()).sort((a, b) => b.count - a.count).slice(0, 10);
  const sourceStats = Array.from(sourceMap.values()).sort((a, b) => b.orders - a.orders);
  totals.uniqueCustomers = customerKeys.size;
  return { revenueByMonth, topProducts, sourceStats, totals };
}

export async function getOrdersForExport(filter: { status?: string; from?: Date; to?: Date; }) {
  const db = getDb();
  if (!db) return [];
  const conditions: SQL<unknown>[] = [];
  if (filter.status) {
    conditions.push(eq(orders.status, filter.status));
  }
  if (filter.from) conditions.push(gte(orders.createdAt, filter.from));
  if (filter.to) conditions.push(lte(orders.createdAt, filter.to));
  const rows = conditions.length
    ? await db.select().from(orders).where(and(...conditions)).orderBy(desc(orders.id))
    : await db.select().from(orders).orderBy(desc(orders.id));
  const statusLabels: Record<string, string> = {
    new: "جديد", contacted: "تم التواصل", confirmed: "مؤكد",
    shipped: "تم الشحن", delivered: "تم التسليم", cancelled: "ملغي",
  };
  return rows.map((o) => ({
    order_id: o.id,
    status_ar: statusLabels[o.status] ?? o.status,
    customer_name: o.customerName,
    customer_phone: o.customerPhone,
    customer_email: o.customerEmail ?? "",
    product_name: o.productName ?? "",
    price: o.productPrice ?? "",
    discount: o.discountValue ?? "",
    total: o.totalAfterDiscount ?? "",
    coupon: o.couponCode ?? "",
    size: o.selectedSize ?? "",
    color: o.selectedColor ?? "",
    notes: o.notes ?? "",
    utm_source: o.utmSource ?? "",
    created_at: o.createdAt?.toISOString() ?? "",
  }));
}

// ===== CONTACT INBOX =====

export async function createContactMessage(data: { name: string; phone?: string; email?: string; subject?: string; message: string }) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(contactInbox).values(data);
}

export async function getContactMessages(limit = 100) {
  const db = getDb();
  if (!db) return [];
  return db.select().from(contactInbox).orderBy(desc(contactInbox.createdAt)).limit(limit);
}

export async function markContactMessageRead(id: number) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.update(contactInbox).set({ readAt: new Date() }).where(eq(contactInbox.id, id));
}

export async function deleteContactMessage(id: number) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(contactInbox).where(eq(contactInbox.id, id));
}