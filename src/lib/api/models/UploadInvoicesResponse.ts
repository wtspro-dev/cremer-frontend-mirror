/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { api__api_endpoints__orders__UploadError } from './api__api_endpoints__orders__UploadError';
export type UploadInvoicesResponse = {
    total_files: number;
    processed_files: number;
    failed_files: number;
    total_invoices: number;
    created_invoices: number;
    updated_invoices: number;
    skipped_invoices: number;
    missing_orders: number;
    errors: Array<api__api_endpoints__orders__UploadError>;
};

