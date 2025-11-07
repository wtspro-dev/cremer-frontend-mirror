/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponse_HealthCheckResponse__ApiResponseError_ } from '../models/ApiResponse_HealthCheckResponse__ApiResponseError_';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class HealthCheckService {
    /**
     * Health Check
     * @returns ApiResponse_HealthCheckResponse__ApiResponseError_ Successful Response
     * @throws ApiError
     */
    public static healthCheckV1HealthCheckGet(): CancelablePromise<ApiResponse_HealthCheckResponse__ApiResponseError_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/health_check',
        });
    }
}
