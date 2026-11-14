"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Maximize, Layers, User, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { templatesService } from "@/services/templates/templates.service";
import { ordersService } from "@/services/orders/orders.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import type { ActiveTemplate } from "@/types";
import { cn } from "@/lib/utils";

export function CreateOrderPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [templates, setTemplates] = useState<ActiveTemplate[]>([]);

  const [formData, setFormData] = useState({
    customerName: "",
    templateId: "",
  });

  useEffect(() => {
    setIsLoadingTemplates(true);
    templatesService.getActiveTemplates()
      .then((res) => {
        setTemplates(res.data ?? []);
        if (res.data && res.data.length > 0) {
          setFormData(prev => ({ ...prev, templateId: res.data![0].id }));
        }
      })
      .catch(() => toast.error("Failed to load active templates."))
      .finally(() => setIsLoadingTemplates(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectTemplate = (id: string) => {
    setFormData(prev => ({ ...prev, templateId: id }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName.trim()) return toast.error("Customer name is required");
    if (!formData.templateId) return toast.error("Please select a template");

    setIsSubmitting(true);
    try {
      const payload = {
        customerName: formData.customerName.trim(),
        templateId: formData.templateId,
      };

      const res = await ordersService.createOrder(payload);
      toast.success("Order created successfully!");
      if (res.data) {
        router.push(`/orders/${res.data.id}/images`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create order");
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
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Create New Order</h1>
          <p className="text-sm font-medium text-muted-foreground">Enter customer details and select a template for their story.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">

        {/* Customer Details Section */}
        <section className="space-y-4">
          {/* <div className="flex items-center gap-2 pb-2 border-b border-border/40">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">1</div>
            <h2 className="text-lg font-bold text-foreground">Customer Information</h2>
          </div> */}

          <div className="max-w-md space-y-3">
            <label className="text-sm font-bold text-foreground">Customer Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                placeholder="e.g. Rahim"
                className="pl-12 h-14 text-lg bg-muted/30 border-border/50 focus:bg-background rounded-xl transition-all"
                required
              />
            </div>

          </div>
        </section>

        {/* Template Selection Section */}
        <section className="space-y-4">
          {/* <div className="flex items-center gap-2 pb-2 border-b border-border/40">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">2</div>
            <h2 className="text-lg font-bold text-foreground">Select a Template</h2>
          </div> */}

          {isLoadingTemplates ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="surface-card p-4 space-y-4">
                  <Skeleton className="h-6 w-3/4 rounded-md" />
                  <Skeleton className="h-4 w-1/2 rounded-md" />
                </div>
              ))}
            </div>
          ) : templates.length === 0 ? (
            <div className="surface-card p-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <Layers className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">No Templates Available</h3>
                <p className="text-sm text-muted-foreground">You need to create and publish a template before taking orders.</p>
              </div>
              <Button variant="outline" asChild className="rounded-xl mt-4">
                <Link href="/templates/new">Create Template</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {templates.map(t => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => handleSelectTemplate(t.id)}
                  className={cn(
                    "text-left group relative surface-card overflow-hidden transition-all duration-300 ring-2 ring-transparent outline-none focus-visible:ring-primary focus-visible:ring-offset-2",
                    formData.templateId === t.id
                      ? "ring-primary shadow-glow-sm scale-[1.02] bg-primary/5 border-primary/20"
                      : "hover:border-border hover:shadow-md hover:scale-[1.01]"
                  )}
                >
                  {/* Selected Indicator */}
                  {formData.templateId === t.id && (
                    <div className="absolute top-4 right-4 z-10 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-200">
                      <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}

                  <div className="p-5 space-y-3">
                    <h3 className="font-bold text-base text-foreground line-clamp-1">{t.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
                        <Layers className="w-3 h-3 text-foreground/50" />
                        {t.totalPages} Pages
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
                        <Maximize className="w-3 h-3 text-foreground/50" />
                        {t.width} × {t.height} {t.unit}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Form Actions */}
        <div className="pt-6 flex items-center justify-end border-t border-border/40">
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting || templates.length === 0}
            className="h-14 px-10 rounded-xl font-bold shadow-glow-sm hover:shadow-glow-md transition-all text-base"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            {isSubmitting ? "Creating Order..." : "Create Order & Continue"}
          </Button>
        </div>
      </form>
    </div>
  );
}
