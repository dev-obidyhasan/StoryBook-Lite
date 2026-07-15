"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, CheckCircle2, Download, AlertCircle, Maximize, Layers } from "lucide-react";
import { toast } from "sonner";
import { templatesService } from "@/services/templates/templates.service";
import type { BookTemplate, TemplatePage } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { PageImageUpload } from "./PageImageUpload";

export function TemplateDetailPage({ templateId }: { templateId: string }) {
  const { user } = useAuth();
  const [template, setTemplate] = useState<BookTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Admin Editing State
  const [isSaving, setIsSaving] = useState(false);
  const [pagesText, setPagesText] = useState<Record<number, string>>({});

  // User Generation State
  const [pageImages, setPageImages] = useState<Record<number, File>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    templatesService.getTemplateById(templateId)
      .then((res) => {
        setTemplate(res.data);
        if (res.data?.pages) {
          const textMap: Record<number, string> = {};
          res.data.pages.forEach(p => {
            textMap[p.pageNumber] = p.storyText || "";
          });
          setPagesText(textMap);
        }
      })
      .catch(() => toast.error("Failed to load template."))
      .finally(() => setIsLoading(false));
  }, [templateId]);

  const handleSaveText = async () => {
    if (!template) return;
    setIsSaving(true);
    try {
      const payload = {
        pages: Array.from({ length: template.totalPages }).map((_, i) => ({
          pageNumber: i + 1,
          storyText: pagesText[i + 1] || "",
        }))
      };
      const res = await templatesService.updateTemplatePages(templateId, payload);
      setTemplate(res.data);
      toast.success("Page texts saved successfully.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save pages.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!template) return;
    const newStatus = template.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    setIsSaving(true);
    try {
      const res = await templatesService.updateTemplate(templateId, { status: newStatus });
      setTemplate(res.data);
      toast.success(`Template ${newStatus.toLowerCase()}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle status.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!template) return;
    const missingPages = Array.from({ length: template.totalPages })
      .map((_, i) => i + 1)
      .filter(p => !pageImages[p]);

    if (missingPages.length > 0) {
      toast.error(`Please upload images for pages: ${missingPages.join(', ')}`);
      return;
    }

    setIsGenerating(true);
    try {
      const formData = new FormData();
      Object.entries(pageImages).forEach(([pageNumber, file]) => {
        formData.append(`page_${pageNumber}`, file);
      });

      const blob = await templatesService.generatePDF(templateId, formData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${template.name.replace(/\s+/g, "_")}_Preview.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success("PDF generated successfully!");
      // Cleanup files
      setPageImages({});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "PDF Generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 w-full mx-auto">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <AlertCircle className="w-8 h-8 text-muted-foreground/50" />
        <p className="text-lg font-bold text-foreground">Template not found</p>
        <Button variant="outline" asChild className="rounded-xl font-bold">
          <Link href="/templates">Return to Templates</Link>
        </Button>
      </div>
    );
  }

  const isAdmin = user?.role === "SUPER_ADMIN";
  const allImagesUploaded = Array.from({ length: template.totalPages }).every((_, i) => pageImages[i + 1]);

  return (
    <div className="space-y-8 w-full mx-auto animate-fade-in pb-20">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-white/50 p-4 rounded-2xl border border-border/40 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="w-10 h-10 rounded-xl" asChild>
            <Link href="/templates"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{template.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                <Maximize className="w-3 h-3 text-foreground/50" />
                {template.width} × {template.height} {template.unit}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                <Layers className="w-3 h-3 text-foreground/50" />
                {template.totalPages} Pages
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              variant={template.status === "PUBLISHED" ? "outline" : "default"}
              size="sm"
              className={cn("rounded-xl font-bold h-10 px-4", template.status === "DRAFT" && "shadow-glow-sm")}
              disabled={isSaving}
              onClick={handleToggleStatus}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
              {template.status === "PUBLISHED" ? "Unpublish Template" : "Publish Template"}
            </Button>
          )}
          <Badge variant={template.status === "PUBLISHED" ? "success" : "muted"} className="h-10 px-4 font-bold uppercase tracking-wider text-[11px] rounded-xl">
            {template.status}
          </Badge>
        </div>
      </div>

      {/* Admin Story Text Editor */}
      {isAdmin ? (
        <div className="surface-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-foreground">Page Configuration</h2>
              <p className="text-xs text-muted-foreground">This name will be used to replace variables (e.g. {"{{name}}"}) inside the story text.</p>
            </div>
            <Button onClick={handleSaveText} disabled={isSaving} className="h-10 px-5 font-bold rounded-xl  hover:shadow-glow-sm transition-all">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save All Pages
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: template.totalPages }).map((_, i) => {
              const pageNum = i + 1;
              return (
                <div key={pageNum} className="p-4 rounded-xl border border-border bg-muted/10 space-y-3">
                  <label className="text-sm font-bold text-foreground flex items-center justify-between">
                    <span>Page {pageNum}</span>
                  </label>
                  <textarea
                    rows={4}
                    value={pagesText[pageNum] || ""}
                    onChange={(e) => setPagesText(prev => ({ ...prev, [pageNum]: e.target.value }))}
                    placeholder={`Enter story text for page ${pageNum}...`}
                    className="w-full px-3.5 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none"
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* User Image Uploader & Generator */
        <div className="surface-card p-6 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-foreground">Upload Page Images</h2>
              <p className="text-sm text-muted-foreground">Upload your illustrations for each page. The system will composite them into a print-ready PDF.</p>
            </div>
            <Button
              size="lg"
              onClick={handleGeneratePDF}
              disabled={!allImagesUploaded || isGenerating}
              className="h-12 px-6 font-bold rounded-xl shadow-glow-sm hover:shadow-glow-md transition-all text-base"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Download className="w-5 h-5 mr-2" />}
              {isGenerating ? "Generating PDF..." : "Generate PDF"}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: template.totalPages }).map((_, i) => {
              const pageNum = i + 1;
              const text = pagesText[pageNum];

              return (
                <div key={pageNum} className="space-y-3">
                  <PageImageUpload
                    pageNumber={pageNum}
                    value={pageImages[pageNum] || null}
                    onChange={(file) => setPageImages(prev => ({
                      ...prev,
                      [pageNum]: file as File
                    }))}
                  />
                  {text && (
                    <div className="p-3 rounded-xl bg-muted/30 border border-border/50 text-xs text-muted-foreground leading-relaxed line-clamp-3">
                      "{text}"
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
