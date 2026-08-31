"use client";

import { useEffect, useMemo, useState } from "react";
import { RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { EnhancementConfig, EnhancementSettings } from "@/types";

const original: EnhancementSettings = {
  brightness: 0,
  contrast: 0,
  exposure: 0,
  gamma: 1,
  shadows: 0,
  highlights: 0,
  saturation: 0,
  sharpness: 0,
  temperature: 0,
};
const presets: Record<string, EnhancementSettings> = {
  original,
  printLight: {
    ...original,
    brightness: 0.08,
    exposure: 0.08,
    gamma: 0.98,
    shadows: 0.18,
    highlights: -0.04,
    sharpness: 0.15,
  },
  brightPrint: {
    ...original,
    brightness: 0.12,
    exposure: 0.12,
    gamma: 0.97,
    shadows: 0.22,
    highlights: -0.06,
    saturation: 0.02,
    sharpness: 0.18,
  },
  shadowDetail: {
    ...original,
    brightness: 0.04,
    exposure: 0.03,
    gamma: 0.96,
    shadows: 0.35,
    highlights: -0.1,
    sharpness: 0.12,
  },
  softPrint: {
    ...original,
    brightness: 0.06,
    contrast: -0.06,
    exposure: 0.05,
    gamma: 0.99,
    shadows: 0.16,
    highlights: -0.08,
    saturation: -0.03,
    sharpness: 0.04,
    temperature: 0.02,
  },
  vividPrint: {
    ...original,
    brightness: 0.05,
    contrast: 0.08,
    exposure: 0.04,
    gamma: 0.98,
    shadows: 0.16,
    highlights: -0.04,
    saturation: 0.12,
    sharpness: 0.2,
    temperature: 0.01,
  },
};
const labels: Record<string, string> = {
  original: "Original",
  printLight: "Print Light",
  brightPrint: "Bright Print",
  shadowDetail: "Shadow Detail",
  softPrint: "Soft Print",
  vividPrint: "Vivid Print",
};
const controls: Array<[keyof EnhancementSettings, string, number, number]> = [
  ["brightness", "Brightness", -0.3, 0.3],
  ["contrast", "Contrast", -0.3, 0.3],
  ["exposure", "Exposure", -0.5, 0.5],
  ["gamma", "Gamma", 0.7, 1.3],
  ["shadows", "Shadows", -0.5, 0.5],
  ["highlights", "Highlights", -0.5, 0.5],
  ["saturation", "Saturation", -0.5, 0.5],
  ["sharpness", "Sharpness", 0, 1],
  ["temperature", "Warmth", -0.25, 0.25],
];

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
  useEffect(() => {
    if (value) setConfig(value);
  }, [value]);
  useEffect(() => {
    if (!previewFile) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    const sourceUrl = URL.createObjectURL(previewFile);
    const image = new Image();
    image.onload = () => {
      if (cancelled) return;
      const scale = Math.min(1, 900 / image.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      if (!context) return;
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      const {
        brightness,
        exposure,
        shadows,
        gamma,
        contrast,
        saturation,
        temperature,
      } = config.settings;
      for (let i = 0; i < pixels.data.length; i += 4) {
        const luminance =
          (0.2126 * pixels.data[i] +
            0.7152 * pixels.data[i + 1] +
            0.0722 * pixels.data[i + 2]) /
          255;
        const lift = shadows * 255 * Math.max(0, 1 - luminance * 2);
        const factor = (1 + contrast) * (1 + contrast);
        const midpoint = 128;
        const values = [
          pixels.data[i],
          pixels.data[i + 1],
          pixels.data[i + 2],
        ].map((channel) => {
          let value =
            midpoint +
            (channel * Math.pow(2, exposure) +
              brightness * 255 +
              lift -
              midpoint) *
              factor;
          value =
            255 * Math.pow(Math.min(255, Math.max(0, value)) / 255, gamma);
          return value;
        });
        const mean = values.reduce((a, b) => a + b, 0) / 3;
        pixels.data[i] = Math.min(
          255,
          Math.max(
            0,
            mean + (values[0] - mean) * (1 + saturation) + temperature * 255,
          ),
        );
        pixels.data[i + 1] = Math.min(
          255,
          Math.max(0, mean + (values[1] - mean) * (1 + saturation)),
        );
        pixels.data[i + 2] = Math.min(
          255,
          Math.max(
            0,
            mean + (values[2] - mean) * (1 + saturation) - temperature * 255,
          ),
        );
      }
      context.putImageData(pixels, 0, 0);
      setPreview(canvas.toDataURL("image/jpeg", 0.85));
    };
    image.src = sourceUrl;
    return () => {
      cancelled = true;
      URL.revokeObjectURL(sourceUrl);
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
          Adjust image pixels for print while preserving original uploads and
          sharp story text.
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
                settings: presets[id],
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
              settings: original,
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
            <img
              src={URL.createObjectURL(previewFile)}
              alt="Original preview"
              className="aspect-video w-full object-cover rounded-lg"
            />
            <figcaption className="text-xs mt-1">Before</figcaption>
          </figure>
          <figure>
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
