import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { OrdersService, OrderBillingStatus } from "@/lib/api";
import type {
  PaginatedApiResponse_list_OrderBatchResponse___ApiResponseError_,
  PaginatedApiResponse_list_OrderResponse___ApiResponseError_,
  ApiResponse_OrderDetailResponse__ApiResponseError_,
  ApiResponse_UploadOrdersResponse__ApiResponseError_,
  Body_upload_orders_v1_orders_upload_post,
} from "@/lib/api";

/**
 * Hook to fetch a paginated list of order batches
 */
export function useOrderBatches(search?: string | null, page: number = 0, limit: number = 25) {
  return useQuery<PaginatedApiResponse_list_OrderBatchResponse___ApiResponseError_>({
    queryKey: ["orderBatches", search, page, limit],
    queryFn: async () => {
      return await OrdersService.getOrderBatchesV1OrdersBatchesGet(search, page, limit);
    },
  });
}

/**
 * Hook to fetch a paginated list of orders with filters
 */
export function useOrders(
  batchId?: number | null,
  orderDateStart?: string | null,
  orderDateEnd?: string | null,
  search?: string | null,
  billingStatus: OrderBillingStatus = OrderBillingStatus.ALL,
  page: number = 0,
  limit: number = 25
) {
  return useQuery<PaginatedApiResponse_list_OrderResponse___ApiResponseError_>({
    queryKey: ["orders", batchId, orderDateStart, orderDateEnd, search, billingStatus, page, limit],
    queryFn: async () => {
      return await OrdersService.getOrdersV1OrdersGet(
        batchId,
        orderDateStart,
        orderDateEnd,
        search,
        billingStatus,
        page,
        limit
      );
    },
  });
}

/**
 * Hook to fetch a single order by ID
 */
export function useOrder(orderId: number | null, enabled: boolean = true) {
  return useQuery<ApiResponse_OrderDetailResponse__ApiResponseError_>({
    queryKey: ["orderDetail", orderId],
    queryFn: async () => {
      if (!orderId) throw new Error("Order ID is required");
      return await OrdersService.getOrderV1OrdersOrderIdGet(orderId);
    },
    enabled: enabled && !!orderId,
  });
}

/**
 * Hook to upload orders
 */
export function useUploadOrders() {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse_UploadOrdersResponse__ApiResponseError_,
    Error,
    Body_upload_orders_v1_orders_upload_post
  >({
    mutationFn: async (formData: Body_upload_orders_v1_orders_upload_post) => {
      return await OrdersService.uploadOrdersV1OrdersUploadPost(formData);
    },
    onSuccess: () => {
      // Invalidate order batches to refresh the list
      queryClient.invalidateQueries({ queryKey: ["orderBatches"] });
    },
  });
}
