import { clientFetch, tokenStore } from "@/helper/client-fetch";
import { xhrFetch } from "@/helper/xhr-fetch";
import type { ApiResponse, Order } from "@/types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export type CreateOrderPayload = {
  customerName: string;
  templateId: string;
};

export const ordersService = {
  createOrder: (data: CreateOrderPayload) =>
    clientFetch.post<ApiResponse<Order>>("/orders", {
      body: JSON.stringify(data),
    }),

  getOrderById: (id: string) =>
    clientFetch.get<ApiResponse<Order>>(`/orders/${id}`),

  updateOrderEnhancement: (id: string, enhancement: unknown) =>
    clientFetch.patch<ApiResponse<Order>>(`/orders/${id}/enhancement`, {
      body: JSON.stringify({ enhancement }),
    }),

  /** Upload a single page image (keeps each request under Vercel's 4.5MB limit).
   *
   * Uses XMLHttpRequest (xhrFetch) instead of window.fetch because
   * download-manager browser extensions patch `window.fetch` and their
   * broken bridge rejects requests with "Receiving end does not exist"
   * (surfacing as a bogus CORS error). XHR is not patched by those
   * extensions, so uploads are guaranteed to reach the server.
   */
  uploadOrderPageImage: async (
    orderId: string,
    pageNumber: number,
    file: File,
    onUploadProgress?: (percent: number) => void,
  ): Promise<void> => {
    const formData = new FormData();
    formData.append("image", file);

    const response = await xhrFetch(
      `${API_BASE}/orders/${orderId}/pages/${pageNumber}/image`,
      {
        method: "POST",
        body: formData,
        onUploadProgress,
        headers: {
          Authorization: `Bearer ${tokenStore.get()}`,
        },
      },
    );

    if (!response.ok) {
      const errJson = await response.json().catch(() => null);
      throw new Error(
        errJson?.error?.message || `Failed to upload page ${pageNumber}`,
      );
    }
  },

  /** Generate PDF from previously uploaded page images (no large multipart body).
   *
   * The backend returns the PDF as base64-encoded JSON (not a raw binary
   * stream) so download-manager browser extensions (e.g. IDM) cannot
   * intercept the response and strip CORS headers. We decode the base64
   * back into a Blob here and trigger the download in the UI.
   */
  generateOrderPDF: async (
    orderId: string,
    enhancement?: unknown,
  ): Promise<{ blob: Blob; enhancementApplied: boolean }> => {
    // Also routed through XMLHttpRequest so extension-patched window.fetch
    // cannot break the PDF generation request.
    const response = await xhrFetch(`${API_BASE}/orders/${orderId}/generate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenStore.get()}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ enhancement: enhancement ?? null }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => null);
      throw new Error(errJson?.error?.message || "Failed to generate PDF");
    }

    const json = (await response.json()) as {
      success: boolean;
      data?: {
        base64?: string;
        mimeType?: string;
        enhancementApplied?: boolean;
      };
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
    return {
      blob: new Blob([byteArray], {
        type: json.data.mimeType || "application/pdf",
      }),
      enhancementApplied: Boolean(json.data.enhancementApplied),
    };
  },
};
