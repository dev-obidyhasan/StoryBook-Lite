"use client";

import { useEffect, useRef, useState } from "react";
import { X, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EnhancementSettings } from "@/types";
import { presetsService } from "@/services/presets/presets.service";
import type { EnhancementPresetDTO } from "@/services/presets/presets.service";

type Props = {
  /** Current enhancement settings to save as a preset */
  settings: EnhancementSettings;
  /** Called with the newly created preset on success */
  onSaved: (preset: EnhancementPresetDTO) => void;
  /** Called when the user closes the modal without saving */
  onClose: () => void;
};

/**
 * SavePresetModal
 *
 * Opens as an accessible dialog overlay. The user types a preset name,
 * confirms, and the current enhancement settings are persisted to the
 * `image_enhancement_presets` table via the POST /presets endpoint.
 *
 * On success, `onSaved` is called with the new preset so the parent can
 * add it to the preset list and auto-select it.
 */
export function SavePresetModal({ settings, onSaved, onClose }: Props) {
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the name input when the modal mounts
  useEffect(() => {
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Please enter a preset name.");
      inputRef.current?.focus();
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const res = await presetsService.createPreset(trimmedName, settings);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to save preset.");
      }
      onSaved(res.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save preset. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") void handleSave();
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-modal="true"
      role="dialog"
      aria-labelledby="save-preset-modal-title"
    >
      {/* Panel */}
      <div className="relative bg-background border border-border rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors rounded-lg p-1 hover:bg-muted"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div>
          <h2
            id="save-preset-modal-title"
            className="text-lg font-bold text-foreground"
          >
            Save as Preset
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Give your current enhancement settings a name so you can reuse them
            later.
          </p>
        </div>

        {/* Name input */}
        <div className="space-y-1.5">
          <label
            htmlFor="preset-name-input"
            className="text-sm font-semibold text-foreground"
          >
            Preset Name <span className="text-destructive">*</span>
          </label>
          <input
            id="preset-name-input"
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="e.g. My Dark Scene Fix"
            maxLength={80}
            disabled={isSaving}
            className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
          {error && (
            <p className="text-xs text-destructive font-medium">{error}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving || !name.trim()}
            className="rounded-xl gap-2"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSaving ? "Saving…" : "Save Preset"}
          </Button>
        </div>
      </div>
    </div>
  );
}
