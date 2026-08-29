import bcrypt from "bcryptjs";

const PHONE_1 = process.env.ADMIN_PHONE_1_PHONE || "01121748885";
const PHONE_2 = process.env.ADMIN_PHONE_2_PHONE || "01118182424";
const PW_1 = process.env.ADMIN_PHONE_1_PASSWORD || "elnour123456";
const PW_2 = process.env.ADMIN_PHONE_2_PASSWORD || "moderator123456";

const normalizePhone = (phone) => (phone || "").replace(/[^0-9]/g, "");

const { drizzle } = await import("drizzle-orm/mysql2");
const schema = await import("./drizzle/schema.ts");
const adminCredentials = schema.adminCredentials;

const db = drizzle(process.env.DATABASE_URL);

async function upsertAdmin(phone, password, displayName, role = "admin") {
  const hash = await bcrypt.hash(password, 10);
  const phoneDigits = normalizePhone(phone);
  await db
    .insert(adminCredentials)
    .values({ phone: phoneDigits, passwordHash: hash, displayName, role, isActive: "yes" })
    .onDuplicateKeyUpdate({
      set: { passwordHash: hash, displayName, role, isActive: "yes" },
    });
  console.log(`Account created/updated: ${phoneDigits} (${displayName}) [${role}]`);
}

await upsertAdmin(PHONE_1, PW_1, "المدير الرئيسي", "admin");
await upsertAdmin(PHONE_2, PW_2, "Moderator", "moderator");
console.log("Admin & Moderator Seed complete.");
process.exit(0);