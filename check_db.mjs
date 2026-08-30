import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_VM4tSBwN5PGd@ep-plain-rice-auzortld-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require";
const sql = neon(connectionString);

async function check() {
  const cats = await sql`SELECT * FROM categories`;
  const prods = await sql`SELECT * FROM products`;
  const admins = await sql`SELECT * FROM admin_credentials`;
  console.log("Categories count:", cats.length);
  console.log("Categories:", cats.map(c => ({ id: c.id, slug: c.slug, name_ar: c.name_ar, is_active: c.is_active })));
  console.log("Products count:", prods.length);
  console.log("Products:", prods.map(p => ({ id: p.id, name_ar: p.name_ar, price: p.price, category: p.category, is_active: p.is_active })));
  console.log("Admins count:", admins.length);
}

check().catch(console.error);
