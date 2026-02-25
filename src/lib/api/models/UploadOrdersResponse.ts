/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { api__api_endpoints__orders__UploadError } from './api__api_endpoints__orders__UploadError';
export type UploadOrdersResponse = {
    total_files: number;
    processed_files: number;
    failed_files: number;
    total_orders: number;
    created_orders: number;
    skipped_orders: number;
    total_items: number;
    errors: Array<api__api_endpoints__orders__UploadError>;
};

