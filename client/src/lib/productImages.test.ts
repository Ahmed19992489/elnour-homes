import { getPrimaryProductImage, hasProductImage, parseProductImages, serializeProductImages } from "./productImages";
import { describe, expect, it } from "vitest";

describe("product image utilities", () => {
  it("reads the relative S3 path used by current product records", () => {
    expect(getPrimaryProductImage("/manus-storage/uploads/steel-door.jpg")).toBe("/manus-storage/uploads/steel-door.jpg");
  });

  it("reads comma-separated images in their display order", () => {
    expect(parseProductImages("/front.jpg, /back.jpg, https://cdn.example.com/side.jpg")).toEqual([
      "/front.jpg",
      "/back.jpg",
      "https://cdn.example.com/side.jpg",
    ]);
  });

  it("supports JSON image arrays and ignores empty entries", () => {
    expect(parseProductImages('["/front.jpg", "", "/back.jpg"]')).toEqual(["/front.jpg", "/back.jpg"]);
  });

  it("serializes clean image URLs for the product form", () => {
    expect(serializeProductImages([" /front.jpg ", "", "/back.jpg"])).toBe("/front.jpg, /back.jpg");
  });

  it("requires at least one non-empty image before a product can be published", () => {
    expect(hasProductImage(undefined)).toBe(false);
    expect(hasProductImage("  ")).toBe(false);
    expect(hasProductImage("[]")).toBe(false);
    expect(hasProductImage("/manus-storage/products/door.jpg")).toBe(true);
  });
});
