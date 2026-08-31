"use client";

import type { EnhancementSettings } from "@/types";

/**
 * Client-side print enhancement.
 *
 * Applies the same pixel math as the backend ImageEnhancement service to a
 * File/Blob in the browser using an offscreen canvas. Used so enhancement
 * works even when the deployed backend does not yet support the enhancement
 * parameter — the enhanced image is uploaded in place of the original, and
 * the original File objects are never modified.
 */

const clamp = (value: number) => Math.min(255, Math.max(0, value));

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

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const imageData = context.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  const exposure = Math.pow(2, settings.exposure);
  const brightness = settings.brightness * 255;
  const contrastFactor = (1 + settings.contrast) * (1 + settings.contrast);
  const saturationFactor = 1 + settings.saturation;
  const gamma = Math.max(0.01, settings.gamma);

  for (let i = 0; i < pixels.length; i += 4) {
    let r = pixels[i];
    let g = pixels[i + 1];
    let b = pixels[i + 2];

    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    const shadowWeight = Math.max(0, 1 - luminance * 2);
    const highlightWeight = Math.max(0, luminance * 2 - 1);

    r = r * exposure + brightness;
    g = g * exposure + brightness;
    b = b * exposure + brightness;

    r = 128 + (r - 128) * contrastFactor;
    g = 128 + (g - 128) * contrastFactor;
    b = 128 + (b - 128) * contrastFactor;

    const shadowLift = settings.shadows * 255 * shadowWeight;
    const highlightAdjust = settings.highlights * 255 * highlightWeight;
    r += shadowLift + highlightAdjust;
    g += shadowLift + highlightAdjust;
    b += shadowLift + highlightAdjust;

    r = 255 * Math.pow(clamp(r) / 255, gamma);
    g = 255 * Math.pow(clamp(g) / 255, gamma);
    b = 255 * Math.pow(clamp(b) / 255, gamma);

    const mid = (r + g + b) / 3;
    r = mid + (r - mid) * saturationFactor + settings.temperature * 255;
    g = mid + (g - mid) * saturationFactor;
    b = mid + (b - mid) * saturationFactor - settings.temperature * 255;

    pixels[i] = clamp(r);
    pixels[i + 1] = clamp(g);
    pixels[i + 2] = clamp(b);
  }

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
