/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseError } from './ApiResponseError';
import type { SkuResponse } from './SkuResponse';
export type PaginatedApiResponse_list_SkuResponse___ApiResponseError_ = {
    success: boolean;
    data?: (Array<SkuResponse> | null);
    error?: (ApiResponseError | null);
    total: number;
};

