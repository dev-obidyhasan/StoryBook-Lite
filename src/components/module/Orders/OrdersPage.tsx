"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Plus, Search, RefreshCw, BookOpen, Clock, CheckCircle2,
  Eye, Activity, AlertCircle, Filter,
} from "lucide-react";
import { toast } from "sonner";
import { ordersService } from "@/services/orders/orders.service";
import { OrderStatusBadge } from "@/components/shared/StatusBadge";
import { OrderListSkeleton } from "@/components/shared/LoadingSkeleton";
import type { Order, OrderStatus, ApiMeta } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STATUS_FILTERS: { label: string; value: OrderStatus | ""; dotClass: string }[] = [
  { label: "All", value: "", dotClass: "" },
  { label: "Generating", value: "GENERATING", dotClass: "bg-info" },
  { label: "Review", value: "REVIEW", dotClass: "bg-warning" },
  { label: "PDF Ready", value: "PDF_READY", dotClass: "bg-success" },
  { label: "Cancelled", value: "CANCELLED", dotClass: "bg-muted-foreground" },
  { label: "Failed", value: "FAILED", dotClass: "bg-destructive" },
];

const ACTIVE_STATUSES: OrderStatus[] = ["GENERATING", "PENDING", "PDF_PENDING"];
const REFRESH_INTERVAL_MS = 10_000;

const KPI_CONFIG = [
  { label: "Total Books", key: "total", icon: BookOpen, accent: "kpi-primary", iconBg: "bg-primary/10", iconColor: "text-primary" },
  { label: "In Production", key: "active", icon: Activity, accent: "kpi-info", iconBg: "bg-info/10", iconColor: "text-info" },
  { label: "Pending Review", key: "review", icon: Eye, accent: "kpi-warning", iconBg: "bg-warning/10", iconColor: "text-warning" },
  { label: "PDF Ready", key: "ready", icon: CheckCircle2, accent: "kpi-success", iconBg: "bg-success/10", iconColor: "text-success" },
];

type KpiKey = "total" | "active" | "review" | "ready";

function getOrderProgress(order: Order): { pct: number; barClass: string } {
  switch (order.status) {
    case "PDF_READY": return { pct: 100, barClass: "bg-success" };
    case "REVIEW": return { pct: 75, barClass: "bg-yellow-600" };
    case "GENERATING": return { pct: 40, barClass: "bg-info" };
    case "PDF_PENDING": return { pct: 90, barClass: "bg-primary" };
    case "FAILED": return { pct: 100, barClass: "bg-destructive" };
    case "CANCELLED": return { pct: 0, barClass: "bg-muted-foreground/30" };
    default: return { pct: 10, barClass: "bg-muted-foreground/30" };
  }
}

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchOrders = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);
      try {
        const res = await ordersService.getOrders({
          status: statusFilter || undefined,
          childName: debouncedSearch || undefined,
          page,
          limit: 12,
        });
        setOrders(res.data ?? []);
        setMeta(res.meta ?? null);
      } catch {
        if (!silent) toast.error("Failed to load orders.");
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [statusFilter, debouncedSearch, page],
  );

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    const hasActive = orders.some((o) => ACTIVE_STATUSES.includes(o.status));
    if (!hasActive) return;
    const interval = setInterval(() => fetchOrders(true), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [orders, fetchOrders]);

  const totalPages = meta ? Math.ceil(meta.total / 12) : 1;
  const kpiValues: Record<KpiKey, number> = {
    total: meta?.total ?? orders.length,
    active: orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length,
    review: orders.filter((o) => o.status === "REVIEW").length,
    ready: orders.filter((o) => o.status === "PDF_READY").length,
  };

  return (
    <div className="space-y-8 pb-10">
      {/* ── Page header ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Book Production
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            Manage &amp; review AI-generated personalized storybooks
          </p>
        </div>
        <Button asChild size="lg" className="shadow-glow-sm hover:shadow-glow-md transition-shadow font-bold">
          <Link href="/orders/new">
            <Plus className="w-5 h-5 mr-1" />
            New Order
          </Link>
        </Button>
      </div>

      {/* ── KPI cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {KPI_CONFIG.map((kpi, idx) => {
          const Icon = kpi.icon;
          const val = kpiValues[kpi.key as KpiKey];
          return (
            <div
              key={kpi.label}
              className={cn(
                "surface-card p-5 animate-fade-up",
                // kpi.accent,
              )}
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                <div className={cn("flex items-center justify-center w-10 h-10 rounded-xl", kpi.iconBg)}>
                  <Icon className={cn("w-5 h-5", kpi.iconColor)} />
                </div>
              </div>
              <p className="text-4xl font-extrabold text-foreground tabular-nums tracking-tight">{val}</p>
            </div>
          );
        })}
      </div>

      {/* ── Filters & search ──────────────────────────────── */}
      <div className="surface-card p-3 flex flex-col md:flex-row gap-4 items-center justify-between z-10   backdrop-blur-md bg-white/90">
        <div className="relative w-full md:w-80 shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search by child name…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10 h-11 bg-muted/30 border-transparent focus-visible:border-primary focus-visible:bg-white transition-all rounded-xl font-medium"
          />
        </div>

        <div className="flex w-full md:w-auto items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-muted-foreground/70 shrink-0 hidden sm:block" />
          <div className="flex gap-2 shrink-0">
            {STATUS_FILTERS.map((f) => {
              const isActive = statusFilter === f.value;
              return (
                <button
                  key={f.value}
                  data-active={isActive}
                  onClick={() => { setStatusFilter(f.value); setPage(1); }}
                  className={cn(
                    "inline-flex h-9 items-center gap-2 rounded-xl border px-3.5 text-xs font-bold transition-all duration-200 ",
                    isActive
                      ? "bg-primary text-white border-primary"
                      : "bg-white border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  {f.dotClass && (
                    <span className={cn("w-2 h-2 rounded-full", f.dotClass)} />
                  )}
                  {f.label}
                </button>
              );
            })}
          </div>
          <div className="h-6 w-px bg-border mx-1 hidden md:block" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fetchOrders()}
            className="shrink-0 text-muted-foreground hover:text-foreground rounded-xl"
          >
            <RefreshCw className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────── */}
      {isLoading ? (
        <OrderListSkeleton />
      ) : orders.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-24 gap-6 rounded-3xl border-2 border-dashed border-border bg-white animate-fade-in">
          <div className="flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/5 border border-primary/10 ">
            <BookOpen className="w-10 h-10 text-primary" />
          </div>
          <div className="text-center space-y-2">
            <p className="font-extrabold text-xl text-foreground">No orders found</p>
            <p className="text-sm font-medium text-muted-foreground max-w-sm">
              {search || statusFilter
                ? "Try adjusting your search query or filters."
                : "Create your first book order to begin AI-powered production."}
            </p>
          </div>
          {!search && !statusFilter && (
            <Button asChild size="lg" className="shadow-glow-sm font-bold mt-2">
              <Link href="/orders/new">
                <Plus className="w-5 h-5 mr-1" />
                Create First Order
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {orders.map((order, idx) => {
            const hasPDF = order.status === "PDF_READY";
            const isReview = order.status === "REVIEW";
            const isFailed = order.status === "FAILED";
            const isCancelled = order.status === "CANCELLED";
            const isGenerating = ACTIVE_STATUSES.includes(order.status);
            const progress = getOrderProgress(order);

            return (
              <div
                key={order.id}
                className="surface-card flex flex-col hover-lift animate-fade-up overflow-hidden relative group"
                style={{ animationDelay: `${Math.min(idx * 50, 300)}ms` }}
              >
                {/* Background ambient glow based on status */}
                {isGenerating && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-info/10 rounded-full blur-[40px] pointer-events-none" />
                )}
                {isReview && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-warning/10 rounded-full blur-[40px] pointer-events-none" />
                )}

                <div className="p-5 flex-1 space-y-5 z-10 relative">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20 text-primary font-extrabold text-lg uppercase shrink-0 ">
                        {order.childName[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-extrabold text-base text-foreground truncate">
                          {order.childName}
                        </p>
                        {order.childAge && (
                          <p className="text-xs font-medium text-muted-foreground mt-0.5">Age {order.childAge}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <OrderStatusBadge status={order.status} />
                      {isGenerating && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-info/10 border border-info/20 text-[10px] font-bold text-info uppercase tracking-wider">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-info opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-info" />
                          </span>
                          Active
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2.5 text-sm font-medium text-muted-foreground">
                      <div className="w-6 h-6 rounded-md bg-muted/50 flex items-center justify-center shrink-0">
                        <BookOpen className="w-3.5 h-3.5 text-foreground/70" />
                      </div>
                      <span className="truncate">{order.template?.name ?? "—"}</span>
                      <span className="ml-auto shrink-0 text-[10px] font-bold uppercase tracking-widest border border-border rounded-lg px-2 py-1 bg-muted/30">
                        {order.template?.productType?.toLowerCase() ?? "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm font-medium text-muted-foreground">
                      <div className="w-6 h-6 rounded-md bg-muted/50 flex items-center justify-center shrink-0">
                        <Clock className="w-3.5 h-3.5 text-foreground/70" />
                      </div>
                      <span>
                        {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                      <span>Production Progress</span>
                      <span className="text-foreground">{progress.pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted/60 rounded-full overflow-hidden ">
                      <div
                        className={cn("h-full rounded-full transition-all duration-700", progress.barClass)}
                        style={{ width: `${progress.pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* CTA button */}
                <div className="p-5 pt-0 z-10 relative">
                  <Button
                    asChild
                    variant={isReview ? "default" : hasPDF ? "success" : "outline"}
                    className={cn(
                      "w-full h-11 font-bold rounded-xl",
                      isReview && "shadow-md",
                      hasPDF && "shadow-md"
                    )}
                  >
                    <Link href={`/orders/${order.id}`}>
                      {isReview ? (
                        <><Eye className="w-4 h-4 mr-2" /> Review Illustrations</>
                      ) : hasPDF ? (
                        <><CheckCircle2 className="w-4 h-4 mr-2" /> Download PDF</>
                      ) : isFailed ? (
                        <><AlertCircle className="w-4 h-4 mr-2 text-destructive" /> View Error Details</>
                      ) : (
                        "View Order"
                      )}
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ────────────────────────────────────── */}
      {meta && meta.total > 12 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-4 border-t border-border/50">
          <p className="text-sm font-medium text-muted-foreground">
            Showing <strong className="text-foreground">{(page - 1) * 12 + 1}–{Math.min(page * 12, meta.total)}</strong> of <strong className="text-foreground">{meta.total}</strong> orders
          </p>
          <div className="flex gap-2 items-center">
            <Button variant="outline" size="sm" className="rounded-xl font-semibold h-9 px-4" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="text-sm font-bold text-foreground px-3 tabular-nums bg-muted/50 rounded-lg h-9 flex items-center justify-center">
              {page} / {totalPages}
            </span>
            <Button variant="outline" size="sm" className="rounded-xl font-semibold h-9 px-4" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
