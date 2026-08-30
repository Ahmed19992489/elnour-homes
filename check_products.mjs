import { neon } from "@neondatabase/serverless";

const url = "postgresql://neondb_owner:npg_VM4tSBwN5PGd@ep-plain-rice-auzortld-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require";
const sql = neon(url);

async function main() {
  const prods = await sql`SELECT id, name_ar, price, sizes, size_options, colors, color_options, category FROM products ORDER BY id ASC LIMIT 25`;
  console.log("Total products fetched:", prods.length);
  for (const p of prods) {
    console.log(`[${p.id}] ${p.name_ar} | Price: ${p.price} | Category: ${p.category}`);
    console.log(`   sizes: ${p.sizes}`);
    console.log(`   size_options: ${p.size_options}`);
    console.log(`   colors: ${p.colors}`);
    console.log(`   color_options: ${p.color_options}`);
  }
}

main().catch(console.error);
