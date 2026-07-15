"use client";

import {
  Check,
  RefreshCw,
  Loader2,
  ZoomIn,
  ImageOff,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageStatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import type { OrderPage } from "@/types";

interface IllustrationCardProps {
  page: OrderPage;
  onApprove: (illustrationId: string) => void;
  onRegenerate: (illustrationId: string) => void;
  /**
   * Retry a single page by page number. Used for PERMANENTLY_FAILED pages,
   * which have no Illustration record (so onRegenerate cannot be used).
   */
  onRetryPage: (pageNumber: number) => void;
  onImageClick: () => void;
  isApproving: boolean;
  isRegenerating: boolean;
}

export function IllustrationCard({
  page,
  onApprove,
  onRegenerate,
  onRetryPage,
  onImageClick,
  isApproving,
  isRegenerating,
}: IllustrationCardProps) {
  const isGenerating =
    page.status === "GENERATING" || page.status === "PENDING";
  const isApproved = page.status === "APPROVED";
  const isFailed = page.status === "PERMANENTLY_FAILED";
  const isReady = page.status === "READY_FOR_REVIEW";
  const hasImage = !!page.illustration?.signedUrl;
  const illustrationId = page.illustration?.id ?? "";

  return (
    <div
      className={cn(
        "group relative rounded-xl border overflow-hidden transition-all duration-300",
        isApproved
          ? "border-success/30 bg-success/5 shadow-glow-success"
          : isFailed
            ? "border-destructive/30 bg-destructive/5"
            : isReady
              ? "border-warning/20 bg-card/80 hover:border-warning/40 hover:-translate-y-0.5 hover:shadow-card-hover"
              : "border-border bg-card/60 hover:border-primary/20 hover:-translate-y-0.5 hover:shadow-card-hover",
      )}
    >
      {/* ── Image area ───────────────────────────────────── */}
      <div className="relative aspect-square bg-muted/40 overflow-hidden">
        {isGenerating ? (
          /* Generating shimmer */
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-primary/8 to-accent/5">
            <div className="absolute inset-0 overflow-hidden">
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
                style={{
                  backgroundSize: "200% 100%",
                  animation: "shimmer-slide 1.8s ease-in-out infinite",
                }}
              />
            </div>
            <Loader2 className="w-8 h-8 text-primary/60 animate-spin relative z-10" />
            <p className="text-[11px] text-muted-foreground relative z-10">
              Generating…
            </p>
          </div>
        ) : isFailed ? (
          /* Failed state */
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-destructive/5">
            <AlertTriangle className="w-8 h-8 text-destructive/60" />
            <p className="text-[11px] text-destructive/80 font-medium text-center px-2">
              Generation failed
            </p>
          </div>
        ) : hasImage ? (
          /* Actual illustration */
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={page.illustration!.signedUrl!}
              alt={`Page ${page.pageNumber}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            {/* Hover zoom overlay */}
            {!isApproved && (
              <div
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center cursor-pointer"
                onClick={onImageClick}
              >
                <div className="flex items-center gap-1.5 rounded-full border border-white/20 bg-black/50 backdrop-blur-sm px-3 py-1.5">
                  <ZoomIn className="w-3.5 h-3.5 text-white" />
                  <span className="text-xs text-white font-medium">
                    View Full
                  </span>
                </div>
              </div>
            )}
            {/* Approved lock overlay */}
            {isApproved && (
              <div className="absolute inset-0 bg-success/10 flex items-end justify-end p-2">
                <div className="flex items-center gap-1 rounded-full border border-success/40 bg-success/20 backdrop-blur-sm px-2 py-1">
                  <Lock className="w-2.5 h-2.5 text-success" />
                  <span className="text-[10px] font-semibold text-success">
                    Approved
                  </span>
                </div>
              </div>
            )}
            {/* Story text overlay preview */}
            {page.storyText && (
              <div className="absolute bottom-0 left-0 right-0 bg-[#1E293B]/60 p-3 flex items-center justify-center pointer-events-none">
                <p className="text-white text-xs text-center font-bold drop-shadow-md leading-relaxed">
                  {page.storyText}
                </p>
              </div>
            )}
          </>
        ) : (
          /* No image yet */
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <ImageOff className="w-8 h-8 text-muted-foreground/30" />
            <p className="text-[11px] text-muted-foreground/50">No image</p>
          </div>
        )}

        {/* Status ribbon — top-left corner */}
        <div className="absolute top-2 left-2 z-10">
          <PageStatusBadge status={page.status} />
        </div>
      </div>

      {/* ── Card footer ──────────────────────────────────── */}
      <div className="p-3 space-y-2.5">
        {/* Page label */}
        <div>
          <p className="text-xs font-semibold text-foreground">
            Page {page.pageNumber}
          </p>
          {page.sceneLabel && (
            <p className="text-[10px] text-muted-foreground truncate mt-0.5">
              {page.sceneLabel}
            </p>
          )}
        </div>

        {/* Action buttons */}
        {!isApproved && !isGenerating && (
          <div className="flex gap-1.5">
            {isReady && (
              <Button
                size="sm"
                variant="success"
                className="flex-1 h-7 text-[11px] font-semibold"
                onClick={() => onApprove(illustrationId)}
                disabled={isApproving || !illustrationId}
              >
                {isApproving ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
                Approve
              </Button>
            )}
            {(isReady || isFailed) && (
              <Button
                size="sm"
                variant="outline"
                className={cn(
                  "h-7 text-[11px]",
                  isReady ? "w-7 px-0" : "flex-1",
                )}
                onClick={() =>
                  isFailed
                    ? onRetryPage(page.pageNumber)
                    : onRegenerate(illustrationId)
                }
                disabled={isRegenerating || (!illustrationId && !isFailed)}
                title="Regenerate illustration"
              >
                {isRegenerating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
                {!isReady && "Retry"}
              </Button>
            )}
          </div>
        )}

        {isApproved && (
          <div className="flex items-center gap-1.5 text-[11px] text-success font-medium">
            <Check className="w-3 h-3" />
            Approved &amp; locked
          </div>
        )}
      </div>
    </div>
  );
}
