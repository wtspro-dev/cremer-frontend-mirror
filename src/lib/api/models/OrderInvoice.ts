/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type OrderInvoice = {
    id: number;
    invoice_number: string;
    invoice_date: string;
    delivery_date: (string | null);
    payment_date: (string | null);
    commission_payment_date: (string | null);
    status: string;
    value: number;
    commission_percentage: number;
    commission_value: number;
    crm_order_code: string;
    customer_cnpj: string;
    city: string;
    state: string;
    product_code: string;
    product_description: string;
    created: number;
    updated: (number | null);
};

