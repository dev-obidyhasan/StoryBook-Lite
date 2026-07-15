"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, BookOpen, Clock, User, CheckCircle2, Eye,
  XCircle, Loader2, RefreshCw, FileText, Hash, Calendar, Zap,
} from "lucide-react";
import { toast } from "sonner";
import { ordersService } from "@/services/orders/orders.service";
import { OrderStatusBadge, PageStatusBadge } from "@/components/shared/StatusBadge";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import type { OrderDetail, OrderStatus } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const POLL_INTERVAL = 3_000;
const ACTIVE_STATUSES: OrderStatus[] = ["GENERATING", "PENDING", "PDF_PENDING"];

const STATUS_STEPS = [
  { key: "PENDING", label: "Order Created", desc: "Queuing AI jobs" },
  { key: "GENERATING", label: "AI Generating", desc: "Creating illustrations" },
  { key: "REVIEW", label: "Review Ready", desc: "Awaiting approval" },
  { key: "PDF_PENDING", label: "Composing PDF", desc: "Building final book" },
  { key: "PDF_READY", label: "PDF Ready", desc: "Download available" },
];

function getStepIndex(status: OrderStatus): number {
  const map: Record<string, number> = {
    PENDING: 0, GENERATING: 1, REVIEW: 2, PDF_PENDING: 3, PDF_READY: 4,
    FAILED: -1, CANCELLED: -1,
  };
  return map[status] ?? 0;
}

/** Route for a pipeline step — only reachable steps (at or before current) are linked. */
function getStepHref(stepIdx: number, orderId: string, currentStepIndex: number): string | null {
  if (stepIdx > currentStepIndex) return null;
  if (stepIdx <= 1) return `/orders/${orderId}`;
  if (stepIdx === 2) return `/orders/${orderId}/review`;
  return `/orders/${orderId}/pdf`;
}

export function OrderDetailPage({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reprocessing, setReprocessing] = useState(false);

  const fetchOrder = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);
      try {
        const res = await ordersService.getOrderById(orderId);
        setOrder(res.data);
      } catch {
        if (!silent) toast.error("Failed to load order.");
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [orderId],
  );

  const pollOrderStatus = useCallback(async () => {
    try {
      const res = await ordersService.getOrderStatus(orderId);
      const newStatus = res.data?.status;
      if (newStatus && order && newStatus !== order.status) {
        fetchOrder(true);
      }
    } catch { /* silent */ }
  }, [orderId, order, fetchOrder]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);
  useEffect(() => {
    if (!order || !ACTIVE_STATUSES.includes(order.status)) return;
    const interval = setInterval(pollOrderStatus, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [order, pollOrderStatus]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await ordersService.cancelOrder(orderId);
      toast.success("Order cancelled.");
      setCancelOpen(false);
      fetchOrder(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel order.");
    } finally { setCancelling(false); }
  };

  const handleReprocess = async () => {
    setReprocessing(true);
    try {
      await ordersService.reprocessOrder(orderId);
      toast.success("Order reprocessed! AI generation re-queued.");
      fetchOrder(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reprocess order.");
    } finally { setReprocessing(false); }
  };

  const handleRetryFailedPages = async () => {
    setReprocessing(true);
    try {
      await ordersService.retryFailedPages(orderId);
      toast.success("Failed illustrations re-queued for generation.");
      fetchOrder(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to retry illustrations.");
    } finally { setReprocessing(false); }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 mx-auto">
        <div className="flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  if (!order)
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="p-4 rounded-full bg-muted">
          <FileText className="w-8 h-8 text-muted-foreground/50" />
        </div>
        <p className="text-lg font-bold text-foreground">Order not found</p>
        <Button variant="outline" asChild>
          <Link href="/orders">Return to Orders</Link>
        </Button>
      </div>
    );

  const isActive = ACTIVE_STATUSES.includes(order.status);
  const isCancellable = !["PDF_READY", "CANCELLED", "FAILED"].includes(order.status);
  const isFailed = order.status === "FAILED";
  const stepIndex = getStepIndex(order.status);
  const isTerminated = isFailed || order.status === "CANCELLED";

  const readyCount = order.orderPages?.filter((p) =>
    ["READY_FOR_REVIEW", "APPROVED"].includes(p.status)
  ).length ?? 0;
  const failedCount =
    order.orderPages?.filter((p) => p.status === "PERMANENTLY_FAILED").length ?? 0;
  const totalPages = order.template?.pageCount ?? order.orderPages?.length ?? 0;

  return (
    <div className="space-y-8 mx-auto animate-fade-in">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-white/50 p-4 rounded-2xl border border-border/40 backdrop-blur-md ">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="w-10 h-10 rounded-xl " asChild>
            <Link href="/orders">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              {order.childName}&apos;s Book
            </h1>
            <p className="text-xs text-muted-foreground font-mono mt-0.5 flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded-md w-fit">
              <Hash className="w-3 h-3 text-primary/70" />
              {orderId.slice(0, 12)}…
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isActive && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-info/10 border border-info/20 text-[11px] font-bold text-info uppercase tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-info opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-info" />
              </span>
              Processing
            </div>
          )}
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      {/* ── Info card ──────────────────────────────────────── */}
      <div className="surface-card p-6 sm:p-8 space-y-8  relative overflow-hidden">
        {/* Subtle background glow if active */}
        {isActive && (
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[60px] pointer-events-none" />
        )}

        {/* Grid info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 relative z-10">
          {[
            { icon: User, label: "Protagonist", value: order.childName },
            { icon: Calendar, label: "Child Age", value: order.childAge ? `${order.childAge} years` : "Not specified" },
            { icon: BookOpen, label: "Template", value: order.template?.name ?? "—" },
            { icon: Clock, label: "Created Date", value: new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" }) },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="space-y-1.5">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-primary/70" />
                  {item.label}
                </p>
                <p className="text-sm font-extrabold text-foreground">{item.value}</p>
              </div>
            );
          })}
        </div>

        {/* Production timeline */}
        {!isTerminated && (
          <div className="pt-8 border-t border-border/50 relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <Zap className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-extrabold text-foreground uppercase tracking-widest">
                Production Pipeline
              </h3>
            </div>

            <div className="flex items-start gap-0 relative">
              {STATUS_STEPS.map((step, idx) => {
                const isDone = idx < stepIndex;
                const isCurrentStep = idx === stepIndex;
                const href = getStepHref(idx, orderId, stepIndex);

                const stepDot = (
                  <div className={cn(
                    "relative flex items-center justify-center w-8 h-8 rounded-full border-[3px] transition-all duration-300 bg-white z-10",
                    isDone ? "border-primary shadow-glow-sm" :
                      isCurrentStep ? "border-primary shadow-glow-md" :
                        "border-border bg-muted/30",
                    href && "group-hover:scale-110 group-hover:border-primary/70",
                  )}>
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    ) : isCurrentStep ? (
                      isActive ? (
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
                        </span>
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                      )
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-border" />
                    )}
                  </div>
                );

                const stepLabel = (
                  <div className="mt-3 flex flex-col items-center">
                    <p className={cn(
                      "text-[11px] font-bold tracking-wide uppercase text-center",
                      isDone ? "text-primary" :
                        isCurrentStep ? "text-primary" :
                          "text-muted-foreground",
                      href && "group-hover:text-primary transition-colors",
                    )}>
                      {step.label}
                    </p>
                    {isCurrentStep && isActive && (
                      <p className="text-[10px] text-muted-foreground font-medium text-center mt-1 animate-pulse">
                        {step.desc}
                      </p>
                    )}
                  </div>
                );

                return (
                  <div key={step.key} className="flex flex-col flex-1 min-w-0 relative">
                    {/* Connecting line */}
                    {idx < STATUS_STEPS.length - 1 && (
                      <div className="absolute top-4 left-[50%] w-full h-0.5 -mt-px -z-10 px-4">
                        <div className={cn(
                          "w-full h-full rounded-full transition-all duration-700",
                          idx < stepIndex ? "bg-primary" : "bg-border",
                        )} />
                      </div>
                    )}

                    {href ? (
                      <Link
                        href={href}
                        title={step.desc}
                        className="group flex flex-col items-center flex-1 min-w-0 cursor-pointer transition-all hover:-translate-y-1"
                      >
                        {stepDot}
                        {stepLabel}
                      </Link>
                    ) : (
                      <div className="flex flex-col items-center flex-1 min-w-0 opacity-80">
                        {stepDot}
                        {stepLabel}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Progress bar */}
        {totalPages > 0 && (
          <div className="pt-8 border-t border-border/50 relative z-10">
            <ProgressBar
              value={Math.round((readyCount / totalPages) * 100)}
              // label={<span className="font-bold text-sm text-foreground">{readyCount} of {totalPages} pages generated</span>}
              indeterminate={isActive && readyCount === 0}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-border/50 relative z-10">
          {order.status === "REVIEW" && (
            <Button asChild className="h-11 shadow-glow-sm font-bold rounded-xl">
              <Link href={`/orders/${orderId}/review`}>
                <Eye className="w-4 h-4 mr-2" />
                Review Illustrations
              </Link>
            </Button>
          )}
          {order.status === "PDF_PENDING" && (
            <Button asChild className="h-11 shadow-glow-sm font-bold rounded-xl" disabled>
              <Link href={`/orders/${orderId}/pdf`}>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Composing Final PDF
              </Link>
            </Button>
          )}
          {order.status === "PDF_READY" && (
            <Button variant="default" className="h-11 shadow-glow-sm font-bold rounded-xl" asChild>
              <Link href={`/orders/${orderId}/pdf`}>
                <FileText className="w-4 h-4 mr-2" />
                Download Print-Ready PDF
              </Link>
            </Button>
          )}
          {failedCount > 0 && (
            <Button variant="warning" className="h-11 font-bold rounded-xl" onClick={handleRetryFailedPages} disabled={reprocessing}>
              {reprocessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              {reprocessing ? "Retrying…" : `Retry ${failedCount} Failed Page${failedCount === 1 ? "" : "s"}`}
            </Button>
          )}
          {isFailed && (
            <Button variant="warning" className="h-11 font-bold rounded-xl" onClick={handleReprocess} disabled={reprocessing}>
              {reprocessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              {reprocessing ? "Reprocessing…" : "Reprocess Order"}
            </Button>
          )}
          {isCancellable && (
            <Button variant="outline" className="h-11 font-bold rounded-xl text-destructive border-destructive/30 hover:bg-destructive/5 hover:border-destructive ml-auto" onClick={() => setCancelOpen(true)}>
              <XCircle className="w-4 h-4 mr-2" />
              Cancel Production
            </Button>
          )}
        </div>
      </div>

      {/* ── Pages grid ─────────────────────────────────────── */}
      {order.orderPages && order.orderPages.length > 0 && (
        <div className="surface-card p-6 sm:p-8 space-y-6 ">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 text-primary rounded-lg">
                <FileText className="w-4 h-4" />
              </div>
              Detailed Page Status
            </h3>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-muted border border-border text-xs font-bold text-muted-foreground tabular-nums">
              {order.orderPages.length} Pages Total
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {order.orderPages.map((pg) => (
              <div
                key={pg.id}
                className="flex items-center justify-between p-3 rounded-xl border border-border bg-white  hover:border-primary/30 transition-colors"
              >
                <span className="text-xs font-bold text-foreground">
                  Page {pg.pageNumber}
                </span>
                <PageStatusBadge status={pg.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={cancelOpen}
        title="Cancel this order?"
        description="All in-progress AI generation will be stopped immediately. This action cannot be undone."
        confirmLabel="Yes, Cancel Order"
        variant="danger"
        isLoading={cancelling}
        onConfirm={handleCancel}
        onCancel={() => setCancelOpen(false)}
      />
    </div>
  );
}
