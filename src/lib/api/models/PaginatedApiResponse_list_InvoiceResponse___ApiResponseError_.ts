/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseError } from './ApiResponseError';
import type { InvoiceResponse } from './InvoiceResponse';
export type PaginatedApiResponse_list_InvoiceResponse___ApiResponseError_ = {
    success: boolean;
    data?: (Array<InvoiceResponse> | null);
    error?: (ApiResponseError | null);
    total: number;
};

