import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import {
  users,
  adminCredentials,
  adminSessions,
} from "../drizzle/schema";
import type {
  User,
  InsertUser,
  AdminCredential,
  InsertAdminCredential,
  AdminSession,
  InsertAdminSession,
} from "../drizzle/schema";

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
      console.warn("[Database] Connection error:", error);
      _db = null;
    }
  }
  return _db;
}

export function normalizePhone(phone: string): string {
  return (phone || "").replace(/[^0-9]/g, "");
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const db = getDb();
  if (!db) return undefined;
  try {
    const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
    return result[0];
  } catch {
    return undefined;
  }
}

export async function upsertUser(user: InsertUser): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    await db.insert(users).values(user).onConflictDoNothing();
  } catch (e) {
    console.error("upsertUser error:", e);
  }
}

export async function getAdminCredentialByPhone(phone: string): Promise<AdminCredential | undefined> {
  const db = getDb();
  if (!db) return undefined;
  try {
    const result = await db.select().from(adminCredentials).where(eq(adminCredentials.phone, phone)).limit(1);
    return result[0];
  } catch {
    return undefined;
  }
}

export async function upsertAdminCredential(cred: InsertAdminCredential): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    const existing = await getAdminCredentialByPhone(cred.phone);
    if (existing) {
      await db.update(adminCredentials).set(cred).where(eq(adminCredentials.phone, cred.phone));
    } else {
      await db.insert(adminCredentials).values(cred);
    }
  } catch (e) {
    console.error("upsertAdminCredential error:", e);
  }
}

export async function getAllAdminCredentials(): Promise<AdminCredential[]> {
  const db = getDb();
  if (!db) return [];
  try {
    return await db.select().from(adminCredentials);
  } catch {
    return [];
  }
}

export async function deleteAdminCredential(phone: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    await db.delete(adminCredentials).where(eq(adminCredentials.phone, phone));
  } catch (e) {
    console.error("deleteAdminCredential error:", e);
  }
}

export async function createAdminSession(session: InsertAdminSession): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    await db.insert(adminSessions).values(session);
  } catch (e) {
    console.error("createAdminSession error:", e);
  }
}

export async function getActiveAdminSession(jti: string): Promise<AdminSession | undefined> {
  const db = getDb();
  if (!db) return undefined;
  try {
    const result = await db.select().from(adminSessions).where(eq(adminSessions.jti, jti)).limit(1);
    return result[0];
  } catch {
    return undefined;
  }
}