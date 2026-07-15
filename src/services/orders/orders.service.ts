import { clientFetch, tokenStore } from "@/helper/client-fetch";
import type { ApiResponse, Order } from "@/types";

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

  generateOrderPDF: async (orderId: string, formData: FormData): Promise<Blob> => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/orders/${orderId}/generate`, {
      method: 'POST',
      body: formData,
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
