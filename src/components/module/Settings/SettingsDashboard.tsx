"use client";

import { useState, useEffect, useCallback } from "react";
import {
  XCircle,
  RefreshCw,
  Server,
  Activity,
  Copy,
  Check,
  Database,
  Clock,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface HealthData {
  environment: string;
  uptime: string;
  timestamp: string;
  version: string;
  storage: string;
}

export function SettingsDashboard() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const fetchHealth = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setRefreshing(true);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
    const baseUrl = apiUrl.replace(/\/api\/v1\/?$/, "");

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${baseUrl}/api/health`, { cache: "no-store", signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setHealth(json.data);
      setApiOnline(true);
    } catch (err) {
      setApiOnline(false);
      setHealth(null);
    }

    if (!silent) setIsLoading(false);
    else setRefreshing(false);
  }, []);

  useEffect(() => { fetchHealth(); }, [fetchHealth]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(true);
    toast.success("API URL copied to clipboard");
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="space-y-8 w-full w-full mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/50 p-6 rounded-2xl border border-border/40 backdrop-blur-md ">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            System Settings
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            Monitor API status and system health.
          </p>
        </div>
        <Button
          onClick={() => fetchHealth(true)}
          disabled={refreshing || isLoading}
          variant="ghost"
          size="lg"
          className="rounded-xl h-12 font-bold w-full sm:w-auto"
        >
          <RefreshCw className={cn("w-5 h-5 mr-2 text-primary", refreshing && "animate-spin")} />
          {refreshing ? "Refreshing..." : "Sync Health"}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-8">
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* System Diagnostics */}
          <div className="surface-card p-6 space-y-6 ">
            <div className="flex items-center justify-between border-b border-border/20 pb-4">
              <div className="flex items-center gap-2.5">
                <Activity className="text-primary w-5 h-5" />
                <h2 className="text-lg font-extrabold text-foreground">Diagnostics</h2>
              </div>
              {apiOnline !== null && (
                <Badge className={cn(
                  "text-[10px] font-bold px-2.5 py-1 uppercase tracking-wider",
                  apiOnline ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"
                )}>
                  {apiOnline ? "Online" : "Offline"}
                </Badge>
              )}
            </div>

            {health ? (
              <div className="space-y-4">
                {[
                  { icon: Server, label: "Environment", val: health.environment, color: "text-foreground" },
                  { icon: Database, label: "Storage", val: health.storage, color: "text-foreground" },
                  { icon: Clock, label: "Uptime", val: health.uptime, color: "text-primary truncate max-w-[140px]" },
                  { icon: Shield, label: "API Version", val: `v${health.version}`, color: "text-foreground" }
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between pb-3 border-b border-border/20 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-muted text-muted-foreground">
                        <s.icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-foreground">{s.label}</span>
                    </div>
                    <span className={cn("text-xs font-mono font-bold uppercase", s.color)}>{s.val}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 text-center text-destructive bg-destructive/5 rounded-2xl border border-destructive/10">
                <XCircle className="w-8 h-8 mb-3" />
                <p className="text-sm font-extrabold uppercase tracking-wider">Gateway Offline</p>
                <p className="text-xs font-medium mt-1">Cannot reach backend API.</p>
              </div>
            )}
          </div>

          {/* Gateway Settings */}
          <div className="surface-card p-6 space-y-5 ">
            <div className="border-b border-border/20 pb-4">
              <h2 className="text-lg font-extrabold text-foreground">Gateway</h2>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">API Host URL</span>
              <div className="flex items-center gap-2 p-1.5 rounded-xl bg-muted/40 border border-border/40 overflow-hidden">
                <code className="text-xs font-mono font-bold text-foreground truncate flex-1 pl-2">
                  {process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1"}
                </code>
                <button
                  onClick={() => copyToClipboard(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1")}
                  className="p-2 rounded-lg bg-white border border-border/40 text-muted-foreground hover:text-primary transition-all"
                  title="Copy URL"
                >
                  {copiedUrl ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/30 border border-border/20 text-[11px] font-medium text-muted-foreground leading-relaxed">
              Update <code className="font-mono font-bold text-foreground bg-white px-1 py-0.5 rounded">NEXT_PUBLIC_API_URL</code> in your <code className="font-mono text-foreground">.env.local</code> file to change the backend target.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
