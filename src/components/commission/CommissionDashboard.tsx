"use client";

import { useState, useMemo, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import CommissionVisualization from "./CommissionVisualization";
import MissingDeliveryDatesVisualization from "./MissingDeliveryDatesVisualization";
import type { SKUCommission, Order, DeliveryDate } from "@/types/commission";
import { calculateCommissions } from "@/lib/commission-calculator";
import type { ParsedOrderItem } from "@/lib/file-processors";

const STORAGE_KEY = "sku_commissions";

export default function CommissionDashboard() {
  const router = useRouter();
  const [skuCommissions, setSkuCommissions] = useState<SKUCommission[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryDates, setDeliveryDates] = useState<DeliveryDate[]>([]);

  // Load SKUs from localStorage on mount and listen for changes
  useEffect(() => {
    const loadSKUs = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const data = JSON.parse(stored);
          setSkuCommissions(data);
        } catch (error) {
          console.error("Error loading SKUs from localStorage:", error);
        }
      }
    };

    // Load on mount
    loadSKUs();

    // Listen for storage events (when localStorage changes in other tabs/windows)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        loadSKUs();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Also listen for custom events (for same-tab updates)
    const handleCustomStorageChange = () => {
      loadSKUs();
    };

    window.addEventListener("sku-commissions-updated", handleCustomStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("sku-commissions-updated", handleCustomStorageChange);
    };
  }, []);

  // Calcula comissões sempre que os dados mudarem
  const commissionItems = useMemo(() => {
    if (skuCommissions.length === 0 || orders.length === 0 || deliveryDates.length === 0) {
      return [];
    }
    try {
      return calculateCommissions(orders, skuCommissions, deliveryDates);
    } catch (error) {
      console.error("Erro ao calcular comissões:", error);
      return [];
    }
  }, [skuCommissions, orders, deliveryDates]);

  // Load orders and delivery dates from mock JSON files on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load orders
        const ordersResponse = await fetch("/pedidos.json");
        if (ordersResponse.ok) {
          const ordersData = (await ordersResponse.json()) as Array<{
            n_order: string;
            dt_order: string;
            customer: string;
            cnpj: string;
            address: string;
            n_item: string;
            code: string;
            description: string;
            package: string;
            dt_in: string;
            qty: number;
            unit_value: number;
            ipi: number;
            icmsubs: number;
            bcsubs: number;
            disc_com: number;
            disc_adi: number;
            other: number;
            weight_kg?: number;
            weight?: number;
          }>;
          const parsedItems: ParsedOrderItem[] = ordersData.map((item) => ({
            n_order: item.n_order,
            dt_order: new Date(item.dt_order),
            customer: item.customer,
            cnpj: item.cnpj,
            address: item.address,
            n_item: item.n_item,
            code: item.code,
            description: item.description,
            package: item.package,
            dt_in: new Date(item.dt_in),
            qty: item.qty,
            unit_value: item.unit_value,
            ipi: item.ipi,
            icmsubs: item.icmsubs,
            bcsubs: item.bcsubs,
            disc_com: item.disc_com,
            disc_adi: item.disc_adi,
            other: item.other,
            weight: item.weight_kg || item.weight || 0,
          }));

          // Transform to orders
          const orderMap = new Map<string, Order>();
          parsedItems.forEach((item) => {
            const orderId = item.n_order;
            if (!orderMap.has(orderId)) {
              orderMap.set(orderId, {
                id: orderId,
                date: item.dt_order,
                items: [],
                totalValue: 0,
              });
            }
            const order = orderMap.get(orderId)!;
            const totalValue = item.unit_value * item.qty;
            order.items.push({
              sku: item.code,
              quantity: item.qty,
              price: item.unit_value,
              totalValue,
            });
            order.totalValue += totalValue;
          });

          setOrders(Array.from(orderMap.values()));
        }

        // Load delivery dates
        const deliveryResponse = await fetch("/delivery-dates.json");
        if (deliveryResponse.ok) {
          const deliveryData = (await deliveryResponse.json()) as Array<{
            orderId: string;
            sku: string;
            expectedDeliveryDate: string;
          }>;
          const deliveryDates: DeliveryDate[] = deliveryData.map((item) => ({
            orderId: item.orderId,
            sku: item.sku,
            expectedDeliveryDate: new Date(item.expectedDeliveryDate),
          }));
          setDeliveryDates(deliveryDates);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    loadData();
  }, []);

  // Validação de dados
  // Nota: Itens sem data de entrega são mostrados na visualização MissingDeliveryDatesVisualization,
  // não como erros
  const validationErrors = useMemo(() => {
    const errors: string[] = [];

    if (orders.length > 0 && skuCommissions.length > 0) {
      // Verifica se há SKUs nos pedidos sem configuração de comissão
      const configuredSkus = new Set(skuCommissions.map((s) => s.sku));
      const missingSkus = new Set<string>();

      orders.forEach((order) => {
        order.items.forEach((item) => {
          if (!configuredSkus.has(item.sku)) {
            missingSkus.add(item.sku);
          }
        });
      });

      missingSkus.forEach((sku) => {
        errors.push(`SKU ${sku} não possui configuração de comissão`);
      });
    }

    return errors;
  }, [orders, skuCommissions]);

  const allErrors = validationErrors;

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard de Comissões</h1>
            <p className="text-muted-foreground">
              Gerencie comissões de representantes de vendas por período
            </p>
          </div>
        </div>
        {skuCommissions.length > 0 && (
          <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
            <span className="text-muted-foreground">
              {skuCommissions.length} SKU{skuCommissions.length !== 1 ? "s" : ""} configurado
              {skuCommissions.length !== 1 ? "s" : ""} •{" "}
            </span>
            <button
              onClick={() => router.push("/sku-management")}
              className="text-primary hover:underline"
            >
              Editar configurações
            </button>
          </div>
        )}
      </div>

      {/* Alertas de erro */}
      {allErrors.length > 0 && (
        <div className="border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-red-800 dark:text-red-200">Avisos e Erros</h3>
          </div>
          <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-300">
            {allErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Info message */}
      <div className="border rounded-lg p-4 bg-muted/30">
        <p className="text-sm text-muted-foreground">
          Os dados são carregados automaticamente dos arquivos mock. Para fazer upload de novos
          arquivos, acesse a seção{" "}
          <button
            onClick={() => router.push("/file-batches")}
            className="text-primary hover:underline"
          >
            Arquivos
          </button>
          .
        </p>
      </div>

      {/* Visualização de itens sem data de entrega */}
      {orders.length > 0 && (
        <MissingDeliveryDatesVisualization
          orders={orders}
          deliveryDates={deliveryDates}
          skuCommissions={skuCommissions}
        />
      )}

      {/* Visualização de comissões */}
      {commissionItems.length > 0 && (
        <div className="border rounded-lg p-6">
          <CommissionVisualization commissionItems={commissionItems} />
        </div>
      )}

      {/* Mensagem quando não há dados */}
      {commissionItems.length === 0 && (
        <div className="border rounded-lg p-12 text-center">
          <p className="text-muted-foreground mb-4">
            Os dados são carregados automaticamente. Se não houver comissões, verifique se os
            arquivos mock estão disponíveis.
          </p>
          {skuCommissions.length === 0 && (
            <p className="text-sm text-muted-foreground mt-4">
              Configure os SKUs em{" "}
              <button
                onClick={() => router.push("/sku-management")}
                className="text-primary hover:underline"
              >
                Gerenciamento de SKUs
              </button>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
