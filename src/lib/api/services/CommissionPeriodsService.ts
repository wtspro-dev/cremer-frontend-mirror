/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponse_CommissionPeriodResponse__ApiResponseError_ } from '../models/ApiResponse_CommissionPeriodResponse__ApiResponseError_';
import type { PaginatedApiResponse_list_CommissionPeriodResponse___ApiResponseError_ } from '../models/PaginatedApiResponse_list_CommissionPeriodResponse___ApiResponseError_';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CommissionPeriodsService {
    /**
     * Get Commission Periods
     * @param startDate Start date for commission period range filter (inclusive)
     * @param endDate End date for commission period range filter (inclusive)
     * @param page Page number (0-indexed)
     * @param limit Number of items per page
     * @returns PaginatedApiResponse_list_CommissionPeriodResponse___ApiResponseError_ Successful Response
     * @throws ApiError
     */
    public static getCommissionPeriodsV1CommissionPeriodsGet(
        startDate?: (string | null),
        endDate?: (string | null),
        page?: number,
        limit: number = 25,
    ): CancelablePromise<PaginatedApiResponse_list_CommissionPeriodResponse___ApiResponseError_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/commission-periods',
            query: {
                'start_date': startDate,
                'end_date': endDate,
                'page': page,
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Commission Period
     * @param periodId
     * @returns ApiResponse_CommissionPeriodResponse__ApiResponseError_ Successful Response
     * @throws ApiError
     */
    public static getCommissionPeriodV1CommissionPeriodsPeriodIdGet(
        periodId: number,
    ): CancelablePromise<ApiResponse_CommissionPeriodResponse__ApiResponseError_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/commission-periods/{period_id}',
            path: {
                'period_id': periodId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
