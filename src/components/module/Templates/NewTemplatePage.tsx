"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Maximize, Layers } from "lucide-react";
import { toast } from "sonner";
import { templatesService } from "@/services/templates/templates.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import type { DimensionUnit } from "@/types";

export function NewTemplatePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    width: "8.5",
    height: "8.5",
    unit: "INCH" as DimensionUnit,
    totalPages: "10",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return toast.error("Template name is required");

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        width: parseFloat(formData.width),
        height: parseFloat(formData.height),
        unit: formData.unit,
        totalPages: parseInt(formData.totalPages, 10),
      };

      const res = await templatesService.createTemplate(payload);
      toast.success("Template created successfully!");
      router.push(`/templates/${res.data?.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create template");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full mx-auto space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-muted shrink-0">
          <Link href="/templates">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Create New Template</h1>
          <p className="text-sm font-medium text-muted-foreground">Define your PDF layout dimensions and page count.</p>
        </div>
      </div>

      <div className="surface-card p-6 md:p-8 space-y-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">Template Name</label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. 8.5x8.5 Square Print"
                className="h-11 bg-muted/50 border-border/50 focus:bg-background"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">Width</label>
                <div className="relative">
                  <Maximize className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.01"
                    name="width"
                    value={formData.width}
                    onChange={handleChange}
                    className="pl-9 h-11 bg-muted/50"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">Height</label>
                <div className="relative">
                  <Maximize className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.01"
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    className="pl-9 h-11 bg-muted/50"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">Unit</label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-muted/50 px-3 py-2 text-sm  ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="INCH">Inches (in)</option>
                  <option value="MM">Millimeters (mm)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">Total Pages</label>
                <div className="relative">
                  <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    name="totalPages"
                    value={formData.totalPages}
                    onChange={handleChange}
                    className="pl-9 h-11 bg-muted/50"
                    required
                    min={1}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end border-t border-border/50">
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="h-11 px-8 rounded-xl font-bold shadow-glow-sm transition-all"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isSubmitting ? "Creating..." : "Create Template"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
