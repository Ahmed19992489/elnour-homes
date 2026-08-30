var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/_core/env.ts
var ENV;
var init_env = __esm({
  "server/_core/env.ts"() {
    ENV = {
      appId: process.env.VITE_APP_ID ?? "",
      cookieSecret: process.env.JWT_SECRET ?? "",
      databaseUrl: process.env.DATABASE_URL ?? "",
      oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
      ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
      isProduction: process.env.NODE_ENV === "production",
      forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
      forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
    };
  }
});

// server/storage.ts
var storage_exports = {};
__export(storage_exports, {
  storageGet: () => storageGet,
  storageGetSignedUrl: () => storageGetSignedUrl,
  storagePut: () => storagePut
});
function getForgeConfig() {
  const forgeUrl = ENV.forgeApiUrl;
  const forgeKey = ENV.forgeApiKey;
  if (!forgeUrl || !forgeKey) {
    throw new Error(
      "Storage config missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }
  return { forgeUrl: forgeUrl.replace(/\/+$/, ""), forgeKey };
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function appendHashSuffix(relKey) {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const { forgeUrl, forgeKey } = getForgeConfig();
  const key = appendHashSuffix(normalizeKey(relKey));
  const presignUrl = new URL("v1/storage/presign/put", forgeUrl + "/");
  presignUrl.searchParams.set("path", key);
  const presignResp = await fetch(presignUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` }
  });
  if (!presignResp.ok) {
    const msg = await presignResp.text().catch(() => presignResp.statusText);
    throw new Error(`Storage presign failed (${presignResp.status}): ${msg}`);
  }
  const { url: s3Url } = await presignResp.json();
  if (!s3Url) throw new Error("Forge returned empty presign URL");
  const blob = typeof data === "string" ? new Blob([data], { type: contentType }) : new Blob([data], { type: contentType });
  const uploadResp = await fetch(s3Url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob
  });
  if (!uploadResp.ok) {
    throw new Error(`Storage upload to S3 failed (${uploadResp.status})`);
  }
  return { key, url: `/manus-storage/${key}` };
}
async function storageGet(relKey) {
  const key = normalizeKey(relKey);
  return { key, url: `/manus-storage/${key}` };
}
async function storageGetSignedUrl(relKey) {
  const { forgeUrl, forgeKey } = getForgeConfig();
  const key = normalizeKey(relKey);
  const getUrl = new URL("v1/storage/presign/get", forgeUrl + "/");
  getUrl.searchParams.set("path", key);
  const resp = await fetch(getUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` }
  });
  if (!resp.ok) {
    const msg = await resp.text().catch(() => resp.statusText);
    throw new Error(`Storage signed URL failed (${resp.status}): ${msg}`);
  }
  const { url } = await resp.json();
  return url;
}
var init_storage = __esm({
  "server/storage.ts"() {
    init_env();
  }
});

// server/api.ts
import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// server/routers.ts
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ADMIN_COOKIE_NAME = "admin_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";
var decodeOAuthState = (state) => {
  let decoded;
  try {
    decoded = atob(state);
  } catch {
    return { redirectUri: "" };
  }
  try {
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed.redirectUri === "string") return parsed;
  } catch {
  }
  return { redirectUri: decoded };
};

// server/routers.ts
init_env();

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
init_env();
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// client/src/lib/productImages.ts
function parseProductImages(images) {
  if (!images?.trim()) return [];
  const value = images.trim();
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim());
    }
  } catch {
  }
  return value.split(",").map((image) => image.trim()).filter(Boolean);
}
function hasProductImage(images) {
  return parseProductImages(images).length > 0;
}
function serializeProductImages(images) {
  return images.map((image) => image.trim()).filter(Boolean).join(", ");
}

// server/routers.ts
import { z as z2 } from "zod";

// server/db.ts
import { and, desc, eq, gt, gte, lte, inArray, lt, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

// drizzle/schema.ts
import {
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
  boolean,
  serial
} from "drizzle-orm/pg-core";
var users = pgTable("users", {
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
  referralCode: varchar("referral_code", { length: 32 })
});
var products = pgTable("products", {
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
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  nameAr: varchar("name_ar", { length: 120 }).notNull(),
  nameEn: varchar("name_en", { length: 120 }).notNull(),
  descriptionAr: text("description_ar"),
  descriptionEn: text("description_en"),
  isActive: varchar("is_active", { length: 10 }).default("yes").notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
});
var orders = pgTable("orders", {
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
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var orderNotifications = pgTable("order_notifications", {
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
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var gallery = pgTable("gallery", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  imageUrl: text("image_url").notNull(),
  category: varchar("category", { length: 100 }).default("\u0623\u0639\u0645\u0627\u0644 \u0645\u0646\u062C\u0632\u0629"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var pageviews = pgTable("pageviews", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 64 }),
  path: varchar("path", { length: 255 }).default("/"),
  referrer: text("referrer"),
  userAgent: text("user_agent"),
  utmSource: varchar("utm_source", { length: 255 }),
  utmMedium: varchar("utm_medium", { length: 255 }),
  utmCampaign: varchar("utm_campaign", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var siteContent = pgTable("site_content", {
  id: serial("id").primaryKey(),
  sectionKey: varchar("section_key", { length: 100 }).notNull().unique(),
  titleAr: text("title_ar"),
  titleEn: text("title_en"),
  contentAr: text("content_ar"),
  contentEn: text("content_en"),
  subtitleAr: text("subtitle_ar"),
  subtitleEn: text("subtitle_en"),
  isActive: varchar("is_active", { length: 10 }).default("yes").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var coupons = pgTable("coupons", {
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
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var productReviews = pgTable("product_reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  productId: integer("product_id").notNull(),
  orderId: integer("order_id"),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  userName: varchar("user_name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var adminCredentials = pgTable("admin_credentials", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 30 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 255 }),
  role: varchar("role", { length: 20 }).default("admin").notNull(),
  isActive: varchar("is_active", { length: 10 }).default("yes").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var adminSessions = pgTable("admin_sessions", {
  id: serial("id").primaryKey(),
  adminPhone: varchar("admin_phone", { length: 30 }).notNull(),
  jti: varchar("jti", { length: 64 }).notNull().unique(),
  userAgent: text("user_agent"),
  ip: varchar("ip", { length: 60 }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var adminLoginAttempts = pgTable("admin_login_attempts", {
  id: serial("id").primaryKey(),
  ip: varchar("ip", { length: 60 }),
  phone: varchar("phone", { length: 30 }),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  settingKey: varchar("setting_key", { length: 64 }).notNull().unique(),
  settingValue: text("setting_value"),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var restockAlerts = pgTable("restock_alerts", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  productName: varchar("product_name", { length: 255 }),
  size: varchar("size", { length: 120 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var contactInbox = pgTable("contact_inbox", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 40 }),
  email: varchar("email", { length: 180 }),
  subject: varchar("subject", { length: 200 }),
  message: text("message").notNull(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// server/db.ts
init_env();
var _db = null;
function getDb() {
  if (!_db) {
    const url = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_VM4tSBwN5PGd@ep-plain-rice-auzortld-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require";
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
async function upsertUser(user) {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = { openId: user.openId };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    for (const field of textFields) {
      const value = user[field];
      if (value === void 0) continue;
      values[field] = value ?? null;
      updateSet[field] = value ?? null;
    }
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) values.lastSignedIn = /* @__PURE__ */ new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUserById(id) {
  const db = getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}
async function getAllUsers(limit = 500) {
  const db = getDb();
  if (!db) return [];
  return db.select({ id: users.id, name: users.name, email: users.email, phone: users.phone, role: users.role }).from(users).orderBy(desc(users.id)).limit(limit);
}
async function updateUserProfile(userId, data) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const updateSet = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== void 0 && key !== "openId" && key !== "role") updateSet[key] = value;
  }
  await db.update(users).set(updateSet).where(eq(users.id, userId));
}
function normalizePhone(phone) {
  return (phone || "").replace(/[^0-9]/g, "");
}
async function getAdminCredentialByPhone(phone) {
  const db = getDb();
  if (!db) {
    console.warn("[Database] Cannot get admin credential: database not available");
    return void 0;
  }
  const result = await db.select().from(adminCredentials).where(eq(adminCredentials.phone, normalizePhone(phone))).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function upsertAdminCredential(data) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const normalized = { ...data, phone: normalizePhone(data.phone) };
  await db.insert(adminCredentials).values(normalized).onConflictDoUpdate({
    target: adminCredentials.phone,
    set: {
      passwordHash: normalized.passwordHash,
      displayName: normalized.displayName ?? null,
      isActive: "yes"
    }
  });
  return getAdminCredentialByPhone(normalized.phone);
}
async function deactivateAdminCredential(phone) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.update(adminCredentials).set({ isActive: "no" }).where(eq(adminCredentials.phone, normalizePhone(phone)));
}
async function activateAdminCredential(phone) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.update(adminCredentials).set({ isActive: "yes" }).where(eq(adminCredentials.phone, normalizePhone(phone)));
}
async function createAdminSession(data) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(adminSessions).values(data);
  return data.jti;
}
async function getActiveAdminSession(jti, now = /* @__PURE__ */ new Date()) {
  const db = getDb();
  if (!db) {
    console.warn("[Database] Cannot get admin session: database not available");
    return void 0;
  }
  const result = await db.select().from(adminSessions).where(and(eq(adminSessions.jti, jti), gt(adminSessions.expiresAt, now))).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function deleteAdminSessionsByPhone(phone) {
  const db = getDb();
  if (!db) return;
  await db.delete(adminSessions).where(eq(adminSessions.adminPhone, normalizePhone(phone)));
}
async function recordFailedAdminLogin(ip, phone) {
  const db = getDb();
  if (!db) return;
  await db.insert(adminLoginAttempts).values({ ip, phone: normalizePhone(phone) });
}
async function countRecentFailedAdminAttempts(ip, windowMs) {
  const db = getDb();
  if (!db) return 0;
  const since = new Date(Date.now() - windowMs);
  const result = await db.select().from(adminLoginAttempts).where(and(eq(adminLoginAttempts.ip, ip), gt(adminLoginAttempts.createdAt, since)));
  return result.length;
}
async function getAllAdminCredentials() {
  const db = getDb();
  if (!db) {
    console.warn("[Database] Cannot list admin credentials: database not available");
    return [];
  }
  return db.select().from(adminCredentials).orderBy(desc(adminCredentials.createdAt));
}
async function deleteAdminCredential(phone) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const normalized = normalizePhone(phone);
  await db.delete(adminSessions).where(eq(adminSessions.adminPhone, normalized));
  await db.delete(adminCredentials).where(eq(adminCredentials.phone, normalized));
}
async function getSetting(key) {
  const db = getDb();
  if (!db) {
    console.warn("[Database] Cannot get setting: database not available");
    return void 0;
  }
  const result = await db.select().from(siteSettings).where(eq(siteSettings.settingKey, key)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function upsertSetting(key, value) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const data = { settingKey: key, settingValue: value };
  await db.insert(siteSettings).values(data).onConflictDoUpdate({
    target: siteSettings.settingKey,
    set: { settingValue: value }
  });
  return getSetting(key);
}
async function getActiveProducts() {
  const db = getDb();
  if (!db) return [];
  return db.select().from(products).where(eq(products.isActive, "yes")).orderBy(products.sortOrder);
}
async function getActiveProductsByCategory(categorySlug) {
  const db = getDb();
  if (!db) return [];
  return db.select().from(products).where(and(eq(products.isActive, "yes"), eq(products.category, categorySlug))).orderBy(products.sortOrder);
}
async function getAllProducts() {
  const db = getDb();
  if (!db) return [];
  return db.select().from(products).orderBy(products.sortOrder);
}
async function getProductById(id) {
  const db = getDb();
  if (!db) return void 0;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createProduct(data) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(products).values(data).returning();
}
async function updateProduct(id, data) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const updateSet = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== void 0) updateSet[key] = value;
  }
  await db.update(products).set(updateSet).where(eq(products.id, id));
}
async function deleteProduct(id) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(products).where(eq(products.id, id));
}
async function getActiveProductsByIds(ids) {
  const db = getDb();
  if (!db || !ids.length) return [];
  return db.select().from(products).where(and(eq(products.isActive, "yes"), inArray(products.id, ids)));
}
async function getActiveCategories() {
  const db = getDb();
  if (!db) return [];
  return db.select().from(categories).where(eq(categories.isActive, "yes")).orderBy(categories.sortOrder);
}
async function getAllCategories() {
  const db = getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(categories.sortOrder);
}
async function categorySlugExists(slug) {
  const db = getDb();
  if (!db) return false;
  const result = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, slug)).limit(1);
  return result.length > 0;
}
async function createCategory(data) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(categories).values(data).returning();
}
async function updateCategory(id, data) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const updateSet = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== void 0) updateSet[key] = value;
  }
  await db.update(categories).set(updateSet).where(eq(categories.id, id));
}
async function deleteCategory(id) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const category = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  if (!category[0]) return;
  const usage = await db.select({ count: sql`count(*)` }).from(products).where(eq(products.category, category[0].slug));
  if (Number(usage[0]?.count ?? 0) > 0) {
    throw new Error("\u0644\u0627 \u064A\u0645\u0643\u0646 \u062D\u0630\u0641 \u0641\u0626\u0629 \u0645\u0631\u062A\u0628\u0637\u0629 \u0628\u0645\u0646\u062A\u062C\u0627\u062A. \u0627\u0646\u0642\u0644 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0625\u0644\u0649 \u0641\u0626\u0629 \u0623\u062E\u0631\u0649 \u0623\u0648\u0644\u0627\u064B.");
  }
  await db.delete(categories).where(eq(categories.id, id));
}
async function createOrder(data) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(orders).values(data).returning();
}
async function getOrders(limit = 100) {
  const db = getDb();
  if (!db) return [];
  return db.select().from(orders).orderBy(desc(orders.createdAt)).limit(limit);
}
async function getOrderById(id) {
  const db = getDb();
  if (!db) return void 0;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function updateOrderStatus(id, status, notes) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const updateSet = { status };
  if (notes !== void 0) updateSet.notes = notes;
  await db.update(orders).set(updateSet).where(eq(orders.id, id));
}
async function cancelOrderByCustomer(orderId, userId, reason) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.update(orders).set({
    status: "cancelled",
    cancelledBy: "customer",
    cancellationReason: reason?.trim() || null
  }).where(and(
    eq(orders.id, orderId),
    eq(orders.userId, userId),
    inArray(orders.status, ["new", "contacted", "confirmed"])
  )).returning();
  return result.length > 0;
}
async function createOrderNotification(data) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(orderNotifications).values(data);
}
async function getOrderNotificationsByUserId(userId, limit = 30) {
  const db = getDb();
  if (!db) return [];
  return db.select().from(orderNotifications).where(and(eq(orderNotifications.userId, userId), eq(orderNotifications.channel, "in_app"))).orderBy(desc(orderNotifications.createdAt)).limit(limit);
}
async function getNewOrdersCount() {
  const db = getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql`count(*)` }).from(orders).where(eq(orders.status, "new"));
  return Number(result[0]?.count ?? 0);
}
async function getOrderStats() {
  const db = getDb();
  if (!db) return { total: 0, new: 0, contacted: 0, confirmed: 0, shipped: 0, delivered: 0, cancelled: 0 };
  const result = await db.select({
    total: sql`count(*)`,
    newCount: sql`sum(case when status = 'new' then 1 else 0 end)`,
    contactedCount: sql`sum(case when status = 'contacted' then 1 else 0 end)`,
    confirmedCount: sql`sum(case when status = 'confirmed' then 1 else 0 end)`,
    shippedCount: sql`sum(case when status = 'shipped' then 1 else 0 end)`,
    deliveredCount: sql`sum(case when status = 'delivered' then 1 else 0 end)`,
    cancelledCount: sql`sum(case when status = 'cancelled' then 1 else 0 end)`
  }).from(orders);
  const row = result[0];
  return {
    total: Number(row?.total ?? 0),
    new: Number(row?.newCount ?? 0),
    contacted: Number(row?.contactedCount ?? 0),
    confirmed: Number(row?.confirmedCount ?? 0),
    shipped: Number(row?.shippedCount ?? 0),
    delivered: Number(row?.deliveredCount ?? 0),
    cancelled: Number(row?.cancelledCount ?? 0)
  };
}
async function updateOrderNotificationStatus(id, sent) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.update(orders).set({ notificationSent: sent }).where(eq(orders.id, id));
}
async function getOrdersByUserId(userId) {
  const db = getDb();
  if (!db) return [];
  return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
}
async function getOrderDetailsByUserId(orderId, userId) {
  const db = getDb();
  if (!db) return void 0;
  const result = await db.select().from(orders).where(and(eq(orders.id, orderId), eq(orders.userId, userId))).limit(1);
  const order = result[0];
  if (!order) return void 0;
  const product = order.productId ? await getProductById(order.productId) : void 0;
  return { order, product };
}
async function getGalleryItems() {
  const db = getDb();
  if (!db) return [];
  return db.select().from(gallery).orderBy(gallery.sortOrder, desc(gallery.createdAt));
}
async function createGalleryItem(data) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(gallery).values(data);
}
async function deleteGalleryItem(id) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(gallery).where(eq(gallery.id, id));
}
async function trackPageview(data) {
  const db = getDb();
  if (!db) return;
  try {
    await db.insert(pageviews).values(data);
  } catch {
  }
}
async function getPageviewStats() {
  const db = getDb();
  if (!db) return { total: 0, unique: 0, today: 0 };
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const result = await db.select({
    total: sql`count(*)`,
    unique: sql`count(distinct session_id)`,
    today: sql`sum(case when created_at >= ${today} then 1 else 0 end)`
  }).from(pageviews);
  const row = result[0];
  return {
    total: Number(row?.total ?? 0),
    unique: Number(row?.unique ?? 0),
    today: Number(row?.today ?? 0)
  };
}
async function getSiteContent() {
  const db = getDb();
  if (!db) return [];
  return db.select().from(siteContent).where(eq(siteContent.isActive, "yes"));
}
async function getSiteContentByKey(sectionKey) {
  const db = getDb();
  if (!db) return void 0;
  const result = await db.select().from(siteContent).where(eq(siteContent.sectionKey, sectionKey)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function updateSiteContent(sectionKey, data) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const updateSet = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== void 0) updateSet[key] = value;
  }
  if (Object.keys(updateSet).length > 0) {
    const existing = await db.select({ id: siteContent.id }).from(siteContent).where(eq(siteContent.sectionKey, sectionKey)).limit(1);
    if (existing.length > 0) {
      await db.update(siteContent).set(updateSet).where(eq(siteContent.sectionKey, sectionKey));
    } else {
      await db.insert(siteContent).values({ sectionKey, ...data });
    }
  }
}
async function getAllCoupons() {
  const db = getDb();
  if (!db) return [];
  return db.select().from(coupons).orderBy(desc(coupons.createdAt));
}
async function getCouponByCode(code) {
  const db = getDb();
  if (!db) return void 0;
  const result = await db.select().from(coupons).where(eq(coupons.code, code.trim())).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createCoupon(data) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(coupons).values(data);
}
async function updateCoupon(id, data) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const updateSet = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== void 0) updateSet[key] = value;
  }
  await db.update(coupons).set(updateSet).where(eq(coupons.id, id));
}
async function deleteCoupon(id) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(coupons).where(eq(coupons.id, id));
}
async function incrementCouponUsage(code) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.update(coupons).set({ usedCount: sql`used_count + 1` }).where(eq(coupons.code, code.trim()));
}
async function getReviewByUserAndProduct(userId, productId) {
  const db = getDb();
  if (!db) return void 0;
  const result = await db.select().from(productReviews).where(and(eq(productReviews.userId, userId), eq(productReviews.productId, productId))).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getProductReviewStats(productId) {
  const db = getDb();
  if (!db) return { count: 0, average: 0 };
  const rows = await db.select({ count: sql`COUNT(*)`, average: sql`COALESCE(AVG(rating), 0)` }).from(productReviews).where(eq(productReviews.productId, productId)).limit(1);
  const row = rows[0];
  return { count: Number(row?.count ?? 0), average: Number(row?.average ?? 0) };
}
async function getProductReviewsByProductId(productId, limit = 50) {
  const db = getDb();
  if (!db) return [];
  const rows = await db.select({
    id: productReviews.id,
    userId: productReviews.userId,
    rating: productReviews.rating,
    comment: productReviews.comment,
    userName: productReviews.userName,
    createdAt: productReviews.createdAt
  }).from(productReviews).where(eq(productReviews.productId, productId)).orderBy(desc(productReviews.createdAt)).limit(limit);
  return rows.map((row) => ({ ...row, verified: true }));
}
async function createProductReview(data) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(productReviews).values(data).returning();
}
async function deleteProductReview(id) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(productReviews).where(eq(productReviews.id, id));
}
async function getAllProductReviews() {
  const db = getDb();
  if (!db) return [];
  return db.select().from(productReviews).orderBy(desc(productReviews.createdAt));
}
async function createRestockAlert(data) {
  const db = getDb();
  if (!db) return null;
  return db.insert(restockAlerts).values(data);
}
async function getRestockAlerts() {
  const db = getDb();
  if (!db) return [];
  return db.select().from(restockAlerts).orderBy(desc(restockAlerts.id));
}
async function markRestockAlertSent(id) {
  const db = getDb();
  if (!db) return;
  return db.update(restockAlerts).set({ sentAt: /* @__PURE__ */ new Date() }).where(eq(restockAlerts.id, id));
}
async function deleteRestockAlert(id) {
  const db = getDb();
  if (!db) return;
  return db.delete(restockAlerts).where(eq(restockAlerts.id, id));
}
async function getReferralByCode(code) {
  const db = getDb();
  if (!db) return null;
  const rows = await db.select({ userId: users.id, name: users.name, email: users.email, referralCode: users.referralCode }).from(users).where(eq(users.referralCode, code));
  return rows[0] ?? null;
}
async function setReferralCode(userId, code) {
  const db = getDb();
  if (!db) return;
  return db.update(users).set({ referralCode: code }).where(eq(users.id, userId));
}
async function getReferralUsageCount(referralCode) {
  const db = getDb();
  if (!db) return 0;
  const rows = await db.select({ id: orders.id }).from(orders).where(eq(orders.referralCodeUsed, referralCode));
  return rows.length;
}
async function getOrderReport() {
  const db = getDb();
  if (!db) return { revenueByMonth: [], topProducts: [], sourceStats: [], totals: { totalOrders: 0, totalRevenue: 0, cancelledRevenue: 0 } };
  const all = await db.select({
    id: orders.id,
    orderValue: orders.totalAfterDiscount,
    productId: orders.productId,
    productName: orders.productName,
    utmSource: orders.utmSource,
    customerEmail: orders.customerEmail,
    customerPhone: orders.customerPhone,
    status: orders.status,
    createdAt: orders.createdAt
  }).from(orders);
  const customerKeys = /* @__PURE__ */ new Set();
  const totals = { totalOrders: all.length, totalRevenue: 0, cancelledRevenue: 0, uniqueCustomers: 0 };
  const revenueByMonth = [];
  const topMap = /* @__PURE__ */ new Map();
  const sourceMap = /* @__PURE__ */ new Map();
  const monthMap = /* @__PURE__ */ new Map();
  for (const o of all) {
    const key = [o.customerEmail || "", o.customerPhone || ""].filter(Boolean).join("|");
    if (key) customerKeys.add(key);
    const value = Number(o.orderValue ?? 0) || 0;
    if (o.status === "cancelled") {
      totals.cancelledRevenue += value;
      continue;
    }
    totals.totalRevenue += value;
    const monthKey = o.createdAt ? `${o.createdAt.getFullYear()}-${String(o.createdAt.getMonth() + 1).padStart(2, "0")}` : "unknown";
    const m = monthMap.get(monthKey) ?? { revenue: 0, orders: 0 };
    m.revenue += value;
    m.orders += 1;
    monthMap.set(monthKey, m);
    const pid = o.productId ?? -1;
    const t2 = topMap.get(pid) ?? { id: pid, name: o.productName ?? "Unknown", count: 0, revenue: 0 };
    t2.count += 1;
    t2.revenue += value;
    topMap.set(pid, t2);
    const src = o.utmSource || "direct";
    const s = sourceMap.get(src) ?? { source: src, orders: 0, revenue: 0 };
    s.orders += 1;
    s.revenue += value;
    sourceMap.set(src, s);
  }
  const monthNames = {
    "01": "\u064A\u0646\u0627\u064A\u0631",
    "02": "\u0641\u0628\u0631\u0627\u064A\u0631",
    "03": "\u0645\u0627\u0631\u0633",
    "04": "\u0623\u0628\u0631\u064A\u0644",
    "05": "\u0645\u0627\u064A\u0648",
    "06": "\u064A\u0648\u0646\u064A\u0648",
    "07": "\u064A\u0648\u0644\u064A\u0648",
    "08": "\u0623\u063A\u0633\u0637\u0633",
    "09": "\u0633\u0628\u062A\u0645\u0628\u0631",
    "10": "\u0623\u0643\u062A\u0648\u0628\u0631",
    "11": "\u0646\u0648\u0641\u0645\u0628\u0631",
    "12": "\u062F\u064A\u0633\u0645\u0628\u0631"
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
async function getOrdersForExport(filter) {
  const db = getDb();
  if (!db) return [];
  const conditions = [];
  if (filter.status) {
    conditions.push(eq(orders.status, filter.status));
  }
  if (filter.from) conditions.push(gte(orders.createdAt, filter.from));
  if (filter.to) conditions.push(lte(orders.createdAt, filter.to));
  const rows = conditions.length ? await db.select().from(orders).where(and(...conditions)).orderBy(desc(orders.id)) : await db.select().from(orders).orderBy(desc(orders.id));
  const statusLabels = {
    new: "\u062C\u062F\u064A\u062F",
    contacted: "\u062A\u0645 \u0627\u0644\u062A\u0648\u0627\u0635\u0644",
    confirmed: "\u0645\u0624\u0643\u062F",
    shipped: "\u062A\u0645 \u0627\u0644\u0634\u062D\u0646",
    delivered: "\u062A\u0645 \u0627\u0644\u062A\u0633\u0644\u064A\u0645",
    cancelled: "\u0645\u0644\u063A\u064A"
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
    created_at: o.createdAt?.toISOString() ?? ""
  }));
}
async function createContactMessage(data) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(contactInbox).values(data);
}
async function getContactMessages(limit = 100) {
  const db = getDb();
  if (!db) return [];
  return db.select().from(contactInbox).orderBy(desc(contactInbox.createdAt)).limit(limit);
}
async function markContactMessageRead(id) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.update(contactInbox).set({ readAt: /* @__PURE__ */ new Date() }).where(eq(contactInbox.id, id));
}
async function deleteContactMessage(id) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(contactInbox).where(eq(contactInbox.id, id));
}

// server/notificationStream.ts
var streamsByUser = /* @__PURE__ */ new Map();
function publishAccountNotification(userId) {
  const streams = streamsByUser.get(userId);
  if (!streams?.size) return;
  for (const stream of Array.from(streams)) {
    stream.write("event: order_notification\ndata: {}\n\n");
  }
}

// server/orderNotifications.ts
var statusCopy = {
  new: { ar: "\u062A\u0645 \u0627\u0633\u062A\u0644\u0627\u0645 \u0637\u0644\u0628\u0643", en: "Your order was received" },
  contacted: { ar: "\u062A\u0645 \u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0628\u0634\u0623\u0646 \u0637\u0644\u0628\u0643", en: "We contacted you about your order" },
  confirmed: { ar: "\u062A\u0645 \u062A\u0623\u0643\u064A\u062F \u0637\u0644\u0628\u0643", en: "Your order was confirmed" },
  shipped: { ar: "\u062A\u0645 \u0634\u062D\u0646 \u0637\u0644\u0628\u0643", en: "Your order was shipped" },
  delivered: { ar: "\u062A\u0645 \u062A\u0633\u0644\u064A\u0645 \u0637\u0644\u0628\u0643", en: "Your order was delivered" },
  cancelled: { ar: "\u062A\u0645 \u0625\u0644\u063A\u0627\u0621 \u0637\u0644\u0628\u0643", en: "Your order was cancelled" }
};
function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  })[char] || char);
}
function getNotificationCopy(order, event) {
  const state = statusCopy[order.status] || statusCopy.new;
  const name = order.customerName || "\u0639\u0645\u064A\u0644\u0646\u0627 \u0627\u0644\u0639\u0632\u064A\u0632";
  const title = event === "customer_cancelled" ? `\u062A\u0645 \u0625\u0644\u063A\u0627\u0621 \u0637\u0644\u0628\u0643 #${order.id}` : `${state.ar} \u2014 \u0637\u0644\u0628 #${order.id}`;
  const message = event === "customer_cancelled" ? `\u0645\u0631\u062D\u0628\u064B\u0627 ${name}\u060C \u062A\u0645 \u0627\u0633\u062A\u0644\u0627\u0645 \u0637\u0644\u0628 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0637\u0644\u0628 \u0631\u0642\u0645 #${order.id}.` : `\u0645\u0631\u062D\u0628\u064B\u0627 ${name}\u060C ${state.ar}. \u0631\u0642\u0645 \u0627\u0644\u0637\u0644\u0628 #${order.id}${order.productName ? ` \u2014 ${order.productName}` : ""}.`;
  return { title, message, statusLabel: state.ar };
}
async function createOrderInAppNotification(order, event) {
  if (!order.userId) return { delivered: false, reason: "no_account" };
  const copy = getNotificationCopy(order, event);
  await createOrderNotification({
    orderId: order.id,
    userId: order.userId,
    channel: "in_app",
    eventType: event,
    status: order.status,
    title: copy.title,
    message: copy.message,
    deliveryStatus: "in_app"
  });
  publishAccountNotification(order.userId);
  return { delivered: true };
}
async function notifyOrderCustomer(order, event, options = {}) {
  const copy = getNotificationCopy(order, event);
  if (options.includeInApp !== false) {
    await createOrderInAppNotification(order, event);
  }
  const account = order.userId ? await getUserById(order.userId) : void 0;
  const recipient = order.customerEmail || account?.email || void 0;
  const sender = process.env.RESEND_FROM_EMAIL;
  if (!recipient || !sender || !process.env.RESEND_API_KEY) {
    await createOrderNotification({
      orderId: order.id,
      userId: order.userId || null,
      channel: "email",
      eventType: event,
      status: order.status,
      title: copy.title,
      message: copy.message,
      recipient: recipient || null,
      deliveryStatus: "skipped"
    });
    return { delivered: false, reason: !recipient ? "no_recipient" : "email_not_configured" };
  }
  const origin = process.env.CANONICAL_ORIGIN || "https://elnoursteel-eexiztdb.manus.space";
  const orderUrl = `${origin}/account/orders/${order.id}`;
  const safeName = escapeHtml(order.customerName || "\u0639\u0645\u064A\u0644\u0646\u0627 \u0627\u0644\u0639\u0632\u064A\u0632");
  const safeProduct = escapeHtml(order.productName || "\u0637\u0644\u0628\u0643");
  const html = `
    <main dir="rtl" style="font-family:Arial,sans-serif;color:#1d1b18;max-width:620px;margin:auto;padding:32px">
      <h1 style="margin:0 0 16px;color:#9f711b;font-size:24px">${escapeHtml(copy.title)}</h1>
      <p>\u0645\u0631\u062D\u0628\u064B\u0627 ${safeName}\u060C</p>
      <p>${escapeHtml(copy.message)}</p>
      <section style="background:#f7f2e8;border-radius:12px;padding:18px;margin:22px 0">
        <p style="margin:0 0 8px"><strong>\u0631\u0642\u0645 \u0627\u0644\u0637\u0644\u0628:</strong> #${order.id}</p>
        <p style="margin:0 0 8px"><strong>\u0627\u0644\u0645\u0646\u062A\u062C:</strong> ${safeProduct}</p>
        <p style="margin:0"><strong>\u0627\u0644\u062D\u0627\u0644\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629:</strong> ${escapeHtml(copy.statusLabel)}</p>
      </section>
      <a href="${orderUrl}" style="display:inline-block;background:#9f711b;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px">\u0639\u0631\u0636 \u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0637\u0644\u0628</a>
      <p style="color:#68625a;font-size:12px;margin-top:28px">Elnour for STEEL</p>
    </main>`;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: sender,
        to: [recipient],
        subject: copy.title,
        html,
        text: `${copy.message}

\u0631\u0642\u0645 \u0627\u0644\u0637\u0644\u0628: #${order.id}
\u0627\u0644\u062D\u0627\u0644\u0629: ${copy.statusLabel}
${orderUrl}`
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || `Resend response ${response.status}`);
    await createOrderNotification({
      orderId: order.id,
      userId: order.userId || null,
      channel: "email",
      eventType: event,
      status: order.status,
      title: copy.title,
      message: copy.message,
      recipient,
      deliveryStatus: "sent",
      providerMessageId: payload.id || null
    });
    return { delivered: true };
  } catch (error) {
    console.warn("[Order notifications] Email delivery failed", error);
    await createOrderNotification({
      orderId: order.id,
      userId: order.userId || null,
      channel: "email",
      eventType: event,
      status: order.status,
      title: copy.title,
      message: copy.message,
      recipient,
      deliveryStatus: "failed"
    });
    return { delivered: false, reason: "delivery_failed" };
  }
}

// shared/cartPricing.ts
function parseJsonOptions(value) {
  try {
    if (!value) return [];
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function splitOptions(value) {
  return (value || "").split(/[،,;؛]+/).map((option) => option.trim()).filter(Boolean);
}
function computeCartItemPrice(product, selectedSize, selectedColor) {
  if (!product) return 0;
  const basePrice = product.price ? parseFloat(String(product.price)) : 0;
  if (product.pricingType === "per_meter") {
    const perMeter = product.pricePerMeter ? parseFloat(String(product.pricePerMeter)) : 0;
    return perMeter || basePrice;
  }
  const sizeOptions = parseJsonOptions(product.sizeOptions);
  if (sizeOptions.length && selectedSize) {
    const match = sizeOptions.find(
      (opt) => (opt.labelAr ?? "").toLocaleLowerCase() === selectedSize.trim().toLocaleLowerCase() || (opt.labelEn ?? "").toLocaleLowerCase() === selectedSize.trim().toLocaleLowerCase()
    );
    if (match) {
      const optPrice = match.price != null ? parseFloat(String(match.price)) : NaN;
      if (!Number.isNaN(optPrice)) return optPrice;
    }
  }
  const legacySizes = splitOptions(product.sizes);
  if (legacySizes.length && selectedSize) {
    if (legacySizes.some((s) => s.toLocaleLowerCase() === selectedSize.trim().toLocaleLowerCase())) {
      return basePrice;
    }
  }
  return basePrice;
}
function isOptionAvailable(values, jsonOptions, key, selected) {
  if (!selected) return true;
  const legacy = splitOptions(values);
  const json = parseJsonOptions(jsonOptions);
  const normalized = selected.trim().toLocaleLowerCase();
  if (legacy.some((v) => v.toLocaleLowerCase() === normalized)) return true;
  if (json.some((opt) => String(opt[key] ?? "").toLocaleLowerCase() === normalized)) return true;
  return false;
}

// server/routers.ts
var couponReasons = {
  invalidCode: "\u0631\u0645\u0632 \u0627\u0644\u0643\u0648\u0628\u0648\u0646 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D",
  inactive: "\u0647\u0630\u0627 \u0627\u0644\u0643\u0648\u0628\u0648\u0646 \u0645\u062A\u0648\u0642\u0641 \u0639\u0646 \u0627\u0644\u0639\u0645\u0644",
  notStarted: "\u0647\u0630\u0627 \u0627\u0644\u0643\u0648\u0628\u0648\u0646 \u0644\u0645 \u064A\u0628\u062F\u0623 \u0628\u0639\u062F",
  expired: "\u0627\u0646\u062A\u0647\u062A \u0635\u0644\u0627\u062D\u064A\u0629 \u0647\u0630\u0627 \u0627\u0644\u0643\u0648\u0628\u0648\u0646",
  exhausted: "\u062A\u0645 \u0627\u0633\u062A\u0646\u0641\u0627\u062F \u0627\u0633\u062A\u062E\u062F\u0627\u0645\u0627\u062A \u0647\u0630\u0627 \u0627\u0644\u0643\u0648\u0628\u0648\u0646",
  belowMinimum: "\u0627\u0644\u062D\u062F \u0627\u0644\u0623\u062F\u0646\u0649 \u0644\u0644\u0637\u0644\u0628 \u0644\u0645 \u064A\u062A\u062D\u0642\u0642"
};
var legacyCategorySlugs = {
  "\u0623\u0639\u0645\u0627\u0644 \u062F\u064A\u0643\u0648\u0631": "home-decor",
  "\u0644\u0648\u062D\u0627\u062A \u0642\u0631\u0622\u0646\u064A\u0629": "wall-art",
  "\u0644\u0648\u062D\u0627\u062A \u0625\u0633\u0644\u0627\u0645\u064A\u0629": "wall-art",
  "\u0644\u0648\u062D\u0627\u062A \u062C\u062F\u0627\u0631\u064A\u0629": "wall-art",
  "\u0637\u0631\u0627\u0628\u064A\u0632\u0629": "tables",
  "\u0627\u0628\u0648\u0627\u0628": "doors",
  "\u0633\u0644\u0645 \u062D\u062F\u064A\u062F": "staircases"
};
function normalizeCategorySlug(category) {
  return legacyCategorySlugs[category.trim()] || category.trim();
}
function parseProductOptions(value) {
  return (value || "").split(",").map((option) => option.trim()).filter(Boolean);
}
var masterAdminOpenIdCache = { value: null, at: 0 };
async function getMasterAdminOpenId() {
  const now = Date.now();
  if (masterAdminOpenIdCache.value !== null && now - masterAdminOpenIdCache.at < 5 * 60 * 1e3) {
    return masterAdminOpenIdCache.value;
  }
  try {
    const creds = await getAllAdminCredentials();
    const first = [...creds].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).find((c) => c.isActive === "yes");
    masterAdminOpenIdCache = { value: first ? `admin-${first.phone}` : null, at: now };
    return masterAdminOpenIdCache.value;
  } catch {
    return null;
  }
}
async function isOwnerOrMasterAdmin(user, ownerOpenId) {
  if (!user) return false;
  if (user.openId === ownerOpenId) return true;
  const master = await getMasterAdminOpenId();
  return master !== null && user.openId === master;
}
function isAvailableOption(options, selected) {
  if (!options.length) return !selected;
  if (!selected) return false;
  return options.some((option) => option.toLocaleLowerCase() === selected.trim().toLocaleLowerCase());
}
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  products: router({
    list: publicProcedure.query(async () => {
      return getAllProducts();
    }),
    active: publicProcedure.input(z2.object({ category: z2.string().min(1).optional() }).optional()).query(async ({ input }) => {
      return input?.category ? getActiveProductsByCategory(input.category) : getActiveProducts();
    }),
    byId: publicProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      return getProductById(input.id);
    }),
    create: adminProcedure.input(z2.object({
      name: z2.string().min(1),
      nameAr: z2.string().min(1),
      description: z2.string().optional(),
      price: z2.number().min(0),
      sizes: z2.string().optional(),
      colors: z2.string().optional(),
      sizeOptions: z2.string().optional(),
      colorOptions: z2.string().optional(),
      pricingType: z2.enum(["fixed", "per_meter"]).optional(),
      pricePerMeter: z2.number().min(0).optional(),
      category: z2.string().min(1).default("home-decor"),
      specifications: z2.string().optional(),
      images: z2.string().optional(),
      isActive: z2.enum(["yes", "no"]).default("yes"),
      sortOrder: z2.number().default(0)
    })).mutation(async ({ input }) => {
      const category = normalizeCategorySlug(input.category);
      if (!await categorySlugExists(category)) {
        throw new Error("\u064A\u0631\u062C\u0649 \u0627\u062E\u062A\u064A\u0627\u0631 \u0641\u0626\u0629 \u0635\u0627\u0644\u062D\u0629 \u0645\u0646 \u0627\u0644\u0641\u0626\u0627\u062A \u0627\u0644\u0645\u064F\u062F\u0627\u0631\u0629 \u0641\u064A \u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645");
      }
      if (input.isActive === "yes" && !hasProductImage(input.images)) {
        throw new Error("\u0623\u0636\u0641 \u0635\u0648\u0631\u0629 \u0648\u0627\u062D\u062F\u0629 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644 \u0642\u0628\u0644 \u0646\u0634\u0631 \u0627\u0644\u0645\u0646\u062A\u062C \u0641\u064A \u0627\u0644\u0645\u062A\u062C\u0631");
      }
      await createProduct({
        ...input,
        category,
        price: String(input.price),
        pricePerMeter: input.pricePerMeter !== void 0 ? String(input.pricePerMeter) : void 0,
        pricingType: input.pricingType ?? "fixed"
      });
      return { success: true };
    }),
    update: adminProcedure.input(z2.object({
      id: z2.number(),
      name: z2.string().min(1).optional(),
      nameAr: z2.string().min(1).optional(),
      description: z2.string().optional(),
      price: z2.number().min(0).optional(),
      sizes: z2.string().optional(),
      colors: z2.string().optional(),
      sizeOptions: z2.string().optional(),
      colorOptions: z2.string().optional(),
      pricingType: z2.enum(["fixed", "per_meter"]).optional(),
      pricePerMeter: z2.number().min(0).optional(),
      category: z2.string().min(1).optional(),
      specifications: z2.string().optional(),
      images: z2.string().optional(),
      isActive: z2.enum(["yes", "no"]).optional(),
      sortOrder: z2.number().optional()
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      const existingProduct = await getProductById(id);
      if (!existingProduct) throw new Error("\u0627\u0644\u0645\u0646\u062A\u062C \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
      const updateData = { ...data };
      if (updateData.price !== void 0) updateData.price = String(updateData.price);
      if (updateData.pricePerMeter !== void 0) updateData.pricePerMeter = String(updateData.pricePerMeter);
      if (updateData.category !== void 0) {
        updateData.category = normalizeCategorySlug(updateData.category);
        if (!await categorySlugExists(updateData.category)) {
          throw new Error("\u064A\u0631\u062C\u0649 \u0627\u062E\u062A\u064A\u0627\u0631 \u0641\u0626\u0629 \u0635\u0627\u0644\u062D\u0629 \u0645\u0646 \u0627\u0644\u0641\u0626\u0627\u062A \u0627\u0644\u0645\u064F\u062F\u0627\u0631\u0629 \u0641\u064A \u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645");
        }
      }
      const effectiveStatus = updateData.isActive ?? existingProduct.isActive;
      const effectiveImages = updateData.images ?? existingProduct.images;
      if (effectiveStatus === "yes" && !hasProductImage(effectiveImages)) {
        throw new Error("\u0623\u0636\u0641 \u0635\u0648\u0631\u0629 \u0648\u0627\u062D\u062F\u0629 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644 \u0642\u0628\u0644 \u0646\u0634\u0631 \u0627\u0644\u0645\u0646\u062A\u062C \u0641\u064A \u0627\u0644\u0645\u062A\u062C\u0631");
      }
      await updateProduct(id, updateData);
      return { success: true };
    }),
    delete: adminProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await deleteProduct(input.id);
      return { success: true };
    })
  }),
  categories: router({
    list: publicProcedure.query(async () => {
      return getAllCategories();
    }),
    active: publicProcedure.query(async () => {
      return getActiveCategories();
    }),
    create: adminProcedure.input(z2.object({
      slug: z2.string().trim().min(2).max(100).regex(/^[a-z0-9-]+$/, "\u0627\u0633\u062A\u062E\u062F\u0645 \u062D\u0631\u0648\u0641\u0627\u064B \u0625\u0646\u062C\u0644\u064A\u0632\u064A\u0629 \u0635\u063A\u064A\u0631\u0629 \u0648\u0623\u0631\u0642\u0627\u0645\u0627\u064B \u0648\u0634\u0631\u0637\u0629 \u0641\u0642\u0637"),
      nameAr: z2.string().trim().min(1).max(120),
      nameEn: z2.string().trim().min(1).max(120),
      descriptionAr: z2.string().optional(),
      descriptionEn: z2.string().optional(),
      isActive: z2.enum(["yes", "no"]).default("yes"),
      sortOrder: z2.number().int().default(0)
    })).mutation(async ({ input }) => {
      await createCategory(input);
      return { success: true };
    }),
    update: adminProcedure.input(z2.object({
      id: z2.number(),
      slug: z2.string().trim().min(2).max(100).regex(/^[a-z0-9-]+$/, "\u0627\u0633\u062A\u062E\u062F\u0645 \u062D\u0631\u0648\u0641\u0627\u064B \u0625\u0646\u062C\u0644\u064A\u0632\u064A\u0629 \u0635\u063A\u064A\u0631\u0629 \u0648\u0623\u0631\u0642\u0627\u0645\u0627\u064B \u0648\u0634\u0631\u0637\u0629 \u0641\u0642\u0637").optional(),
      nameAr: z2.string().trim().min(1).max(120).optional(),
      nameEn: z2.string().trim().min(1).max(120).optional(),
      descriptionAr: z2.string().optional(),
      descriptionEn: z2.string().optional(),
      isActive: z2.enum(["yes", "no"]).optional(),
      sortOrder: z2.number().int().optional()
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateCategory(id, data);
      return { success: true };
    }),
    delete: adminProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await deleteCategory(input.id);
      return { success: true };
    })
  }),
  orders: router({
    create: publicProcedure.input(z2.object({
      customerName: z2.string().min(1, "\u0627\u0644\u0627\u0633\u0645 \u0645\u0637\u0644\u0648\u0628"),
      customerPhone: z2.string().min(5, "\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641 \u0645\u0637\u0644\u0648\u0628"),
      customerEmail: z2.string().trim().email("\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0628\u0631\u064A\u062F \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0635\u062D\u064A\u062D").optional(),
      customerAddress: z2.string().optional(),
      productId: z2.number().optional(),
      productName: z2.string().optional(),
      productPrice: z2.number().optional(),
      selectedSize: z2.string().trim().min(1).max(120).optional(),
      selectedColor: z2.string().trim().min(1).max(120).optional(),
      message: z2.string().optional(),
      orderSource: z2.string().default("web"),
      couponCode: z2.string().optional(),
      orderValue: z2.number().min(0).optional(),
      utmSource: z2.string().optional(),
      utmMedium: z2.string().optional(),
      utmCampaign: z2.string().optional(),
      utmContent: z2.string().optional(),
      utmTerm: z2.string().optional(),
      referrer: z2.string().optional(),
      userAgent: z2.string().optional(),
      referralCode: z2.string().trim().max(32).optional()
    })).mutation(async ({ ctx, input }) => {
      const product = input.productId ? await getProductById(input.productId) : void 0;
      if (input.productId && !product) throw new Error("\u0627\u0644\u0645\u0646\u062A\u062C \u063A\u064A\u0631 \u0645\u062A\u0627\u062D \u062D\u0627\u0644\u064A\u064B\u0627");
      const legacySizes = parseProductOptions(product?.sizes);
      if (!isAvailableOption(legacySizes, input.selectedSize) && !isOptionAvailable(product?.sizes, product?.sizeOptions, "labelAr", input.selectedSize) && !isOptionAvailable(product?.sizes, product?.sizeOptions, "labelEn", input.selectedSize)) {
        throw new Error("\u064A\u0631\u062C\u0649 \u0627\u062E\u062A\u064A\u0627\u0631 \u0645\u0642\u0627\u0633 \u0645\u062A\u0627\u062D \u0644\u0644\u0645\u0646\u062A\u062C");
      }
      const legacyColors = parseProductOptions(product?.colors);
      if (!isAvailableOption(legacyColors, input.selectedColor) && !isOptionAvailable(product?.colors, product?.colorOptions, "labelAr", input.selectedColor) && !isOptionAvailable(product?.colors, product?.colorOptions, "labelEn", input.selectedColor)) {
        throw new Error("\u064A\u0631\u062C\u0649 \u0627\u062E\u062A\u064A\u0627\u0631 \u0644\u0648\u0646 \u0645\u062A\u0627\u062D \u0644\u0644\u0645\u0646\u062A\u062C");
      }
      let couponApplied = {
        valid: false,
        reason: "",
        discount: 0
      };
      if (input.couponCode && input.couponCode.trim()) {
        const now = /* @__PURE__ */ new Date();
        const coupon = await getCouponByCode(input.couponCode.trim());
        const invalidReason = !coupon ? "\u0631\u0645\u0632 \u0627\u0644\u0643\u0648\u0628\u0648\u0646 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D" : coupon.isActive !== "yes" ? "\u0647\u0630\u0627 \u0627\u0644\u0643\u0648\u0628\u0648\u0646 \u0645\u062A\u0648\u0642\u0641 \u0639\u0646 \u0627\u0644\u0639\u0645\u0644" : coupon.startsAt && coupon.startsAt > now ? "\u0647\u0630\u0627 \u0627\u0644\u0643\u0648\u0628\u0648\u0646 \u0644\u0645 \u064A\u0628\u062F\u0623 \u0628\u0639\u062F" : coupon.expiresAt && coupon.expiresAt < now ? "\u0627\u0646\u062A\u0647\u062A \u0635\u0644\u0627\u062D\u064A\u0629 \u0647\u0630\u0627 \u0627\u0644\u0643\u0648\u0628\u0648\u0646" : coupon.maxUsage !== null && coupon.usedCount >= coupon.maxUsage ? "\u062A\u0645 \u0627\u0633\u062A\u0646\u0641\u0627\u062F \u0627\u0633\u062A\u062E\u062F\u0627\u0645\u0627\u062A \u0647\u0630\u0627 \u0627\u0644\u0643\u0648\u0628\u0648\u0646" : input.orderValue && input.orderValue < Number(coupon.minOrderValue) ? `\u0627\u0644\u062D\u062F \u0627\u0644\u0623\u062F\u0646\u0649 \u0644\u0644\u0637\u0644\u0628 ${Number(coupon.minOrderValue)} \u062C\u0646\u064A\u0647` : null;
        if (invalidReason) throw new Error(invalidReason);
        const orderValue = input.orderValue ?? input.productPrice ?? 0;
        const discount = coupon.discountType === "percent" ? Math.min(orderValue, Math.round(orderValue * Number(coupon.discountValue) / 100)) : Math.min(orderValue, Number(coupon.discountValue));
        couponApplied = { valid: true, reason: "", discount };
        await incrementCouponUsage(input.couponCode.trim());
      }
      let appliedReferralCode;
      if (input.referralCode && input.referralCode.trim()) {
        const normalizedRef = input.referralCode.trim().toUpperCase();
        const referrer = await getReferralByCode(normalizedRef);
        if (referrer) {
          const selfReferral = ctx.user && referrer.userId === ctx.user.id;
          if (!selfReferral) {
            appliedReferralCode = normalizedRef;
          }
        }
      }
      const { referralCode: _referralCode, ...restInput } = input;
      const orderResult = await createOrder({
        ...restInput,
        productName: product?.nameAr ?? input.productName,
        productPrice: product ? String(product.price) : input.productPrice ? String(input.productPrice) : void 0,
        userId: ctx.user?.id,
        couponCode: couponApplied.valid ? input.couponCode?.trim().toUpperCase() : void 0,
        discountType: couponApplied.valid ? couponApplied.discount > 0 ? "percent" : "none" : void 0,
        discountValue: couponApplied.valid ? String(couponApplied.discount) : void 0,
        referralCodeUsed: appliedReferralCode,
        totalAfterDiscount: couponApplied.valid ? String(Math.max(0, (input.orderValue ?? input.productPrice ?? 0) - couponApplied.discount)) : void 0
      });
      let notificationSent = false;
      try {
        const orderDetails = [
          `\u0627\u0644\u0639\u0645\u064A\u0644: ${input.customerName}`,
          `\u0627\u0644\u0647\u0627\u062A\u0641: ${input.customerPhone}`,
          input.customerAddress ? `\u0627\u0644\u0639\u0646\u0648\u0627\u0646: ${input.customerAddress}` : "",
          input.productName ? `\u0627\u0644\u0645\u0646\u062A\u062C: ${input.productName}` : "",
          input.productPrice ? `\u0627\u0644\u0633\u0639\u0631: ${input.productPrice} \u062C.\u0645` : "",
          input.message ? `\u0631\u0633\u0627\u0644\u0629: ${input.message}` : "",
          input.utmSource ? `\u0645\u0635\u062F\u0631 \u0627\u0644\u0625\u0639\u0644\u0627\u0646: ${input.utmSource}` : ""
        ].filter(Boolean).join("\n");
        await notifyOwner({
          title: "\u0637\u0644\u0628 \u062C\u062F\u064A\u062F - Elnour for STEEL",
          content: orderDetails
        });
        notificationSent = true;
      } catch (e) {
        console.warn("Failed to send notification:", e);
      }
      if (orderResult[0]) {
        const orderId = typeof orderResult[0].insertId === "number" ? orderResult[0].insertId : void 0;
        if (orderId) {
          await updateOrderNotificationStatus(orderId, notificationSent);
          const createdOrder = await getOrderById(orderId);
          if (createdOrder) {
            try {
              await createOrderInAppNotification(createdOrder, "status_changed");
            } catch (error) {
              console.warn("[Order notifications] Failed to create in-app notification after order creation", error);
            }
            void notifyOrderCustomer(createdOrder, "status_changed", { includeInApp: false }).catch((error) => {
              console.warn("[Order notifications] Failed after order creation", error);
            });
          }
        }
      }
      return { success: true, notificationSent };
    }),
    /**
     * Multi-item cart checkout. Each item is validated against the live
     * product configuration (sizeOptions / colorOptions / legacy fields).
     * Coupons are applied to the cart subtotal exactly like single orders.
     * Returns one order record whose productName is a human-readable summary
     * so existing admin flows (list, stats, WhatsApp notifications) keep working.
     */
    createCart: publicProcedure.input(z2.object({
      customerName: z2.string().min(1, "\u0627\u0644\u0627\u0633\u0645 \u0645\u0637\u0644\u0648\u0628"),
      customerPhone: z2.string().min(5, "\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641 \u0645\u0637\u0644\u0648\u0628"),
      customerEmail: z2.string().trim().email("\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0628\u0631\u064A\u062F \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0635\u062D\u064A\u062D").optional(),
      customerAddress: z2.string().optional(),
      items: z2.array(z2.object({
        productId: z2.number(),
        selectedSize: z2.string().trim().min(1).max(120).optional(),
        selectedColor: z2.string().trim().min(1).max(120).optional(),
        quantity: z2.number().int().min(1).max(99)
      })).min(1, "\u0627\u0644\u0633\u0644\u0629 \u0641\u0627\u0631\u063A\u0629").max(50),
      message: z2.string().optional(),
      orderSource: z2.string().default("web"),
      couponCode: z2.string().optional(),
      orderValue: z2.number().min(0).optional(),
      utmSource: z2.string().optional(),
      utmMedium: z2.string().optional(),
      utmCampaign: z2.string().optional(),
      utmContent: z2.string().optional(),
      utmTerm: z2.string().optional(),
      referrer: z2.string().optional(),
      userAgent: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      const items = await Promise.all(
        input.items.map(async (item, index) => {
          const product = await getProductById(item.productId);
          if (!product) throw new Error(`\u0627\u0644\u0645\u0646\u062A\u062C \u0631\u0642\u0645 ${item.productId} \u063A\u064A\u0631 \u0645\u062A\u0627\u062D \u062D\u0627\u0644\u064A\u064B\u0627`);
          if (product.isActive !== "yes") throw new Error(`\u0627\u0644\u0645\u0646\u062A\u062C \xAB${product.nameAr}\xBB \u0644\u0645 \u064A\u0639\u062F \u0645\u062A\u0627\u062D\u064B\u0627`);
          const hasJsonSizes = Boolean(product.sizeOptions && product.sizeOptions.trim());
          const legacySizes = parseProductOptions(product.sizes);
          if ((hasJsonSizes || legacySizes.length) && !item.selectedSize) {
            throw new Error(`\u064A\u0631\u062C\u0649 \u0627\u062E\u062A\u064A\u0627\u0631 \u0645\u0642\u0627\u0633 \u0644\u0644\u0645\u0646\u062A\u062C \xAB${product.nameAr}\xBB`);
          }
          const legacyColors = parseProductOptions(product.colors);
          const hasJsonColors = Boolean(product.colorOptions && product.colorOptions.trim());
          if ((hasJsonColors || legacyColors.length) && !item.selectedColor) {
            throw new Error(`\u064A\u0631\u062C\u0649 \u0627\u062E\u062A\u064A\u0627\u0631 \u0644\u0648\u0646 \u0644\u0644\u0645\u0646\u062A\u062C \xAB${product.nameAr}\xBB`);
          }
          if (!isAvailableOption(legacySizes, item.selectedSize) && !isOptionAvailable(product.sizes, product.sizeOptions, "labelAr", item.selectedSize) && !isOptionAvailable(product.sizes, product.sizeOptions, "labelEn", item.selectedSize)) {
            throw new Error(`\u0627\u0644\u0645\u0642\u0627\u0633 \u0627\u0644\u0645\u062E\u062A\u0627\u0631 \u063A\u064A\u0631 \u0645\u062A\u0627\u062D \u0644\u0644\u0645\u0646\u062A\u062C \xAB${product.nameAr}\xBB`);
          }
          if (!isAvailableOption(legacyColors, item.selectedColor) && !isOptionAvailable(product.colors, product.colorOptions, "labelAr", item.selectedColor) && !isOptionAvailable(product.colors, product.colorOptions, "labelEn", item.selectedColor)) {
            throw new Error(`\u0627\u0644\u0644\u0648\u0646 \u0627\u0644\u0645\u062E\u062A\u0627\u0631 \u063A\u064A\u0631 \u0645\u062A\u0627\u062D \u0644\u0644\u0645\u0646\u062A\u062C \xAB${product.nameAr}\xBB`);
          }
          const unitPrice = computeCartItemPrice(product, item.selectedSize, item.selectedColor);
          const lineTotal = Math.round(unitPrice * item.quantity * 100) / 100;
          return {
            product,
            selectedSize: item.selectedSize,
            selectedColor: item.selectedColor,
            quantity: item.quantity,
            unitPrice,
            lineTotal
          };
        })
      );
      const subtotal = Math.round(items.reduce((sum, i) => sum + i.lineTotal, 0) * 100) / 100;
      let couponApplied = { valid: false, discount: 0 };
      if (input.couponCode && input.couponCode.trim()) {
        const now = /* @__PURE__ */ new Date();
        const coupon = await getCouponByCode(input.couponCode.trim());
        const invalidReason = !coupon ? couponReasons.invalidCode : coupon.isActive !== "yes" ? couponReasons.inactive : coupon.startsAt && coupon.startsAt > now ? couponReasons.notStarted : coupon.expiresAt && coupon.expiresAt < now ? couponReasons.expired : coupon.maxUsage !== null && coupon.usedCount >= coupon.maxUsage ? couponReasons.exhausted : subtotal < Number(coupon.minOrderValue) ? `${couponReasons.belowMinimum} ${Number(coupon.minOrderValue)} \u062C\u0646\u064A\u0647` : null;
        if (invalidReason) throw new Error(invalidReason);
        const discount = coupon.discountType === "percent" ? Math.min(subtotal, Math.round(subtotal * Number(coupon.discountValue) / 100)) : Math.min(subtotal, Number(coupon.discountValue));
        couponApplied = { valid: true, discount };
        await incrementCouponUsage(input.couponCode.trim());
      }
      const itemSummary = items.map(
        (i) => `\xAB${i.product.nameAr}\xBB${i.selectedSize ? ` (${i.selectedSize})` : ""}${i.selectedColor ? ` \u2014 ${i.selectedColor}` : ""} \xD7 ${i.quantity}`
      );
      const beforeDiscount = items.reduce((sum, i) => sum + i.lineTotal, 0);
      const orderResult = await createOrder({
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerEmail: input.customerEmail,
        customerAddress: input.customerAddress || void 0,
        productId: items[0].product.id,
        productName: itemSummary.join(" | "),
        productPrice: String(Math.max(0, beforeDiscount - couponApplied.discount)),
        selectedSize: itemSummary.join(" | ").slice(0, 120),
        selectedColor: void 0,
        message: [input.message || ""].filter(Boolean).join(" ") || void 0,
        orderSource: input.orderSource,
        couponCode: couponApplied.valid ? input.couponCode?.trim().toUpperCase() : void 0,
        discountType: couponApplied.valid ? couponApplied.discount > 0 ? "percent" : "none" : void 0,
        discountValue: couponApplied.valid ? String(couponApplied.discount) : void 0,
        totalAfterDiscount: couponApplied.valid ? String(Math.max(0, subtotal - couponApplied.discount)) : void 0,
        userId: ctx.user?.id,
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
        utmCampaign: input.utmCampaign,
        utmContent: input.utmContent,
        utmTerm: input.utmTerm,
        referrer: input.referrer,
        userAgent: input.userAgent
      });
      let notificationSent = false;
      try {
        const orderDetails = [
          `\u0637\u0644\u0628 \u0633\u0644\u0629 \u0645\u0634\u062A\u0631\u064A\u0627\u062A \u2014 ${items.length} \u0635\u0646\u0641`,
          `\u0627\u0644\u0639\u0645\u064A\u0644: ${input.customerName}`,
          `\u0627\u0644\u0647\u0627\u062A\u0641: ${input.customerPhone}`,
          input.customerAddress ? `\u0627\u0644\u0639\u0646\u0648\u0627\u0646: ${input.customerAddress}` : "",
          ...items.map((i) => `\u2022 ${i.product.nameAr} | ${i.selectedSize || "\u2014"} | ${i.selectedColor || "\u2014"} | \xD7${i.quantity} | ${i.lineTotal} \u062C.\u0645`),
          `\u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A: ${subtotal} \u062C.\u0645` + (couponApplied.valid ? ` (\u062E\u0635\u0645 ${couponApplied.discount} \u062C.\u0645)` : ""),
          input.utmSource ? `\u0645\u0635\u062F\u0631 \u0627\u0644\u0625\u0639\u0644\u0627\u0646: ${input.utmSource}` : ""
        ].filter(Boolean).join("\n");
        await notifyOwner({
          title: "\u0637\u0644\u0628 \u0633\u0644\u0629 \u062C\u062F\u064A\u062F - Elnour for STEEL",
          content: orderDetails
        });
        notificationSent = true;
      } catch (e) {
        console.warn("Failed to send notification:", e);
      }
      if (orderResult[0]) {
        const orderId = typeof orderResult[0].insertId === "number" ? orderResult[0].insertId : void 0;
        if (orderId) {
          await updateOrderNotificationStatus(orderId, notificationSent);
          const createdOrder = await getOrderById(orderId);
          if (createdOrder) {
            try {
              await createOrderInAppNotification(createdOrder, "status_changed");
            } catch (error) {
              console.warn("[Order notifications] Failed to create in-app notification after cart order creation", error);
            }
            void notifyOrderCustomer(createdOrder, "status_changed", { includeInApp: false }).catch((error) => {
              console.warn("[Order notifications] Failed after cart order creation", error);
            });
          }
        }
      }
      return { success: true, notificationSent, orderId: typeof orderResult[0]?.insertId === "number" ? orderResult[0].insertId : void 0, subtotal, discount: couponApplied.discount };
    }),
    list: adminProcedure.query(async () => {
      return getOrders();
    }),
    byId: adminProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      return getOrderById(input.id);
    }),
    updateStatus: adminProcedure.input(z2.object({
      id: z2.number(),
      status: z2.enum(["new", "contacted", "confirmed", "shipped", "delivered", "cancelled"]),
      notes: z2.string().optional()
    })).mutation(async ({ input }) => {
      const previousOrder = await getOrderById(input.id);
      if (!previousOrder) throw new Error("\u0627\u0644\u0637\u0644\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
      if (previousOrder.status === input.status) return { success: true };
      await updateOrderStatus(input.id, input.status, input.notes);
      const updatedOrder = await getOrderById(input.id);
      if (updatedOrder) {
        try {
          await createOrderInAppNotification(updatedOrder, "status_changed");
        } catch (error) {
          console.warn("[Order notifications] Failed to create in-app notification after status update", error);
        }
        void notifyOrderCustomer(updatedOrder, "status_changed", { includeInApp: false }).catch((error) => {
          console.warn("[Order notifications] Failed after status update", error);
        });
      }
      return { success: true };
    }),
    stats: adminProcedure.query(async () => {
      const orderStats = await getOrderStats();
      const pageviewStats = await getPageviewStats();
      return {
        ...orderStats,
        pageviews: pageviewStats.total,
        uniqueVisitors: pageviewStats.unique,
        todayVisitors: pageviewStats.today,
        conversionRate: pageviewStats.unique > 0 ? orderStats.total / pageviewStats.unique * 100 : 0,
        visitorBasedConversion: pageviewStats.unique > 0 ? orderStats.total / pageviewStats.unique * 100 : 0
      };
    }),
    newCount: adminProcedure.query(async () => {
      return getNewOrdersCount();
    })
  }),
  reviews: router({
    create: protectedProcedure.input(z2.object({
      productId: z2.number().int().positive(),
      rating: z2.number().int().min(1).max(5),
      comment: z2.string().trim().max(1e3).optional()
    })).mutation(async ({ ctx, input }) => {
      const userOrders = await getOrdersByUserId(ctx.user.id);
      const bought = userOrders.some(
        (order) => order.productId === input.productId && order.status !== "cancelled"
      );
      if (!bought) {
        throw new Error("\u064A\u0645\u0643\u0646\u0643 \u062A\u0642\u064A\u064A\u0645 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0627\u0644\u062A\u064A \u0627\u0634\u062A\u0631\u064A\u062A\u0647\u0627 \u0645\u0646 \u0627\u0644\u0645\u062A\u062C\u0631 \u0641\u0642\u0637");
      }
      const existing = await getReviewByUserAndProduct(ctx.user.id, input.productId);
      if (existing) {
        throw new Error("\u0644\u0642\u062F \u0642\u0645\u062A \u0628\u062A\u0642\u064A\u064A\u0645 \u0647\u0630\u0627 \u0627\u0644\u0645\u0646\u062A\u062C \u0645\u0646 \u0642\u0628\u0644");
      }
      await createProductReview({
        userId: ctx.user.id,
        productId: input.productId,
        rating: input.rating,
        comment: input.comment || null,
        userName: ctx.user.name || null
      });
      return { success: true };
    }),
    forProduct: publicProcedure.input(z2.object({ productId: z2.number().int().positive() })).query(async ({ input }) => {
      const [stats, reviews] = await Promise.all([
        getProductReviewStats(input.productId),
        getProductReviewsByProductId(input.productId)
      ]);
      return { stats, reviews };
    }),
    my: protectedProcedure.query(async ({ ctx }) => {
      const userOrders = await getOrdersByUserId(ctx.user.id);
      const productIds = Array.from(
        new Set(
          userOrders.filter((order) => order.status !== "cancelled" && order.productId).map((order) => order.productId)
        )
      );
      const eligible = await getActiveProductsByIds ? await getActiveProductsByIds(productIds) : (await getActiveProducts()).filter((product) => productIds.includes(product.id));
      const reviews = await Promise.all(
        eligible.map(
          (product) => getReviewByUserAndProduct(ctx.user.id, product.id).then((review) => ({
            product,
            review
          }))
        )
      );
      return reviews;
    }),
    adminList: adminProcedure.query(async () => {
      const [reviews, users2, products2] = await Promise.all([
        getAllProductReviews(),
        getAllUsers(),
        getAllProducts()
      ]);
      return { reviews, users: users2, products: products2 };
    }),
    adminDelete: adminProcedure.input(z2.object({ id: z2.number().int().positive() })).mutation(async ({ input }) => {
      await deleteProductReview(input.id);
      return { success: true };
    })
  }),
  pageviews: router({
    track: publicProcedure.input(z2.object({
      sessionId: z2.string().optional(),
      path: z2.string().optional().default("/"),
      referrer: z2.string().optional(),
      userAgent: z2.string().optional(),
      utmSource: z2.string().optional(),
      utmMedium: z2.string().optional(),
      utmCampaign: z2.string().optional()
    })).mutation(async ({ input }) => {
      await trackPageview(input);
      return { success: true };
    })
  }),
  gallery: router({
    list: publicProcedure.query(async () => {
      return getGalleryItems();
    }),
    create: adminProcedure.input(z2.object({
      title: z2.string().min(1),
      imageUrl: z2.string().min(1),
      category: z2.string().default("\u0623\u0639\u0645\u0627\u0644 \u0645\u0646\u062C\u0632\u0629"),
      sortOrder: z2.number().default(0)
    })).mutation(async ({ input }) => {
      await createGalleryItem(input);
      return { success: true };
    }),
    delete: adminProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await deleteGalleryItem(input.id);
      return { success: true };
    })
  }),
  coupons: router({
    list: adminProcedure.query(async () => {
      return getAllCoupons();
    }),
    create: adminProcedure.input(z2.object({
      code: z2.string().trim().min(2).max(50).regex(/^[A-Za-z0-9-]+$/, "\u0627\u0633\u062A\u062E\u062F\u0645 \u062D\u0631\u0648\u0641\u0627\u064B \u0625\u0646\u062C\u0644\u064A\u0632\u064A\u0629 \u0648\u0623\u0631\u0642\u0627\u0645\u0627\u064B \u0648\u0634\u0631\u0637\u0629 \u0641\u0642\u0637"),
      description: z2.string().optional(),
      discountType: z2.enum(["percent", "fixed"]),
      discountValue: z2.number().min(0),
      minOrderValue: z2.number().min(0).default(0),
      maxUsage: z2.number().int().min(1).optional(),
      isActive: z2.enum(["yes", "no"]).default("yes"),
      startsAt: z2.date().optional(),
      expiresAt: z2.date().optional()
    })).mutation(async ({ input }) => {
      if (input.discountType === "percent" && input.discountValue > 100) {
        throw new Error("\u0627\u0644\u062E\u0635\u0645 \u0627\u0644\u0645\u0626\u0648\u064A \u0644\u0627 \u064A\u062A\u062C\u0627\u0648\u0632 100%");
      }
      if (input.expiresAt && input.startsAt && input.expiresAt < input.startsAt) {
        throw new Error("\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0646\u0647\u0627\u064A\u0629 \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0628\u0639\u062F \u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0628\u062F\u0627\u064A\u0629");
      }
      const existing = await getCouponByCode(input.code);
      if (existing) throw new Error("\u0631\u0645\u0632 \u0627\u0644\u0643\u0648\u0628\u0648\u0646 \u0645\u0633\u062A\u062E\u062F\u0645 \u0628\u0627\u0644\u0641\u0639\u0644\u060C \u0627\u062E\u062A\u0631 \u0631\u0645\u0632\u0627\u064B \u0645\u062E\u062A\u0644\u0641\u0627\u064B");
      await createCoupon({
        ...input,
        code: input.code.toUpperCase(),
        discountValue: String(input.discountValue),
        minOrderValue: String(input.minOrderValue)
      });
      return { success: true };
    }),
    update: adminProcedure.input(z2.object({
      id: z2.number(),
      description: z2.string().optional(),
      discountType: z2.enum(["percent", "fixed"]).optional(),
      discountValue: z2.number().min(0).optional(),
      minOrderValue: z2.number().min(0).optional(),
      maxUsage: z2.number().int().min(1).optional(),
      isActive: z2.enum(["yes", "no"]).optional(),
      startsAt: z2.date().optional(),
      expiresAt: z2.date().optional()
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      const updateData = { ...data };
      if (updateData.discountValue !== void 0) updateData.discountValue = String(updateData.discountValue);
      if (updateData.minOrderValue !== void 0) updateData.minOrderValue = String(updateData.minOrderValue);
      await updateCoupon(id, updateData);
      return { success: true };
    }),
    toggle: adminProcedure.input(z2.object({ id: z2.number(), isActive: z2.enum(["yes", "no"]) })).mutation(async ({ input }) => {
      await updateCoupon(input.id, { isActive: input.isActive });
      return { success: true };
    }),
    delete: adminProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await deleteCoupon(input.id);
      return { success: true };
    }),
    /**
     * Public active offers — coupons that are enabled and currently within their
     * validity window, shown on /offers so customers can copy redeemable codes.
     */
    getOffers: publicProcedure.query(async () => {
      const now = /* @__PURE__ */ new Date();
      const coupons2 = await getAllCoupons();
      return coupons2.filter((c) => {
        if (c.isActive !== "yes") return false;
        if (c.startsAt && c.startsAt > now) return false;
        if (c.expiresAt && c.expiresAt < now) return false;
        if (c.maxUsage !== null && c.usedCount >= c.maxUsage) return false;
        return true;
      }).map((c) => ({
        code: c.code,
        discountType: c.discountType,
        discountValue: Number(c.discountValue),
        minOrderValue: Number(c.minOrderValue ?? 0),
        expiresAt: c.expiresAt ? c.expiresAt.getTime() : null,
        startsAt: c.startsAt ? c.startsAt.getTime() : null,
        note: c.description ?? ""
      }));
    }),
    validate: publicProcedure.input(z2.object({ code: z2.string().min(1), orderValue: z2.number().min(0) })).mutation(async ({ input }) => {
      const now = /* @__PURE__ */ new Date();
      const coupon = await getCouponByCode(input.code);
      if (!coupon) return { valid: false, reason: "\u0631\u0645\u0632 \u0627\u0644\u0643\u0648\u0628\u0648\u0646 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D", discount: 0 };
      if (coupon.isActive !== "yes") return { valid: false, reason: "\u0647\u0630\u0627 \u0627\u0644\u0643\u0648\u0628\u0648\u0646 \u0645\u062A\u0648\u0642\u0641 \u0639\u0646 \u0627\u0644\u0639\u0645\u0644", discount: 0 };
      if (coupon.startsAt && coupon.startsAt > now) return { valid: false, reason: "\u0647\u0630\u0627 \u0627\u0644\u0643\u0648\u0628\u0648\u0646 \u0644\u0645 \u064A\u0628\u062F\u0623 \u0628\u0639\u062F", discount: 0 };
      if (coupon.expiresAt && coupon.expiresAt < now) return { valid: false, reason: "\u0627\u0646\u062A\u0647\u062A \u0635\u0644\u0627\u062D\u064A\u0629 \u0647\u0630\u0627 \u0627\u0644\u0643\u0648\u0628\u0648\u0646", discount: 0 };
      if (coupon.maxUsage !== null && coupon.usedCount >= coupon.maxUsage) return { valid: false, reason: "\u062A\u0645 \u0627\u0633\u062A\u0646\u0641\u0627\u062F \u0627\u0633\u062A\u062E\u062F\u0627\u0645\u0627\u062A \u0647\u0630\u0627 \u0627\u0644\u0643\u0648\u0628\u0648\u0646", discount: 0 };
      if (input.orderValue < Number(coupon.minOrderValue)) return { valid: false, reason: `\u0627\u0644\u062D\u062F \u0627\u0644\u0623\u062F\u0646\u0649 \u0644\u0644\u0637\u0644\u0628 ${Number(coupon.minOrderValue)} \u062C\u0646\u064A\u0647`, discount: 0 };
      const discount = coupon.discountType === "percent" ? Math.min(input.orderValue, Math.round(input.orderValue * Number(coupon.discountValue) / 100)) : Math.min(input.orderValue, Number(coupon.discountValue));
      return { valid: true, reason: "", discount };
    })
  }),
  account: router({
    me: protectedProcedure.query(async ({ ctx }) => {
      return { id: ctx.user.id, name: ctx.user.name, email: ctx.user.email, phone: ctx.user.phone, address: ctx.user.address };
    }),
    orders: protectedProcedure.query(async ({ ctx }) => {
      return getOrdersByUserId(ctx.user.id);
    }),
    notifications: protectedProcedure.query(async ({ ctx }) => {
      return getOrderNotificationsByUserId(ctx.user.id);
    }),
    orderDetails: protectedProcedure.input(z2.object({ id: z2.number().int().positive() })).query(async ({ ctx, input }) => {
      const details = await getOrderDetailsByUserId(input.id, ctx.user.id);
      if (!details) {
        throw new Error("\u0627\u0644\u0637\u0644\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0623\u0648 \u0644\u0627 \u062A\u0645\u0644\u0643 \u0635\u0644\u0627\u062D\u064A\u0629 \u0627\u0644\u0627\u0637\u0644\u0627\u0639 \u0639\u0644\u064A\u0647");
      }
      return details;
    }),
    updateProfile: protectedProcedure.input(z2.object({
      name: z2.string().min(1).optional(),
      phone: z2.string().min(5).optional(),
      address: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      await updateUserProfile(ctx.user.id, input);
      return { success: true };
    }),
    cancelOrder: protectedProcedure.input(z2.object({ id: z2.number().int().positive(), reason: z2.string().trim().max(500).optional() })).mutation(async ({ ctx, input }) => {
      const details = await getOrderDetailsByUserId(input.id, ctx.user.id);
      if (!details) throw new Error("\u0627\u0644\u0637\u0644\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0623\u0648 \u0644\u0627 \u062A\u0645\u0644\u0643 \u0635\u0644\u0627\u062D\u064A\u0629 \u0625\u0644\u063A\u0627\u0626\u0647");
      if (!["new", "contacted", "confirmed"].includes(details.order.status)) {
        throw new Error("\u0644\u0627 \u064A\u0645\u0643\u0646 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0637\u0644\u0628 \u0628\u0639\u062F \u0628\u062F\u0621 \u0627\u0644\u0634\u062D\u0646 \u0623\u0648 \u0627\u0644\u062A\u0633\u0644\u064A\u0645");
      }
      const cancelled = await cancelOrderByCustomer(input.id, ctx.user.id, input.reason);
      if (!cancelled) throw new Error("\u062A\u0639\u0630\u0631 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0637\u0644\u0628. \u064A\u0631\u062C\u0649 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0635\u0641\u062D\u0629 \u0648\u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649");
      const cancelledOrder = await getOrderById(input.id);
      if (cancelledOrder) {
        try {
          await createOrderInAppNotification(cancelledOrder, "customer_cancelled");
        } catch (error) {
          console.warn("[Order notifications] Failed to create in-app notification after customer cancellation", error);
        }
        void notifyOrderCustomer(cancelledOrder, "customer_cancelled", { includeInApp: false }).catch((error) => {
          console.warn("[Order notifications] Failed after customer cancellation", error);
        });
      }
      return { success: true };
    })
  }),
  siteContent: router({
    list: publicProcedure.query(async () => {
      return getSiteContent();
    }),
    update: adminProcedure.input(z2.object({
      sectionKey: z2.string().min(1),
      titleAr: z2.string().optional(),
      titleEn: z2.string().optional(),
      contentAr: z2.string().optional(),
      contentEn: z2.string().optional(),
      subtitleAr: z2.string().optional(),
      subtitleEn: z2.string().optional()
    })).mutation(async ({ input }) => {
      const { sectionKey, ...data } = input;
      await updateSiteContent(sectionKey, data);
      return { success: true };
    })
  }),
  contactInfo: router({
    get: publicProcedure.query(async () => {
      const row = await getSiteContentByKey("contact");
      if (!row) {
        return { facebookUrl: "", instagramUrl: "", telegramUrl: "", whatsappNumber: "", whatsAppMessage: "", phone: "" };
      }
      return {
        facebookUrl: row.titleAr ?? "",
        instagramUrl: row.titleEn ?? "",
        telegramUrl: row.contentAr ?? "",
        whatsappNumber: row.contentEn ?? "",
        whatsAppMessage: row.subtitleAr ?? "",
        phone: row.subtitleEn ?? ""
      };
    }),
    update: adminProcedure.input(z2.object({
      facebookUrl: z2.string().optional(),
      instagramUrl: z2.string().optional(),
      telegramUrl: z2.string().optional(),
      whatsappNumber: z2.string().optional(),
      whatsAppMessage: z2.string().optional(),
      phone: z2.string().optional()
    })).mutation(async ({ input }) => {
      if (input.facebookUrl !== void 0 && !/^https:\/\/.+/i.test(input.facebookUrl)) {
        throw new Error("\u0623\u062F\u062E\u0644 \u0631\u0627\u0628\u0637 \u0641\u064A\u0633\u0628\u0648\u0643 \u0635\u062D\u064A\u062D\u0627\u064B \u064A\u0628\u062F\u0623 \u0628\u0640 https");
      }
      await updateSiteContent("contact", {
        titleAr: input.facebookUrl ?? null,
        titleEn: input.instagramUrl ?? null,
        contentAr: input.telegramUrl ?? null,
        contentEn: input.whatsappNumber ?? null,
        subtitleAr: input.whatsAppMessage ?? null,
        subtitleEn: input.phone ?? null
      });
      return { success: true };
    })
  }),
  mediaLibrary: router({
    productImages: publicProcedure.query(async () => {
      const allProducts = await getAllProducts();
      return allProducts.flatMap(
        (product) => parseProductImages(product.images).map((url) => ({
          url,
          productId: product.id,
          productNameAr: product.nameAr,
          productName: product.name
        }))
      );
    }),
    galleryImages: publicProcedure.query(async () => {
      const items = await getGalleryItems();
      return items.map((item) => ({ url: item.imageUrl, galleryId: item.id, title: item.title }));
    }),
    removeProductImage: adminProcedure.input(z2.object({ productId: z2.number(), url: z2.string().min(1) })).mutation(async ({ input }) => {
      const product = await getProductById(input.productId);
      if (!product) throw new Error("\u0627\u0644\u0645\u0646\u062A\u062C \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
      const remaining = parseProductImages(product.images).filter((u) => u !== input.url);
      await updateProduct(input.productId, { images: serializeProductImages(remaining) });
      return { success: true, remainingCount: remaining.length };
    }),
    removeGalleryImage: adminProcedure.input(z2.object({ galleryId: z2.number() })).mutation(async ({ input }) => {
      await deleteGalleryItem(input.galleryId);
      return { success: true };
    })
  }),
  upload: router({
    uploadImage: adminProcedure.input(z2.object({
      filename: z2.string().min(1),
      base64: z2.string().min(1),
      contentType: z2.string().default("image/jpeg")
    })).mutation(async ({ input }) => {
      const { storagePut: storagePut2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
      const key = `uploads/${Date.now()}_${input.filename}`;
      const base64Data = input.base64.replace(/^data:[^;]+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const result = await storagePut2(key, buffer, input.contentType);
      return { key: result.key, url: result.url };
    })
  }),
  /**
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
    setup: adminProcedure.input(
      z2.object({
        phone: z2.string().min(1),
        password: z2.string().min(8),
        displayName: z2.string().min(1)
      })
    ).mutation(async ({ input }) => {
      const normalized = normalizePhone(input.phone);
      const expected = normalized === normalizePhone("01118182424") ? process.env.ADMIN_PHONE_1_PASSWORD : normalized === normalizePhone("01121748885") ? process.env.ADMIN_PHONE_2_PASSWORD : void 0;
      if (!expected || expected !== input.password) {
        throw new Error(
          "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0644\u0627 \u062A\u062A\u0637\u0627\u0628\u0642 \u0645\u0639 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u0645\u0633\u062C\u0644\u0629 \u0644\u0647\u0630\u0627 \u0627\u0644\u0631\u0642\u0645 \u0641\u064A \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u0648\u0642\u0639"
        );
      }
      const hash = await bcrypt.hash(input.password, 10);
      await upsertAdminCredential({
        phone: input.phone,
        passwordHash: hash,
        displayName: input.displayName
      });
      return { success: true, phone: normalized };
    }),
    /** Public login: phone + password → signed admin session cookie. */
    login: publicProcedure.input(
      z2.object({
        phone: z2.string().min(1),
        password: z2.string().min(1),
        rememberMe: z2.boolean().optional()
      })
    ).mutation(async ({ input, ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      const ip = ctx.req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || ctx.req.ip || "";
      const normalized = normalizePhone(input.phone);
      const rateLimit = 5;
      const recentFailures = await countRecentFailedAdminAttempts(
        ip,
        15 * 60 * 1e3
      );
      if (recentFailures >= rateLimit) {
        await recordFailedAdminLogin(ip, normalized);
        throw new Error(
          "\u0639\u062F\u062F \u0645\u062D\u0627\u0648\u0644\u0627\u062A \u0627\u0644\u062F\u062E\u0648\u0644 \u0627\u0644\u062E\u0627\u0637\u0626\u0629 \u0643\u0628\u064A\u0631\u060C \u0627\u0646\u062A\u0638\u0631 15 \u062F\u0642\u064A\u0642\u0629 \u062B\u0645 \u062D\u0627\u0648\u0644 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649"
        );
      }
      const credential = await getAdminCredentialByPhone(normalized);
      if (!credential || credential.isActive !== "yes") {
        await recordFailedAdminLogin(ip, normalized);
        throw new Error("\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641 \u0623\u0648 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629");
      }
      const match = await bcrypt.compare(input.password, credential.passwordHash);
      if (!match) {
        await recordFailedAdminLogin(ip, normalized);
        throw new Error("\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641 \u0623\u0648 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629");
      }
      const jti = crypto.randomUUID();
      const rememberMe = Boolean(input.rememberMe);
      const days = rememberMe ? 30 : 7;
      const sessionExpiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1e3);
      const sessionPayload = {
        openId: `admin-${normalized}`,
        appId: ENV.appId,
        name: credential.displayName || normalized,
        jti
      };
      const secretKey = new TextEncoder().encode(ENV.cookieSecret);
      const token = await new SignJWT(sessionPayload).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(Math.floor(sessionExpiresAt.getTime() / 1e3)).sign(secretKey);
      await createAdminSession({
        adminPhone: normalized,
        jti,
        userAgent: ctx.req.headers["user-agent"] || null,
        ip,
        expiresAt: sessionExpiresAt
      });
      await deleteAdminSessionsByPhone(normalized);
      await createAdminSession({
        adminPhone: normalized,
        jti,
        userAgent: ctx.req.headers["user-agent"] || null,
        ip,
        expiresAt: sessionExpiresAt
      });
      ctx.res.cookie(ADMIN_COOKIE_NAME, token, {
        ...cookieOptions,
        maxAge: days * 24 * 60 * 60
      });
      return { success: true, name: credential.displayName || normalized };
    }),
    me: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user || ctx.user.role !== "admin") return null;
      const owner = await isOwnerOrMasterAdmin(ctx.user, ENV.ownerOpenId);
      return {
        openId: ctx.user.openId,
        name: ctx.user.name,
        phone: ctx.user.phone || null,
        loginMethod: ctx.user.loginMethod || "admin_phone",
        isOwner: owner
      };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(ADMIN_COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  /**
   * Site-wide settings (e.g. the SQM price used for size-based auto pricing).
   * Readable publicly (the storefront uses it) but only writable by admins.
   */
  settings: router({
    get: publicProcedure.query(async () => {
      const sqm = await getSetting("sqm_price");
      const price = sqm?.settingValue ? parseInt(sqm.settingValue, 10) : 3e3;
      return { sqmPrice: Number.isFinite(price) ? price : 3e3 };
    }),
    setSqmPrice: adminProcedure.input(z2.object({ price: z2.number().int().min(100).max(1e5) })).mutation(async ({ ctx, input }) => {
      if (!await isOwnerOrMasterAdmin(ctx.user, ENV.ownerOpenId)) {
        throw new Error("\u062A\u063A\u064A\u064A\u0631 \u0633\u0639\u0631 \u0627\u0644\u0645\u062A\u0631 \u0645\u062A\u0627\u062D \u0644\u0645\u0627\u0644\u0643 \u0627\u0644\u0645\u0648\u0642\u0639 \u0641\u0642\u0637");
      }
      await upsertSetting("sqm_price", String(input.price));
      return { success: true, sqmPrice: input.price };
    })
  }),
  /**
   * Admin account management — list, add, change password, disable/enable and
   * remove phone-based admin logins. Only the site owner (OWNER_OPEN_ID) may delete accounts.
   */
  adminAccounts: router({
    list: adminProcedure.query(async () => {
      const creds = await getAllAdminCredentials();
      return creds.map((c) => ({
        id: c.id,
        phone: c.phone,
        displayName: c.displayName,
        isActive: c.isActive,
        createdAt: c.createdAt.getTime()
      }));
    }),
    create: adminProcedure.input(
      z2.object({
        phone: z2.string().min(9),
        password: z2.string().min(8),
        displayName: z2.string().min(1).max(120)
      })
    ).mutation(async ({ input }) => {
      const normalized = normalizePhone(input.phone);
      if (!/^01[0-9]{9}$/.test(normalized)) {
        throw new Error("\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D \u2014 \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0631\u0642\u0645\u064B\u0627 \u0645\u0635\u0631\u064A\u064B\u0627 \u064A\u0628\u062F\u0623 \u0628\u0640 01 \u0648\u064A\u062A\u0643\u0648\u0646 \u0645\u0646 11 \u0631\u0642\u0645\u064B\u0627");
      }
      const existing = await getAdminCredentialByPhone(normalized);
      if (existing) {
        throw new Error("\u064A\u0648\u062C\u062F \u062D\u0633\u0627\u0628 \u0645\u062F\u0631\u0627\u0621 \u0628\u0647\u0630\u0627 \u0627\u0644\u0631\u0642\u0645 \u0628\u0627\u0644\u0641\u0639\u0644 \u2014 \u0627\u0633\u062A\u062E\u062F\u0645 \u062A\u063A\u064A\u064A\u0631 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0623\u0648 \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0641\u0639\u064A\u0644");
      }
      const hash = await bcrypt.hash(input.password, 10);
      await upsertAdminCredential({
        phone: normalized,
        passwordHash: hash,
        displayName: input.displayName.trim()
      });
      return { success: true, phone: normalized };
    }),
    updatePassword: adminProcedure.input(z2.object({ phone: z2.string().min(9), password: z2.string().min(8) })).mutation(async ({ input }) => {
      const normalized = normalizePhone(input.phone);
      const existing = await getAdminCredentialByPhone(normalized);
      if (!existing) throw new Error("\u0644\u0627 \u064A\u0648\u062C\u062F \u062D\u0633\u0627\u0628 \u0645\u062F\u0631\u0627\u0621 \u0628\u0647\u0630\u0627 \u0627\u0644\u0631\u0642\u0645");
      const hash = await bcrypt.hash(input.password, 10);
      await upsertAdminCredential({ phone: normalized, passwordHash: hash, displayName: existing.displayName });
      return { success: true };
    }),
    deactivate: adminProcedure.input(z2.object({ phone: z2.string().min(9) })).mutation(async ({ input }) => {
      const normalized = normalizePhone(input.phone);
      await deactivateAdminCredential(normalized);
      await deleteAdminSessionsByPhone(normalized);
      return { success: true };
    }),
    activate: adminProcedure.input(z2.object({ phone: z2.string().min(9) })).mutation(async ({ input }) => {
      await activateAdminCredential(normalizePhone(input.phone));
      return { success: true };
    }),
    remove: adminProcedure.input(z2.object({ phone: z2.string().min(9) })).mutation(async ({ ctx, input }) => {
      if (!await isOwnerOrMasterAdmin(ctx.user, ENV.ownerOpenId)) {
        throw new Error("\u062D\u0630\u0641 \u062D\u0633\u0627\u0628\u0627\u062A \u0627\u0644\u0645\u062F\u0631\u0627\u0621 \u0645\u062A\u0627\u062D \u0644\u0645\u0627\u0644\u0643 \u0627\u0644\u0645\u0648\u0642\u0639 \u0641\u0642\u0637");
      }
      const normalized = normalizePhone(input.phone);
      await deleteAdminCredential(normalized);
      return { success: true };
    })
  }),
  /**
   * Back-stock alert — customers who want a size/product that is currently
   * unavailable can leave their contact info and get notified.
   */
  restockAlerts: router({
    create: publicProcedure.input(z2.object({
      productId: z2.number().int().positive(),
      size: z2.string().trim().min(1).max(120),
      email: z2.string().trim().email("\u0628\u0631\u064A\u062F \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u063A\u064A\u0631 \u0635\u062D\u064A\u062D").optional(),
      phone: z2.string().trim().min(5).max(20).optional()
    })).mutation(async ({ input }) => {
      if (!input.email && !input.phone) {
        throw new Error("\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0623\u0648 \u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641 \u0644\u064A\u0635\u0644\u0643 \u0625\u0634\u0639\u0627\u0631 \u0627\u0644\u062A\u0648\u0641\u0631");
      }
      const product = await getProductById(input.productId);
      await createRestockAlert({
        productId: input.productId,
        productName: product?.nameAr ?? void 0,
        size: input.size,
        email: input.email || void 0,
        phone: input.phone || void 0
      });
      void notifyOwner({
        title: "\u0637\u0644\u0628 \u0625\u0634\u0639\u0627\u0631 \u062A\u0648\u0641\u0631 \u0645\u0646\u062A\u062C",
        content: [
          `\u0627\u0644\u0645\u0646\u062A\u062C: ${product?.nameAr ?? `\u0631\u0642\u0645 ${input.productId}`}`,
          `\u0627\u0644\u0645\u0642\u0627\u0633 \u0627\u0644\u0645\u0637\u0644\u0648\u0628: ${input.size}`,
          input.email ? `\u0627\u0644\u0628\u0631\u064A\u062F: ${input.email}` : "",
          input.phone ? `\u0627\u0644\u0647\u0627\u062A\u0641: ${input.phone}` : ""
        ].filter(Boolean).join("\n")
      }).catch((e) => console.warn("Failed to notify owner about restock alert", e));
      return { success: true };
    }),
    list: adminProcedure.query(async () => {
      return getRestockAlerts();
    }),
    markSent: adminProcedure.input(z2.object({ id: z2.number().int().positive() })).mutation(async ({ input }) => {
      await markRestockAlertSent(input.id);
      return { success: true };
    }),
    delete: adminProcedure.input(z2.object({ id: z2.number().int().positive() })).mutation(async ({ input }) => {
      await deleteRestockAlert(input.id);
      return { success: true };
    })
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
        await setReferralCode(ctx.user.id, code);
      }
      const usage = await getReferralUsageCount(code);
      return { code, usage };
    })
  }),
  /**
   * Sales analytics for the admin panel — revenue by month, top products,
   * acquisition source stats and grand totals. Writable only by admins.
   */
  reports: router({
    orderReport: adminProcedure.query(async () => {
      const report = await getOrderReport();
      return {
        revenueByMonth: report.revenueByMonth,
        topProducts: report.topProducts.slice(0, 10),
        sourceStats: report.sourceStats,
        totals: report.totals
      };
    }),
    exportOrders: adminProcedure.input(z2.object({
      status: z2.string().optional(),
      from: z2.date().optional(),
      to: z2.date().optional()
    })).query(async ({ input }) => {
      return getOrdersForExport(input);
    })
  }),
  /**
   * Public contact form submissions — rate limited per IP to prevent spam.
   */
  contact: router({
    submit: publicProcedure.input(z2.object({
      name: z2.string().trim().min(2).max(160),
      phone: z2.string().trim().min(5).max(40).optional(),
      email: z2.string().trim().email("\u0628\u0631\u064A\u062F \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u063A\u064A\u0631 \u0635\u062D\u064A\u062D").optional(),
      subject: z2.string().trim().max(200).optional(),
      message: z2.string().trim().min(10).max(5e3)
    })).mutation(async ({ input }) => {
      await createContactMessage(input);
      void notifyOwner({
        title: "\u0631\u0633\u0627\u0644\u0629 \u062C\u062F\u064A\u062F\u0629 \u0645\u0646 \u0646\u0645\u0648\u0630\u062C \u0627\u062A\u0635\u0644 \u0628\u0646\u0627",
        content: [
          `\u0627\u0644\u0627\u0633\u0645: ${input.name}`,
          input.phone ? `\u0627\u0644\u0647\u0627\u062A\u0641: ${input.phone}` : "",
          input.email ? `\u0627\u0644\u0628\u0631\u064A\u062F: ${input.email}` : "",
          input.subject ? `\u0627\u0644\u0645\u0648\u0636\u0648\u0639: ${input.subject}` : "",
          `\u0627\u0644\u0631\u0633\u0627\u0644\u0629: ${input.message}`
        ].filter(Boolean).join("\n")
      }).catch((e) => console.warn("Failed to notify owner about contact message", e));
      return { success: true };
    })
  }),
  /**
   * Admin inbox — read, mark as read, and delete contact form messages.
   */
  contactInbox: router({
    list: adminProcedure.query(async () => getContactMessages()),
    markRead: adminProcedure.input(z2.object({ id: z2.number().int().positive() })).mutation(async ({ input }) => {
      await markContactMessageRead(input.id);
      return { success: true };
    }),
    delete: adminProcedure.input(z2.object({ id: z2.number().int().positive() })).mutation(async ({ input }) => {
      await deleteContactMessage(input.id);
      return { success: true };
    })
  })
});

// server/_core/context.ts
import { jwtVerify as jwtVerify2 } from "jose";
import { parse as parseCookieHeader2 } from "cookie";

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT as SignJWT2, jwtVerify } from "jose";
init_env();
var isNonEmptyString2 = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    return decodeOAuthState(state).redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT2({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString2(openId) || !isNonEmptyString2(appId) || !isNonEmptyString2(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    let sessionToken = cookies.get(COOKIE_NAME);
    if (!sessionToken) {
      const authHeader = req.headers.authorization;
      if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        sessionToken = authHeader.slice(7);
      }
    }
    const session = await this.verifySession(sessionToken);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    if (session.openId.startsWith(CRON_OPEN_ID_PREFIX)) {
      const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
      const taskUid = userInfo.taskUid ?? null;
      if (!taskUid) {
        throw ForbiddenError("Cron session missing task_uid");
      }
      return buildCronUser(userInfo);
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var CRON_OPEN_ID_PREFIX = "cron_";
function buildCronUser(userInfo) {
  const now = /* @__PURE__ */ new Date();
  return {
    id: -1,
    openId: userInfo.openId,
    name: userInfo.name || "Manus Scheduled Task",
    email: null,
    loginMethod: null,
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    taskUid: userInfo.taskUid ?? void 0,
    isCron: true
  };
}
var sdk = new SDKServer();

// server/_core/context.ts
init_env();
var isNonEmptyString3 = (value) => typeof value === "string" && value.length > 0;
async function authenticateAdminSession(cookieHeader) {
  if (!cookieHeader) return null;
  const cookies = new Map(
    Object.entries(parseCookieHeader2(cookieHeader))
  );
  const token = cookies.get(ADMIN_COOKIE_NAME);
  if (!token) return null;
  let payload;
  try {
    const secretKey = new TextEncoder().encode(ENV.cookieSecret);
    const verified = await jwtVerify2(token, secretKey, { algorithms: ["HS256"] });
    payload = verified.payload;
  } catch {
    return null;
  }
  const jti = payload.jti;
  const openId = payload.openId;
  const name = payload.name;
  if (!isNonEmptyString3(jti) || !isNonEmptyString3(openId) || !isNonEmptyString3(name) || !openId.startsWith("admin-")) {
    return null;
  }
  const session = await getActiveAdminSession(jti, /* @__PURE__ */ new Date());
  if (!session) return null;
  return {
    id: 0,
    openId,
    name: name || session.adminPhone,
    email: null,
    phone: session.adminPhone,
    address: null,
    loginMethod: "admin_phone",
    role: "admin",
    createdAt: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date(),
    lastSignedIn: /* @__PURE__ */ new Date(),
    referralCode: null
  };
}
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  if (!user) {
    try {
      user = await authenticateAdminSession(opts.req.headers.cookie);
    } catch (error) {
      user = null;
    }
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/api.ts
var app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(
  ["/api/trpc", "/trpc"],
  createExpressMiddleware({
    router: appRouter,
    createContext
  })
);
app.get(["/api/health", "/health", "/api"], (_req, res) => {
  res.json({ status: "ok", service: "elnour-homes-api" });
});
var api_default = app;
export {
  api_default as default
};
