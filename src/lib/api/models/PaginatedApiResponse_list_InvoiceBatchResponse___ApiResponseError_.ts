/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseError } from './ApiResponseError';
import type { InvoiceBatchResponse } from './InvoiceBatchResponse';
export type PaginatedApiResponse_list_InvoiceBatchResponse___ApiResponseError_ = {
    success: boolean;
    data?: (Array<InvoiceBatchResponse> | null);
    error?: (ApiResponseError | null);
    total: number;
};

