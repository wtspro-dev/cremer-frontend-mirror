import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SkUsService } from "@/lib/api";
import type {
  PaginatedApiResponse_list_SkuResponse___ApiResponseError_,
  ApiResponse_SkuResponse__ApiResponseError_,
  CreateSkuRequest,
  UpdateSkuRequest,
} from "@/lib/api";

/**
 * Hook to fetch a paginated list of SKUs
 */
export function useSkus(search?: string | null, page: number = 0, limit: number = 25) {
  return useQuery<PaginatedApiResponse_list_SkuResponse___ApiResponseError_>({
    queryKey: ["skus", search, page, limit],
    queryFn: async () => {
      return await SkUsService.getSkusV1SkusGet(search, page, limit);
    },
  });
}

/**
 * Hook to fetch a single SKU by ID
 */
export function useSku(skuId: number | null, enabled: boolean = true) {
  return useQuery<ApiResponse_SkuResponse__ApiResponseError_>({
    queryKey: ["skuDetail", skuId],
    queryFn: async () => {
      if (!skuId) throw new Error("SKU ID is required");
      return await SkUsService.getSkuV1SkusSkuIdGet(skuId);
    },
    enabled: enabled && !!skuId,
  });
}

/**
 * Hook to create a new SKU
 */
export function useCreateSku() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse_SkuResponse__ApiResponseError_, Error, CreateSkuRequest>({
    mutationFn: async (data: CreateSkuRequest) => {
      return await SkUsService.createSkuV1SkusPost(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skus"] });
    },
  });
}

/**
 * Hook to update an existing SKU
 */
export function useUpdateSku() {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse_SkuResponse__ApiResponseError_,
    Error,
    { skuId: number; data: UpdateSkuRequest }
  >({
    mutationFn: async ({ skuId, data }: { skuId: number; data: UpdateSkuRequest }) => {
      return await SkUsService.updateSkuV1SkusSkuIdPut(skuId, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["skus"] });
      queryClient.invalidateQueries({ queryKey: ["skuDetail", variables.skuId] });
    },
  });
}
