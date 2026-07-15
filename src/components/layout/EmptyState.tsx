"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ReactNode, ComponentPropsWithoutRef } from "react";
import Link from "next/link";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
  variant?: "default" | "dashed";
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
  variant = "default",
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 gap-4 rounded-xl text-center",
        variant === "dashed"
          ? "border-2 border-dashed border-border bg-muted/30"
          : "border border-border bg-card",
        className,
      )}
    >
      {icon && (
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
          {icon}
        </div>
      )}
      <div className="space-y-2 max-w-xs">
        <p className="font-semibold text-lg text-foreground">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

interface EmptyStateActionProps extends ComponentPropsWithoutRef<typeof Button> {
  href?: string;
  children: ReactNode;
}

export function EmptyStateAction({
  href,
  children,
  className,
  ...props
}: EmptyStateActionProps) {
  if (href) {
    return (
      <Button asChild className={className} {...props}>
        <Link href={href}>{children}</Link>
      </Button>
    );
  }
  return <Button className={className} {...props}>{children}</Button>;
}