"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { tokenStore } from "@/helper/client-fetch";
import type { OrderStatusResponse } from "@/types";
import {
  ArrowLeft,
  Loader2,
  BookOpen,
  Sparkles,
  Rocket,
  Clock,
  CheckCircle2,
  ImageIcon,
  Circle,
  XCircle,
} from "lucide-react";
import { PhotoUpload } from "@/components/shared/PhotoUpload";
import { ordersService } from "@/services/orders/orders.service";
import { templatesService } from "@/services/templates/templates.service";
import type { ActiveTemplate } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const schema = z.object({
  childName: z.string().min(1, "Child name is required.").max(100),
  childAge: z.number().int().min(1).max(18).optional(),
  childGender: z.enum(["MALE", "FEMALE"], { error: "Child gender is required." }),
  templateId: z.string().uuid("Please select a template."),
});

type FormValues = z.infer<typeof schema>;

type TimelineStepId = "validate" | "upload" | "create" | "queue" | "generate" | "complete";

type TimelineStep = {
  id: TimelineStepId;
  label: string;
  description: string;
  status: "pending" | "active" | "done" | "error";
  progress?: number;
};

const PRODUCT_TYPE_COLORS: Record<string, string> = {
  STORY: "border-primary/25 bg-primary/10 text-primary",
  COLORING: "border-warning/25 bg-warning/10 text-warning",
  SUPERHERO: "border-destructive/25 bg-destructive/10 text-destructive",
  BIRTHDAY: "border-pink-400/25 bg-pink-500/10 text-pink-500",
  EDUCATIONAL: "border-info/25 bg-info/10 text-info",
  ISLAMIC: "border-success/25 bg-success/10 text-success",
  ALPHABET: "border-accent/25 bg-accent/10 text-accent",
};

export function NewOrderPage() {
  const router = useRouter();
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<ActiveTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [timelineSteps, setTimelineSteps] = useState<TimelineStep[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [progressStage, setProgressStage] = useState<"idle" | "active">("idle");
  const toastedMilestones = useRef(new Set<string>());

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { childGender: "FEMALE" },
  });

  useEffect(() => {
    templatesService
      .getActiveTemplates()
      .then((res) => setTemplates(res.data ?? []))
      .catch(() => toast.error("Failed to load templates."))
      .finally(() => setLoadingTemplates(false));
  }, []);

  const notifyOnce = (key: string, message: string, type: "success" | "error" | "info" = "success") => {
    if (toastedMilestones.current.has(key)) return;
    toastedMilestones.current.add(key);
    if (type === "error") toast.error(message);
    else if (type === "info") toast.info(message);
    else toast.success(message);
  };

  const buildTimeline = (patch: Partial<Record<TimelineStepId, Partial<TimelineStep>>>): TimelineStep[] => {
    const base: TimelineStep[] = [
      { id: "validate", label: "Validate details", description: "Checking form and template", status: "pending" },
      { id: "upload", label: "Upload photo", description: "Sending child photo to server", status: "pending", progress: 0 },
      { id: "create", label: "Create order", description: "Saving order and page records", status: "pending" },
      { id: "queue", label: "Queue AI jobs", description: "Starting illustration pipeline", status: "pending" },
      { id: "generate", label: "Generate illustrations", description: "AI is creating personalized pages", status: "pending", progress: 0 },
      { id: "complete", label: "Open order", description: "Redirecting to order progress", status: "pending" },
    ];
    return base.map((step) => ({ ...step, ...(patch[step.id] ?? {}) }));
  };

  const updateTimeline = (patch: Partial<Record<TimelineStepId, Partial<TimelineStep>>>) => {
    setTimelineSteps((prev) => {
      const current = prev.length > 0 ? prev : buildTimeline({});
      return current.map((step) => ({ ...step, ...(patch[step.id] ?? {}) }));
    });
  };

  const computeOverallProgress = (uploadPct: number, generationPct: number, stage: TimelineStepId): number => {
    const weights: Record<TimelineStepId, number> = { validate: 5, upload: 25, create: 10, queue: 10, generate: 45, complete: 5 };
    const order: TimelineStepId[] = ["validate", "upload", "create", "queue", "generate", "complete"];
    const stageIndex = order.indexOf(stage);
    let total = 0;
    for (let i = 0; i < order.length; i++) {
      const key = order[i];
      if (i < stageIndex) total += weights[key];
      else if (i === stageIndex) {
        if (key === "upload") total += (weights[key] * uploadPct) / 100;
        else if (key === "generate") total += (weights[key] * generationPct) / 100;
        else total += weights[key] * 0.5;
        break;
      }
    }
    return Math.min(100, Math.round(total));
  };

  const pollOrderStatus = async (apiUrl: string, orderId: string, totalPages: number): Promise<void> => {
    let pollCount = 0;
    const maxPolls = 90;
    let lastReadyPages = 0;
    let stuckPolls = 0;

    while (pollCount < maxPolls) {
      try {
        const statusRes = await fetch(`${apiUrl}/orders/${orderId}/status`, {
          cache: "no-store",
          headers: tokenStore.get() ? { Authorization: `Bearer ${tokenStore.get()}` } : {},
        });

        if (statusRes.ok) {
          const statusData = await statusRes.json();
          const status = statusData.data as OrderStatusResponse;
          const { progress } = status;
          const generationPct = progress?.progressPercent ?? 0;
          const readyPages = progress?.readyPages ?? 0;
          const generatingPages = progress?.generatingPages ?? 0;
          const failedPages = progress?.failedPages ?? 0;

          setOverallProgress(computeOverallProgress(100, generationPct, "generate"));
          updateTimeline({
            generate: {
              status: "active",
              progress: generationPct,
              description: readyPages > 0
                ? `${readyPages}/${totalPages} illustrations ready`
                : generatingPages > 0
                  ? `Generating page illustrations (${generatingPages} active)`
                  : "Waiting for AI worker to pick up jobs…",
            },
          });
          setStatusMessage(
            readyPages > 0
              ? `${readyPages} of ${totalPages} illustrations ready`
              : generatingPages > 0
                ? `AI is generating ${generatingPages} page(s)…`
                : "AI jobs queued — illustrations will start shortly",
          );

          const totalPageCount = progress?.totalPages ?? 0;
          const allPagesSettled = totalPageCount > 0 && readyPages + failedPages >= totalPageCount && generatingPages === 0;

          if (status.status === "FAILED" || (failedPages > 0 && allPagesSettled)) {
            updateTimeline({ generate: { status: "error" }, queue: { status: "error" } });
            notifyOnce("failed", failedPages > 0 ? `${failedPages} illustration(s) failed. Check the order page for details.` : "Order failed during AI setup. Is Redis running?", "error");
            router.push(`/orders/${orderId}`);
            return;
          }

          if (status.status === "GENERATING") {
            notifyOnce("generating", "AI image generation started!");
            stuckPolls = readyPages === 0 && generatingPages === 0 ? stuckPolls + 1 : 0;
            if (stuckPolls === 15) {
              notifyOnce("stuck", "Jobs are queued but not processing yet. Ensure Redis and the AI worker are running.", "info");
            }
          }

          if (readyPages > lastReadyPages) {
            notifyOnce(`ready-${readyPages}`, `${readyPages}/${totalPages} illustrations ready`);
            lastReadyPages = readyPages;
          }

          if (status.status === "GENERATING" && (pollCount >= 4 || readyPages > 0 || generatingPages > 0)) {
            updateTimeline({ generate: { status: "done", progress: generationPct }, complete: { status: "active" } });
            setOverallProgress(98);
            notifyOnce("redirect", "Opening order page to track live progress…", "info");
            await new Promise((resolve) => setTimeout(resolve, 800));
            updateTimeline({ complete: { status: "done" } });
            setOverallProgress(100);
            router.push(`/orders/${orderId}`);
            return;
          }
        }
      } catch (err) {
        console.error("Status polling error:", err);
      }
      pollCount++;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    notifyOnce("redirect-timeout", "Order created — opening order page…", "info");
    router.push(`/orders/${orderId}`);
  };

  const onSubmit = async (data: FormValues) => {
    if (!photo) { setPhotoError("Child photo is required."); return; }
    setPhotoError(null);
    setSubmitting(true);
    setProgressStage("active");
    setUploadProgress(0);
    setOverallProgress(0);
    toastedMilestones.current.clear();
    setTimelineSteps(buildTimeline({ validate: { status: "active" } }));
    setStatusMessage("Validating order details…");
    // notifyOnce("validate", "Validating order details…", "info");

    try {
      const formData = new FormData();
      formData.append("photo", photo);
      formData.append("childName", data.childName);
      if (typeof data.childAge === "number") formData.append("childAge", String(data.childAge));
      formData.append("childGender", data.childGender);
      formData.append("templateId", data.templateId);

      const xhr = new XMLHttpRequest();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      const template = templates.find((t) => t.id === data.templateId);
      const totalPages = template?.pageCount ?? 15;

      xhr.upload.addEventListener("progress", (e) => {
        if (!e.lengthComputable) return;
        const pct = Math.round((e.loaded / e.total) * 100);
        setUploadProgress(pct);
        setOverallProgress(computeOverallProgress(pct, 0, "upload"));
        updateTimeline({
          validate: { status: "done" },
          upload: {
            status: "active",
            progress: pct,
            description: pct >= 100 ? "Photo sent — creating order on server…" : `Uploading photo… ${pct}%`,
          },
        });
        setStatusMessage(pct >= 100 ? "Photo uploaded — creating order…" : `Uploading photo… ${pct}%`);
        // if (pct > 0) notifyOnce("upload-start", "Uploading child photo…", "info");
        // if (pct >= 100) notifyOnce("upload-done", "Photo uploaded successfully!");
      });

      const orderId = await new Promise<string>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try { resolve(JSON.parse(xhr.responseText).data?.id); }
            catch { reject(new Error("Invalid response from server")); }
            return;
          }
          try { reject(new Error(JSON.parse(xhr.responseText).error?.message || "Upload failed")); }
          catch { reject(new Error(`Upload failed: HTTP ${xhr.status}`)); }
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.onabort = () => reject(new Error("Upload cancelled"));
        xhr.open("POST", `${apiUrl}/orders`);
        const token = tokenStore.get();
        if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.send(formData);
      });

      setUploadProgress(100);
      setOverallProgress(computeOverallProgress(100, 0, "queue"));
      updateTimeline({ upload: { status: "done", progress: 100 }, create: { status: "done" }, queue: { status: "active" }, generate: { status: "pending", progress: 0 } });
      setStatusMessage("Order created — queueing AI illustration jobs…");
      // notifyOnce("order-created", "Order created successfully!");
      // notifyOnce("queue", "Starting AI illustration generation…", "info");
      updateTimeline({ queue: { status: "done" }, generate: { status: "active", progress: 0 } });
      setStatusMessage("AI pipeline started — tracking illustration progress…");
      await pollOrderStatus(apiUrl, orderId, totalPages);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create order.";
      updateTimeline({ upload: { status: "error" }, create: { status: "error" }, queue: { status: "error" } });
      setStatusMessage(message);
      toast.error(message);
      setProgressStage("idle");
      setTimelineSteps([]);
      setOverallProgress(0);
      setUploadProgress(0);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTemplateId = watch("templateId");
  const childName = watch("childName");
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  return (
    <div className="space-y-8 mx-auto  animate-fade-in">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="rounded-xl w-10 h-10 shadow-sm" asChild>
          <Link href="/orders"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Create Production Order</h1>
          <p className="text-sm font-medium text-muted-foreground mt-0.5">Initialize a new AI-generated personalized storybook</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ── Left: form inputs ────────────────────────── */}
          <div className="lg:col-span-7 space-y-6">
            {/* Photo upload */}
            <div className="surface-card p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-3 border-b border-border/50 pb-4">
                <div className="p-2 bg-primary/10 rounded-xl text-primary shrink-0">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">Character Reference Photo <span className="text-destructive">*</span></h2>
                  <p className="text-[12px] font-medium text-muted-foreground mt-0.5 leading-snug max-w-sm">
                    Upload a clear, front-facing photo of the child. This sets the character baseline for all illustrations.
                  </p>
                </div>
              </div>
              <PhotoUpload value={photo} onChange={setPhoto} error={photoError ?? undefined} />
            </div>

            {/* Child details */}
            <div className="surface-card p-6 space-y-5 shadow-sm">
              <div className="flex items-center gap-3 border-b border-border/50 pb-4 mb-2">
                <div className="p-2 bg-accent/10 rounded-xl text-accent shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">Protagonist Details</h2>
                  <p className="text-[12px] font-medium text-muted-foreground mt-0.5">Used for the narrative text and AI prompt injection.</p>
                </div>
              </div>

              {/* Name & Age Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground" htmlFor="childName">
                    Child Name <span className="text-destructive">*</span>
                  </label>
                  <Input id="childName" {...register("childName")} placeholder="e.g. Aisha" className="h-11 bg-muted/30 border-transparent focus-visible:border-primary focus-visible:bg-white rounded-xl transition-colors font-medium" />
                  {errors.childName && <p className="text-[11px] font-bold text-destructive">{errors.childName.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground" htmlFor="childAge">
                    Child Age{" "}
                    <span className="text-muted-foreground font-medium text-xs">(optional)</span>
                  </label>
                  <Input
                    id="childAge"
                    {...register("childAge", { setValueAs: (v) => v === "" || Number.isNaN(Number(v)) ? undefined : Number(v) })}
                    type="number" min={1} max={18} placeholder="e.g. 5" className="h-11 bg-muted/30 border-transparent focus-visible:border-primary focus-visible:bg-white rounded-xl transition-colors font-medium"
                  />
                </div>
              </div>

              {/* Gender */}
              <div className="space-y-2.5">
                <label className="text-sm font-bold text-foreground">
                  Child Gender <span className="text-destructive">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[{ value: "MALE", label: "Male" }, { value: "FEMALE", label: "Female" }].map((option) => {
                    const selected = watch("childGender") === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setValue("childGender", option.value as "MALE" | "FEMALE", { shouldValidate: true })}
                        className={cn(
                          "rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all duration-200",
                          selected
                            ? "border-primary bg-primary/5 text-primary shadow-sm"
                            : "border-border bg-white text-muted-foreground hover:border-primary/30 hover:bg-muted/30",
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                {errors.childGender && <p className="text-[11px] font-bold text-destructive">{errors.childGender.message}</p>}
              </div>
            </div>

            {/* Template selector */}
            <div className="surface-card p-6 space-y-5 shadow-sm">
              <div className="flex items-center gap-3 border-b border-border/50 pb-4 mb-2">
                <div className="p-2 bg-info/10 rounded-xl text-info shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">Book Template <span className="text-destructive">*</span></h2>
                  <p className="text-[12px] font-medium text-muted-foreground mt-0.5">Select the story framework and layout logic.</p>
                </div>
              </div>

              {loadingTemplates ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
                </div>
              ) : templates.length === 0 ? (
                <p className="text-sm text-destructive font-medium p-4 bg-destructive/5 rounded-xl border border-destructive/10">No active templates available. Contact your administrator to activate a template.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {templates.map((t) => {
                    const isSelected = selectedTemplateId === t.id;
                    const typeColor = PRODUCT_TYPE_COLORS[t.productType] ?? "border-border bg-muted/40 text-muted-foreground";
                    return (
                      <label
                        key={t.id}
                        className={cn(
                          "relative flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:-translate-y-0.5",
                          isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-white hover:border-primary/30 hover:bg-muted/30",
                        )}
                      >
                        <input type="radio" value={t.id} className="sr-only" {...register("templateId")} />

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-foreground leading-tight">{t.name}</p>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                          </div>
                          {t.description && <p className="text-[11px] font-medium text-muted-foreground leading-snug line-clamp-1">{t.description}</p>}
                        </div>

                        <div className="flex items-center gap-3 sm:shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-border sm:pl-4">
                          <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", typeColor)}>
                            {t.productType.toLowerCase()}
                          </span>
                          <span className="text-[11px] font-bold text-muted-foreground">{t.pageCount} pages</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
              {errors.templateId && <p className="text-[11px] font-bold text-destructive">{errors.templateId.message}</p>}
            </div>
          </div>

          {/* ── Right: preview panel ─────────────────────── */}
          <div className="lg:col-span-5 space-y-5">
            <div className="sticky top-10 space-y-5">
              {/* Preview card */}
              <div className="surface-card p-1 shadow-md border-border/60">
                <div className="bg-muted/10 rounded-[14px] p-5 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary text-white rounded-xl">
                      <Rocket className="w-4 h-4" />
                    </div>
                    <h2 className="text-sm font-bold text-foreground">Order Preview</h2>
                  </div>

                  {selectedTemplate ? (
                    <div className="space-y-5 animate-fade-in">
                      {/* Book mockup */}
                      <div className="relative rounded-2xl bg-gradient-primary p-6 text-center space-y-3 overflow-hidden shadow-sm">
                        <div className="absolute inset-0 bg-mesh-primary opacity-30 mix-blend-screen" />

                        <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto relative z-10 border border-white/10 shadow-glow-sm">
                          <BookOpen className="w-8 h-8 text-white" />
                        </div>
                        <div className="relative z-10">
                          <p className="text-xl font-extrabold text-white tracking-tight">{childName || "Child"}&apos;s Book</p>
                          <p className="text-[11px] font-medium text-white/80 uppercase tracking-widest mt-1">{selectedTemplate.name}</p>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col items-center gap-1 rounded-xl bg-white border border-border p-3 shadow-sm">
                          <ImageIcon className="w-4 h-4 text-primary mb-1" />
                          <p className="text-lg font-extrabold text-foreground leading-none">{selectedTemplate.pageCount}</p>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Illustrations</p>
                        </div>
                        <div className="flex flex-col items-center gap-1 rounded-xl bg-white border border-border p-3 shadow-sm">
                          <Clock className="w-4 h-4 text-primary mb-1" />
                          <p className="text-lg font-extrabold text-foreground leading-none">2–4 <span className="text-sm">min</span></p>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Est. Production</p>
                        </div>
                      </div>

                      {/* Ready info */}
                      <div className="flex items-start gap-3 rounded-xl bg-success/10 border border-success/20 p-4 shadow-sm">
                        <Sparkles className="w-5 h-5 text-success shrink-0" />
                        <div className="text-sm space-y-1">
                          <p className="font-bold text-success">Ready to Generate</p>
                          <p className="text-muted-foreground font-medium text-xs leading-relaxed">
                            AI will create {selectedTemplate.pageCount} custom illustrations targeting the appearance of {" "}
                            <strong className="text-foreground font-bold">{childName || "the child"}</strong>.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-white border border-border flex items-center justify-center shadow-sm">
                        <BookOpen className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                      <p className="text-sm font-bold text-muted-foreground">Select a template to preview</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit / progress */}
              {progressStage === "idle" ? (
                <Button type="submit" disabled={submitting || loadingTemplates} className="w-full h-14 rounded-xl text-base shadow-glow-sm hover:shadow-glow-md font-bold" size="lg">
                  {submitting ? (
                    <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Initializing Pipeline…</>
                  ) : (
                    <><Rocket className="w-5 h-5 mr-2" /> Start AI Production</>
                  )}
                </Button>
              ) : (
                <div className="space-y-3 animate-fade-in">
                  <div className="surface-card border-primary/20 bg-primary/5 p-6 space-y-5 shadow-glow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        Pipeline Progress
                      </h3>
                      <span className="text-sm font-extrabold text-primary tabular-nums">{overallProgress}%</span>
                    </div>

                    <div className="h-2 w-full bg-muted/60 rounded-full overflow-hidden ">
                      <div
                        className="h-full bg-gradient-primary rounded-full transition-all duration-500"
                        style={{ width: `${overallProgress}%` }}
                      />
                    </div>

                    {statusMessage && <p className="text-[12px] font-bold text-muted-foreground">{statusMessage}</p>}

                    <div className="space-y-2.5 pt-2">
                      {timelineSteps.map((step) => (
                        <div
                          key={step.id}
                          className={cn(
                            "flex items-start gap-3 rounded-xl border px-4 py-3 transition-colors",
                            step.status === "active" && "border-primary/30 bg-primary/10 shadow-sm",
                            step.status === "done" && "border-success/30 bg-success/10",
                            step.status === "error" && "border-destructive/30 bg-destructive/10",
                            step.status === "pending" && "border-border/50 bg-white/50 opacity-60",
                          )}
                        >
                          <span className="mt-0.5 shrink-0">
                            {step.status === "done" ? <CheckCircle2 className="w-4 h-4 text-success" /> :
                              step.status === "active" ? <Loader2 className="w-4 h-4 text-primary animate-spin" /> :
                                step.status === "error" ? <XCircle className="w-4 h-4 text-destructive" /> :
                                  <Circle className="w-4 h-4 text-muted-foreground/40" />}
                          </span>
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className={cn("text-xs font-bold", step.status === "pending" ? "text-muted-foreground" : "text-foreground")}>{step.label}</p>
                              {typeof step.progress === "number" && step.status === "active" && (
                                <span className="text-[10px] font-bold text-primary tabular-nums">{step.progress}%</span>
                              )}
                            </div>
                            <p className="text-[11px] font-medium text-muted-foreground leading-snug">{step.description}</p>
                            {typeof step.progress === "number" && (step.id === "upload" || step.id === "generate") && (
                              <div className="h-1 w-full bg-muted/50 rounded-full overflow-hidden mt-1.5">
                                <div className="h-full bg-primary/80 rounded-full transition-all duration-300" style={{ width: `${step.progress}%` }} />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center pt-2">
                    Keep this page open while processing
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
