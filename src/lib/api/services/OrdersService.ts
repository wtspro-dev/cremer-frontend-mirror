/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponse_OrderDetailResponse__ApiResponseError_ } from '../models/ApiResponse_OrderDetailResponse__ApiResponseError_';
import type { ApiResponse_UploadOrdersResponse__ApiResponseError_ } from '../models/ApiResponse_UploadOrdersResponse__ApiResponseError_';
import type { Body_upload_orders_v1_orders_upload_post } from '../models/Body_upload_orders_v1_orders_upload_post';
import type { OrderBillingStatus } from '../models/OrderBillingStatus';
import type { PaginatedApiResponse_list_OrderBatchResponse___ApiResponseError_ } from '../models/PaginatedApiResponse_list_OrderBatchResponse___ApiResponseError_';
import type { PaginatedApiResponse_list_OrderResponse___ApiResponseError_ } from '../models/PaginatedApiResponse_list_OrderResponse___ApiResponseError_';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class OrdersService {
    /**
     * Upload Orders
     * @param formData
     * @param locale Response locale, e.g. pt_BR, pt, en_US, en
     * @returns ApiResponse_UploadOrdersResponse__ApiResponseError_ Successful Response
     * @throws ApiError
     */
    public static uploadOrdersV1OrdersUploadPost(
        formData: Body_upload_orders_v1_orders_upload_post,
        locale: string = 'pt_BR',
    ): CancelablePromise<ApiResponse_UploadOrdersResponse__ApiResponseError_> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/orders/upload',
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
     * Get Order Batches
     * @param search Search string to filter by batch name (case-insensitive)
     * @param page Page number (0-indexed)
     * @param limit Number of items per page
     * @returns PaginatedApiResponse_list_OrderBatchResponse___ApiResponseError_ Successful Response
     * @throws ApiError
     */
    public static getOrderBatchesV1OrdersBatchesGet(
        search?: (string | null),
        page?: number,
        limit: number = 25,
    ): CancelablePromise<PaginatedApiResponse_list_OrderBatchResponse___ApiResponseError_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/orders/batches',
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
     * Get Orders
     * @param batchId Filter by order batch ID
     * @param orderDateStart Start date for order date range filter
     * @param orderDateEnd End date for order date range filter
     * @param search Search string to match against order_number, customer_name, or customer_cnpj
     * @param billingStatus
     * @param page Page number (0-indexed)
     * @param limit Number of items per page
     * @returns PaginatedApiResponse_list_OrderResponse___ApiResponseError_ Successful Response
     * @throws ApiError
     */
    public static getOrdersV1OrdersGet(
        batchId?: (number | null),
        orderDateStart?: (string | null),
        orderDateEnd?: (string | null),
        search?: (string | null),
        billingStatus?: (OrderBillingStatus | string),
        page?: number,
        limit: number = 25,
    ): CancelablePromise<PaginatedApiResponse_list_OrderResponse___ApiResponseError_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/orders',
            query: {
                'batch_id': batchId,
                'order_date_start': orderDateStart,
                'order_date_end': orderDateEnd,
                'search': search,
                'billing_status': billingStatus,
                'page': page,
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Order
     * @param orderId
     * @returns ApiResponse_OrderDetailResponse__ApiResponseError_ Successful Response
     * @throws ApiError
     */
    public static getOrderV1OrdersOrderIdGet(
        orderId: number,
    ): CancelablePromise<ApiResponse_OrderDetailResponse__ApiResponseError_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/orders/{order_id}',
            path: {
                'order_id': orderId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
