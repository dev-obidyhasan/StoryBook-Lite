"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus, BookMarked, Loader2, ToggleLeft, ToggleRight,
  BookOpen, Hash, Layers, Sparkles, Settings2, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { templatesService } from "@/services/templates/templates.service";
import type { BookTemplate } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const PRODUCT_TYPE_CONFIG: Record<string, { label: string; color: string; accent: string }> = {
  STORY: { label: "Story", color: "border-primary/25 bg-primary/10 text-primary", accent: "from-primary to-accent" },
  COLORING: { label: "Coloring", color: "border-warning/25 bg-warning/10 text-warning", accent: "from-warning to-amber-400" },
  SUPERHERO: { label: "Superhero", color: "border-destructive/25 bg-destructive/10 text-destructive", accent: "from-destructive to-orange-500" },
  BIRTHDAY: { label: "Birthday", color: "border-pink-500/25 bg-pink-500/10 text-pink-500", accent: "from-pink-500 to-rose-400" },
  EDUCATIONAL: { label: "Educational", color: "border-info/25 bg-info/10 text-info", accent: "from-info to-cyan-400" },
  ISLAMIC: { label: "Islamic", color: "border-success/25 bg-success/10 text-success", accent: "from-success to-emerald-400" },
  ALPHABET: { label: "Alphabet", color: "border-primary/25 bg-primary/10 text-primary", accent: "from-primary to-accent" },
};

export function TemplateListPage() {
  const [templates, setTemplates] = useState<BookTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const res = await templatesService.getTemplates();
      setTemplates(res.data ?? []);
    } catch {
      toast.error("Failed to load templates.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleToggle = async (template: BookTemplate) => {
    setTogglingId(template.id);
    try {
      await templatesService.toggleStatus(template.id, !template.isActive);
      toast.success(`Template ${template.isActive ? "deactivated" : "activated"}.`);
      setTemplates((prev) =>
        prev.map((t) => t.id === template.id ? { ...t, isActive: !t.isActive } : t),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Toggle failed.");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-8 mx-auto animate-fade-in">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            {/* <div className="p-2 bg-primary/10 rounded-xl text-primary shadow-sm border border-primary/20">
              <Sparkles className="w-5 h-5" />
            </div> */}
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Templates</h1>
          </div>
          <p className="text-sm font-medium text-muted-foreground ml-1">
            Manage book templates, page layouts &amp; AI prompt logic.
          </p>
        </div>
        <Button asChild size="lg" className="shadow-glow-sm hover:shadow-glow-md font-bold rounded-xl h-11 w-full sm:w-auto">
          <Link href="/templates/new">
            <Plus className="w-5 h-5 mr-1" />
            Create Template
          </Link>
        </Button>
      </div>

      {/* ── Content ─────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-6 rounded-3xl border-2 border-dashed border-border bg-white shadow-sm">
          <div className="flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/5 border border-primary/10  text-primary">
            <BookMarked className="w-10 h-10" />
          </div>
          <div className="text-center space-y-2">
            <p className="font-extrabold text-xl text-foreground">No templates configured</p>
            <p className="text-sm font-medium text-muted-foreground max-w-md mx-auto">
              You need at least one active template before generating any books. Start by defining the story layout and AI prompts.
            </p>
          </div>
          <Button asChild size="lg" className="shadow-glow-sm font-bold mt-2 rounded-xl">
            <Link href="/templates/new"><Plus className="w-5 h-5 mr-1" /> Create First Template</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {templates.map((template, idx) => {
            const typeConfig = PRODUCT_TYPE_CONFIG[template.productType] ?? {
              label: template.productType, color: "border-border bg-muted/40 text-muted-foreground", accent: "from-muted-foreground/40 to-muted-foreground/20",
            };
            const isToggling = togglingId === template.id;

            return (
              <div
                key={template.id}
                className={cn(
                  "surface-card group relative overflow-hidden transition-all duration-300 hover-lift flex flex-col",
                  !template.isActive && "opacity-70 grayscale-[20%] hover:grayscale-0 hover:opacity-100",
                )}
                style={{ animationDelay: `${Math.min(idx * 50, 300)}ms` }}
              >
                {/* Accent glow background */}
                {template.isActive && (
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-[40px] pointer-events-none transition-all group-hover:bg-primary/10" />
                )}

                {/* Top colored edge */}
                {/* <div className={cn("absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r transition-opacity", typeConfig.accent, template.isActive ? "opacity-100" : "opacity-40")} /> */}

                <div className="p-6 flex-1 space-y-5 relative z-10">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className={cn(
                      "flex items-center justify-center w-12 h-12 rounded-2xl shrink-0 shadow-sm transition-transform group-hover:scale-105",
                      typeConfig.color.replace("text-", "text-").replace("bg-", "bg-"),
                      "border"
                    )}>
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {template.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 border border-success/20 text-[10px] font-bold text-success uppercase tracking-wider">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted border border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1.5">
                    <h3 className="font-extrabold text-lg text-foreground tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-sm font-medium text-muted-foreground line-clamp-2 leading-relaxed">
                      {template.description || "No description provided."}
                    </p>
                  </div>

                  {/* Badges/Stats */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <span className={cn("inline-flex items-center rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm", typeConfig.color)}>
                      {typeConfig.label}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-2.5 py-1 text-[11px] font-bold text-muted-foreground shadow-sm">
                      <Layers className="w-3.5 h-3.5 text-foreground/50" />
                      {template.pageCount} Pages
                    </span>
                    {template._count && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-2.5 py-1 text-[11px] font-bold text-muted-foreground shadow-sm">
                        <Hash className="w-3.5 h-3.5 text-foreground/50" />
                        {template._count.orders} Orders
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer actions */}
                <div className="px-6 pb-6 pt-2 flex items-center gap-3 relative z-10">
                  <Button
                    variant="outline"
                    onClick={() => handleToggle(template)}
                    disabled={isToggling}
                    className={cn(
                      "flex-1 h-10 font-bold rounded-xl transition-all shadow-sm",
                      template.isActive
                        ? "text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/10"
                        : "text-foreground hover:text-success hover:border-success/30 hover:bg-success/10 border-foreground/20",
                    )}
                  >
                    {isToggling ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : template.isActive ? (
                      <><ToggleRight className="w-4 h-4 mr-1.5" /> Deactivate</>
                    ) : (
                      <><ToggleLeft className="w-4 h-4 mr-1.5" /> Activate</>
                    )}
                  </Button>
                  <Button variant={template.isActive ? "default" : "secondary"} asChild className={cn("flex-1 h-10 font-bold rounded-xl shadow-sm", template.isActive && "shadow-glow-sm")}>
                    <Link href={`/templates/${template.id}`}>
                      <Settings2 className="w-4 h-4 mr-1.5" />
                      Configure
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
