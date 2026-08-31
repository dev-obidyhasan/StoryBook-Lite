"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Download,
  AlertCircle,
  Maximize,
  Layers,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ordersService } from "@/services/orders/orders.service";
import type { EnhancementConfig } from "@/types";
import { enhanceImageClientSide } from "@/services/orders/enhanceImageClientSide";
import { PrintEnhancementPanel } from "./PrintEnhancementPanel";
import type { Order } from "@/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageImageUpload } from "../Templates/PageImageUpload";

export function OrderImagesPage({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // User Generation State
  const [pageImages, setPageImages] = useState<Record<number, File>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [enhancement, setEnhancement] = useState<EnhancementConfig>({
    enabled: false,
    mode: "preset",
    presetId: "original",
    settings: {
      brightness: 0,
      contrast: 0,
      exposure: 0,
      gamma: 1,
      shadows: 0,
      highlights: 0,
      saturation: 0,
      sharpness: 0,
      temperature: 0,
    },
  });

  // Bulk Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsLoading(true);
    ordersService
      .getOrderById(orderId)
      .then((res) => {
        setOrder(res.data);
        if (res.data?.enhancement) {
          setEnhancement(res.data.enhancement);
        } else {
          try {
            const saved = window.localStorage.getItem(
              `order-enhancement:${orderId}`,
            );
            if (saved) setEnhancement(JSON.parse(saved) as EnhancementConfig);
          } catch {
            // Ignore unavailable/corrupt local editing state and use Original.
          }
        }
      })
      .catch(() => toast.error("Failed to load order."))
      .finally(() => setIsLoading(false));
  }, [orderId]);

  const handleBulkFiles = (files: File[]) => {
    if (!order || !order.template) return;

    const totalPages = order.template.totalPages;

    // Filter only images
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));

    if (imageFiles.length === 0) {
      toast.error("Please select valid image files.");
      return;
    }

    // Map each image to its page based on the numeric value in its file name.
    // File names use a 0-based page index (e.g. "0.png" = first page,
    // "1.png" = second page), while the app stores pages as 1-based keys
    // (page 1 = first page). The mapping relies solely on the numeric file
    // name and never on the order returned by the file picker.
    const newMap: Record<number, File> = {};
    let mappedCount = 0;

    for (const file of imageFiles) {
      // Extract the numeric portion of the file name before the extension.
      const stem = file.name.replace(/\.[^.]+$/, "");

      // 1. Prefer a number enclosed in parentheses, brackets, or braces
      //    e.g. "0(2)" → 2, "0[10]" → 10, "0{3}" → 3
      // 2. Fall back to the leading number for plain filenames
      //    e.g. "1" → 1, "10" → 10  (existing behavior, unchanged)
      const bracketMatch = stem.match(/[([{](\d+)[)\]}]/);
      const leadingMatch = stem.match(/^(\d+)/);

      let rawIndex: number | null = null;
      if (bracketMatch) {
        // Sequence number is the value inside the brackets (1-based from user)
        // Subtract 1 to convert to the 0-based page index used internally.
        rawIndex = Number(bracketMatch[1]) - 1;
      } else if (leadingMatch) {
        // Plain numeric filename: the number itself is the 0-based page index.
        rawIndex = Number(leadingMatch[1]);
      }

      if (rawIndex === null) continue; // skip files without a recognizable index

      const pageIndex = rawIndex; // 0-based index
      const pageNumber = pageIndex + 1; // convert to 1-based app page key

      // Ignore files whose page index is outside the available page range.
      if (pageNumber < 1 || pageNumber > totalPages) continue;

      newMap[pageNumber] = file;
      mappedCount += 1;
    }

    if (mappedCount === 0) {
      toast.error(
        "No images could be mapped. Ensure file names start with a page number (e.g. 0.png, 1.png).",
      );
      return;
    }

    // Preserve existing images for any pages not included in this selection.
    setPageImages((prev) => ({ ...prev, ...newMap }));
    toast.success(`Successfully mapped ${mappedCount} images to pages.`);
  };

  const saveEnhancement = (next: EnhancementConfig) => {
    setEnhancement(next);
    try {
      window.localStorage.setItem(
        `order-enhancement:${orderId}`,
        JSON.stringify(next),
      );
    } catch {
      // The current editing session still works when browser storage is unavailable.
    }
  };

  const handleGeneratePDF = async () => {
    if (!order || !order.template) return;
    const template = order.template;

    const missingPages = Array.from({ length: template.totalPages })
      .map((_, i) => i + 1)
      .filter((p) => !pageImages[p]);

    if (missingPages.length > 0) {
      toast.error(`Please upload images for pages: ${missingPages.join(", ")}`);
      return;
    }

    setIsGenerating(true);
    try {
      // Upload one page at a time. When print enhancement is enabled, each
      // page is enhanced in the browser first and the enhanced copy is
      // uploaded — the original File objects are never modified. When
      // enhancement is disabled, original files are uploaded unchanged.
      const pageEntries = Object.entries(pageImages).sort(
        ([a], [b]) => Number(a) - Number(b),
      );

      const useClientEnhancement =
        enhancement.enabled &&
        pageEntries.every(
          ([, file]) => file.type === "image/jpeg" || file.type === "image/png",
        );

      for (const [pageNumber, file] of pageEntries) {
        toast.loading(
          `Uploading page ${pageNumber} of ${pageEntries.length}...`,
          {
            id: "pdf-upload",
          },
        );
        let uploadFile: File = file;
        if (useClientEnhancement) {
          const enhancedBlob = await enhanceImageClientSide(
            file,
            enhancement.settings,
          );
          if (enhancedBlob) {
            uploadFile = new File(
              [enhancedBlob],
              file.name.replace(/\.[^.]+$/, "") + ".jpg",
              {
                type: "image/jpeg",
              },
            );
          }
        }
        await ordersService.uploadOrderPageImage(
          orderId,
          Number(pageNumber),
          uploadFile,
        );
      }

      toast.loading("Generating PDF...", { id: "pdf-upload" });
      // Enhancement is already baked into the uploaded images; do not send
      // the enhancement config again to avoid double application.
      const { blob } = await ordersService.generateOrderPDF(orderId);
      toast.dismiss("pdf-upload");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${order.customerName.replace(/\s+/g, "_")}_${template.name.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success("PDF generated successfully!");
    } catch (err) {
      toast.dismiss("pdf-upload");
      toast.error(
        err instanceof Error ? err.message : "PDF Generation failed.",
      );
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

  if (!order || !order.template) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <AlertCircle className="w-8 h-8 text-muted-foreground/50" />
        <p className="text-lg font-bold text-foreground">Order not found</p>
        <Button variant="outline" asChild className="rounded-xl font-bold">
          <Link href="/orders/new">Return to Orders</Link>
        </Button>
      </div>
    );
  }

  const template = order.template;
  const allImagesUploaded = Array.from({ length: template.totalPages }).every(
    (_, i) => pageImages[i + 1],
  );

  // Create a map for quick text lookup
  const pagesText: Record<number, string> = {};
  template.pages?.forEach((p) => {
    if (p.storyText) pagesText[p.pageNumber] = p.storyText;
  });

  return (
    <div className="space-y-8 w-full mx-auto animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/60 p-4 md:p-6 rounded-2xl border border-border/40 backdrop-blur-md ">
        <div className="flex items-start sm:items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 rounded-full hover:bg-muted shrink-0 mt-1 sm:mt-0"
            asChild
          >
            <Link href="/orders/new">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl md:text-3xl font-extrabold tracking-tight text-foreground truncate">
              Order: {order.customerName}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-2 py-0.5 text-xs font-bold text-muted-foreground max-w-full">
                <Layers className="w-3.5 h-3.5 text-foreground/50 shrink-0" />
                <span className="truncate">Template: {template.name}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-2 py-0.5 text-xs font-bold text-muted-foreground whitespace-nowrap shrink-0">
                <Maximize className="w-3.5 h-3.5 text-foreground/50 shrink-0" />
                {template.width} × {template.height} {template.unit}
              </span>
            </div>
          </div>
        </div>
      </div>

      <PrintEnhancementPanel
        value={enhancement}
        onChange={saveEnhancement}
        previewFile={pageImages[1] || null}
      />

      {/* User Image Uploader & Generator */}
      <div className="surface-card p-6 md:p-8 space-y-8 relative transition-all duration-300">
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png"
          className="hidden"
          ref={fileInputRef}
          onChange={(e) => {
            if (e.target.files) {
              handleBulkFiles(Array.from(e.target.files));
            }
            e.target.value = "";
          }}
        />

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/40 relative z-10">
          <div className="space-y-4">
            <div>
              <h2 className="-mt-4 text-2xl font-extrabold text-foreground tracking-tight">
                Upload Page Images
              </h2>
              <p className="text-sm font-medium text-muted-foreground max-w-xl mt-1">
                Upload your illustrations for each page. The system will
                composite them into a print-ready PDF using the "{template.name}
                " template formatting.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="font-bold rounded-xl h-11 border-primary/20 text-primary hover:bg-primary/5 hover:text-primary transition-colors bg-white/50"
              >
                <UploadCloud className="w-4 h-4 mr-2" />
                Upload Images in Bulk
              </Button>
              <span className="text-xs font-medium text-muted-foreground hidden sm:inline-block">
                or upload individually below
              </span>
            </div>
          </div>
          <div className="flex flex-col items-start md:items-end gap-3 shrink-0 w-full md:w-auto mt-4 md:mt-0">
            <div className="flex items-center justify-between w-full md:justify-end gap-3 text-sm font-bold">
              <span
                className={
                  allImagesUploaded ? "text-success" : "text-muted-foreground"
                }
              >
                {Object.keys(pageImages).length} / {template.totalPages} Pages
                Uploaded
              </span>
              {/* Progress Bar (mini) */}
              <div className="w-24 sm:w-32 h-2.5 bg-muted rounded-full overflow-hidden shrink-0">
                <div
                  className="h-full bg-success transition-all duration-500"
                  style={{
                    width: `${(Object.keys(pageImages).length / template.totalPages) * 100}%`,
                  }}
                />
              </div>
            </div>
            <Button
              size="lg"
              onClick={handleGeneratePDF}
              disabled={!allImagesUploaded || isGenerating}
              className={`h-12 px-8 font-bold rounded-xl transition-all text-base w-full md:w-auto ${
                allImagesUploaded
                  ? "shadow-glow-sm hover:shadow-glow-md bg-success hover:bg-success/90 text-white"
                  : ""
              }`}
            >
              {isGenerating ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Download className="w-5 h-5 mr-2" />
              )}
              {isGenerating ? "Generating PDF..." : "Generate PDF"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: template.totalPages }).map((_, i) => {
            const pageNum = i + 1;
            const text = pagesText[pageNum];

            // Re-interpolate the text snippet for the frontend preview using the order customer name
            let previewText = text;
            if (previewText) {
              previewText = previewText.replace(
                /\{\{name\}\}/g,
                order.customerName,
              );
            }

            return (
              <div key={pageNum} className="space-y-6 group">
                <div className="space-y-4">
                  <PageImageUpload
                    pageNumber={pageNum}
                    value={pageImages[pageNum] || null}
                    onChange={(file) =>
                      setPageImages((prev) => ({
                        ...prev,
                        [pageNum]: file as File,
                      }))
                    }
                  />
                  {previewText && (
                    <div className="p-4 rounded-xl bg-muted/20 border border-border/30 text-xs text-muted-foreground leading-relaxed line-clamp-3 transition-colors group-hover:bg-muted/40">
                      "{previewText}"
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
