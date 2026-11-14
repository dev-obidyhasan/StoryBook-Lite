import { clientFetch } from "@/helper/client-fetch";
import type {
  ApiResponse,
  BookTemplate,
  ActiveTemplate,
  TemplateStatus,
  DimensionUnit,
} from "@/types";

export type CreateTemplatePayload = {
  name: string;
  slug?: string;
  coverImage?: string;
  width: number;
  height: number;
  unit: DimensionUnit;
  totalPages: number;
};

export type UpdateTemplatePayload = Partial<{
  name: string;
  slug: string;
  coverImage: string;
  width: number;
  height: number;
  unit: DimensionUnit;
  totalPages: number;
  status: TemplateStatus;
}>;

export type UpdateTemplatePagesPayload = {
  pages: Array<{
    pageNumber: number;
    storyText?: string;
  }>;
};

export const templatesService = {
  getActiveTemplates: () =>
    clientFetch.get<ApiResponse<ActiveTemplate[]>>("/templates/active"),

  getTemplates: (params?: {
    status?: TemplateStatus;
    page?: number;
    limit?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.append("status", params.status);
    if (params?.page) qs.append("page", String(params.page));
    if (params?.limit) qs.append("limit", String(params.limit));

    const queryString = qs.toString();
    const url = queryString ? `/templates?${queryString}` : "/templates";
    return clientFetch.get<ApiResponse<BookTemplate[]>>(url);
  },

  getTemplateById: (id: string) =>
    clientFetch.get<ApiResponse<BookTemplate>>(`/templates/${id}`),

  createTemplate: (data: CreateTemplatePayload) =>
    clientFetch.post<ApiResponse<BookTemplate>>("/templates", {
      body: JSON.stringify(data),
    }),

  updateTemplate: (id: string, data: UpdateTemplatePayload) =>
    clientFetch.patch<ApiResponse<BookTemplate>>(`/templates/${id}`, {
      body: JSON.stringify(data),
    }),

  deleteTemplate: (id: string) =>
    clientFetch.delete<ApiResponse<null>>(`/templates/${id}`),

  updateTemplatePages: (id: string, data: UpdateTemplatePagesPayload) =>
    clientFetch.patch<ApiResponse<BookTemplate>>(`/templates/${id}/pages`, {
      body: JSON.stringify(data),
    }),

  generatePDF: async (
    templateId: string,
    formData: FormData,
  ): Promise<Blob> => {
    // The backend returns the PDF as base64-encoded JSON (not a raw binary
    // stream) so download-manager browser extensions (e.g. IDM) cannot
    // intercept the response and strip CORS headers. We decode the base64
    // back into a Blob here.
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/pdf/generate/${templateId}`,
      {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      const errJson = await response.json().catch(() => null);
      throw new Error(errJson?.error?.message || "Failed to generate PDF");
    }

    const json = (await response.json()) as {
      success: boolean;
      data?: { base64?: string; mimeType?: string };
      error?: { message?: string };
    };

    if (!json.success || !json.data?.base64) {
      throw new Error(json.error?.message || "Failed to generate PDF");
    }

    // Decode base64 into a binary Blob
    const byteCharacters = atob(json.data.base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], {
      type: json.data.mimeType || "application/pdf",
    });
  },
};
