import { clientFetch } from "@/helper/client-fetch";
import type {
  ApiResponse,
  Order,
  OrderDetail,
  OrderStatusResponse,
  OrderStatus,
  ApiMeta,
} from "@/types";

export const ordersService = {
  /**
   * Get paginated orders list with optional filters.
   */
  getOrders: (params?: {
    status?: OrderStatus;
    childName?: string;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.childName) query.set("childName", params.childName);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));

    const qs = query.toString();
    return clientFetch.get<ApiResponse<Order[]> & { meta: ApiMeta }>(
      `/orders${qs ? `?${qs}` : ""}`,
    );
  },

  /**
   * Get full order detail with pages + illustrations.
   */
  getOrderById: (id: string) =>
    clientFetch.get<ApiResponse<OrderDetail>>(`/orders/${id}`),

  /**
   * Lightweight status poll for real-time updates.
   */
  getOrderStatus: (id: string) =>
    clientFetch.get<ApiResponse<OrderStatusResponse>>(`/orders/${id}/status`),

  /**
   * Create a new order (multipart form: photo + fields).
   */
  createOrder: (formData: FormData) =>
    clientFetch.post<ApiResponse<Order>>("/orders", { body: formData }),

  /**
   * Cancel an in-progress order.
   */
  cancelOrder: (id: string) =>
    clientFetch.patch<ApiResponse<null>>(`/orders/${id}/cancel`),

  /**
   * Reprocess a FAILED order — re-queues AI generation (SRD FR-04).
   */
  reprocessOrder: (id: string) =>
    clientFetch.post<ApiResponse<Order>>(`/orders/${id}/reprocess`),

  retryFailedPages: (id: string) =>
    clientFetch.post<ApiResponse<Order>>(`/orders/${id}/retry-failed-pages`),
};
