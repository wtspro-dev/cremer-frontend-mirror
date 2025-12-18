import { useQuery } from "@tanstack/react-query";
import { CommissionPeriodsService } from "@/lib/api";
import type {
  PaginatedApiResponse_list_CommissionPeriodResponse___ApiResponseError_,
  ApiResponse_CommissionPeriodResponse__ApiResponseError_,
} from "@/lib/api";

/**
 * Hook to fetch a paginated list of commission periods
 */
export function useCommissionPeriods(
  startDate?: string | null,
  endDate?: string | null,
  page: number = 0,
  limit: number = 25
) {
  return useQuery<PaginatedApiResponse_list_CommissionPeriodResponse___ApiResponseError_>({
    queryKey: ["commissionPeriods", startDate, endDate, page, limit],
    queryFn: async () => {
      return await CommissionPeriodsService.getCommissionPeriodsV1CommissionPeriodsGet(
        startDate,
        endDate,
        page,
        limit
      );
    },
  });
}

/**
 * Hook to fetch a single commission period by ID
 */
export function useCommissionPeriod(periodId: number | null, enabled: boolean = true) {
  return useQuery<ApiResponse_CommissionPeriodResponse__ApiResponseError_>({
    queryKey: ["commissionPeriod", periodId],
    queryFn: async () => {
      if (!periodId) throw new Error("Period ID is required");
      return await CommissionPeriodsService.getCommissionPeriodV1CommissionPeriodsPeriodIdGet(
        periodId
      );
    },
    enabled: enabled && !!periodId,
  });
}
