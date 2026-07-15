"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle2,
  Sparkles,
  FileCode,
  Tag,
  BookOpen,
  Plus,
  Info,
  AlertCircle,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import {
  templatesService,
  type UpdateTemplatePayload,
} from "@/services/templates/templates.service";
import type {
  BookTemplate,
  TemplatePage,
  TextZone,
  PromptPreviewResult,
} from "@/types";
import { FULL_PAGE_LAYOUT_SENTINEL } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Inline fallback used only until the DB-backed default page prompt is
 * fetched from /templates/ai-defaults. Once loaded, the component uses
 * the server value so admins can change it without a frontend deploy.
 */
const FALLBACK_PAGE_PROMPT =
  "Full-page children's storybook illustration: {{child_name}}, a cheerful {{child_age}}-year-old {{child_gender_descriptor}}, {{scene_description}}, {{style_prompt}}, vibrant colors, professional composition";

function buildTemplateSettings(t: BookTemplate): UpdateTemplatePayload {
  return {
    name: t.name,
    stylePrompt: t.stylePrompt,
    description: t.description ?? "",
  };
}

const VARIABLE_REGEX = /(\{\{[\w_]+\}\})/g;

/** Render a prompt string with {{variables}} highlighted */
function HighlightedPrompt({ text }: { text: string }) {
  const parts = text.split(VARIABLE_REGEX);
  return (
    <span>
      {parts.map((part, i) =>
        VARIABLE_REGEX.test(part) ? (
          <span
            key={i}
            className="text-primary font-bold bg-primary/10 rounded px-1 py-0.5 border border-primary/20  mx-0.5"
          >
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  );
}

const PRODUCT_TYPES = [
  "STORY",
  "COLORING",
  "SUPERHERO",
  "BIRTHDAY",
  "EDUCATIONAL",
  "ISLAMIC",
  "ALPHABET",
];

export function TemplateDetailPage({ templateId }: { templateId: string }) {
  const [template, setTemplate] = useState<BookTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPages, setEditingPages] = useState<
    Record<string, Partial<TemplatePage>>
  >({});
  const [savingPageId, setSavingPageId] = useState<string | null>(null);
  const [previewPageId, setPreviewPageId] = useState<string | null>(null);
  const [templateSettings, setTemplateSettings] =
    useState<UpdateTemplatePayload>({});
  const [templateSettingsDirty, setTemplateSettingsDirty] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [supportedVariables, setSupportedVariables] = useState<
    Record<string, string>
  >({});
  const [showVariables, setShowVariables] = useState(false);
  const [validating, setValidating] = useState(false);
  const [addingPage, setAddingPage] = useState(false);
  const [defaultPagePrompt, setDefaultPagePrompt] =
    useState<string>(FALLBACK_PAGE_PROMPT);
  const [newPageForm, setNewPageForm] = useState({
    pageNumber: 1,
    sceneLabel: "",
    promptTemplate: FALLBACK_PAGE_PROMPT,
  });
  const [previewSample, setPreviewSample] = useState({
    childName: "Alex",
    childAge: 5,
    childGender: "FEMALE" as "MALE" | "FEMALE",
    pageNumber: 1,
  });
  const [promptPreview, setPromptPreview] =
    useState<PromptPreviewResult | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    productType: "STORY",
    pageCount: 5,
    stylePrompt: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (templateId === "new") {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    templatesService
      .getTemplateById(templateId)
      .then((res) => {
        setTemplate(res.data);
        if (res.data) {
          setTemplateSettings(buildTemplateSettings(res.data));
          setNewPageForm((prev) => ({
            ...prev,
            pageNumber: (res.data?.pages?.length ?? 0) + 1,
          }));
        }
      })
      .catch(() => toast.error("Failed to load template."))
      .finally(() => setIsLoading(false));
  }, [templateId]);

  useEffect(() => {
    templatesService
      .getSupportedVariables()
      .then((res) => setSupportedVariables(res.data ?? {}))
      .catch(() => {});
    // Fetch DB-backed default page prompt so admins can edit it without a
    // frontend deploy. Falls back to FALLBACK_PAGE_PROMPT on error.
    templatesService
      .getAIPlatformDefaults()
      .then((res) => {
        const tmpl = res.data?.platformDefaults?.defaultPagePromptTemplate;
        if (tmpl) {
          setDefaultPagePrompt(tmpl);
          setNewPageForm((prev) => ({
            ...prev,
            promptTemplate:
              prev.promptTemplate === FALLBACK_PAGE_PROMPT
                ? tmpl
                : prev.promptTemplate,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.stylePrompt) {
      toast.error("Name and Style Prompt are required.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await templatesService.createTemplate({
        name: formData.name,
        productType: formData.productType,
        pageCount: Number(formData.pageCount),
        stylePrompt: formData.stylePrompt,
        description: formData.description || undefined,
      });
      if (res.success && res.data) {
        toast.success("Template created!");
        window.location.href = `/templates/${res.data.id}`;
      } else toast.error("Failed to create template.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Creation failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePageEdit = (
    pageId: string,
    field: keyof TemplatePage,
    value: string,
  ) => {
    setEditingPages((prev) => ({
      ...prev,
      [pageId]: { ...prev[pageId], [field]: value },
    }));
  };

  const handleStoryContentEdit = (page: TemplatePage, content: string) => {
    const baseZones = editingPages[page.id]?.textZoneJson ?? page.textZoneJson;
    const updatedZones: TextZone[] = baseZones.map((zone, index) =>
      index === 0 ? { ...zone, content } : zone,
    );
    setEditingPages((prev) => ({
      ...prev,
      [page.id]: { ...prev[page.id], textZoneJson: updatedZones },
    }));
  };

  // Ref to the currently-focused story-text textarea so the variable picker
  // can insert tokens at the cursor position.
  const activeStoryTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const insertVariableAtCursor = (page: TemplatePage, variable: string) => {
    const token = `{{${variable}}}`;
    const textarea = activeStoryTextareaRef.current;
    if (!textarea) {
      // Fallback: append to the end of the current content.
      const current =
        editingPages[page.id]?.textZoneJson?.[0]?.content ??
        page.textZoneJson[0]?.content ??
        "";
      handleStoryContentEdit(page, current + token);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current =
      editingPages[page.id]?.textZoneJson?.[0]?.content ??
      page.textZoneJson[0]?.content ??
      "";
    const newValue = current.slice(0, start) + token + current.slice(end);
    handleStoryContentEdit(page, newValue);

    // Restore cursor position after the inserted token.
    requestAnimationFrame(() => {
      const newPos = start + token.length;
      textarea.focus();
      textarea.setSelectionRange(newPos, newPos);
    });
  };

  const updateTemplateSetting = <K extends keyof UpdateTemplatePayload>(
    key: K,
    value: UpdateTemplatePayload[K],
  ) => {
    setTemplateSettings((prev) => ({ ...prev, [key]: value }));
    setTemplateSettingsDirty(true);
  };

  const handleSaveTemplateSettings = async () => {
    if (!template) return;
    setSavingTemplate(true);
    try {
      const res = await templatesService.updateTemplate(
        templateId,
        templateSettings,
      );
      if (res.data) {
        setTemplate(res.data);
        setTemplateSettings(buildTemplateSettings(res.data));
      }
      setTemplateSettingsDirty(false);
      toast.success("Template settings saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleValidateTemplate = async () => {
    setValidating(true);
    try {
      const res = await templatesService.validateTemplate(templateId);
      if (res.data?.isValid)
        toast.success("Template is complete and ready to activate.");
      else
        toast.error(
          res.data?.message ??
            `Missing pages: ${res.data?.missingPages?.join(", ")}`,
        );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Validation failed.");
    } finally {
      setValidating(false);
    }
  };

  const handleAddPage = async () => {
    if (!template) return;
    if (newPageForm.pageNumber > template.pageCount) {
      toast.error(
        `Page number cannot exceed template page count (${template.pageCount}).`,
      );
      return;
    }
    setAddingPage(true);
    try {
      await templatesService.addTemplatePage(templateId, {
        pageNumber: newPageForm.pageNumber,
        promptTemplate: newPageForm.promptTemplate,
        sceneLabel: newPageForm.sceneLabel || undefined,
      });
      toast.success(`Page ${newPageForm.pageNumber} added.`);
      const res = await templatesService.getTemplateById(templateId);
      setTemplate(res.data);
      if (res.data) {
        setNewPageForm({
          pageNumber: (res.data.pages?.length ?? 0) + 1,
          sceneLabel: "",
          promptTemplate: defaultPagePrompt,
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add page.");
    } finally {
      setAddingPage(false);
    }
  };

  const handlePreviewPrompts = async () => {
    if (!previewSample.childName.trim()) {
      toast.error("Enter a sample child name for preview.");
      return;
    }
    setLoadingPreview(true);
    try {
      const res = await templatesService.previewTemplatePrompts(
        templateId,
        previewSample,
      );
      setPromptPreview(res.data ?? null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Preview failed.");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSavePage = async (page: TemplatePage) => {
    const changes = editingPages[page.id];
    if (!changes || Object.keys(changes).length === 0) {
      toast.info("No changes to save.");
      return;
    }
    setSavingPageId(page.id);
    try {
      await templatesService.updateTemplatePage(templateId, page.id, {
        promptTemplate: changes.promptTemplate as string | undefined,
        layoutFilePath: changes.layoutFilePath as string | undefined,
        sceneLabel: changes.sceneLabel as string | undefined,
        textZoneJson: changes.textZoneJson as TextZone[] | undefined,
      });
      toast.success(`Page ${page.pageNumber} saved.`);
      setEditingPages((prev) => {
        const n = { ...prev };
        delete n[page.id];
        return n;
      });
      const res = await templatesService.getTemplateById(templateId);
      setTemplate(res.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSavingPageId(null);
    }
  };

  /* ── Loading ───────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="space-y-6  mx-auto">
        <div className="flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-64 rounded-2xl" />
        ))}
      </div>
    );
  }

  /* ── Form Field Base Styles ────────────────────────────── */
  const formFieldClass =
    "w-full px-3.5 py-3 rounded-xl border border-border bg-muted/30 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary focus:bg-white transition-all resize-none ";

  /* ── Create form ─────────────────────────────────────────── */
  if (templateId === "new") {
    return (
      <div className="space-y-8 mx-auto animate-fade-in">
        <div className="flex items-center gap-4 bg-white/50 p-4 rounded-2xl border border-border/40 backdrop-blur-md">
          <Button
            variant="outline"
            size="icon"
            className="w-10 h-10 rounded-xl "
            asChild
          >
            <Link href="/templates">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              Create Template
            </h1>
            <p className="text-sm font-medium text-muted-foreground mt-0.5">
              Define a new personalized storybook layout
            </p>
          </div>
        </div>

        <div className="surface-card p-6 relative overflow-hidden">
          {/* Subtle top accent */}
          {/* <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-primary" /> */}

          <form onSubmit={handleCreateTemplate} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">
                Template Name <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g. Magic Forest Adventure"
                value={formData.name}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, name: e.target.value }))
                }
                className={formFieldClass}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">
                  Product Type
                </label>
                <select
                  value={formData.productType}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, productType: e.target.value }))
                  }
                  className={formFieldClass}
                >
                  {PRODUCT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t[0] + t.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">
                  Page Count
                </label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={formData.pageCount}
                  required
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      pageCount: Number(e.target.value),
                    }))
                  }
                  className={formFieldClass}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">
                Description
              </label>
              <textarea
                rows={2}
                placeholder="Describe the theme or plot..."
                value={formData.description}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, description: e.target.value }))
                }
                className={formFieldClass}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">
                Style Prompt <span className="text-destructive">*</span>
              </label>
              <p className="text-xs font-medium text-muted-foreground">
                Master visual style injected into all page prompts. Use{" "}
                <code className="text-primary font-bold bg-primary/10 rounded px-1.5 py-0.5">
                  {"{{child_name}}"}
                </code>{" "}
                variables.
              </p>
              <textarea
                rows={4}
                required
                placeholder="e.g. Whimsical children illustration style, pastel colors, soft watercolor glow..."
                value={formData.stylePrompt}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, stylePrompt: e.target.value }))
                }
                className={cn(
                  formFieldClass,
                  "font-mono text-xs leading-relaxed",
                )}
              />
            </div>

            {/* ── Guided Help ─────────────────────────────────────── */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">
                  How templates work
                </h3>
              </div>
              <ol className="space-y-2 text-xs font-medium text-muted-foreground leading-relaxed list-decimal list-inside">
                <li>
                  <strong className="text-foreground">Create the shell</strong>{" "}
                  — set a name, product type, page count, and a master{" "}
                  <em>style prompt</em> that defines the overall visual look.
                </li>
                <li>
                  <strong className="text-foreground">Add pages</strong> — after
                  creating, open the template and define each page's scene
                  label, illustration prompt, and story text.
                </li>
                <li>
                  <strong className="text-foreground">Use variables</strong> —
                  prompts and story text support{" "}
                  <code className="text-primary font-bold bg-primary/10 rounded px-1 py-0.5">
                    {"{{child_name}}"}
                  </code>
                  ,{" "}
                  <code className="text-primary font-bold bg-primary/10 rounded px-1 py-0.5">
                    {"{{child_age}}"}
                  </code>
                  ,{" "}
                  <code className="text-primary font-bold bg-primary/10 rounded px-1 py-0.5">
                    {"{{child_gender_descriptor}}"}
                  </code>{" "}
                  and more. They are replaced at order time.
                </li>
                <li>
                  <strong className="text-foreground">
                    Validate & activate
                  </strong>{" "}
                  — once all pages are defined, click <em>Validate</em> then{" "}
                  <em>Activate</em> to make the template available for new
                  orders.
                </li>
              </ol>
              <p className="text-xs text-muted-foreground pt-1 border-t border-primary/10">
                Tip: You can edit AI prompts and layout at any time, but changes
                only affect
                <strong className="text-foreground"> new orders</strong> —
                existing orders keep their snapshot.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-border/50">
              <Button
                variant="outline"
                asChild
                className="h-11 rounded-xl font-bold"
              >
                <Link href="/templates">Cancel</Link>
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 rounded-xl font-bold shadow-glow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> Creating…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" /> Create Template
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (!template)
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="p-4 rounded-full bg-muted">
          <BookOpen className="w-8 h-8 text-muted-foreground/50" />
        </div>
        <p className="text-lg font-bold text-foreground">Template not found</p>
        <Button variant="outline" asChild className="rounded-xl font-bold">
          <Link href="/templates">Return to Templates</Link>
        </Button>
      </div>
    );

  /* ── Edit view ───────────────────────────────────────────── */
  return (
    <div className="space-y-8  mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-white/50 p-4 rounded-2xl border border-border/40 backdrop-blur-md ">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="w-10 h-10 rounded-xl "
            asChild
          >
            <Link href="/templates">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              {template.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                {template.productType}
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                • {template.pageCount} pages
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl font-bold"
            onClick={() => setShowVariables((v) => !v)}
          >
            <Info className="w-4 h-4 mr-1.5" /> Variables
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl font-bold"
            disabled={validating}
            onClick={handleValidateTemplate}
          >
            {validating ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
            ) : (
              <AlertCircle className="w-4 h-4 mr-1.5" />
            )}
            Validate
          </Button>
          <Badge
            variant={template.isActive ? "success" : "muted"}
            className="px-3 py-1 font-bold uppercase tracking-wider text-[10px]"
          >
            {template.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      {showVariables && (
        <div className="surface-card p-5 space-y-3 animate-fade-in">
          <h3 className="text-sm font-extrabold text-foreground">
            Supported Prompt Variables
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(supportedVariables).map(([key, desc]) => (
              <div
                key={key}
                className="flex gap-2 text-xs p-2 rounded-lg bg-muted/40 border border-border"
              >
                <code className="text-primary font-bold shrink-0">{`{{${key}}}`}</code>
                <span className="text-muted-foreground">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Template settings */}
      <div className="surface-card p-6 space-y-6">
        <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-info/10 text-info">
              <Tag className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-extrabold text-foreground">
              Template Configuration
            </h2>
          </div>
          {templateSettingsDirty && (
            <Button
              onClick={handleSaveTemplateSettings}
              disabled={savingTemplate}
              className="h-10 px-5 font-bold rounded-xl"
            >
              {savingTemplate ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Template Settings
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground uppercase tracking-wider">
            Description
          </label>
          <textarea
            rows={2}
            value={templateSettings.description ?? ""}
            onChange={(e) =>
              updateTemplateSetting("description", e.target.value)
            }
            className={formFieldClass}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground uppercase tracking-wider">
            Global Style Prompt
          </label>
          <p className="text-[11px] text-muted-foreground">
            Applied to every page for visual consistency. Leave blank fields in
            AI Instructions to use platform defaults.
          </p>
          <textarea
            rows={3}
            value={templateSettings.stylePrompt ?? ""}
            onChange={(e) =>
              updateTemplateSetting("stylePrompt", e.target.value)
            }
            className={cn(formFieldClass, "font-mono text-sm")}
          />
        </div>

        <div className="border-t border-border/50 pt-6 space-y-4">
          <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" /> Prompt Preview
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Dry-run resolved prompts with sample child data before activating.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <Input
              placeholder="Child name"
              value={previewSample.childName}
              onChange={(e) =>
                setPreviewSample((p) => ({ ...p, childName: e.target.value }))
              }
              className={formFieldClass}
            />
            <Input
              type="number"
              min={1}
              max={18}
              placeholder="Age"
              value={previewSample.childAge}
              onChange={(e) =>
                setPreviewSample((p) => ({
                  ...p,
                  childAge: Number(e.target.value),
                }))
              }
              className={formFieldClass}
            />
            <select
              value={previewSample.childGender}
              onChange={(e) =>
                setPreviewSample((p) => ({
                  ...p,
                  childGender: e.target.value as "MALE" | "FEMALE",
                }))
              }
              className={formFieldClass}
            >
              <option value="FEMALE">Female</option>
              <option value="MALE">Male</option>
            </select>
            <Input
              type="number"
              min={1}
              placeholder="Page # (optional)"
              value={previewSample.pageNumber}
              onChange={(e) =>
                setPreviewSample((p) => ({
                  ...p,
                  pageNumber: Number(e.target.value),
                }))
              }
              className={formFieldClass}
            />
          </div>
          <Button
            variant="outline"
            onClick={handlePreviewPrompts}
            disabled={loadingPreview}
            className="rounded-xl font-bold"
          >
            {loadingPreview ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Eye className="w-4 h-4 mr-2" />
            )}
            Preview Resolved Prompts
          </Button>
          {promptPreview && (
            <div className="space-y-4 animate-fade-in">
              {promptPreview.requiresCharacterSheet && (
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Master Sheet Prompt
                  </p>
                  <pre className="text-xs font-mono p-3 rounded-xl bg-muted/40 border border-border overflow-x-auto whitespace-pre-wrap">
                    {promptPreview.masterSheetPrompt}
                  </pre>
                </div>
              )}
              {promptPreview.pages.map((page) => (
                <div
                  key={page.pageNumber}
                  className="space-y-2 p-4 rounded-xl border border-border bg-muted/20"
                >
                  <p className="text-sm font-bold">
                    Page {page.pageNumber} — {page.sceneLabel ?? "Untitled"} (v
                    {page.promptVersion})
                  </p>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">
                      Illustration Prompt
                    </p>
                    <pre className="text-xs font-mono p-2 rounded-lg bg-white border border-border overflow-x-auto whitespace-pre-wrap">
                      {page.illustrationPrompt}
                    </pre>
                  </div>
                  {page.storyText && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">
                        Story Text
                      </p>
                      <p className="text-sm">{page.storyText}</p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">
                      System Prompt
                    </p>
                    <pre className="text-xs font-mono p-2 rounded-lg bg-white border border-border overflow-x-auto whitespace-pre-wrap">
                      {page.systemPrompt}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pages */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2 bg-white/40 p-4 rounded-xl border border-border/60">
          <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <FileCode className="w-5 h-5" />
            </div>
            Page Definitions
            <span className="px-2 py-0.5 rounded-full bg-muted border border-border text-xs font-medium text-muted-foreground ml-1">
              {template.pages?.length ?? 0}
            </span>
          </h2>
          <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground bg-white px-3 py-1.5 rounded-lg border border-border flex-wrap">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>
              {template.pages?.length ?? 0} / {template.pageCount} pages defined
            </span>
          </div>
        </div>

        {(template.pages?.length ?? 0) < template.pageCount &&
          !template.isActive && (
            <div className="surface-card p-5 space-y-4 border-dashed">
              <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Page {newPageForm.pageNumber}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider">
                    Page Number
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={template.pageCount}
                    value={newPageForm.pageNumber}
                    onChange={(e) =>
                      setNewPageForm((p) => ({
                        ...p,
                        pageNumber: Number(e.target.value),
                      }))
                    }
                    className={formFieldClass}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider">
                    Scene Label
                  </label>
                  <Input
                    value={newPageForm.sceneLabel}
                    onChange={(e) =>
                      setNewPageForm((p) => ({
                        ...p,
                        sceneLabel: e.target.value,
                      }))
                    }
                    placeholder="Brief scene description"
                    className={formFieldClass}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider">
                  AI Prompt Template
                </label>
                <textarea
                  rows={3}
                  value={newPageForm.promptTemplate}
                  onChange={(e) =>
                    setNewPageForm((p) => ({
                      ...p,
                      promptTemplate: e.target.value,
                    }))
                  }
                  className={cn(formFieldClass, "font-mono text-xs")}
                />
              </div>
              <Button
                onClick={handleAddPage}
                disabled={addingPage}
                className="rounded-xl font-bold"
              >
                {addingPage ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Add Page
              </Button>
            </div>
          )}

        <div className="space-y-6">
          {(template.pages ?? []).map((page) => {
            const edits = editingPages[page.id] ?? {};
            const hasChanges = Object.keys(edits).length > 0;
            const isSaving = savingPageId === page.id;
            const isPreview = previewPageId === page.id;
            const currentPrompt =
              (edits.promptTemplate as string | undefined) ??
              page.promptTemplate;

            return (
              <div
                key={page.id}
                className={cn(
                  "surface-card transition-all duration-300 relative overflow-hidden",
                  hasChanges
                    ? "border-warning/50 shadow-md ring-1 ring-warning/20"
                    : " hover:border-primary/30",
                )}
              >
                {/* Visual indicator for unsaved changes */}
                {hasChanges && (
                  <div className="absolute top-0 left-0 bottom-0 w-1 bg-warning" />
                )}

                <div className="p-6 space-y-6">
                  {/* Page header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20 text-primary font-extrabold text-lg shrink-0 ">
                        {page.pageNumber}
                      </div>
                      <div className="space-y-1">
                        <p className="font-extrabold text-base text-foreground">
                          {(edits.sceneLabel as string | undefined) ??
                            page.sceneLabel ??
                            `Page ${page.pageNumber}`}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Version {page.promptVersion ?? 1}
                          </span>
                          {hasChanges && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-warning animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                              Unsaved Changes
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {hasChanges && (
                        <Button
                          onClick={() => handleSavePage(page)}
                          disabled={isSaving}
                          className="h-10 px-5 font-bold rounded-xl shadow-glow-sm"
                        >
                          {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          Save Changes
                        </Button>
                      )}
                      {!hasChanges && !isSaving && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/5 border border-success/10 text-[11px] font-bold text-success uppercase tracking-wider">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Fields */}
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                        Scene Label
                      </label>
                      <Input
                        defaultValue={page.sceneLabel ?? ""}
                        onChange={(e) =>
                          handlePageEdit(page.id, "sceneLabel", e.target.value)
                        }
                        placeholder="Brief scene description…"
                        className={formFieldClass}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-primary" />
                          AI Prompt Template
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewPageId(isPreview ? null : page.id)
                          }
                          className="text-[11px] font-bold text-primary hover:text-primary/80 transition-colors bg-primary/10 px-2.5 py-1 rounded-full"
                        >
                          {isPreview
                            ? "Hide Highlight Preview"
                            : "Preview Highlights"}
                        </button>
                      </div>
                      <div className="relative">
                        <textarea
                          defaultValue={page.promptTemplate}
                          onChange={(e) =>
                            handlePageEdit(
                              page.id,
                              "promptTemplate",
                              e.target.value,
                            )
                          }
                          rows={4}
                          className={cn(
                            formFieldClass,
                            "font-mono text-sm leading-relaxed pb-8",
                          )}
                        />
                        <div className="absolute bottom-2 right-3 flex items-center gap-1">
                          <Badge
                            variant="outline"
                            className="text-[9px] uppercase tracking-wider text-muted-foreground border-border bg-white/80 backdrop-blur"
                          >
                            Scene prompt
                          </Badge>
                        </div>
                      </div>

                      {isPreview && (
                        <div className="rounded-xl bg-muted/40 border border-border p-4 font-mono text-sm leading-relaxed text-foreground animate-fade-in ">
                          <HighlightedPrompt text={currentPrompt} />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                            Layout Mode
                          </label>
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono bg-muted/50"
                          >
                            {page.imageZoneJson[0]?.width ?? 1365}×
                            {page.imageZoneJson[0]?.height ?? 1024}px
                          </Badge>
                        </div>
                        {(() => {
                          const currentLayout =
                            editingPages[page.id]?.layoutFilePath ??
                            page.layoutFilePath ??
                            "";
                          const isFullPage =
                            currentLayout === FULL_PAGE_LAYOUT_SENTINEL ||
                            currentLayout === "";
                          return (
                            <>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handlePageEdit(
                                      page.id,
                                      "layoutFilePath",
                                      FULL_PAGE_LAYOUT_SENTINEL,
                                    )
                                  }
                                  className={cn(
                                    "flex-1 text-xs font-bold rounded-lg px-3 py-2 border transition-colors",
                                    isFullPage
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "bg-muted/30 text-muted-foreground border-border hover:bg-muted/50",
                                  )}
                                >
                                  Full-Page AI Art
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handlePageEdit(
                                      page.id,
                                      "layoutFilePath",
                                      "",
                                    )
                                  }
                                  className={cn(
                                    "flex-1 text-xs font-bold rounded-lg px-3 py-2 border transition-colors",
                                    !isFullPage
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "bg-muted/30 text-muted-foreground border-border hover:bg-muted/50",
                                  )}
                                >
                                  Custom Layout File
                                </button>
                              </div>
                              {!isFullPage && (
                                <Input
                                  defaultValue={page.layoutFilePath}
                                  onChange={(e) =>
                                    handlePageEdit(
                                      page.id,
                                      "layoutFilePath",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="/path/to/layout.pdf"
                                  className={cn(
                                    formFieldClass,
                                    "font-mono text-xs",
                                  )}
                                />
                              )}
                              <p className="text-[11px] font-medium text-muted-foreground leading-relaxed mt-1">
                                {isFullPage
                                  ? "AI generates a full-bleed illustration covering the entire page."
                                  : "Upload or reference a custom PDF layout with defined image and text zones."}
                              </p>
                            </>
                          );
                        })()}
                        <div className="flex items-start gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1.5 mt-1">
                          <AlertCircle className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                          <p className="text-[10px] font-medium text-amber-700 leading-relaxed">
                            Layout changes only affect{" "}
                            <strong>new orders</strong>. Existing orders keep
                            their original layout snapshot.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                          Story Text Overlay
                        </label>
                        <div className="relative">
                          <textarea
                            key={`story-${page.id}-${page.updatedAt}`}
                            defaultValue={
                              editingPages[page.id]?.textZoneJson?.[0]
                                ?.content ??
                              page.textZoneJson[0]?.content ??
                              ""
                            }
                            onChange={(e) =>
                              handleStoryContentEdit(page, e.target.value)
                            }
                            onFocus={(e) => {
                              activeStoryTextareaRef.current = e.target;
                            }}
                            rows={3}
                            placeholder="Enter this page's story text…"
                            className={cn(formFieldClass, "leading-relaxed")}
                          />
                          {page.textZoneJson[0] && (
                            <div className="absolute bottom-2 right-3">
                              <Badge
                                variant="outline"
                                className="text-[9px] uppercase tracking-wider text-muted-foreground border-border bg-white/80 backdrop-blur"
                              >
                                Safe Zone: {page.textZoneJson[0].width}×
                                {page.textZoneJson[0].height}
                              </Badge>
                            </div>
                          )}
                        </div>
                        {/* Variable picker — click to insert at cursor */}
                        {Object.keys(supportedVariables).length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              Insert:
                            </span>
                            {Object.entries(supportedVariables).map(
                              ([key, desc]) => (
                                <button
                                  key={key}
                                  type="button"
                                  title={desc}
                                  onClick={() =>
                                    insertVariableAtCursor(page, key)
                                  }
                                  className="text-[10px] font-bold font-mono text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded px-1.5 py-0.5 transition-colors"
                                >
                                  {`{{${key}}}`}
                                </button>
                              ),
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
