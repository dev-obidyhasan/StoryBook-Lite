import { clientFetch, tokenStore } from "@/helper/client-fetch";
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

  /** Upload a single page image (keeps each request under Vercel's 4.5MB limit). */
  uploadOrderPageImage: async (
    orderId: string,
    pageNumber: number,
    file: File,
  ): Promise<void> => {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(
      `${API_BASE}/orders/${orderId}/pages/${pageNumber}/image`,
      {
        method: "POST",
        body: formData,
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

  /** Generate PDF from previously uploaded page images (no large multipart body). */
  generateOrderPDF: async (orderId: string): Promise<Blob> => {
    const response = await fetch(`${API_BASE}/orders/${orderId}/generate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenStore.get()}`,
      },
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => null);
      throw new Error(errJson?.error?.message || "Failed to generate PDF");
    }

    return response.blob();
  },
};
