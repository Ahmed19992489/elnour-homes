import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}
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
