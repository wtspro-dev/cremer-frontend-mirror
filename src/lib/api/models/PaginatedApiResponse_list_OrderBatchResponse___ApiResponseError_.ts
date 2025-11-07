/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseError } from './ApiResponseError';
import type { OrderBatchResponse } from './OrderBatchResponse';
export type PaginatedApiResponse_list_OrderBatchResponse___ApiResponseError_ = {
    success: boolean;
    data?: (Array<OrderBatchResponse> | null);
    error?: (ApiResponseError | null);
    total: number;
};

