/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OrderItemResponse } from './OrderItemResponse';
export type OrderDetailResponse = {
    id: number;
    order_batch_id: (number | null);
    order_number: string;
    order_date: string;
    customer_name: string;
    customer_cnpj: string;
    address: string;
    created: number;
    updated: (number | null);
    item_count: number;
    items: Array<OrderItemResponse>;
    batch_file_name: (string | null);
};

