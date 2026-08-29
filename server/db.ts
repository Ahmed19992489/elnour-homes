import { and, desc, eq, gt, gte, lte, inArray, lt, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
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
  User,
  InsertUser,
  Product,
  InsertProduct,
  Category,
  InsertCategory,
  Order,
  InsertOrder,
  GalleryItem,
  InsertGalleryItem,
  Pageview,
  InsertPageview,
  Coupon,
  InsertCoupon,
  OrderNotification,
  InsertOrderNotification,
  ProductReview,
  InsertProductReview,
  AdminCredential,
  InsertAdminCredential,
  AdminSession,
  InsertAdminSession,
  SiteSetting,
  InsertSiteSetting,
} from "../drizzle/schema";

let _db: any = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Connection notice:", error);
      _db = null;
    }
  }
  return _db;
}

export function normalizePhone(phone: string): string {
  return (phone || "").replace(/[^0-9]/g, "");
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  try {
    const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
    return result[0];
  } catch {
    return undefined;
  }
}

export async function upsertUser(user: InsertUser): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(users).values(user).onDuplicateKeyUpdate({
      set: {
        name: user.name ?? undefined,
        email: user.email ?? undefined,
        phone: user.phone ?? undefined,
        lastSignedIn: new Date(),
      },
    });
  } catch (e) {
    console.error("upsertUser error:", e);
  }
}

export async function getAdminCredentialByPhone(phone: string): Promise<AdminCredential | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  try {
    const result = await db
      .select()
      .from(adminCredentials)
      .where(eq(adminCredentials.phone, normalizePhone(phone)))
      .limit(1);
    return result[0];
  } catch {
    return undefined;
  }
}

export async function upsertAdminCredential(data: InsertAdminCredential) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const normalized = { ...data, phone: normalizePhone(data.phone) };
  await db.insert(adminCredentials).values(normalized).onDuplicateKeyUpdate({
    set: {
      passwordHash: normalized.passwordHash,
      displayName: normalized.displayName ?? null,
      role: normalized.role ?? "admin",
      isActive: "yes",
    },
  });
  return getAdminCredentialByPhone(normalized.phone);
}

export async function createAdminSession(data: InsertAdminSession) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(adminSessions).values(data);
  return data.jti;
}

export async function getActiveAdminSession(jti: string, now: Date): Promise<AdminSession | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  try {
    const result = await db
      .select()
      .from(adminSessions)
      .where(and(eq(adminSessions.jti, jti), gt(adminSessions.expiresAt, now)))
      .limit(1);
    return result[0];
  } catch {
    return undefined;
  }
}

export async function deleteAdminSession(jti: string) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.delete(adminSessions).where(eq(adminSessions.jti, jti));
  } catch {}
}

export async function deleteAdminSessionsByPhone(phone: string) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.delete(adminSessions).where(eq(adminSessions.adminPhone, normalizePhone(phone)));
  } catch {}
}

export async function recordFailedAdminLogin(ip: string, phone: string) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(adminLoginAttempts).values({ ip, phone: normalizePhone(phone) });
  } catch {}
}

export async function countRecentFailedAdminAttempts(ip: string, windowMs: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  try {
    const since = new Date(Date.now() - windowMs);
    const result = await db
      .select()
      .from(adminLoginAttempts)
      .where(and(eq(adminLoginAttempts.ip, ip), gt(adminLoginAttempts.createdAt, since)));
    return result.length;
  } catch {
    return 0;
  }
}

export async function getAllAdminCredentials(): Promise<AdminCredential[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(adminCredentials).orderBy(desc(adminCredentials.createdAt));
  } catch {
    return [];
  }
}

export async function deleteAdminCredential(phone: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(adminCredentials).where(eq(adminCredentials.phone, normalizePhone(phone)));
}