import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "default" | "lg" | "icon";
}

export function Spinner({ className, size = "default", ...props }: SpinnerProps) {
  const sizeClass =
    size === "sm"
      ? "h-4 w-4"
      : size === "lg"
      ? "h-8 w-8"
      : size === "icon"
      ? "h-10 w-10"
      : "h-5 w-5";

  return (
    <div role="status" className={cn("inline-flex items-center justify-center", className)} {...props}>
      <Loader2 className={cn("animate-spin text-current", sizeClass)} />
      <span className="sr-only">جاري التحميل...</span>
    </div>
  );
}
