"use client";

import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef } from "react";

interface ProgressProps extends ComponentPropsWithoutRef<"div"> {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  variant?: "default" | "success" | "warning" | "info" | "destructive";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const variantStyles = {
  default: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-info",
  destructive: "bg-destructive",
};

const sizeStyles = {
  sm: "h-1.5",
  md: "h-2",
  lg: "h-3",
};

const trackStyles = {
  sm: "h-1.5",
  md: "h-2",
  lg: "h-3",
};

export function Progress({
  value,
  max = 100,
  label,
  showValue = false,
  variant = "default",
  size = "md",
  className,
  ...props
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn("w-full", className)} {...props}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          {label && <span>{label}</span>}
          {showValue && <span className="font-medium text-foreground">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div className={cn("w-full rounded-full bg-muted overflow-hidden", trackStyles[size])}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            variantStyles[variant],
            sizeStyles[size],
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface ProgressCircleProps extends ComponentPropsWithoutRef<"svg"> {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  variant?: "default" | "success" | "warning" | "info" | "destructive";
  showValue?: boolean;
  className?: string;
}

const circleVariantStyles = {
  default: "text-primary",
  success: "text-success",
  warning: "text-warning",
  info: "text-info",
  destructive: "text-destructive",
};

export function ProgressCircle({
  value,
  max = 100,
  size = 48,
  strokeWidth = 4,
  variant = "default",
  showValue = true,
  className,
}: ProgressCircleProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          className="text-muted"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={cn(
            "transition-all duration-500 ease-out",
            circleVariantStyles[variant],
          )}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {showValue && (
        <span
          className={cn(
            "absolute text-center font-bold",
            size <= 32 ? "text-xs" : "text-sm",
          )}
        >
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}