// Lógica de cálculo de comissões

import type {
  SKUCommission,
  Order,
  DeliveryDate,
  CommissionItem,
  CommissionPeriod,
  CommissionSummary,
  OrderItem,
} from "@/types/commission";

/**
 * Calcula a data de pagamento baseada na data de entrega
 * Regra: data de entrega + 60 dias
 */
export function calculatePaymentDate(deliveryDate: Date): Date {
  const paymentDate = new Date(deliveryDate);
  paymentDate.setDate(paymentDate.getDate() + 60);
  return paymentDate;
}

/**
 * Determina o período de pagamento da comissão
 * - Se data de pagamento <= 15: paga no dia 16 do mesmo mês
 * - Se data de pagamento >= 16: paga no dia 1 do mês seguinte
 */
export function calculateCommissionPeriod(paymentDate: Date): CommissionPeriod {
  const day = paymentDate.getDate();
  const month = paymentDate.getMonth();
  const year = paymentDate.getFullYear();

  let periodStart: Date;
  let periodEnd: Date;
  let label: string;

  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  if (day <= 15) {
    // Paga no dia 16 do mesmo mês
    periodStart = new Date(year, month, 16);
    periodEnd = new Date(year, month + 1, 0); // Último dia do mês
    label = `16 de ${monthNames[month]}`;
  } else {
    // Paga no dia 1 do mês seguinte
    const nextMonth = month === 11 ? 0 : month + 1;
    periodStart = new Date(year, month + 1, 1);
    periodEnd = new Date(year, month + 1, 15);
    label = `1 de ${monthNames[nextMonth]}`;
  }

  return {
    periodStart,
    periodEnd,
    label,
  };
}

/**
 * Calcula comissões para todos os pedidos
 */
export function calculateCommissions(
  orders: Order[],
  skuCommissions: SKUCommission[],
  deliveryDates: DeliveryDate[]
): CommissionItem[] {
  const commissionItems: CommissionItem[] = [];

  // Cria mapas para acesso rápido
  const skuCommissionMap = new Map<string, number>();
  skuCommissions.forEach((sku) => {
    skuCommissionMap.set(sku.sku, sku.commissionPercentage);
  });

  const deliveryDateMap = new Map<string, Map<string, Date>>();
  deliveryDates.forEach((delivery) => {
    if (!deliveryDateMap.has(delivery.orderId)) {
      deliveryDateMap.set(delivery.orderId, new Map());
    }
    deliveryDateMap.get(delivery.orderId)!.set(delivery.sku, delivery.expectedDeliveryDate);
  });

  // Processa cada pedido
  orders.forEach((order) => {
    order.items.forEach((item) => {
      const commissionPercentage = skuCommissionMap.get(item.product_description) || 0;
      const deliveryDate = deliveryDateMap.get(order.id)?.get(item.product_description);

      if (!deliveryDate) {
        // SKU sem data de entrega - pode ser tratado como erro ou ignorado
        console.warn(
          `SKU ${item.product_description} do pedido ${order.id} não possui data de entrega`
        );
        return;
      }

      const paymentDate = calculatePaymentDate(deliveryDate);
      const commissionPeriod = calculateCommissionPeriod(paymentDate);
      const commissionAmount =
        (calculateTotalOrderItemWithDiscounts(item) * commissionPercentage) / 100;

      commissionItems.push({
        orderId: order.id,
        orderDate: order.date,
        sku: item.product_description,
        quantity: item.quantity,
        itemValue: calculateTotalOrderItemWithDiscounts(item),
        commissionPercentage,
        commissionAmount,
        deliveryDate,
        paymentDate,
        commissionPeriod,
      });
    });
  });

  return commissionItems;
}

/**
 * Agrupa comissões por período
 */
export function groupCommissionsByPeriod(commissionItems: CommissionItem[]): CommissionSummary[] {
  const periodMap = new Map<string, CommissionSummary>();

  commissionItems.forEach((item) => {
    const periodKey = `${item.commissionPeriod.periodStart.getTime()}-${item.commissionPeriod.label}`;

    if (!periodMap.has(periodKey)) {
      periodMap.set(periodKey, {
        period: item.commissionPeriod,
        totalCommission: 0,
        items: [],
      });
    }

    const summary = periodMap.get(periodKey)!;
    summary.items.push(item);
    summary.totalCommission += item.commissionAmount;
  });

  // Ordena por data do período
  return Array.from(periodMap.values()).sort(
    (a, b) => a.period.periodStart.getTime() - b.period.periodStart.getTime()
  );
}

/**
 * Filtra comissões por período
 */
export function filterCommissionsByPeriod(
  commissionItems: CommissionItem[],
  period: CommissionPeriod
): CommissionItem[] {
  return commissionItems.filter((item) => {
    const itemPeriod = item.commissionPeriod;
    return (
      itemPeriod.periodStart.getTime() === period.periodStart.getTime() &&
      itemPeriod.label === period.label
    );
  });
}

export function calculateUnitValueWithDiscounts(orderItem: OrderItem): number {
  return orderItem.unit_value * ((100 - (orderItem.disc_com + orderItem.disc_adi)) / 100);
}

export function calculateTotalOrderItemWithDiscounts(orderItem: OrderItem): number {
  const unitValue = calculateUnitValueWithDiscounts(orderItem);
  return Math.round(unitValue * orderItem.quantity);
}

export function calculateTotalOrderItemWithDiscountsAndTaxes(orderItem: OrderItem): number {
  const unitValue = calculateUnitValueWithDiscounts(orderItem);
  const unitTaxIPI = Math.round(unitValue * (orderItem.ipi / 100));
  return orderItem.quantity * (unitValue + unitTaxIPI + orderItem.icmsubs);
}
