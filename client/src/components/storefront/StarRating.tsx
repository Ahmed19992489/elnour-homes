import React from "react";
import { Star } from "lucide-react";

export function StarRatingDisplay({ rating = 5, total = 5, size = "sm" }: { rating?: number; total?: number; size?: "sm" | "md" | "lg" }) {
  const iconSize = size === "lg" ? "h-6 w-6" : size === "md" ? "h-5 w-5" : "h-3.5 w-3.5";
  return (
    <div className="flex items-center text-amber-500">
      {[...Array(total)].map((_, i) => (
        <Star
          key={i}
          className={`${iconSize} ${i < Math.round(rating) ? "fill-current" : "text-gray-300"}`}
        />
      ))}
    </div>
  );
}

export function InteractiveRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (val: number) => void;
}) {
  return (
    <div className="flex gap-1 text-amber-500">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          type="button"
          key={star}
          onClick={() => onChange(star)}
          className="p-1 hover:scale-125 transition-transform focus:outline-none"
        >
          <Star className={`h-6 w-6 ${star <= value ? "fill-current" : "text-gray-300"}`} />
        </button>
      ))}
    </div>
  );
}
