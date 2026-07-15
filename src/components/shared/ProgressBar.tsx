import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0–100
  label?: string;
  size?: "sm" | "md" | "lg";
  showPercent?: boolean;
  indeterminate?: boolean;
  variant?: "primary" | "success" | "warning";
  className?: string;
}

const SIZE_MAP = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
};

const GRADIENT_MAP = {
  primary: "bg-gradient-primary",
  success: "bg-success",
  warning: "bg-warning",
};

export function ProgressBar({
  value,
  label,
  size = "md",
  showPercent = true,
  indeterminate = false,
  variant = "primary",
  className,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const isComplete = clamped === 100;

  return (
    <div className={cn("space-y-1.5", className)}>
      {/* Label row */}
      {(label || showPercent) && (
        <div className="flex items-center justify-between gap-4">
          {label && (
            <span className="text-sm font-medium text-foreground truncate">
              {label}
            </span>
          )}
          {showPercent && (
            <span
              className={cn(
                "text-sm font-semibold tabular-nums shrink-0 ml-auto",
                isComplete ? "text-primary" : "text-foreground",
              )}
            >
              {indeterminate ? "—" : `${clamped}%`}
            </span>
          )}
        </div>
      )}

      {/* Track */}
      <div
        className={cn(
          "relative w-full rounded-full overflow-hidden bg-muted",
          SIZE_MAP[size],
        )}
      >
        {indeterminate ? (
          /* Indeterminate shimmer */
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-70"
            style={{ animation: "progress-indeterminate 1.5s ease-in-out infinite" }}
          />
        ) : (
          /* Determinate fill */
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden",
              GRADIENT_MAP[variant],
            )}
            style={{ width: `${clamped}%` }}
          >
            {/* Shimmer on incomplete */}
            {!isComplete && clamped > 0 && (
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                style={{
                  backgroundSize: "200% 100%",
                  animation: "shimmer-slide 2s ease-in-out infinite",
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
