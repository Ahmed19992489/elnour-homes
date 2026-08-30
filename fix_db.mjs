import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_VM4tSBwN5PGd@ep-plain-rice-auzortld-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require";
const sql = neon(connectionString);

async function fixDb() {
  console.log("Migrating and checking DB schema...");

  // 1. Add missing columns to categories if not exist
  await sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_active VARCHAR(10) DEFAULT 'yes'`;
  await sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0`;
  await sql`UPDATE categories SET is_active = 'yes' WHERE is_active IS NULL`;

  // 2. Add missing columns to products if not exist
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes TEXT`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS colors TEXT`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS size_options TEXT`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS color_options TEXT`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS specifications TEXT`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE`;
  await sql`UPDATE products SET is_active = 'yes' WHERE is_active IS NULL`;

  // 3. Seed default admin credentials for both phones
  const hash1 = await bcrypt.hash("elnour123456", 10);
  const hash2 = await bcrypt.hash("moderator123456", 10);

  await sql`
    INSERT INTO admin_credentials (phone, display_name, password_hash, role, is_active)
    VALUES 
      ('01121748885', 'المدير الرئيسي', ${hash1}, 'admin', 'yes'),
      ('01118182424', 'المشرف العام', ${hash2}, 'moderator', 'yes')
    ON CONFLICT (phone) DO UPDATE 
    SET password_hash = EXCLUDED.password_hash, is_active = 'yes', display_name = EXCLUDED.display_name;
  `;

  // 4. Seed site settings
  await sql`
    CREATE TABLE IF NOT EXISTS site_settings (
      id SERIAL PRIMARY KEY,
      setting_key VARCHAR(64) NOT NULL UNIQUE,
      setting_value TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await sql`
    INSERT INTO site_settings (setting_key, setting_value)
    VALUES ('sqm_price', '3000')
    ON CONFLICT (setting_key) DO NOTHING;
  `;

  // 5. Seed site content
  await sql`
    CREATE TABLE IF NOT EXISTS site_content (
      id SERIAL PRIMARY KEY,
      section_key VARCHAR(100) NOT NULL UNIQUE,
      title_ar TEXT,
      title_en TEXT,
      content_ar TEXT,
      content_en TEXT,
      subtitle_ar TEXT,
      subtitle_en TEXT,
      is_active VARCHAR(10) DEFAULT 'yes',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await sql`
    INSERT INTO site_content (section_key, title_ar, title_en, subtitle_ar, subtitle_en, is_active)
    VALUES 
      ('hero', 'استيل يترك أثراً في كل مساحة', 'Steel that makes every space memorable', 'ديكورات وأثاث استيل بتشطيبات أنيقة، من القطعة الجاهزة إلى التصميم الخاص.', 'Steel décor and furniture with refined finishes, from ready pieces to custom designs.', 'yes'),
      ('about', 'عن النور ستيل', 'About Elnour Steel', 'رواد صناعة وتشكيل الاستيل الفاخر في مصر', 'Pioneers of luxury steel crafting in Egypt', 'yes'),
      ('story', 'قصتنا', 'Our Story', 'رحلة من الإبداع والدقة في تشكيل المعادن', 'A journey of creativity and precision in metalcraft', 'yes')
    ON CONFLICT (section_key) DO NOTHING;
  `;

  console.log("DB migrated and seeded successfully!");
}

fixDb().catch(console.error);
