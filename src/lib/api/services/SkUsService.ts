/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponse_SkuResponse__ApiResponseError_ } from '../models/ApiResponse_SkuResponse__ApiResponseError_';
import type { CreateSkuRequest } from '../models/CreateSkuRequest';
import type { PaginatedApiResponse_list_SkuResponse___ApiResponseError_ } from '../models/PaginatedApiResponse_list_SkuResponse___ApiResponseError_';
import type { UpdateSkuRequest } from '../models/UpdateSkuRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SkUsService {
    /**
     * Get Skus
     * @param search Search string to match against order_product_code, invoice_product_code, or description
     * @param page Page number (0-indexed)
     * @param limit Number of items per page
     * @returns PaginatedApiResponse_list_SkuResponse___ApiResponseError_ Successful Response
     * @throws ApiError
     */
    public static getSkusV1SkusGet(
        search?: (string | null),
        page?: number,
        limit: number = 25,
    ): CancelablePromise<PaginatedApiResponse_list_SkuResponse___ApiResponseError_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/skus',
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
     * Create Sku
     * @param requestBody
     * @returns ApiResponse_SkuResponse__ApiResponseError_ Successful Response
     * @throws ApiError
     */
    public static createSkuV1SkusPost(
        requestBody: CreateSkuRequest,
    ): CancelablePromise<ApiResponse_SkuResponse__ApiResponseError_> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/skus',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Sku
     * @param skuId
     * @returns ApiResponse_SkuResponse__ApiResponseError_ Successful Response
     * @throws ApiError
     */
    public static getSkuV1SkusSkuIdGet(
        skuId: number,
    ): CancelablePromise<ApiResponse_SkuResponse__ApiResponseError_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/skus/{sku_id}',
            path: {
                'sku_id': skuId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Sku
     * @param skuId
     * @param requestBody
     * @returns ApiResponse_SkuResponse__ApiResponseError_ Successful Response
     * @throws ApiError
     */
    public static updateSkuV1SkusSkuIdPut(
        skuId: number,
        requestBody: UpdateSkuRequest,
    ): CancelablePromise<ApiResponse_SkuResponse__ApiResponseError_> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/v1/skus/{sku_id}',
            path: {
                'sku_id': skuId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
