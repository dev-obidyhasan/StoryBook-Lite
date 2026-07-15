"use client";

import { AlertTriangle, CheckCircle2, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary" | "warning";
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const VARIANT_CONFIG = {
  danger: {
    icon: AlertTriangle,
    iconBg: "bg-destructive/10 border-destructive/20",
    iconColor: "text-destructive",
    confirmVariant: "destructive" as const,
  },
  primary: {
    icon: CheckCircle2,
    iconBg: "bg-primary/10 border-primary/20",
    iconColor: "text-primary",
    confirmVariant: "default" as const,
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-warning/10 border-warning/20",
    iconColor: "text-warning",
    confirmVariant: "warning" as const,
  },
};

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const cfg = VARIANT_CONFIG[variant];
  const Icon = cfg.icon;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      {/* Blur overlay */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in" />

      {/* Modal card */}
      <div className="relative z-10 w-full max-w-md animate-scale-in">
        <div className="rounded-2xl border bg-card shadow-lg overflow-hidden">
          {/* Top accent bar */}
          <div
            className={cn(
              "h-1 w-full",
              variant === "danger"
                ? "bg-destructive"
                : variant === "warning"
                  ? "bg-warning"
                  : "bg-primary",
            )}
          />

          <div className="p-6 space-y-5">
            {/* Close button */}
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon + text */}
            <div className="flex items-start gap-4">
              <div className={cn("flex items-center justify-center w-10 h-10 rounded-xl border shrink-0", cfg.iconBg)}>
                <Icon className={cn("w-5 h-5", cfg.iconColor)} />
              </div>
              <div className="space-y-1 min-w-0 pt-1">
                <h3 className="text-base font-semibold text-foreground leading-snug">
                  {title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={onCancel}
                disabled={isLoading}
              >
                {cancelLabel}
              </Button>
              <Button
                variant={cfg.confirmVariant}
                className="flex-1"
                onClick={onConfirm}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {isLoading ? "Processing…" : confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
