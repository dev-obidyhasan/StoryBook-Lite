import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors duration-200 select-none",
  {
    variants: {
      variant: {
        default:     "border-primary/25 bg-primary/10 text-primary",
        secondary:   "border-secondary bg-secondary text-secondary-foreground",
        destructive: "border-destructive/25 bg-destructive/10 text-destructive",
        outline:     "border-border bg-transparent text-foreground",
        success:     "border-success/25 bg-success/10 text-success",
        warning:     "border-warning/30 bg-warning/10 text-warning",
        info:        "border-info/25 bg-info/10 text-info",
        muted:       "border-border bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };