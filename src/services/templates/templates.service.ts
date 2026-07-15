import { clientFetch } from "@/helper/client-fetch";
import type {
  ApiResponse,
  BookTemplate,
  ActiveTemplate,
  TextZone,
  PlatformAIDefaults,
  PromptPreviewResult,
} from "@/types";

export type UpdateTemplatePayload = Partial<{
  name: string;
  stylePrompt: string;
  description: string;
}>;

export const templatesService = {
  getActiveTemplates: () =>
    clientFetch.get<ApiResponse<ActiveTemplate[]>>("/templates/active"),

  getTemplates: (params?: { isActive?: boolean }) => {
    const qs =
      params?.isActive !== undefined ? `?isActive=${params.isActive}` : "";
    return clientFetch.get<ApiResponse<BookTemplate[]>>(`/templates${qs}`);
  },

  getTemplateById: (id: string) =>
    clientFetch.get<ApiResponse<BookTemplate>>(`/templates/${id}`),

  getAIPlatformDefaults: () =>
    clientFetch.get<ApiResponse<PlatformAIDefaults>>("/templates/ai-defaults"),

  getSupportedVariables: () =>
    clientFetch.get<ApiResponse<Record<string, string>>>(
      "/templates/variables",
    ),

  createTemplate: (data: {
    name: string;
    productType: string;
    pageCount: number;
    stylePrompt: string;
    description?: string;
  }) =>
    clientFetch.post<ApiResponse<BookTemplate>>("/templates", {
      body: JSON.stringify(data),
    }),

  updateTemplate: (id: string, data: UpdateTemplatePayload) =>
    clientFetch.patch<ApiResponse<BookTemplate>>(`/templates/${id}`, {
      body: JSON.stringify(data),
    }),

  toggleStatus: (id: string, isActive: boolean) =>
    clientFetch.patch<ApiResponse<BookTemplate>>(`/templates/${id}/status`, {
      body: JSON.stringify({ isActive }),
    }),

  validateTemplate: (id: string) =>
    clientFetch.get<
      ApiResponse<{ isValid: boolean; missingPages: number[]; message: string }>
    >(`/templates/${id}/validate`),

  addTemplatePage: (
    templateId: string,
    data: {
      pageNumber: number;
      promptTemplate: string;
      sceneLabel?: string;
      layoutFilePath?: string;
    },
  ) =>
    clientFetch.post<ApiResponse<unknown>>(`/templates/${templateId}/pages`, {
      body: JSON.stringify(data),
    }),

  previewTemplatePrompts: (
    templateId: string,
    params: {
      childName: string;
      childAge?: number;
      childGender: "MALE" | "FEMALE";
      pageNumber?: number;
    },
  ) => {
    const qs = new URLSearchParams({
      childName: params.childName,
      childGender: params.childGender,
      ...(params.childAge != null ? { childAge: String(params.childAge) } : {}),
      ...(params.pageNumber != null
        ? { pageNumber: String(params.pageNumber) }
        : {}),
    });
    return clientFetch.get<ApiResponse<PromptPreviewResult>>(
      `/templates/${templateId}/preview-prompts?${qs.toString()}`,
    );
  },

  updateTemplatePage: (
    templateId: string,
    pageId: string,
    data: Partial<{
      promptTemplate: string;
      layoutFilePath: string;
      sceneLabel: string;
      textZoneJson: TextZone[];
    }>,
  ) =>
    clientFetch.patch<ApiResponse<unknown>>(
      `/templates/${templateId}/pages/${pageId}`,
      {
        body: JSON.stringify(data),
      },
    ),
};
