"use client";

import type { EnhancementSettings } from "@/types";
import { applyTonalEnhancement, normalizeTonalSettings } from "./tonalEngine";

/**
 * Client-side print enhancement.
 *
 * Applies the SAME tonal engine used by the backend (tonalEngine.ts mirrors
 * the backend TonalEnhancer) to a File/Blob in the browser using an offscreen
 * canvas. The enhanced image is uploaded in place of the original; the
 * original File objects are never modified.
 *
 * The final PDF is ALWAYS composed from the original high-resolution image
 * uploaded here — this routine is the only "preview-like" degradation point,
 * and it is bounded by `maxDimension` to stay under the Vercel request limit.
 */

const clamp = (value: number) => Math.min(255, Math.max(0, value));

const toTonalSettings = (settings: EnhancementSettings) => ({
  exposure: settings.exposure,
  brightness: settings.brightness,
  contrast: settings.contrast,
  gamma: settings.gamma,
  shadows: settings.shadows,
  shadowRange: settings.shadowRange,
  shadowFeather: settings.shadowFeather,
  highlights: settings.highlights,
  highlightRange: settings.highlightRange,
  highlightFeather: settings.highlightFeather,
  whites: settings.whites,
  blacks: settings.blacks,
  blackPoint: settings.blackPoint,
  saturation: settings.saturation,
  vibrance: settings.vibrance,
  temperature: settings.temperature,
  tint: settings.tint,
  clarity: settings.clarity,
  sharpness: settings.sharpness,
  faceProtection: settings.faceProtection,
});

export const hasActiveEnhancement = (settings: EnhancementSettings): boolean =>
  Object.entries(settings).some(
    ([key, value]) => value !== (key === "gamma" ? 1 : 0),
  );

/**
 * Enhance an image file in the browser.
 * @param file Original image file (never modified).
 * @param settings Enhancement settings.
 * @param maxDimension Optional cap on the longest edge (keeps memory bounded).
 * @returns A new Blob with enhancement applied, or null when settings are inactive.
 */
export async function enhanceImageClientSide(
  file: File,
  settings: EnhancementSettings,
  maxDimension = 4096,
): Promise<Blob | null> {
  if (!hasActiveEnhancement(settings)) return null;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(
    1,
    maxDimension / Math.max(bitmap.width, bitmap.height),
  );
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    bitmap.close();
    return null;
  }

  // Composite onto white first: the upload is encoded as JPEG (no alpha), and
  // transparent pixels would otherwise flatten onto black when the enhanced
  // image is baked into the print PDF.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const imageData = context.getImageData(0, 0, width, height);
  applyTonalEnhancement(
    imageData.data,
    width,
    height,
    4,
    normalizeTonalSettings(toTonalSettings(settings)),
  );
  context.putImageData(imageData, 0, 0);

  // Adaptive quality: keep the encoded blob under the 4.5MB Vercel request limit.
  let quality = 0.95;
  let blob = await canvasToJpeg(canvas, quality);
  while (blob && blob.size > 4.2 * 1024 * 1024 && quality > 0.7) {
    quality -= 0.1;
    blob = await canvasToJpeg(canvas, quality);
  }
  return blob;
}

function canvasToJpeg(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) =>
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality),
  );
}
