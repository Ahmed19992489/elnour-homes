import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_VM4tSBwN5PGd@ep-plain-rice-auzortld-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require";
const sql = neon(connectionString);

async function main() {
  console.log("Connecting to Neon PostgreSQL...");

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      open_id VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(50),
      address TEXT,
      login_method VARCHAR(50),
      role VARCHAR(50) DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_signed_in TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS admin_credentials (
      id SERIAL PRIMARY KEY,
      phone VARCHAR(50) NOT NULL UNIQUE,
      display_name VARCHAR(100),
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) DEFAULT 'admin',
      is_active VARCHAR(10) DEFAULT 'yes',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      id SERIAL PRIMARY KEY,
      admin_phone VARCHAR(50) NOT NULL,
      jti VARCHAR(255) NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL,
      revoked_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(100) NOT NULL UNIQUE,
      name_ar VARCHAR(255) NOT NULL,
      name_en VARCHAR(255) NOT NULL,
      description_ar TEXT,
      description_en TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      name_ar VARCHAR(255) NOT NULL,
      description TEXT,
      price VARCHAR(50) NOT NULL,
      pricing_type VARCHAR(50) DEFAULT 'fixed',
      price_per_meter VARCHAR(50),
      category VARCHAR(100) NOT NULL DEFAULT 'home-decor',
      images TEXT,
      is_active VARCHAR(10) DEFAULT 'yes',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      customer_name VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(50) NOT NULL,
      customer_email VARCHAR(255),
      customer_address TEXT NOT NULL,
      product_id INTEGER,
      product_name VARCHAR(255) DEFAULT 'طلب تفصيل استيل',
      product_price VARCHAR(50),
      selected_size VARCHAR(100),
      selected_color VARCHAR(100),
      message TEXT,
      notes TEXT,
      coupon_code VARCHAR(50),
      discount_value VARCHAR(50),
      total_after_discount VARCHAR(50),
      status VARCHAR(50) DEFAULT 'new',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS gallery (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      image_url TEXT NOT NULL,
      category VARCHAR(100) DEFAULT 'أعمال منجزة',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS coupons (
      id SERIAL PRIMARY KEY,
      code VARCHAR(50) NOT NULL UNIQUE,
      description TEXT,
      discount_type VARCHAR(20) DEFAULT 'percent',
      discount_value VARCHAR(50) NOT NULL,
      min_order_value VARCHAR(50) DEFAULT '0',
      is_active VARCHAR(10) DEFAULT 'yes',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS product_reviews (
      id SERIAL PRIMARY KEY,
      product_id INTEGER,
      user_id INTEGER,
      user_name VARCHAR(255) NOT NULL,
      rating INTEGER NOT NULL DEFAULT 5,
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS restock_alerts (
      id SERIAL PRIMARY KEY,
      product_id INTEGER,
      product_name VARCHAR(255),
      size VARCHAR(100),
      phone VARCHAR(50),
      email VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS contact_inbox (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      email VARCHAR(255),
      subject VARCHAR(255),
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Seed default products and categories if empty
  const cats = await sql`SELECT count(*) FROM categories`;
  if (parseInt(cats[0].count) === 0) {
    console.log("Seeding categories...");
    await sql`
      INSERT INTO categories (slug, name_ar, name_en, description_ar, description_en) VALUES
      ('tables', 'ترابيزات استيل', 'Steel Tables', 'أرقى ترابيزات الصالون والريسبشن استيل 304 مع رخام وقزاز فاخر', 'Luxury 304 Stainless Steel living room & reception tables with marble and glass'),
      ('consoles', 'كونسول استيل', 'Steel Consoles', 'كونسول مداخل وتحف استيل مطلي PVD ذهبي وفضي عالي المقاومة', 'Entrance consoles and luxury steel statement furniture with PVD titanium finish'),
      ('mirrors', 'مرايات مضيئة', 'LED Mirrors', 'مرايات استيل ليد تتش ذكية بإضاءة وورم وكولد لغرف النوم والمداخل', 'Smart LED touch stainless steel mirrors for bedrooms, vanity, and entrances'),
      ('partitions', 'قواطع جدارية', 'Wall Partitions', 'قواطع وبرافانات استيل مودرن لتقسيم المساحات والديكور الداخلي', 'Modern decorative steel partitions and privacy screens for interior luxury');
    `;
  }

  const prods = await sql`SELECT count(*) FROM products`;
  if (parseInt(prods[0].count) === 0) {
    console.log("Seeding initial products...");
    await sql`
      INSERT INTO products (name, name_ar, description, price, pricing_type, price_per_meter, category, images, is_active) VALUES
      ('Diamond Marble Steel Table', 'ترابيزة استيل رخام دايموند', 'ترابيزة صالون استيل 304 مذهب PVD مع قرصة رخام طبيعي إسباني', '4800', 'fixed', NULL, 'tables', '["/images/products/photo_1_2026-02-27_01-20-43.jpg"]', 'yes'),
      ('Royal Golden Console 120cm', 'كونسول رويال مذهب 120 سم', 'كونسول مدخل استيل ذهبي فائق اللمعان مع رف زجاجي سيكوريت عالي التحمل', '5600', 'fixed', NULL, 'consoles', '["/images/products/photo_2_2026-02-27_01-20-43.jpg"]', 'yes'),
      ('Smart Oval LED Mirror', 'مراية أوفال ليد ذكية إطار استيل', 'مراية بيضاوية بإطار استيل 304 ولمبات ليد ثلاث درجات إضاءة مع حساس لمس', '3200', 'fixed', NULL, 'mirrors', '["/images/products/photo_3_2026-02-27_01-20-43.jpg"]', 'yes'),
      ('Geometric Architectural Partition', 'قاطع استيل هندسي مودرن بالطلب', 'قاطع استيل مقطوع بالليزر بتصميم هندسي راقي (سعر تفصيل بالمتر المربع)', '3500', 'per_meter', '3500', 'partitions', '["/images/products/photo_4_2026-02-27_01-20-43.jpg"]', 'yes');
    `;
  }

  console.log("Database initialized successfully!");
}

main().catch((err) => {
  console.error("Init DB Error:", err);
  process.exit(1);
});
