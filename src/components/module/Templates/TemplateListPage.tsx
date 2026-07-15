"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus, BookMarked, Layers, Settings2, CheckCircle2, Maximize, Trash2, Loader2, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { templatesService } from "@/services/templates/templates.service";
import type { BookTemplate } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function TemplateListPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [templates, setTemplates] = useState<BookTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Delete Template State
  const [templateToDelete, setTemplateToDelete] = useState<BookTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      // Normal users only see published templates
      const res = user?.role === "SUPER_ADMIN"
        ? await templatesService.getTemplates()
        : await templatesService.getTemplates({ status: "PUBLISHED" });
      setTemplates(res.data ?? []);
    } catch {
      toast.error("Failed to load templates.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthLoading && user) fetchTemplates();
    else if (!isAuthLoading && !user) setIsLoading(false);
  }, [user, isAuthLoading]);

  const handleDelete = async () => {
    if (!templateToDelete) return;
    setIsDeleting(true);
    try {
      await templatesService.deleteTemplate(templateToDelete.id);
      toast.success("Template deleted successfully.");
      setTemplates(templates.filter(t => t.id !== templateToDelete.id));
      setTemplateToDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete template.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 mx-auto animate-fade-in">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Templates</h1>
          </div>
          <p className="text-sm font-medium text-muted-foreground ml-1">
            {user?.role === "SUPER_ADMIN"
              ? "Manage PDF templates, page dimensions, and text overlays."
              : "Select a template to generate a new PDF."}
          </p>
        </div>
        {user?.role === "SUPER_ADMIN" && (
          <Button asChild size="lg" className="shadow-glow-sm hover:shadow-glow-md font-bold rounded-xl h-11 w-full sm:w-auto">
            <Link href="/templates/new">
              <Plus className="w-5 h-5 mr-1" />
              Create Template
            </Link>
          </Button>
        )}
      </div>

      {/* ── Content ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {templates.map((template, idx) => {
          const isPublished = template.status === "PUBLISHED";

          return (
            <div
              key={template.id}
              className={cn(
                "surface-card group relative overflow-hidden transition-all duration-300 hover-lift flex flex-col border border-border bg-card",
                !isPublished && "opacity-70 grayscale-[20%] hover:grayscale-0 hover:opacity-100",
              )}
              style={{ animationDelay: `${Math.min(idx * 50, 300)}ms` }}
            >
              {/* Accent glow background */}
              {isPublished && (
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-[40px] pointer-events-none transition-all group-hover:bg-primary/10" />
              )}

              <div className="p-6 flex-1 space-y-5 relative z-10">
                {/* Header row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-2xl shrink-0  transition-transform group-hover:scale-105 border border-primary/20 bg-primary/10 text-primary">
                    <BookMarked className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {isPublished ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 border border-success/20 text-[10px] font-bold text-success uppercase tracking-wider">
                        <CheckCircle2 className="w-3 h-3" /> Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted border border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Draft
                      </span>
                    )}
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-1.5">
                  <h3 className="font-extrabold text-lg text-foreground tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
                    {template.name}
                  </h3>
                </div>

                {/* Badges/Stats */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-2.5 py-1 text-[11px] font-bold text-muted-foreground ">
                    <Maximize className="w-3.5 h-3.5 text-foreground/50" />
                    {template.width} × {template.height} {template.unit}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-2.5 py-1 text-[11px] font-bold text-muted-foreground ">
                    <Layers className="w-3.5 h-3.5 text-foreground/50" />
                    {template.totalPages} Pages
                  </span>
                </div>
              </div>

              {/* Footer actions */}
              <div className="px-6 pb-6 pt-2 flex items-center gap-3 relative z-10">
                <Button variant="default" asChild className={cn("flex-1 h-10 font-bold rounded-xl ", isPublished && "shadow-glow-sm")}>
                  <Link href={`/templates/${template.id}`}>
                    {user?.role === "SUPER_ADMIN" ? (
                      <><Settings2 className="w-4 h-4 mr-1.5" /> Configure</>
                    ) : (
                      <><Plus className="w-4 h-4 mr-1.5" /> Generate PDF</>
                    )}
                  </Link>
                </Button>

                {user?.role === "SUPER_ADMIN" && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0 rounded-xl"
                    onClick={(e) => {
                      e.preventDefault();
                      setTemplateToDelete(template);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!templateToDelete} onOpenChange={(open) => !open && setTemplateToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Delete Template
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-bold text-foreground">{templateToDelete?.name}</span>?
              This will also delete all associated template pages. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setTemplateToDelete(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

