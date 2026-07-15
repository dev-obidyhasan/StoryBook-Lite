"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface DataGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4 | 5;
  gap?: "sm" | "md" | "lg";
  className?: string;
}

export function DataGrid({
  children,
  columns = 3,
  gap = "md",
  className,
}: DataGridProps) {
  const columnClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
  };

  const gapClasses = {
    sm: "gap-3",
    md: "gap-4",
    lg: "gap-6",
  };

  return (
    <div className={cn("grid", columnClasses[columns], gapClasses[gap], className)}>
      {children}
    </div>
  );
}

interface DataGridItemProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function DataGridItem({ children, className, hover = false }: DataGridItemProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card transition-all duration-200",
        hover && "hover:border-primary/30 hover:shadow-card-hover hover:-translate-y-0.5",
        className,
      )}
    >
      {children}
    </div>
  );
}