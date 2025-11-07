// Tipos para o sistema de comissões

export interface SKUCommission {
  sku: string;
  commissionPercentage: number;
}

export interface OrderItem {
  id: number;
  product_code: string;
  product_description: string;
  package: string;
  quantity: number;
  unit_value: number;
  ipi: number;
  icmsubs: number;
  bcsubs: number;
  disc_com: number;
  disc_adi: number;
  weight_kg: number;
}

export interface Order {
  id: string;
  date: Date;
  items: OrderItem[];
  totalValue: number;
}

export interface DeliveryDate {
  orderId: string;
  sku: string;
  expectedDeliveryDate: Date;
}

export interface CommissionPeriod {
  periodStart: Date;
  periodEnd: Date;
  label: string; // "16 de Janeiro" ou "1 de Fevereiro"
}

export interface CommissionItem {
  orderId: string;
  orderDate: Date;
  sku: string;
  quantity: number;
  itemValue: number;
  commissionPercentage: number;
  commissionAmount: number;
  deliveryDate: Date;
  paymentDate: Date;
  commissionPeriod: CommissionPeriod;
}

export interface CommissionSummary {
  period: CommissionPeriod;
  totalCommission: number;
  items: CommissionItem[];
}

export type FileUploadType = "sku-config" | "orders-pdf" | "delivery-dates";
