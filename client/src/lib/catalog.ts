export type CatalogFilterProduct = {
  category: string | null;
  name: string;
  nameAr: string;
  description?: string | null;
  sizes?: string | null;
  colors?: string | null;
};

export function filterCatalogProducts<T extends CatalogFilterProduct>(
  products: T[] | undefined,
  query: string,
  selectedCategory: string,
): T[] {
  const normalizedQuery = query.trim().toLowerCase();

  return (products ?? []).filter((product) => {
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const haystack = `${product.name} ${product.nameAr} ${product.description || ""} ${product.category || ""} ${product.sizes || ""} ${product.colors || ""}`.toLocaleLowerCase();
    return matchesCategory && haystack.includes(normalizedQuery);
  });
}
