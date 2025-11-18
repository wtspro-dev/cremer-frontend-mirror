/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseError } from './ApiResponseError';
import type { CommissionPeriodResponse } from './CommissionPeriodResponse';
export type PaginatedApiResponse_list_CommissionPeriodResponse___ApiResponseError_ = {
    success: boolean;
    data?: (Array<CommissionPeriodResponse> | null);
    error?: (ApiResponseError | null);
    total: number;
};

