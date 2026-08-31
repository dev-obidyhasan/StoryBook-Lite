"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { EnhancementConfig, EnhancementSettings } from "@/types";
import {
  applyTonalEnhancement,
  normalizeTonalSettings,
} from "@/services/orders/tonalEngine";

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
const presets: Record<string, EnhancementSettings> = {
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

const labels: Record<string, string> = {
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

  useEffect(() => {
    if (value) setConfig(value);
  }, [value]);

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
          // alpha), and transparent pixels would otherwise flatten onto black
          // and make the "After" image appear fully black.
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

  const selected = useMemo(
    () =>
      config.presetId && labels[config.presetId]
        ? labels[config.presetId]
        : "Custom",
    [config.presetId],
  );

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

      <div className="flex flex-wrap gap-2">
        {Object.keys(presets).map((id) => (
          <Button
            key={id}
            type="button"
            variant={config.presetId === id ? "default" : "outline"}
            onClick={() =>
              commit({
                enabled: id !== "original",
                mode: "preset",
                presetId: id,
                settings: { ...presets[id] },
              })
            }
          >
            {labels[id]}
          </Button>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            commit({
              enabled: false,
              mode: "preset",
              presetId: "original",
              settings: { ...original },
            })
          }
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>

      <label className="flex items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          checked={config.enabled}
          onChange={(e) => commit({ ...config, enabled: e.target.checked })}
        />{" "}
        Enable for entire Storybook{" "}
        <span className="text-muted-foreground">({selected})</span>
      </label>

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

      <Button
        type="button"
        variant="outline"
        onClick={() =>
          toast.success(
            "Custom settings are saved to this order and reusable in the enhancement controls.",
          )
        }
      >
        <Save className="w-4 h-4 mr-2" />
        Save Custom Settings
      </Button>
    </section>
  );
}
