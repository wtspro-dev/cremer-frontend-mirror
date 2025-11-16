/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type InvoiceDetailResponse = {
    id: number;
    invoice_batch_id: (number | null);
    order_id: (number | null);
    order_number: string;
    invoice_number: string;
    invoice_date: string;
    delivery_date: (string | null);
    status: string;
    value: number;
    crm_order_code: string;
    customer_cnpj: string;
    city: string;
    state: string;
    product_code: string;
    product_description: string;
    created: number;
    updated: (number | null);
    batch_file_name: (string | null);
};

