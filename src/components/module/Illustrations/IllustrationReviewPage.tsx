"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCheck,
  Loader2,
  Download,
  Sparkles,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { illustrationsService } from "@/services/illustrations/illustrations.service";
import { pdfService } from "@/services/pdf/pdf.service";
import { IllustrationCard } from "./IllustrationCard";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { ImageLightbox } from "@/components/shared/ImageLightbox";
import { IllustrationGridSkeleton } from "@/components/shared/LoadingSkeleton";
import type { IllustrationsReviewResponse, OrderPage } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const POLL_INTERVAL_MS = 5_000;

export function IllustrationReviewPage({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [data, setData] = useState<IllustrationsReviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkApproving, setBulkApproving] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());
  const [regeneratingIds, setRegeneratingIds] = useState<Set<string>>(
    new Set(),
  );
  // Track page-number-based retries (used for PERMANENTLY_FAILED pages, which
  // have no Illustration record and therefore no illustrationId).
  const [retryingPageNumbers, setRetryingPageNumbers] = useState<Set<number>>(
    new Set(),
  );

  const fetchIllustrations = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);
      try {
        const res = await illustrationsService.getOrderIllustrations(orderId);
        setData(res.data);
      } catch (err) {
        if (!silent) {
          toast.error(
            err instanceof Error
              ? err.message
              : "Failed to load illustrations.",
          );
        }
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [orderId],
  );

  useEffect(() => {
    fetchIllustrations();
  }, [fetchIllustrations]);

  // Auto-refresh while any page is generating
  useEffect(() => {
    if (!data) return;
    const hasGenerating = data.pages.some(
      (p) => p.status === "GENERATING" || p.status === "PENDING",
    );
    if (!hasGenerating) return;
    const interval = setInterval(
      () => fetchIllustrations(true),
      POLL_INTERVAL_MS,
    );
    return () => clearInterval(interval);
  }, [data, fetchIllustrations]);

  const handleApprove = async (illustrationId: string) => {
    setApprovingIds((prev) => new Set([...prev, illustrationId]));
    try {
      await illustrationsService.approveIllustration(illustrationId);
      toast.success("Illustration approved!");
      await fetchIllustrations(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to approve.");
    } finally {
      setApprovingIds((prev) => {
        const n = new Set(prev);
        n.delete(illustrationId);
        return n;
      });
    }
  };

  const handleRegenerate = async (illustrationId: string) => {
    setRegeneratingIds((prev) => new Set([...prev, illustrationId]));
    try {
      await illustrationsService.rejectAndRegenerate(illustrationId);
      toast.success("Regeneration queued. Check back in a moment.");
      await fetchIllustrations(true);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to queue regeneration.",
      );
    } finally {
      setRegeneratingIds((prev) => {
        const n = new Set(prev);
        n.delete(illustrationId);
        return n;
      });
    }
  };

  // Retry a single page by page number. Primary path for PERMANENTLY_FAILED
  // pages, which have no Illustration record (so handleRegenerate cannot be
  // used — it requires an illustrationId that does not exist).
  const handleRetryPage = async (pageNumber: number) => {
    setRetryingPageNumbers((prev) => new Set([...prev, pageNumber]));
    try {
      await illustrationsService.retryPage(orderId, pageNumber);
      toast.success(`Page ${pageNumber} retry queued. Check back in a moment.`);
      await fetchIllustrations(true);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to queue page retry.",
      );
    } finally {
      setRetryingPageNumbers((prev) => {
        const n = new Set(prev);
        n.delete(pageNumber);
        return n;
      });
    }
  };

  const handleBulkApprove = async () => {
    setBulkApproving(true);
    try {
      const res = await illustrationsService.bulkApproveAll(orderId);
      toast.success(`${res.data?.approvedCount ?? 0} illustrations approved!`);
      setBulkConfirmOpen(false);
      await fetchIllustrations(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bulk approval failed.");
    } finally {
      setBulkApproving(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (
      data?.orderStatus === "PDF_PENDING" ||
      data?.orderStatus === "PDF_READY"
    ) {
      router.push(`/orders/${orderId}/pdf`);
      return;
    }
    try {
      await pdfService.generatePDF(orderId);
      toast.success("PDF generation queued!");
      router.push(`/orders/${orderId}/pdf`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to start PDF generation.",
      );
    }
  };

  const lightboxImages = (data?.pages ?? [])
    .filter((p) => p.illustration?.signedUrl)
    .map((p) => ({
      url: p.illustration!.signedUrl!,
      label: `Page ${p.pageNumber}${p.sceneLabel ? ` — ${p.sceneLabel}` : ""}`,
    }));

  const getPageLightboxIndex = (page: OrderPage) =>
    lightboxImages.findIndex((img) => img.url === page.illustration?.signedUrl);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-muted animate-pulse" />
          <div className="h-7 w-52 bg-muted rounded-lg animate-pulse" />
        </div>
        <IllustrationGridSkeleton />
      </div>
    );
  }

  if (!data)
    return (
      <div className="text-center py-20 text-muted-foreground">
        No data found.
      </div>
    );

  const { summary, pages, orderStatus } = data;
  const allApproved =
    summary.approved === summary.totalPages && summary.totalPages > 0;
  const hasReadyForReview = summary.readyForReview > 0;

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/orders/${orderId}`}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Illustration Review
              </h1>
              {summary.generating > 0 && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-info opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-info" />
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Approve or regenerate each page illustration
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {allApproved && orderStatus !== "PDF_READY" && (
            <Button variant="success" onClick={handleGeneratePDF}>
              <Download className="w-4 h-4" />
              {orderStatus === "PDF_PENDING"
                ? "View PDF Progress"
                : "Generate PDF"}
            </Button>
          )}
          {hasReadyForReview && (
            <Button onClick={() => setBulkConfirmOpen(true)}>
              <CheckCheck className="w-4 h-4" />
              Approve All ({summary.readyForReview})
            </Button>
          )}
        </div>
      </div>

      {/* ── Progress summary ───────────────────────────────── */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <ProgressBar
            value={summary.progressPercent}
            label={`${summary.approved} of ${summary.totalPages} pages approved`}
            size="lg"
            variant={allApproved ? "success" : "primary"}
          />

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3">
            {[
              {
                label: "Approved",
                count: summary.approved,
                icon: CheckCircle2,
                color: "text-success",
                bg: "bg-success/10 border-success/20",
              },
              {
                label: "For Review",
                count: summary.readyForReview,
                icon: Eye,
                color: "text-warning",
                bg: "bg-warning/10 border-warning/20",
              },
              {
                label: "Generating",
                count: summary.generating,
                icon: Activity,
                color: "text-info",
                bg: "bg-info/10 border-info/20",
              },
              {
                label: "Failed",
                count: summary.failed,
                icon: AlertTriangle,
                color: "text-destructive",
                bg: "bg-destructive/10 border-destructive/20",
              },
            ].map(({ label, count, icon: Icon, color, bg }) => (
              <div
                key={label}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 ${bg}`}
              >
                <Icon className={`w-4 h-4 ${color}`} />
                <p className={`text-xl font-bold tabular-nums ${color}`}>
                  {count}
                </p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          {summary.generating > 0 && (
            <div className="flex items-center gap-2 text-xs text-info">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>
                AI is generating {summary.generating} illustration
                {summary.generating !== 1 ? "s" : ""}. Page refreshes
                automatically.
              </span>
            </div>
          )}

          {allApproved && (
            <div className="flex items-center gap-2 rounded-lg bg-success/10 border border-success/20 px-4 py-2.5">
              <Sparkles className="w-4 h-4 text-success" />
              <p className="text-sm font-semibold text-success">
                All illustrations approved!{" "}
                {orderStatus !== "PDF_READY"
                  ? "Generate PDF to complete production."
                  : "PDF is ready to download."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Illustration grid ─────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {pages.map((page) => (
          <IllustrationCard
            key={page.pageId}
            page={page}
            onApprove={handleApprove}
            onRegenerate={handleRegenerate}
            onRetryPage={handleRetryPage}
            onImageClick={() => setLightboxIndex(getPageLightboxIndex(page))}
            isApproving={approvingIds.has(page.illustration?.id ?? "")}
            isRegenerating={
              regeneratingIds.has(page.illustration?.id ?? "") ||
              retryingPageNumbers.has(page.pageNumber)
            }
          />
        ))}
      </div>

      {/* ── Bulk approve confirm ──────────────────────────── */}
      <ConfirmModal
        isOpen={bulkConfirmOpen}
        title="Approve all illustrations?"
        description={`This will approve all ${summary.readyForReview} illustrations that are ready for review. Approved illustrations cannot be regenerated.`}
        confirmLabel="Approve All"
        variant="primary"
        isLoading={bulkApproving}
        onConfirm={handleBulkApprove}
        onCancel={() => setBulkConfirmOpen(false)}
      />

      {/* ── Lightbox ──────────────────────────────────────── */}
      <ImageLightbox
        images={lightboxImages}
        currentIndex={lightboxIndex ?? 0}
        isOpen={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
        referencePhotoUrl={data?.childPhotoUrl ?? undefined}
      />
    </div>
  );
}
