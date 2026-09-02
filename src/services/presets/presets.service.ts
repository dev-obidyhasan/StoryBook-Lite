import { clientFetch } from "@/helper/client-fetch";
import type { ApiResponse, EnhancementSettings } from "@/types";

export type EnhancementPresetDTO = {
  id: string;
  name: string;
  settings: EnhancementSettings;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
};

export const presetsService = {
  /** Fetch all presets (system + custom). System presets are first. */
  listPresets: () =>
    clientFetch.get<ApiResponse<EnhancementPresetDTO[]>>("/presets"),

  /** Save a new custom preset. */
  createPreset: (name: string, settings: EnhancementSettings) =>
    clientFetch.post<ApiResponse<EnhancementPresetDTO>>("/presets", {
      body: JSON.stringify({ name, settings }),
    }),

  /** Delete a custom preset by id. System presets are protected server-side. */
  deletePreset: (id: string) =>
    clientFetch.delete<ApiResponse<null>>(`/presets/${id}`),
};
