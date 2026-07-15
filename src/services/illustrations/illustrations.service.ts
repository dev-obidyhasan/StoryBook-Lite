import { clientFetch } from "@/helper/client-fetch";
import type { ApiResponse, IllustrationsReviewResponse } from "@/types";

export const illustrationsService = {
  getOrderIllustrations: (orderId: string) =>
    clientFetch.get<ApiResponse<IllustrationsReviewResponse>>(
      `/orders/${orderId}/illustrations`,
    ),

  approveIllustration: (illustrationId: string) =>
    clientFetch.patch<ApiResponse<{ pageNumber: number; status: string }>>(
      `/illustrations/${illustrationId}/approve`,
    ),

  rejectAndRegenerate: (illustrationId: string) =>
    clientFetch.post<ApiResponse<{ pageNumber: number; status: string }>>(
      `/illustrations/${illustrationId}/regenerate`,
    ),

  // Retry a single page by page number. Primary path for PERMANENTLY_FAILED
  // pages, which have no Illustration record (so /illustrations/:id/regenerate
  // cannot be used). Also works for READY_FOR_REVIEW pages.
  retryPage: (orderId: string, pageNumber: number) =>
    clientFetch.post<ApiResponse<{ pageNumber: number; status: string }>>(
      `/orders/${orderId}/pages/${pageNumber}/retry`,
    ),

  bulkApproveAll: (orderId: string) =>
    clientFetch.post<ApiResponse<{ approvedCount: number }>>(
      `/orders/${orderId}/approve-all`,
    ),

  getIllustrationHistory: (orderId: string, pageNumber: number) =>
    clientFetch.get<ApiResponse<unknown>>(
      `/orders/${orderId}/pages/${pageNumber}/history`,
    ),
};
