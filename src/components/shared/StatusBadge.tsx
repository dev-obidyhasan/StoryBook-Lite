"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OrderStatus, PageStatus } from "@/types";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "muted";

type StatusConfig = {
  label: string;
  variant: BadgeVariant;
  pulse?: boolean;
};

const ORDER_STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  PENDING: { label: "Pending", variant: "muted" },
  GENERATING: { label: "Generating", variant: "info", pulse: true },
  REVIEW: { label: "Review", variant: "warning" },
  PDF_PENDING: { label: "Creating PDF", variant: "info", pulse: true },
  PDF_READY: { label: "PDF Ready", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "muted" },
  FAILED: { label: "Failed", variant: "destructive" },
};

const PAGE_STATUS_CONFIG: Record<PageStatus, StatusConfig> = {
  PENDING: { label: "Pending", variant: "muted" },
  GENERATING: { label: "Generating", variant: "info", pulse: true },
  READY_FOR_REVIEW: { label: "Ready", variant: "warning" },
  APPROVED: { label: "Approved", variant: "success" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  PERMANENTLY_FAILED: { label: "Failed", variant: "destructive" },
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
  size?: "sm" | "md";
  showDot?: boolean;
}

interface PageStatusBadgeProps {
  status: PageStatus;
  size?: "sm" | "md";
  showDot?: boolean;
}

export function OrderStatusBadge({ status, size = "md", showDot = true }: OrderStatusBadgeProps) {
  const cfg: StatusConfig = ORDER_STATUS_CONFIG[status] ?? { label: status, variant: "muted" as BadgeVariant };
  return (
    <Badge
      variant={cfg.variant}
      className={cn("gap-1.5 font-medium", size === "sm" && "text-[10px] px-2 py-0.5")}
    >
      {showDot && cfg.pulse && (
        <span className={cn("inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse", size === "sm" && "w-1 h-1")} />
      )}
      {cfg.label}
    </Badge>
  );
}

export function PageStatusBadge({ status, size = "sm", showDot = true }: PageStatusBadgeProps) {
  const cfg: StatusConfig = PAGE_STATUS_CONFIG[status] ?? { label: status, variant: "muted" as BadgeVariant };
  return (
    <Badge
      variant={cfg.variant}
      className={cn("gap-1.5 font-medium", size === "sm" && "text-[10px] px-2 py-0.5 uppercase tracking-wider")}
    >
      {showDot && cfg.pulse && (
        <span className={cn("inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse", size === "sm" && "w-1 h-1")} />
      )}
      {cfg.label}
    </Badge>
  );
}