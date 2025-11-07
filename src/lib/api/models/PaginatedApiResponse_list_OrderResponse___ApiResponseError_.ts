/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseError } from './ApiResponseError';
import type { OrderResponse } from './OrderResponse';
export type PaginatedApiResponse_list_OrderResponse___ApiResponseError_ = {
    success: boolean;
    data?: (Array<OrderResponse> | null);
    error?: (ApiResponseError | null);
    total: number;
};

