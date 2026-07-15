"use client";

import { cn } from "@/lib/utils";
import type { ReactNode, ComponentPropsWithoutRef } from "react";

interface KPICardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: string;
    positive?: boolean;
  };
  className?: string;
  color?: "primary" | "success" | "warning" | "info" | "destructive";
}

const colorStyles = {
  primary: "border-primary/20 bg-primary/5 text-primary",
  success: "border-success/20 bg-success/5 text-success",
  warning: "border-warning/20 bg-warning/5 text-warning",
  info: "border-info/20 bg-info/5 text-info",
  destructive: "border-destructive/20 bg-destructive/5 text-destructive",
};

export function KPICard({
  label,
  value,
  icon,
  trend,
  className,
  color = "primary",
}: KPICardProps) {
  return (
    <div
      className={cn(
        "relative rounded-xl border p-5 transition-all duration-200 hover:border-primary/30 hover:shadow-card-hover",
        colorStyles[color],
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold text-foreground tabular-nums">
            {value}
          </p>
          {trend && (
            <p
              className={cn(
                "mt-1 text-xs font-medium",
                trend.positive
                  ? "text-success"
                  : "text-destructive",
              )}
            >
              {trend.value}
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex items-center justify-center w-12 h-12 rounded-xl shrink-0",
            colorStyles[color].replace("border-", "bg-").replace("text-", ""),
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}