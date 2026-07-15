"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Download, RefreshCw, FileText, Clock,
  HardDrive, Loader2, CheckCircle2, AlertCircle,
  Sparkles, BookOpen, Timer,
} from "lucide-react";
import { toast } from "sonner";
import { pdfService } from "@/services/pdf/pdf.service";
import { ordersService } from "@/services/orders/orders.service";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import type { PDFInfo, OrderStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const POLL_INTERVAL_MS = 3_000;

function ConfettiStar({ style }: { style: React.CSSProperties }) {
  return (
    <div
      className="absolute w-2 h-2 rounded-sm opacity-70"
      style={style}
    />
  );
}

export function PDFReadyPage({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [pdfInfo, setPdfInfo] = useState<PDFInfo | null>(null);
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const [childName, setChildName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regenConfirmOpen, setRegenConfirmOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const fetchStatus = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);
      try {
        const [orderRes, pdfRes] = await Promise.all([
          ordersService.getOrderById(orderId),
          pdfService.getPDFInfo(orderId),
        ]);
        const status = orderRes.data?.status ?? null;
        setOrderStatus(status);
        setChildName(orderRes.data?.childName ?? "");
        setPdfInfo(pdfRes.data ?? null);
        if (status === "PDF_READY") setShowConfetti(true);
      } catch {
        if (!silent) toast.error("Failed to load PDF status.");
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [orderId],
  );

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const pollOrderStatus = useCallback(async () => {
    try {
      const res = await ordersService.getOrderStatus(orderId);
      const newStatus = res.data?.status;
      if (newStatus && newStatus !== orderStatus) fetchStatus(true);
    } catch { /* silent */ }
  }, [orderId, orderStatus, fetchStatus]);

  useEffect(() => {
    if (orderStatus !== "PDF_PENDING") return;
    const interval = setInterval(pollOrderStatus, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [orderStatus, pollOrderStatus]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await pdfService.getDownloadUrl(orderId);
      const url = res.data?.downloadUrl;
      if (!url) throw new Error("No download URL returned.");
      window.open(url, "_blank");
      toast.success("PDF download started!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download failed.");
    } finally { setDownloading(false); }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await pdfService.regeneratePDF(orderId);
      toast.success("PDF regeneration started!");
      setRegenConfirmOpen(false);
      await fetchStatus(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Regeneration failed.");
    } finally { setRegenerating(false); }
  };

  const formatBytes = (bytes: number | null | undefined): string => {
    if (!bytes) return "—";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDaysUntilExpiry = (expiresAt: string) => {
    const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000);
    return days;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 ">
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-lg" />
          <Skeleton className="h-7 w-40" />
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  const isPending = orderStatus === "PDF_PENDING";
  const isReady = orderStatus === "PDF_READY";
  const daysLeft = pdfInfo?.expiresAt ? getDaysUntilExpiry(pdfInfo.expiresAt) : null;

  return (
    <div className="space-y-6 ">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/orders/${orderId}`}><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">PDF Download</h1>
          <p className="text-sm text-muted-foreground">
            {childName ? `${childName}'s storybook` : "Your personalized storybook"}
          </p>
        </div>
      </div>

      {/* ── Main card ──────────────────────────────────────── */}
      <div>
        <Card
          glass
          className={cn(
            "relative overflow-hidden transition-all duration-500",
            isReady && "border-success/30 shadow-glow-success",
          )}
        >
          {/* Confetti dots on success */}
          {showConfetti && isReady && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[
                { top: "10%", left: "15%", bg: "#6366f1", transform: "rotate(15deg)", animation: "confetti-pop 0.6s ease-out 0.1s both" },
                { top: "20%", right: "12%", bg: "#22c55e", transform: "rotate(-20deg)", animation: "confetti-pop 0.6s ease-out 0.2s both" },
                { top: "5%", left: "50%", bg: "#f59e0b", transform: "rotate(30deg)", animation: "confetti-pop 0.6s ease-out 0.3s both" },
                { top: "15%", right: "30%", bg: "#a855f7", transform: "rotate(-10deg)", animation: "confetti-pop 0.6s ease-out 0.15s both" },
                { top: "8%", left: "35%", bg: "#14b8a6", transform: "rotate(45deg)", animation: "confetti-pop 0.6s ease-out 0.25s both" },
              ].map((s, i) => (
                <ConfettiStar key={i} style={s} />
              ))}
            </div>
          )}

          {/* Top gradient strip */}
          {/* <div className={cn(
          "h-1 w-full",
          isReady ? "bg-gradient-to-r from-success to-emerald-400" :
          isPending ? "bg-gradient-to-r from-primary to-accent" :
          "bg-destructive/50"
        )} /> */}

          <CardContent className="p-8 flex flex-col items-center text-center gap-6">
            {/* Status icon */}
            <div className={cn(
              "relative flex items-center justify-center w-24 h-24 rounded-2xl transition-all duration-500",
              isReady ? "bg-success/15 border border-success/30 shadow-glow-success" :
                isPending ? "bg-primary/15 border border-primary/20" :
                  "bg-muted border border-border",
            )}>
              {isPending ? (
                <>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/5" />
                  {/* Animated stacked pages */}
                  <div className="relative flex items-end justify-center gap-0.5">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-6 h-8 rounded-sm border border-primary/30 bg-primary/10"
                        style={{
                          animation: `float 1.5s ease-in-out ${i * 0.2}s infinite`,
                          height: `${28 + i * 4}px`,
                        }}
                      />
                    ))}
                  </div>
                  {/* <Loader2 className="absolute -bottom-2 -right-2 w-6 h-6 text-primary animate-spin" /> */}
                </>
              ) : isReady ? (
                <>
                  <FileText className="w-12 h-12 text-success" />
                  <div className="absolute -top-2 -right-2 flex items-center justify-center w-7 h-7 rounded-full bg-success border-2 border-background shadow-glow-success">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                </>
              ) : (
                <AlertCircle className="w-12 h-12 text-destructive/60" />
              )}
            </div>

            {/* Status text */}
            <div className="space-y-2">
              {isPending ? (
                <>
                  <h2 className="text-xl font-bold text-primary">Composing Your Book…</h2>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Assembling {childName ? `${childName}'s` : "your"} storybook PDF.
                    This usually takes 15–30 seconds.
                  </p>
                  <p className="text-xs text-muted-foreground/70 max-w-xs">
                    If it stays here for more than a minute, start the PDF worker in the backend:{" "}
                    <code className="text-[11px] bg-muted px-1 rounded">npm run worker:pdf</code>
                  </p>
                </>
              ) : isReady ? (
                <>
                  <div className="flex items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5 text-success" />
                    <h2 className="text-xl font-bold text-success">PDF Ready!</h2>
                    <Sparkles className="w-5 h-5 text-success" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your print-ready storybook is available for download.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-destructive">PDF Not Available</h2>
                  <p className="text-sm text-muted-foreground">
                    Go back to the order and approve all illustrations first.
                  </p>
                </>
              )}
            </div>

            {/* PDF metadata */}
            {isReady && pdfInfo && (
              <div className="grid grid-cols-3 gap-0 w-full rounded-xl overflow-hidden border border-border bg-muted/20">
                {[
                  { icon: HardDrive, label: "File Size", value: formatBytes(pdfInfo.fileSizeBytes) },
                  { icon: Clock, label: "Generated", value: new Date(pdfInfo.createdAt).toLocaleDateString(undefined, { dateStyle: "short" }) },
                  {
                    icon: Timer,
                    label: "Expires In",
                    value: daysLeft !== null ? `${daysLeft}d` : "—",
                    valueClass: daysLeft !== null && daysLeft <= 5 ? "text-warning" : "text-foreground",
                  },
                ].map((stat, idx) => {
                  const Icon = stat.icon;
                  return (
                    <div key={idx} className={cn(
                      "flex flex-col items-center gap-1.5 py-4",
                      idx < 2 && "border-r border-border",
                    )}>
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <p className={cn("text-base font-bold tabular-nums", stat.valueClass ?? "text-foreground")}>
                        {stat.value}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Actions */}
            {isReady && (
              <div className="flex flex-col gap-3 w-full">
                <Button
                  variant="success"
                  size="lg"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full text-base font-semibold h-12"
                >
                  {downloading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Opening PDF…</>
                  ) : (
                    <><Download className="w-5 h-5" /> Download Print-Ready PDF</>
                  )}
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setRegenConfirmOpen(true)}
                    disabled={regenerating}
                    className="flex-1"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Regenerate PDF
                  </Button>
                  <Button variant="outline" asChild className="flex-1">
                    <Link href={`/orders/${orderId}/review`}>
                      <BookOpen className="w-4 h-4" />
                      View Illustrations
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            {!isReady && !isPending && (
              <Button asChild className="w-full">
                <Link href={`/orders/${orderId}/review`}>← Back to Review</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmModal
        isOpen={regenConfirmOpen}
        title="Regenerate PDF?"
        description="The current PDF will be deleted and recomposed from your approved illustrations. No AI generation will run. This takes 15–30 seconds."
        confirmLabel="Yes, Regenerate"
        variant="primary"
        isLoading={regenerating}
        onConfirm={handleRegenerate}
        onCancel={() => setRegenConfirmOpen(false)}
      />
    </div>
  );
}
