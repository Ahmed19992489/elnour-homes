import { neon } from "@neondatabase/serverless";

const url = "postgresql://neondb_owner:npg_VM4tSBwN5PGd@ep-plain-rice-auzortld-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require";
const sql = neon(url);

const standardColors = [
  { labelAr: "ذهبي ملكي PVD", labelEn: "Royal Gold", hex: "#D4AF37" },
  { labelAr: "سيلفر / فضي كروم", labelEn: "Silver Chrome", hex: "#C0C0C0" },
  { labelAr: "أسود مطفي فاخر", labelEn: "Matte Black", hex: "#1F1F1F" }
];
const standardColorsJson = JSON.stringify(standardColors);
const standardColorsText = "ذهبي ملكي PVD، سيلفر / فضي كروم، أسود مطفي فاخر";

async function updateAllProducts() {
  const products = await sql`SELECT id, name_ar, price, category FROM products ORDER BY id ASC`;
  console.log(`Found ${products.length} products to update...`);

  for (const p of products) {
    const basePrice = parseFloat(p.price) || 3500;
    let sizeOpts = [];
    let sizesText = "";

    const cat = (p.category || "").toLowerCase();
    const name = p.name_ar || "";

    if (cat.includes("table") || name.includes("ترابيزة") || name.includes("طاولة") || name.includes("طقم")) {
      if (name.includes("طقم") || name.includes("خدمة") || name.includes("متداخلة")) {
        sizeOpts = [
          { labelAr: "طقم 3 قطع قياسي (قطر 40-45-50 سم)", labelEn: "Standard 3-Piece Set (40-45-50cm)", price: String(Math.round(basePrice * 0.9 / 50) * 50) },
          { labelAr: "طقم 3 قطع كبير (قطر 45-50-55 سم)", labelEn: "Large 3-Piece Set (45-50-55cm)", price: String(Math.round(basePrice / 50) * 50) },
          { labelAr: "طقم 4 قطع سوبر (قطر 40-45-50-55 سم)", labelEn: "Super 4-Piece Set", price: String(Math.round(basePrice * 1.25 / 50) * 50) }
        ];
        sizesText = "طقم 3 قطع قياسي (40-45-50 سم)، طقم 3 قطع كبير (45-50-55 سم)، طقم 4 قطع سوبر";
      } else if (name.includes("دائري") || name.includes("دايموند") || name.includes("قطر")) {
        sizeOpts = [
          { labelAr: "قطر 80 سم × ارتفاع 45 سم", labelEn: "80cm Diameter x 45cm H", price: String(Math.round(basePrice * 0.88 / 50) * 50) },
          { labelAr: "قطر 90 سم × ارتفاع 45 سم", labelEn: "90cm Diameter x 45cm H", price: String(Math.round(basePrice / 50) * 50) },
          { labelAr: "قطر 100 سم × ارتفاع 45 سم", labelEn: "100cm Diameter x 45cm H", price: String(Math.round(basePrice * 1.15 / 50) * 50) }
        ];
        sizesText = "قطر 80 سم، قطر 90 سم، قطر 100 سم";
      } else {
        // Rectangular / Oval tables
        sizeOpts = [
          { labelAr: "100×50 سم (ارتفاع 45 سم)", labelEn: "100x50 cm (45cm H)", price: String(Math.round(basePrice * 0.88 / 50) * 50) },
          { labelAr: "120×60 سم (ارتفاع 45 سم)", labelEn: "120x60 cm (45cm H)", price: String(Math.round(basePrice / 50) * 50) },
          { labelAr: "140×70 سم (ارتفاع 45 سم)", labelEn: "140x70 cm (45cm H)", price: String(Math.round(basePrice * 1.15 / 50) * 50) }
        ];
        sizesText = "100×50 سم، 120×60 سم، 140×70 سم";
      }
    } else if (cat.includes("console") || name.includes("كونسول")) {
      sizeOpts = [
        { labelAr: "عرض 100 سم × عمق 35 سم × ارتفاع 85 سم", labelEn: "100cm W x 35cm D x 85cm H", price: String(Math.round(basePrice * 0.88 / 50) * 50) },
        { labelAr: "عرض 120 سم × عمق 35 سم × ارتفاع 85 سم", labelEn: "120cm W x 35cm D x 85cm H", price: String(Math.round(basePrice / 50) * 50) },
        { labelAr: "عرض 140 سم × عمق 40 سم × ارتفاع 85 سم", labelEn: "140cm W x 40cm D x 85cm H", price: String(Math.round(basePrice * 1.15 / 50) * 50) }
      ];
      sizesText = "عرض 100 سم، عرض 120 سم، عرض 140 سم";
    } else if (cat.includes("mirror") || name.includes("مراية") || name.includes("مرآة")) {
      if (name.includes("دائرية") || name.includes("قطر")) {
        sizeOpts = [
          { labelAr: "قطر 60 سم مع إضاءة ليد", labelEn: "60cm Diameter with LED", price: String(Math.round(basePrice * 0.85 / 50) * 50) },
          { labelAr: "قطر 70 سم مع إضاءة ليد", labelEn: "70cm Diameter with LED", price: String(Math.round(basePrice / 50) * 50) },
          { labelAr: "قطر 80 سم مع إضاءة ليد", labelEn: "80cm Diameter with LED", price: String(Math.round(basePrice * 1.18 / 50) * 50) }
        ];
        sizesText = "قطر 60 سم، قطر 70 سم، قطر 80 سم";
      } else if (name.includes("طولية") || name.includes("كاملة") || name.includes("مدخل")) {
        sizeOpts = [
          { labelAr: "ارتفاع 160 سم × عرض 50 سم", labelEn: "160x50 cm", price: String(Math.round(basePrice * 0.88 / 50) * 50) },
          { labelAr: "ارتفاع 180 سم × عرض 60 سم", labelEn: "180x60 cm", price: String(Math.round(basePrice / 50) * 50) },
          { labelAr: "ارتفاع 200 سم × عرض 70 سم", labelEn: "200x70 cm", price: String(Math.round(basePrice * 1.18 / 50) * 50) }
        ];
        sizesText = "160×50 سم، 180×60 سم، 200×70 سم";
      } else {
        // Oval / Rectangular mirror
        sizeOpts = [
          { labelAr: "80×50 سم مع ليد ذكي", labelEn: "80x50 cm with Smart LED", price: String(Math.round(basePrice * 0.85 / 50) * 50) },
          { labelAr: "100×60 سم مع ليد ذكي", labelEn: "100x60 cm with Smart LED", price: String(Math.round(basePrice / 50) * 50) },
          { labelAr: "120×70 سم مع ليد ذكي", labelEn: "120x70 cm with Smart LED", price: String(Math.round(basePrice * 1.2 / 50) * 50) }
        ];
        sizesText = "80×50 سم، 100×60 سم، 120×70 سم";
      }
    } else {
      // Partitions / Wall decor / Screens
      sizeOpts = [
        { labelAr: "عرض 80 سم × ارتفاع 200 سم", labelEn: "80x200 cm", price: String(Math.round(basePrice * 0.85 / 50) * 50) },
        { labelAr: "عرض 100 سم × ارتفاع 220 سم", labelEn: "100x220 cm", price: String(Math.round(basePrice / 50) * 50) },
        { labelAr: "عرض 120 سم × ارتفاع 240 سم", labelEn: "120x240 cm", price: String(Math.round(basePrice * 1.2 / 50) * 50) }
      ];
      sizesText = "80×200 سم، 100×220 سم، 120×240 سم";
    }

    const sizeOptionsJson = JSON.stringify(sizeOpts);

    await sql`
      UPDATE products 
      SET 
        size_options = ${sizeOptionsJson},
        sizes = ${sizesText},
        color_options = ${standardColorsJson},
        colors = ${standardColorsText},
        updated_at = NOW()
      WHERE id = ${p.id}
    `;
    console.log(`✅ Updated product [${p.id}] "${p.name_ar}" with 3 sizes and 3 colors (Gold, Silver, Black).`);
  }

  console.log("🎉 All products successfully updated!");
}

updateAllProducts().catch(console.error);
