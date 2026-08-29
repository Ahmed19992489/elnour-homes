import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | string | null | undefined): string {
  if (price === null || price === undefined || isNaN(Number(price))) return "0";
  return new Intl.NumberFormat("ar-EG", {
    maximumFractionDigits: 0,
  }).format(Number(price));
}

export function formatDate(date: string | number | Date | null | undefined): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}
