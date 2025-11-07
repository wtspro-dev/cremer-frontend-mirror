"use client";

import { useState, useMemo } from "react";
import { AlertTriangle, DollarSign, Package, Eye } from "lucide-react";
import Modal from "@/components/ui/Modal";
import type { Order, DeliveryDate, SKUCommission } from "@/types/commission";

interface MissingDeliveryDateItem {
  orderId: string;
  orderDate: Date;
  sku: string;
  quantity: number;
  itemValue: number;
  commissionPercentage: number;
  commissionAmount: number;
}

interface MissingDeliveryDatesVisualizationProps {
  orders: Order[];
  deliveryDates: DeliveryDate[];
  skuCommissions: SKUCommission[];
}

export default function MissingDeliveryDatesVisualization({
  orders,
  deliveryDates,
  skuCommissions,
}: MissingDeliveryDatesVisualizationProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Find items without delivery dates
  const missingItems = useMemo(() => {
    if (orders.length === 0) {
      return [];
    }

    const deliveryDateMap = new Map<string, Map<string, Date>>();
    deliveryDates.forEach((delivery) => {
      if (!deliveryDateMap.has(delivery.orderId)) {
        deliveryDateMap.set(delivery.orderId, new Map());
      }
      deliveryDateMap.get(delivery.orderId)!.set(delivery.sku, delivery.expectedDeliveryDate);
    });

    // Create SKU commission map
    const skuCommissionMap = new Map<string, number>();
    skuCommissions.forEach((sku) => {
      skuCommissionMap.set(sku.sku, sku.commissionPercentage);
    });

    const missing: MissingDeliveryDateItem[] = [];

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const hasDeliveryDate = deliveryDateMap.get(order.id)?.has(item.sku);
        if (!hasDeliveryDate) {
          const commissionPercentage = skuCommissionMap.get(item.sku) || 0;
          const commissionAmount = (item.totalValue * commissionPercentage) / 100;

          missing.push({
            orderId: order.id,
            orderDate: order.date,
            sku: item.sku,
            quantity: item.quantity,
            itemValue: item.totalValue,
            commissionPercentage,
            commissionAmount,
          });
        }
      });
    });

    return missing;
  }, [orders, deliveryDates, skuCommissions]);

  const filteredItems = useMemo(() => {
    return missingItems.filter(
      (item) =>
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.orderId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [missingItems, searchTerm]);

  const totalValue = useMemo(() => {
    return filteredItems.reduce((sum, item) => sum + item.itemValue, 0);
  }, [filteredItems]);

  const totalCommission = useMemo(() => {
    return missingItems.reduce((sum, item) => sum + item.commissionAmount, 0);
  }, [missingItems]);

  if (missingItems.length === 0) {
    return null;
  }

  return (
    <div className="border rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-yellow-600" />
        <h3 className="text-lg font-semibold">Itens sem Data de Entrega</h3>
      </div>

      {/* Resumo geral */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm">Comissão Total não realizada</span>
          </div>
          <p className="text-2xl font-bold">
            R${" "}
            {totalCommission.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Package className="h-4 w-4" />
            <span className="text-sm">Total de Itens</span>
          </div>
          <p className="text-2xl font-bold">{missingItems.length}</p>
        </div>
      </div>

      {/* View Details Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Eye className="h-4 w-4" />
          <span>Ver Detalhes</span>
        </button>
      </div>

      {/* Modal with Table */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Itens sem Data de Entrega"
        size="xl"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Buscar por SKU ou Pedido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm flex-1"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Pedido</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Data Pedido</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">SKU</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Quantidade</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Valor Item</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Comissão %</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Comissão</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      {searchTerm ? "Nenhum item encontrado" : "Nenhum item sem data de entrega"}
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item, index) => (
                    <tr
                      key={`${item.orderId}-${item.sku}-${index}`}
                      className="border-t hover:bg-muted/50"
                    >
                      <td className="px-4 py-3 font-medium">{item.orderId}</td>
                      <td className="px-4 py-3">{item.orderDate.toLocaleDateString("pt-BR")}</td>
                      <td className="px-4 py-3">{item.sku}</td>
                      <td className="px-4 py-3 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">
                        R${" "}
                        {item.itemValue.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {item.commissionPercentage.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        R${" "}
                        {item.commissionAmount.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredItems.length > 0 && (
                <tfoot className="bg-muted font-semibold">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-right">
                      Total:
                    </td>
                    <td className="px-4 py-3 text-right">
                      R${" "}
                      {totalValue.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-3 text-right"></td>
                    <td className="px-4 py-3 text-right">
                      R${" "}
                      {totalCommission.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
}
