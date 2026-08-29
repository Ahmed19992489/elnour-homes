export function computeCartItemPrice(params: {
  price: number;
  pricePerMeter?: number;
  isPerMeter?: boolean;
  meters?: number;
  quantity: number;
}): number {
  const { price, pricePerMeter, isPerMeter, meters, quantity } = params;
  if (isPerMeter && meters && pricePerMeter) {
    return pricePerMeter * meters * quantity;
  }
  return price * quantity;
}

export function isOptionAvailable(availableOptions: string[], selected?: string): boolean {
  if (!availableOptions || availableOptions.length === 0) return true;
  if (!selected) return true;
  return availableOptions.some((opt) => opt.toLowerCase() === selected.toLowerCase());
}
