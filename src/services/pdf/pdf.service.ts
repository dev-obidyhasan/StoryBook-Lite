import { clientFetch } from '@/helper/client-fetch';
import type { ApiResponse, PDFDownloadResponse, PDFInfo } from '@/types';

export const pdfService = {
  generatePDF: (orderId: string) =>
    clientFetch.post<ApiResponse<{ orderId: string; status: string }>>(
      `/orders/${orderId}/generate-pdf`,
    ),

  getDownloadUrl: (orderId: string) =>
    clientFetch.get<ApiResponse<PDFDownloadResponse>>(`/orders/${orderId}/pdf/download`),

  regeneratePDF: (orderId: string) =>
    clientFetch.post<ApiResponse<PDFDownloadResponse>>(`/orders/${orderId}/pdf/regenerate`),

  getPDFInfo: (orderId: string) =>
    clientFetch.get<ApiResponse<PDFInfo | null>>(`/orders/${orderId}/pdf/info`),
};
