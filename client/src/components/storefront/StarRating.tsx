import { Star } from "lucide-react";

type StarRatingProps = {
  /** 0-5 average (may be fractional); when provided the component is read-only. */
  value?: number;
  /** Number of reviews to display next to the stars. */
  count?: number;
};

/** Read-only display of an average rating, e.g. ★ 4.5 (12) */
export function StarRatingDisplay({ value = 0, count }: StarRatingProps) {
  const stars = [];
  for (let i = 1; i <= 5; i += 1) {
    const fill = Math.min(1, Math.max(0, (value || 0) - (i - 1)));
    stars.push(
      <span key={i} className="relative inline-block">
        <Star className="h-4 w-4 text-[#d8cfb8]" />
        {fill > 0 ? (
          <span className="absolute inset-y-0 start-0 overflow-hidden" style={{ width: `${Math.round(fill * 100)}%` }}>
            <Star className="h-4 w-4 text-[#ad842f]" />
          </span>
        ) : null}
      </span>,
    );
  }
  return (
    <span className="inline-flex items-center gap-1" dir="ltr">
      <span className="flex items-center">{stars}</span>
      {typeof count === "number" ? (
        <span className="text-xs text-muted-foreground">
          ({count.toLocaleString("en-US")})
        </span>
      ) : null}
    </span>
  );
}

type InteractiveRatingProps = {
  value: number;
  onChange: (rating: number) => void;
  /** Optional — pass to make it read-only while keeping the interactive look. */
  readOnly?: boolean;
  size?: "sm" | "md";
  labelAr?: string;
  labelEn?: string;
};

/** Hover/click star selector used in the review form. */
export function InteractiveRating({
  value,
  onChange,
  readOnly,
  size = "md",
  labelAr,
  labelEn,
}: InteractiveRatingProps) {
  const stars = [];
  for (let i = 1; i <= 5; i += 1) {
    stars.push(
      <button
        key={i}
        type="button"
        disabled={readOnly}
        aria-label={`${labelAr ?? "تقييم"} ${i}`}
        onClick={() => onChange(i)}
        className="transition-transform disabled:cursor-default hover:scale-110 active:scale-95"
      >
        <Star
          className={`${size === "sm" ? "h-4 w-4" : "h-6 w-6"} ${
            i <= value ? "text-[#ad842f]" : "text-[#d8cfb8]"
          } transition-colors`}
        />
      </button>,
    );
  }
  return <div className="flex items-center gap-0.5" dir="ltr">{stars}</div>;
}
