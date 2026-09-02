"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { RotateCcw, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { EnhancementConfig, EnhancementSettings } from "@/types";
import {
  applyTonalEnhancement,
  normalizeTonalSettings,
} from "@/services/orders/tonalEngine";
import { presetsService } from "@/services/presets/presets.service";
import type { EnhancementPresetDTO } from "@/services/presets/presets.service";
import { SavePresetModal } from "./SavePresetModal";

const neutral: EnhancementSettings = {
  brightness: 0,
  contrast: 0,
  exposure: 0,
  gamma: 1,
  shadows: 0,
  shadowRange: 0.5,
  shadowFeather: 0.5,
  highlights: 0,
  highlightRange: 0.5,
  highlightFeather: 0.5,
  whites: 0,
  blacks: 0,
  blackPoint: 0,
  saturation: 0,
  vibrance: 0,
  temperature: 0,
  tint: 0,
  clarity: 0,
  sharpness: 0,
  faceProtection: 0,
};

const original: EnhancementSettings = { ...neutral };

/** Same ids as the backend ENHANCEMENT_PRESETS (backward compatible). */
const SYSTEM_PRESETS: Record<string, EnhancementSettings> = {
  original,
  printLight: {
    ...neutral,
    brightness: 0.04,
    contrast: 0.01,
    exposure: 0.06,
    gamma: 0.99,
    shadows: 0.12,
    shadowRange: 0.45,
    shadowFeather: 0.55,
    highlights: -0.03,
    blackPoint: 0.3,
    saturation: 0.02,
    clarity: 0.08,
    sharpness: 0.12,
  },
  brightPrint: {
    ...neutral,
    brightness: 0.06,
    contrast: 0.02,
    exposure: 0.1,
    gamma: 0.98,
    shadows: 0.16,
    shadowRange: 0.48,
    shadowFeather: 0.55,
    highlights: -0.04,
    whites: 0.05,
    blackPoint: 0.3,
    saturation: 0.03,
    clarity: 0.1,
    sharpness: 0.15,
  },
  shadowDetail: {
    ...neutral,
    brightness: 0.02,
    contrast: -0.01,
    exposure: 0.04,
    gamma: 0.97,
    shadows: 0.3,
    shadowRange: 0.5,
    shadowFeather: 0.6,
    highlights: -0.08,
    blacks: 0.06,
    blackPoint: 0.45,
    saturation: 0.03,
    clarity: 0.12,
    sharpness: 0.12,
  },
  softPrint: {
    ...neutral,
    brightness: 0.02,
    contrast: -0.04,
    exposure: 0.04,
    gamma: 0.99,
    shadows: 0.1,
    shadowRange: 0.45,
    shadowFeather: 0.55,
    highlights: -0.06,
    blackPoint: 0.3,
    saturation: -0.02,
    clarity: 0.05,
    sharpness: 0.05,
    temperature: 0.01,
  },
  vividPrint: {
    ...neutral,
    brightness: 0.02,
    contrast: 0.06,
    exposure: 0.05,
    gamma: 0.98,
    shadows: 0.12,
    shadowRange: 0.45,
    shadowFeather: 0.55,
    highlights: -0.03,
    blackPoint: 0.3,
    saturation: 0.14,
    vibrance: 0.2,
    clarity: 0.14,
    sharpness: 0.18,
    temperature: 0.01,
  },
  gentlePrintLift: {
    ...neutral,
    brightness: 0.02,
    exposure: 0.04,
    gamma: 0.99,
    shadows: 0.14,
    shadowRange: 0.48,
    shadowFeather: 0.55,
    highlights: -0.02,
    blacks: 0.03,
    blackPoint: 0.32,
    saturation: 0.03,
    vibrance: 0.1,
    clarity: 0.1,
    sharpness: 0.12,
  },
  shadowRecovery: {
    ...neutral,
    brightness: 0,
    exposure: 0.05,
    gamma: 0.98,
    shadows: 0.20,
    shadowRange: 0.52,
    shadowFeather: 0.6,
    highlights: -0.06,
    blacks: 0.05,
    blackPoint: 0.4,
    saturation: 0.04,
    vibrance: 0.12,
    clarity: 0.1,
    sharpness: 0.1,
    faceProtection: 0.3,
  },
  balancedPrint: {
    ...neutral,
    brightness: 0.02,
    contrast: 0.03,
    exposure: 0.06,
    gamma: 0.99,
    shadows: 0.14,
    shadowRange: 0.45,
    shadowFeather: 0.5,
    highlights: -0.03,
    blacks: 0.02,
    whites: 0.03,
    blackPoint: 0.3,
    saturation: 0.05,
    vibrance: 0.12,
    clarity: 0.1,
    sharpness: 0.14,
    temperature: 0.01,
  },
  darkSceneRecovery: {
    ...neutral,
    brightness: 0,
    exposure: 0.08,
    gamma: 0.97,
    shadows: 0.28,
    shadowRange: 0.58,
    shadowFeather: 0.7,
    highlights: -0.05,
    blacks: 0.08,
    blackPoint: 0.5,
    saturation: 0.05,
    vibrance: 0.18,
    clarity: 0.16,
    sharpness: 0.14,
    faceProtection: 0.45,
  },
  detailPrint: {
    ...neutral,
    brightness: 0.01,
    contrast: 0.05,
    exposure: 0.04,
    gamma: 0.99,
    shadows: 0.15,
    shadowRange: 0.45,
    shadowFeather: 0.55,
    highlights: -0.04,
    blackPoint: 0.35,
    saturation: 0.06,
    vibrance: 0.15,
    clarity: 0.2,
    sharpness: 0.22,
  },
};

const SYSTEM_PRESET_LABELS: Record<string, string> = {
  original: "Original",
  printLight: "Print Light",
  brightPrint: "Bright Print",
  shadowDetail: "Shadow Detail",
  softPrint: "Soft Print",
  vividPrint: "Vivid Print",
  gentlePrintLift: "Gentle Print Lift",
  shadowRecovery: "Shadow Recovery",
  balancedPrint: "Balanced Print",
  darkSceneRecovery: "Dark Scene Recovery",
  detailPrint: "Detail Print",
};

type ControlDef = [keyof EnhancementSettings, string, number, number];

const controls: ControlDef[] = [
  // ── Light & exposure ─────────────────────────────────────────────
  ["exposure", "Exposure", -0.5, 0.5],
  ["brightness", "Brightness", -0.3, 0.3],
  ["contrast", "Contrast", -0.3, 0.3],
  ["gamma", "Gamma", 0.7, 1.3],
  // ── Selective tonal (real, engine-backed) ────────────────────────
  ["shadows", "Shadows", -0.5, 0.5],
  ["shadowRange", "Shadow Range", 0.15, 0.85],
  ["shadowFeather", "Shadow Feather", 0, 1],
  ["highlights", "Highlights", -0.5, 0.5],
  ["highlightRange", "Highlight Range", 0.15, 0.85],
  ["highlightFeather", "Highlight Feather", 0, 1],
  ["whites", "Whites", -0.5, 0.5],
  ["blacks", "Blacks", -0.5, 0.5],
  ["blackPoint", "Black Point", 0, 1],
  // ── Color ────────────────────────────────────────────────────────
  ["saturation", "Saturation", -0.5, 0.5],
  ["vibrance", "Vibrance", -0.5, 0.5],
  ["temperature", "Warmth", -0.25, 0.25],
  ["tint", "Tint", -0.25, 0.25],
  // ── Local detail ─────────────────────────────────────────────────
  ["clarity", "Local Contrast / Clarity", 0, 1],
  ["sharpness", "Sharpness", 0, 1],
  ["faceProtection", "Face Protection", 0, 1],
];

const toTonalSettings = (s: EnhancementSettings) => ({
  exposure: s.exposure,
  brightness: s.brightness,
  contrast: s.contrast,
  gamma: s.gamma,
  shadows: s.shadows,
  shadowRange: s.shadowRange,
  shadowFeather: s.shadowFeather,
  highlights: s.highlights,
  highlightRange: s.highlightRange,
  highlightFeather: s.highlightFeather,
  whites: s.whites,
  blacks: s.blacks,
  blackPoint: s.blackPoint,
  saturation: s.saturation,
  vibrance: s.vibrance,
  temperature: s.temperature,
  tint: s.tint,
  clarity: s.clarity,
  sharpness: s.sharpness,
  faceProtection: s.faceProtection,
});

const hasActiveEnhancement = (s: EnhancementSettings): boolean =>
  Object.entries(s).some(([key, value]) => value !== (key === "gamma" ? 1 : 0));

type Props = {
  value?: EnhancementConfig | null;
  onChange: (value: EnhancementConfig) => Promise<void> | void;
  previewFile?: File | null;
};

export function PrintEnhancementPanel({ value, onChange, previewFile }: Props) {
  const [config, setConfig] = useState<EnhancementConfig>(
    value || {
      enabled: false,
      mode: "preset",
      presetId: "original",
      settings: original,
    },
  );
  const [preview, setPreview] = useState<string | null>(null);
  const previewBusy = useRef(false);

  // ── Custom presets loaded from the API ───────────────────────────
  const [customPresets, setCustomPresets] = useState<EnhancementPresetDTO[]>([]);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Sync when parent value changes
  useEffect(() => {
    if (value) setConfig(value);
  }, [value]);

  // Load custom presets from the API on mount
  const loadCustomPresets = useCallback(async () => {
    try {
      const res = await presetsService.listPresets();
      if (res.success && res.data) {
        // Filter out system presets — they are already hardcoded in SYSTEM_PRESETS
        setCustomPresets(res.data.filter((p) => !p.isSystem));
      }
    } catch {
      // Non-critical — silently skip; the hardcoded system presets still work
    }
  }, []);

  useEffect(() => {
    void loadCustomPresets();
  }, [loadCustomPresets]);

  // Debounced, reduced-resolution preview using the SAME tonal engine as the
  // final export. Full-resolution images are never processed for preview.
  useEffect(() => {
    if (!previewFile) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        if (previewBusy.current) return;
        previewBusy.current = true;
        try {
          const bitmap = await createImageBitmap(previewFile);
          if (cancelled) {
            bitmap.close();
            return;
          }
          const scale = Math.min(
            1,
            900 / Math.max(bitmap.width, bitmap.height),
          );
          const width = Math.max(1, Math.round(bitmap.width * scale));
          const height = Math.max(1, Math.round(bitmap.height * scale));
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext("2d", { willReadFrequently: true });
          if (!context) {
            bitmap.close();
            return;
          }
          // Composite onto white first: the preview is encoded as JPEG (no
          // alpha), and transparent pixels would otherwise flatten onto black.
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, width, height);
          context.drawImage(bitmap, 0, 0, width, height);
          bitmap.close();

          if (hasActiveEnhancement(config.settings)) {
            const imageData = context.getImageData(0, 0, width, height);
            applyTonalEnhancement(
              imageData.data,
              width,
              height,
              4,
              normalizeTonalSettings(toTonalSettings(config.settings)),
            );
            context.putImageData(imageData, 0, 0);
          }

          if (cancelled) return;
          setPreview(canvas.toDataURL("image/jpeg", 0.85));
        } finally {
          previewBusy.current = false;
        }
      })();
    }, 180);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [previewFile, config.settings]);

  const commit = (next: EnhancementConfig) => {
    setConfig(next);
    void onChange(next);
  };

  const selected = useMemo(() => {
    if (config.presetId) {
      if (SYSTEM_PRESET_LABELS[config.presetId])
        return SYSTEM_PRESET_LABELS[config.presetId];
      const custom = customPresets.find((p) => p.id === config.presetId);
      if (custom) return custom.name;
    }
    return "Custom";
  }, [config.presetId, customPresets]);

  const handlePresetSaved = (preset: EnhancementPresetDTO) => {
    // Add to local list immediately (no re-fetch needed)
    setCustomPresets((prev) => [...prev, preset]);
    // Auto-select the new preset
    commit({
      enabled: true,
      mode: "preset",
      presetId: preset.id,
      settings: preset.settings as EnhancementSettings,
    });
    setIsSaveModalOpen(false);
    toast.success(`Preset "${preset.name}" saved and selected.`);
  };

  const handleDeleteCustomPreset = async (preset: EnhancementPresetDTO) => {
    setIsDeletingId(preset.id);
    try {
      await presetsService.deletePreset(preset.id);
      setCustomPresets((prev) => prev.filter((p) => p.id !== preset.id));
      // If the deleted preset was selected, fall back to Original
      if (config.presetId === preset.id) {
        commit({
          enabled: false,
          mode: "preset",
          presetId: "original",
          settings: { ...original },
        });
      }
      toast.success(`Preset "${preset.name}" deleted.`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete preset.",
      );
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <section className="surface-card p-6 space-y-5">
      <div>
        <h2 className="text-xl font-extrabold">Print / Image Enhancement</h2>
        <p className="text-sm text-muted-foreground">
          Selective tonal editing for print. Shadows, highlights, blacks and
          whites each work on their own luminance range — faces and highlights
          stay protected. Original uploads are never modified.
        </p>
      </div>

      {/* ── System presets ──────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          System Presets
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.keys(SYSTEM_PRESETS).map((id) => (
            <Button
              key={id}
              type="button"
              variant={config.presetId === id ? "default" : "outline"}
              size="sm"
              onClick={() =>
                commit({
                  enabled: id !== "original",
                  mode: "preset",
                  presetId: id,
                  settings: { ...SYSTEM_PRESETS[id] },
                })
              }
            >
              {SYSTEM_PRESET_LABELS[id]}
            </Button>
          ))}
        </div>
      </div>

      {/* ── Custom (user-saved) presets ─────────────────────────── */}
      {customPresets.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            My Presets
          </p>
          <div className="flex flex-wrap gap-2">
            {customPresets.map((preset) => (
              <div key={preset.id} className="flex items-center gap-1">
                <Button
                  type="button"
                  variant={config.presetId === preset.id ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    commit({
                      enabled: true,
                      mode: "preset",
                      presetId: preset.id,
                      settings: preset.settings as EnhancementSettings,
                    })
                  }
                >
                  {preset.name}
                </Button>
                <button
                  type="button"
                  onClick={() => void handleDeleteCustomPreset(preset)}
                  disabled={isDeletingId === preset.id}
                  title={`Delete preset "${preset.name}"`}
                  aria-label={`Delete preset ${preset.name}`}
                  className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => commit({ ...config, enabled: e.target.checked })}
          />{" "}
          Enable for entire Storybook{" "}
          <span className="text-muted-foreground">({selected})</span>
        </label>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            commit({
              enabled: false,
              mode: "preset",
              presetId: "original",
              settings: { ...original },
            })
          }
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          Reset
        </Button>
      </div>

      {/* ── Before / After preview ──────────────────────────────── */}
      {preview && previewFile && (
        <div className="grid grid-cols-2 gap-3">
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={URL.createObjectURL(previewFile)}
              alt="Original preview"
              className="aspect-video w-full object-cover rounded-lg"
            />
            <figcaption className="text-xs mt-1">Before</figcaption>
          </figure>
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Enhanced preview"
              className="aspect-video w-full object-cover rounded-lg"
            />
            <figcaption className="text-xs mt-1">
              After (editing preview)
            </figcaption>
          </figure>
        </div>
      )}

      {/* ── Slider controls ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {controls.map(([key, label, min, max]) => (
          <label key={key} className="text-sm font-semibold">
            {label}
            <input
              className="w-full"
              type="range"
              min={min}
              max={max}
              step=".01"
              value={config.settings[key]}
              onChange={(e) =>
                commit({
                  enabled: true,
                  mode: "custom",
                  settings: {
                    ...config.settings,
                    [key]: Number(e.target.value),
                  },
                })
              }
            />
          </label>
        ))}
      </div>

      {/* ── Save as Preset button ───────────────────────────────── */}
      <div className="pt-1">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsSaveModalOpen(true)}
          disabled={!hasActiveEnhancement(config.settings)}
          title={
            !hasActiveEnhancement(config.settings)
              ? "Adjust at least one setting before saving"
              : "Save the current settings as a reusable preset"
          }
        >
          <Save className="w-4 h-4 mr-2" />
          Save as Preset…
        </Button>
        {!hasActiveEnhancement(config.settings) && (
          <p className="text-xs text-muted-foreground mt-1.5">
            Adjust any setting above to enable saving.
          </p>
        )}
      </div>

      {/* ── Save Preset Modal ───────────────────────────────────── */}
      {isSaveModalOpen && (
        <SavePresetModal
          settings={config.settings}
          onSaved={handlePresetSaved}
          onClose={() => setIsSaveModalOpen(false)}
        />
      )}
    </section>
  );
}
