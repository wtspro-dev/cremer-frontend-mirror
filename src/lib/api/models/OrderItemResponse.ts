/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OrderInvoice } from './OrderInvoice';
export type OrderItemResponse = {
    id: number;
    order_id: number;
    sku_id: number;
    product_code: string;
    product_description: string;
    package: string;
    date_in: string;
    quantity: number;
    unit_value: number;
    ipi: number;
    icmsubs: number;
    bcsubs: number;
    disc_com: number;
    disc_adi: number;
    other: number;
    weight_kg: number;
    created: number;
    updated: (number | null);
    commission_percentage: number;
    total_value: number;
    total_with_taxes: number;
    total_commission: number;
    invoices: Array<OrderInvoice>;
};

