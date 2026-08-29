import { and, desc, eq, gt, gte, lte, inArray, lt, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, products, categories, orders, gallery, pageviews, siteContent, coupons, orderNotifications, productReviews, adminCredentials, adminSessions, adminLoginAttempts, siteSettings, restockAlerts, contactInbox } from "../drizzle/schema";
import type { InsertProduct, InsertCategory, InsertOrder, InsertGalleryItem, InsertPageview, InsertCoupon, InsertOrderNotification, InsertProductReview, InsertAdminCredential, InsertAdminSession, InsertSiteSetting } from "../drizzle/schema";
import { ENV } from './_core/env';
8: let _db: ReturnType<typeof drizzle> | null = null;

10: // Lazily create the drizzle instance so local tooling can run without a DB.

export async function getDb() {
if (!_db && process.env.DATABASE_URL) {
try {
_db = drizzle(process.env.DATABASE_URL);
} catch (error) {
console.warn("[Database] Failed to connect:", error);
_db = null;
}
}
return _db;
}
23: export async function upsertUser(user: InsertUser): Promise<void> {

if (!user.openId) {
throw new Error("User openId is required for upsert");
}
28:   const db = await getDb();

if (!db) {
console.warn("[Database] Cannot upsert user: database not available");
return;
}
34:   try {

const values: InsertUser = {
openId: user.openId,
};
c
40:     const textFields = ["name", "email", "loginMethod"] as const;

type TextField = (typeof textFields)[number];
43:     const assignNullable = (field: TextField) => {

const value = user[field];
if (value === undefined) return;
const normalized = value ?? null;
values[field] = normalized;
updateSet[field] = normalized;
};
51:     textFields.forEach(assignNullable);

53:     if (user.lastSignedIn !== undefined) {

values.lastSignedIn = user.lastSignedIn;
updateSet.lastSignedIn = user.lastSignedIn;
}
if (user.role !== undefined) {
values.role = user.role;
updateSet.role = user.role;
} else if (user.openId === ENV.ownerOpenId) {
values.role = 'admin';
updateSet.role = 'admin';
}
65:     if (!values.lastSignedIn) {

values.lastSignedIn = new Date();
}
69:     if (Object.keys(updateSet).length === 0) {

updateSet.lastSignedIn = new Date();
}
73:     await db.insert(users).values(values).onDuplicateKeyUpdate({

set: updateSet,
});
} catch (error) {
console.error("[Database] Failed to upsert user:", error);
throw error;
}
}
82: export async function getUserByOpenId(openId: string) {

const db = await getDb();
if (!db) {
console.warn("[Database] Cannot get user: database not available");
return undefined;
}
89:   const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

91:   return result.length > 0 ? result[0] : undefined;

}
94: // ===== PHONE-BASED ADMIN LOGIN =====

96: /**

* Normalize a phone number to digits only so formatting (leading zero,
* spaces, dashes) never breaks login matching.
*/
export function normalizePhone(phone: string): string {
return (phone || "").replace(/[^0-9]/g, "");
}
104: export async function getAdminCredentialByPhone(phone: string) {

const db = await getDb();
if (!db) {
console.warn("[Database] Cannot get admin credential: database not available");
return undefined;
}
const result = await db
.select()
.from(adminCredentials)
.where(eq(adminCredentials.phone, normalizePhone(phone)))
.limit(1);
return result.length > 0 ? result[0] : undefined;
}
118: export async function upsertAdminCredential(data: InsertAdminCredential) {
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

const db = await getDb();
if (!db) throw new Error("Database not available");
await db.update(adminCredentials).set({ isActive: "no" }).where(eq(adminCredentials.phone, normalizePhone(phone)));
}
138: export async function createAdminSession(data: InsertAdminSession) {

const db = await getDb();
if (!db) throw new Error("Database not available");
await db.insert(adminSessions).values(data);
return data.jti;
}
145: export async function getActiveAdminSession(jti: string, now: Date) {

const db = await getDb();
if (!db) {
console.warn("[Database] Cannot get admin session: database not available");
return undefined;
}
const result = await db
.select()
.from(adminSessions)
.where(and(eq(adminSessions.jti, jti), gt(adminSessions.expiresAt, now)))
.limit(1);
return result.length > 0 ? result[0] : undefined;
}
159: export async function deleteAdminSession(jti: string) {

const db = await getDb();
if (!db) return;
await db.delete(adminSessions).where(eq(adminSessions.jti, jti));
}
165: export async function deleteAdminSessionsByPhone(phone: string) {

const db = await getDb();
if (!db) return;
await db.delete(adminSessions).where(eq(adminSessions.adminPhone, normalizePhone(phone)));
}
171: export async function recordFailedAdminLogin(ip: string, phone: string) {

const db = await getDb();
if (!db) return;
await db.insert(adminLoginAttempts).values({ ip, phone: normalizePhone(phone) });
}
177: export async function countRecentFailedAdminAttempts(ip: string, windowMs: number) {

const db = await getDb();
if (!db) return 0;
const since = new Date(Date.now() - windowMs);
const result = await db
.select()
.from(adminLoginAttempts)
.where(and(eq(adminLoginAttempts.ip, ip), gt(adminLoginAttempts.createdAt, since)));
return result.length;
}
188: export async function getAllAdminCredentials() {

const db = await getDb();
if (!db) {
console.warn("[Database] Cannot list admin credentials: database not available");
return [];
}
return db.select().from(adminCredentials).orderBy(desc(adminCredentials.createdAt));
}
197: export async function deleteAdminCredential(phone: string) {

const db = await getDb();
if (!db) throw new Error("Database not available");
const normalized = normalizePhone(phone);
await db.delete(adminSessions).where(eq(adminSessions.adminPhone, normalized));
await db.delete(adminCredentials).where(eq(adminCredentials.phone, normalized));
}
205: export async function activateAdminCredential(phone: string) {

const db = await getDb();
if (!db) throw new Error("Database not available");
await db.update(adminCredentials).set({ isActive: "yes" }).where(eq(adminCredentials.phone, normalizePhone(phone)));
}
211: // ===== SITE SETTINGS =====

213: export async function getSetting(key: string) {

const db = await getDb();
if (!db) {
console.warn("[Database] Cannot get setting: database not available");
return undefined;
}
const result = await db.select().from(siteSettings).where(eq(siteSettings.settingKey, key)).limit(1);
return result.length > 0 ? result[0] : undefined;