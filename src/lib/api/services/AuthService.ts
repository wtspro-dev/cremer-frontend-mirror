/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponse_dict__ApiResponseError_ } from '../models/ApiResponse_dict__ApiResponseError_';
import type { ApiResponse_GoogleAuthResponse__ApiResponseError_ } from '../models/ApiResponse_GoogleAuthResponse__ApiResponseError_';
import type { GoogleAuth } from '../models/GoogleAuth';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthService {
    /**
     * Authenticate Google
     * @param requestBody
     * @returns ApiResponse_GoogleAuthResponse__ApiResponseError_ Successful Response
     * @throws ApiError
     */
    public static authenticateGoogleV1AuthGooglePost(
        requestBody: GoogleAuth,
    ): CancelablePromise<ApiResponse_GoogleAuthResponse__ApiResponseError_> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/auth/google',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Current User Info
     * @returns ApiResponse_dict__ApiResponseError_ Successful Response
     * @throws ApiError
     */
    public static getCurrentUserInfoV1AuthMeGet(): CancelablePromise<ApiResponse_dict__ApiResponseError_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/auth/me',
        });
    }
}
