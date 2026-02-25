/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponse_InvoiceDetailResponse__ApiResponseError_ } from '../models/ApiResponse_InvoiceDetailResponse__ApiResponseError_';
import type { ApiResponse_UploadInvoicesResponse__ApiResponseError_ } from '../models/ApiResponse_UploadInvoicesResponse__ApiResponseError_';
import type { Body_upload_invoices_v1_invoices_upload_post } from '../models/Body_upload_invoices_v1_invoices_upload_post';
import type { InvoiceDeliveryState } from '../models/InvoiceDeliveryState';
import type { PaginatedApiResponse_list_InvoiceBatchResponse___ApiResponseError_ } from '../models/PaginatedApiResponse_list_InvoiceBatchResponse___ApiResponseError_';
import type { PaginatedApiResponse_list_InvoiceResponse___ApiResponseError_ } from '../models/PaginatedApiResponse_list_InvoiceResponse___ApiResponseError_';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class InvoicesService {
    /**
     * Upload Invoices
     * @param formData
     * @param locale Response locale, e.g. pt_BR, pt, en_US, en
     * @returns ApiResponse_UploadInvoicesResponse__ApiResponseError_ Successful Response
     * @throws ApiError
     */
    public static uploadInvoicesV1InvoicesUploadPost(
        formData: Body_upload_invoices_v1_invoices_upload_post,
        locale: string = 'pt_BR',
    ): CancelablePromise<ApiResponse_UploadInvoicesResponse__ApiResponseError_> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/invoices/upload',
            query: {
                'locale': locale,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Invoice Batches
     * @param search Search string to filter by batch name (case-insensitive)
     * @param page Page number (0-indexed)
     * @param limit Number of items per page
     * @returns PaginatedApiResponse_list_InvoiceBatchResponse___ApiResponseError_ Successful Response
     * @throws ApiError
     */
    public static getInvoiceBatchesV1InvoicesBatchesGet(
        search?: (string | null),
        page?: number,
        limit: number = 25,
    ): CancelablePromise<PaginatedApiResponse_list_InvoiceBatchResponse___ApiResponseError_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/invoices/batches',
            query: {
                'search': search,
                'page': page,
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Invoices
     * @param batchId Filter by invoice batch ID
     * @param orderId Filter by order ID
     * @param commissionPeriodId Filter by commission period ID
     * @param commissionPaymentDateStart Start date for commission payment date range filter
     * @param commissionPaymentDateEnd End date for commission payment date range filter
     * @param search Search string to match against invoice_number, customer_cnpj, or product_code
     * @param deliveryState
     * @param page Page number (0-indexed)
     * @param limit Number of items per page
     * @returns PaginatedApiResponse_list_InvoiceResponse___ApiResponseError_ Successful Response
     * @throws ApiError
     */
    public static getInvoicesV1InvoicesGet(
        batchId?: (number | null),
        orderId?: (number | null),
        commissionPeriodId?: (number | null),
        commissionPaymentDateStart?: (string | null),
        commissionPaymentDateEnd?: (string | null),
        search?: (string | null),
        deliveryState?: (InvoiceDeliveryState | string),
        page?: number,
        limit: number = 25,
    ): CancelablePromise<PaginatedApiResponse_list_InvoiceResponse___ApiResponseError_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/invoices',
            query: {
                'batch_id': batchId,
                'order_id': orderId,
                'commission_period_id': commissionPeriodId,
                'commission_payment_date_start': commissionPaymentDateStart,
                'commission_payment_date_end': commissionPaymentDateEnd,
                'search': search,
                'delivery_state': deliveryState,
                'page': page,
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Invoice
     * @param invoiceId
     * @returns ApiResponse_InvoiceDetailResponse__ApiResponseError_ Successful Response
     * @throws ApiError
     */
    public static getInvoiceV1InvoicesInvoiceIdGet(
        invoiceId: number,
    ): CancelablePromise<ApiResponse_InvoiceDetailResponse__ApiResponseError_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/invoices/{invoice_id}',
            path: {
                'invoice_id': invoiceId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
