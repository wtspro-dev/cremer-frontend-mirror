import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { InvoicesService, InvoiceDeliveryState } from "@/lib/api";
import type {
  PaginatedApiResponse_list_InvoiceBatchResponse___ApiResponseError_,
  PaginatedApiResponse_list_InvoiceResponse___ApiResponseError_,
  ApiResponse_InvoiceDetailResponse__ApiResponseError_,
  ApiResponse_UploadInvoicesResponse__ApiResponseError_,
  Body_upload_invoices_v1_invoices_upload_post,
} from "@/lib/api";

/**
 * Hook to fetch a paginated list of invoice batches
 */
export function useInvoiceBatches(search?: string | null, page: number = 0, limit: number = 25) {
  return useQuery<PaginatedApiResponse_list_InvoiceBatchResponse___ApiResponseError_>({
    queryKey: ["invoiceBatches", search, page, limit],
    queryFn: async () => {
      return await InvoicesService.getInvoiceBatchesV1InvoicesBatchesGet(search, page, limit);
    },
  });
}

/**
 * Hook to fetch a paginated list of invoices with filters
 */
export function useInvoices(
  batchId?: number | null,
  orderId?: number | null,
  commissionPeriodId?: number | null,
  commissionPaymentDateStart?: string | null,
  commissionPaymentDateEnd?: string | null,
  search?: string | null,
  deliveryState: InvoiceDeliveryState = InvoiceDeliveryState.ALL,
  page: number = 0,
  limit: number = 25
) {
  return useQuery<PaginatedApiResponse_list_InvoiceResponse___ApiResponseError_>({
    queryKey: [
      "invoices",
      batchId,
      orderId,
      commissionPeriodId,
      commissionPaymentDateStart,
      commissionPaymentDateEnd,
      search,
      deliveryState,
      page,
      limit,
    ],
    queryFn: async () => {
      return await InvoicesService.getInvoicesV1InvoicesGet(
        batchId,
        orderId,
        commissionPeriodId,
        commissionPaymentDateStart,
        commissionPaymentDateEnd,
        search,
        deliveryState,
        page,
        limit
      );
    },
  });
}

/**
 * Hook to fetch a single invoice by ID
 */
export function useInvoiceDetail(invoiceId: number | null, enabled: boolean = true) {
  return useQuery<ApiResponse_InvoiceDetailResponse__ApiResponseError_>({
    queryKey: ["invoiceDetail", invoiceId],
    queryFn: async () => {
      if (!invoiceId) throw new Error("Invoice ID is required");
      return await InvoicesService.getInvoiceV1InvoicesInvoiceIdGet(invoiceId);
    },
    enabled: enabled && !!invoiceId,
  });
}

/**
 * Hook to upload invoices
 */
export function useUploadInvoices() {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse_UploadInvoicesResponse__ApiResponseError_,
    Error,
    Body_upload_invoices_v1_invoices_upload_post
  >({
    mutationFn: async (formData: Body_upload_invoices_v1_invoices_upload_post) => {
      return await InvoicesService.uploadInvoicesV1InvoicesUploadPost(formData);
    },
    onSuccess: () => {
      // Invalidate invoice batches to refresh the list
      queryClient.invalidateQueries({ queryKey: ["invoiceBatches"] });
    },
  });
}
