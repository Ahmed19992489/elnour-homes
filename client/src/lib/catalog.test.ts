import { describe, expect, it } from "vitest";
import { filterCatalogProducts } from "./catalog";

const products = [
  { category: "home-decor", name: "Golden Wall Art", nameAr: "لوحة حائط ذهبية" },
  { category: "tables", name: "Coffee Table", nameAr: "طاولة قهوة" },
  { category: "home-decor", name: "Entry Console", nameAr: "كونسول مدخل" },
];

describe("filterCatalogProducts", () => {
  it("returns all products when no search or category filter is selected", () => {
    expect(filterCatalogProducts(products, "", "all")).toHaveLength(3);
  });

  it("filters products by their selected category", () => {
    expect(filterCatalogProducts(products, "", "home-decor").map((product) => product.name)).toEqual([
      "Golden Wall Art",
      "Entry Console",
    ]);
  });

  it("searches against both Arabic and English product names within the selected category", () => {
    expect(filterCatalogProducts(products, "قهوة", "tables").map((product) => product.name)).toEqual(["Coffee Table"]);
    expect(filterCatalogProducts(products, "golden", "home-decor").map((product) => product.name)).toEqual(["Golden Wall Art"]);
  });

  it("returns an empty result when a search has no match in the chosen category", () => {
    expect(filterCatalogProducts(products, "table", "home-decor")).toEqual([]);
  });
});
