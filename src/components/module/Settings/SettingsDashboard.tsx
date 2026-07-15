"use client";

import { useState, useEffect, useCallback } from "react";
import { clientFetch, tokenStore } from "@/helper/client-fetch";
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Server,
  Cpu,
  Zap,
  ChevronDown,
  Activity,
  Layers,
  Copy,
  Check,
  AlertTriangle,
  Database,
  Clock,
  Shield,
  CheckSquare,
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
  aiProvider: string;
  availableProviders: string[];
}

interface QueueStats {
  aiQueue: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  };
  pdfQueue: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  };
}

interface ProviderInfo {
  key: string;
  providerName: string;
  defaultModel: string;
  supportsReferenceImage: boolean;
  isActive: boolean;
}

interface ProviderRecord {
  providerKey: string;
  displayName: string;
  modelName: string;
  isEnabled: boolean;
  isDefaultMaster: boolean;
  isDefaultPages: boolean;
  healthStatus: string;
  lastHealthCheckAt: string | null;
  isRegistered: boolean;
  supportsReferenceImage: boolean;
}

interface AIProviderConfig {
  activeProvider: string;
  activeProviderName: string;
  activeProviderModel: string;
  supportsReferenceImage: boolean;
  availableProviders: ProviderInfo[];
  providers?: ProviderRecord[];
  apiKeysConfigured: {
    openrouter: boolean;
    openai: boolean;
    gemini: boolean;
    nvidiaNim: boolean;
  };
}

export function SettingsDashboard() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [aiConfig, setAIConfig] = useState<AIProviderConfig | null>(null);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [switchingProvider, setSwitchingProvider] = useState(false);
  const [checkingProviderKey, setCheckingProviderKey] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>("");
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

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const statsRes = await fetch(`${apiUrl}/admin/queue-stats`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${tokenStore.get() || ""}` },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (statsRes.ok) {
        const json = await statsRes.json();
        setQueueStats(json.data);
      } else {
        setQueueStats(null);
      }
    } catch (err) {
      setQueueStats(null);
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const configRes = await fetch(`${apiUrl}/settings/ai-providers`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${tokenStore.get() || ""}` },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (configRes.ok) {
        const json = await configRes.json();
        setAIConfig(json.data);
        setSelectedProvider(json.data.activeProvider);
      } else {
        setAIConfig(null);
      }
    } catch (err) {
      setAIConfig(null);
    }

    if (!silent) setIsLoading(false);
    else setRefreshing(false);
  }, []);

  useEffect(() => { fetchHealth(); }, [fetchHealth]);

  const handleSwitchProvider = async () => {
    if (!selectedProvider || selectedProvider === aiConfig?.activeProvider) return;
    setSwitchingProvider(true);
    try {
      await clientFetch.patch(`/settings/ai-providers/${selectedProvider}`, {
        body: JSON.stringify({ isEnabled: true, isDefaultMaster: true, isDefaultPages: true }),
      });
      toast.success(`AI provider switched to "${selectedProvider}" successfully.`);
      await fetchHealth(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to switch AI provider.");
    } finally {
      setSwitchingProvider(false);
    }
  };

  const handleHealthCheck = async (providerKey: string) => {
    setCheckingProviderKey(providerKey);
    try {
      await clientFetch.post(`/settings/ai-providers/${providerKey}/health-check`, { body: "{}" });
      toast.success(`Health check completed for "${providerKey}".`);
      await fetchHealth(true);
    } catch {
      toast.error(`Health check failed for "${providerKey}".`);
    } finally {
      setCheckingProviderKey(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(true);
    toast.success("API URL copied to clipboard");
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="space-y-8 w-full mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/50 p-6 rounded-2xl border border-border/40 backdrop-blur-md ">
        <div>
          {/* <div className="flex items-center gap-2 mb-1.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Shield className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Super Admin Console
            </span>
          </div> */}
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            System Settings
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            Monitor API status, queues, and configure generative AI providers.
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
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-8">
            <Skeleton className="h-96 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
          <div className="space-y-8">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* ── Left / Main Column ── */}
          <div className="xl:col-span-2 space-y-8">

            {/* AI Provider Config */}
            <div className="surface-card p-6 space-y-8 ">
              <div className="flex items-center gap-3 border-b border-border/20 pb-4">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-foreground">AI Image Provider</h2>
                  <p className="text-xs font-medium text-muted-foreground mt-0.5">Configure the engine driving child illustration generation</p>
                </div>
              </div>

              {aiConfig ? (
                <div className="space-y-8">
                  {/* Active Provider Detail Card */}
                  <div className="p-6 rounded-2xl border border-success/20 bg-gradient-to-br from-success/5 to-transparent relative overflow-hidden ">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-success/10 rounded-full blur-[40px] pointer-events-none" />

                    <div className="flex items-center justify-between mb-5 relative z-10">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-success animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-success">
                          Current Production Driver
                        </span>
                      </div>
                      <Badge className="bg-success/10 text-success border border-success/20 px-3 py-1 font-bold uppercase tracking-wider text-[10px] ">
                        Active
                      </Badge>
                    </div>

                    <h3 className="text-2xl font-extrabold text-foreground relative z-10 mb-6">
                      {aiConfig.activeProviderName}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-5 border-t border-success/10 relative z-10">
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Identifier</p>
                        <p className="text-sm font-mono font-bold text-foreground mt-1">
                          {aiConfig.activeProvider}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Default Model</p>
                        <p className="text-sm font-mono font-bold text-foreground mt-1 truncate" title={aiConfig.activeProviderModel}>
                          {aiConfig.activeProviderModel}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Reference Support</p>
                        <p className="text-sm font-bold text-foreground mt-1 flex items-center gap-1.5">
                          {aiConfig.supportsReferenceImage ? (
                            <><CheckCircle2 className="w-4 h-4 text-success" /> Supported</>
                          ) : (
                            <><XCircle className="w-4 h-4 text-muted-foreground" /> N/A</>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Switch Provider */}
                  <div className="space-y-4 pt-2">
                    <h4 className="text-sm font-extrabold text-foreground">Switch AI Service Provider</h4>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <select
                          value={selectedProvider}
                          onChange={(e) => setSelectedProvider(e.target.value)}
                          disabled={switchingProvider}
                          className="w-full appearance-none rounded-xl border border-input bg-muted/30 px-4 py-3 pr-10 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all disabled:opacity-50"
                        >
                          {aiConfig.availableProviders.map((p) => (
                            <option key={p.key} value={p.key}>
                              {p.providerName} ({p.key})
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      </div>
                      <Button
                        onClick={handleSwitchProvider}
                        disabled={switchingProvider || selectedProvider === aiConfig.activeProvider}
                        className="h-12 px-6 rounded-xl font-bold "
                      >
                        {switchingProvider ? <><RefreshCw className="w-4 h-4 animate-spin mr-2" /> Applying…</> : "Apply Change"}
                      </Button>
                    </div>
                    {selectedProvider !== aiConfig.activeProvider && selectedProvider && (
                      <div className="flex items-start gap-3 p-4 rounded-xl border border-warning/20 bg-warning/10 text-warning-foreground text-sm  animate-fade-in">
                        <AlertTriangle className="w-5 h-5 shrink-0 text-warning mt-0.5" />
                        <p className="leading-relaxed font-medium">
                          <strong className="text-warning font-bold">Warning:</strong> Switching takes immediate effect. Active pipelines continue normally, but all new jobs will use the new provider.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* System API Keys */}
                  <div className="space-y-4 pt-4 border-t border-border/20">
                    <h4 className="text-sm font-extrabold text-foreground">Configured API Keys</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { name: "OpenRouter SDK", configured: aiConfig.apiKeysConfigured.openrouter },
                        { name: "OpenAI Platform", configured: aiConfig.apiKeysConfigured.openai },
                        { name: "Google Gemini", configured: aiConfig.apiKeysConfigured.gemini },
                        { name: "NVIDIA NIM", configured: aiConfig.apiKeysConfigured.nvidiaNim },
                      ].map(({ name, configured }) => (
                        <div key={name} className={cn(
                          "p-4 rounded-xl border flex items-center justify-between transition-all",
                          configured ? "border-success/20 bg-success/5" : "border-border/40 bg-muted/40"
                        )}>
                          <div className="flex items-center gap-2.5">
                            {configured ? <CheckSquare className="w-4 h-4 text-success" /> : <XCircle className="w-4 h-4 text-muted-foreground/60" />}
                            <span className={cn("text-sm font-bold", configured ? " text-success " : "text-muted-foreground")}>{name}</span>
                          </div>
                          <Badge className={cn(
                            "text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 ",
                            configured ? "bg-success/10 text-success border-success/20" : "bg-white text-muted-foreground border-border/40"
                          )}>
                            {configured ? "Active" : "Missing"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Provider Controls */}
                  {aiConfig.providers && aiConfig.providers.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-border/20">
                      <h4 className="text-sm font-extrabold text-foreground">Runtime Controls</h4>
                      <div className="space-y-4">
                        {aiConfig.providers.map((provider) => (
                          <div key={provider.providerKey} className={cn(
                            "p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ",
                            provider.isEnabled ? "border-primary/20 bg-white hover:border-primary/40" : "border-border/40 bg-muted/20 grayscale-[20%]"
                          )}>
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2.5">
                                <span className="font-extrabold text-foreground">{provider.displayName}</span>
                                <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                                  {provider.providerKey}
                                </span>
                              </div>
                              <p className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                                Model: <code className="font-mono text-foreground font-bold">{provider.modelName}</code>
                              </p>
                              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                Status:
                                <span className={cn(
                                  "font-bold",
                                  provider.healthStatus === "HEALTHY" ? "text-success" :
                                    provider.healthStatus === "ERROR" ? "text-destructive" : "text-warning"
                                )}>
                                  {provider.healthStatus}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                              <Badge className={cn(
                                "text-[10px] uppercase tracking-wider font-bold px-2 py-1 ",
                                provider.isEnabled ? "bg-success/10 text-success border-success/20" : "bg-white text-muted-foreground border-border/40"
                              )}>
                                {provider.isEnabled ? "Enabled" : "Disabled"}
                              </Badge>
                              {provider.isDefaultMaster && (
                                <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] uppercase tracking-wider font-bold px-2 py-1 ">Master</Badge>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleHealthCheck(provider.providerKey)}
                                disabled={checkingProviderKey === provider.providerKey}
                                className="h-8 rounded-lg font-bold ml-1 "
                              >
                                {checkingProviderKey === provider.providerKey ? <><RefreshCw className="w-3 h-3 animate-spin mr-1.5" /> Checking</> : "Check Health"}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 rounded-2xl border-2 border-dashed border-border/40 bg-muted/20">
                  <AlertTriangle className="w-10 h-10 text-warning mx-auto mb-3" />
                  <p className="text-base font-extrabold text-foreground">Configuration Offline</p>
                  <p className="text-sm font-medium text-muted-foreground mt-1 max-w-sm mx-auto">
                    API is unreachable or you lack Super Admin privileges.
                  </p>
                </div>
              )}
            </div>

            {/* Queue Health */}
            <div className="surface-card p-6 space-y-6 ">
              <div className="flex items-center justify-between gap-4 border-b border-border/20 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-accent/10 text-accent">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-foreground">Redis Queue Load</h2>
                    <p className="text-xs font-medium text-muted-foreground mt-0.5">Asynchronous job scheduler monitoring</p>
                  </div>
                </div>
                <Badge className="bg-success/10 text-success border-success/20 text-[10px] font-bold uppercase tracking-wider px-2 py-1 ">
                  <span className="w-1.5 h-1.5 rounded-full bg-success mr-1.5 animate-pulse" /> Online
                </Badge>
              </div>

              {queueStats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* AI Queue */}
                  <div className="space-y-5 p-5 rounded-2xl border border-border/40 bg-muted/20 ">
                    <h4 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                      AI Generation Queue
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Waiting", val: queueStats.aiQueue.waiting, color: queueStats.aiQueue.waiting > 10 ? "text-warning" : "text-foreground", bg: "bg-white" },
                        { label: "Active", val: queueStats.aiQueue.active, color: "text-primary", bg: "bg-primary/5 border-primary/20" },
                        { label: "Failed", val: queueStats.aiQueue.failed, color: queueStats.aiQueue.failed > 0 ? "text-destructive" : "text-muted-foreground", bg: queueStats.aiQueue.failed > 0 ? "bg-destructive/5 border-destructive/20" : "bg-white" }
                      ].map(s => (
                        <div key={s.label} className={cn("p-3 rounded-xl border border-border/40 text-center ", s.bg)}>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</span>
                          <span className={cn("text-2xl font-extrabold block mt-1", s.color)}>{s.val}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between text-xs font-bold text-muted-foreground">
                        <span>Completed Runs</span>
                        <span className="text-foreground">{queueStats.aiQueue.completed}</span>
                      </div>
                      <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden ">
                        <div className="h-full bg-gradient-primary rounded-full transition-all duration-1000" style={{ width: `${queueStats.aiQueue.completed + queueStats.aiQueue.failed === 0 ? 0 : Math.min(100, (queueStats.aiQueue.completed / (queueStats.aiQueue.completed + queueStats.aiQueue.failed)) * 100)}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* PDF Queue */}
                  <div className="space-y-5 p-5 rounded-2xl border border-border/40 bg-muted/20 ">
                    <h4 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
                      PDF Assembly Queue
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Waiting", val: queueStats.pdfQueue.waiting, color: queueStats.pdfQueue.waiting > 5 ? "text-warning" : "text-foreground", bg: "bg-white" },
                        { label: "Active", val: queueStats.pdfQueue.active, color: "text-accent", bg: "bg-accent/5 border-accent/20" },
                        { label: "Failed", val: queueStats.pdfQueue.failed, color: queueStats.pdfQueue.failed > 0 ? "text-destructive" : "text-muted-foreground", bg: queueStats.pdfQueue.failed > 0 ? "bg-destructive/5 border-destructive/20" : "bg-white" }
                      ].map(s => (
                        <div key={s.label} className={cn("p-3 rounded-xl border border-border/40 text-center ", s.bg)}>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</span>
                          <span className={cn("text-2xl font-extrabold block mt-1", s.color)}>{s.val}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between text-xs font-bold text-muted-foreground">
                        <span>Completed Runs</span>
                        <span className="text-foreground">{queueStats.pdfQueue.completed}</span>
                      </div>
                      <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden ">
                        <div className="h-full bg-gradient-primary rounded-full transition-all duration-1000" style={{ width: `${queueStats.pdfQueue.completed + queueStats.pdfQueue.failed === 0 ? 0 : Math.min(100, (queueStats.pdfQueue.completed / (queueStats.pdfQueue.completed + queueStats.pdfQueue.failed)) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 rounded-2xl border-2 border-dashed border-border/40 bg-muted/20">
                  <p className="text-sm font-bold text-muted-foreground">No active metrics available.</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Right Column ── */}
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
                    "text-[10px] font-bold px-2.5 py-1  uppercase tracking-wider",
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
                <div className="flex items-center gap-2 p-1.5 rounded-xl bg-muted/40 border border-border/40  overflow-hidden">
                  <code className="text-xs font-mono font-bold text-foreground truncate flex-1 pl-2">
                    {process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1"}
                  </code>
                  <button
                    onClick={() => copyToClipboard(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1")}
                    className="p-2 rounded-lg bg-white border border-border/40  text-muted-foreground hover:text-primary transition-all"
                    title="Copy URL"
                  >
                    {copiedUrl ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-muted/30 border border-border/20 text-[11px] font-medium text-muted-foreground leading-relaxed">
                Update <code className="font-mono font-bold text-foreground bg-white px-1 py-0.5 rounded ">NEXT_PUBLIC_API_URL</code> in your <code className="font-mono text-foreground">.env.local</code> file to change the backend target.
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
