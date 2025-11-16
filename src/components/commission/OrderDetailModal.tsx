"use client";

import { useQuery } from "@tanstack/react-query";
import { OrdersService } from "@/lib/api";
import type { OrderDetailResponse } from "@/lib/api";
import Modal from "@/components/ui/Modal";
import {
  formatDate,
  formatDateTime,
  formatCurrency,
  formatCNPJ,
  formatPercentage,
} from "@/lib/formatters";
import {
  calculateTotalOrderItemWithDiscounts,
  calculateTotalOrderItemWithDiscountsAndTaxes,
} from "@/lib/commission-calculator";

interface OrderDetailModalProps {
  orderId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function OrderDetailModal({ orderId, isOpen, onClose }: OrderDetailModalProps) {
  // Fetch order details when modal is open
  const { data: orderDetailResponse, isLoading: isLoadingOrderDetail } = useQuery({
    queryKey: ["orderDetail", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const response = await OrdersService.getOrderV1OrdersOrderIdGet(orderId);
      return response;
    },
    enabled: !!orderId && isOpen,
  });

  const orderDetail: OrderDetailResponse | null =
    orderDetailResponse?.success && orderDetailResponse?.data ? orderDetailResponse.data : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Pedido ${orderDetail?.order_number || orderId || ""}`}
      size="full"
    >
      {isLoadingOrderDetail ? (
        <div className="p-8 text-center text-muted-foreground">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-2" />
          <p>Carregando detalhes do pedido...</p>
        </div>
      ) : orderDetail ? (
        <div className="space-y-6">
          {/* Order Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Número do Pedido</label>
              <p className="text-base font-semibold">{orderDetail.order_number}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Data do Pedido</label>
              <p className="text-base">{formatDate(orderDetail.order_date)}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Cliente</label>
              <p className="text-base">{orderDetail.customer_name}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">CNPJ</label>
              <p className="text-base font-mono">{formatCNPJ(orderDetail.customer_cnpj)}</p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-muted-foreground">Endereço</label>
              <p className="text-base">{orderDetail.address}</p>
            </div>
            {orderDetail.batch_file_name && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Arquivo de Origem
                </label>
                <p className="text-base">{orderDetail.batch_file_name}</p>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Notas Fiscais</label>
              <p className="text-base">
                {orderDetail.invoices && orderDetail.invoices.length > 0 ? (
                  <a
                    href={`/invoices?order_id=${orderDetail.id}`}
                    className="text-blue-500 hover:underline font-medium"
                  >
                    {orderDetail.invoices.length} nota
                    {orderDetail.invoices.length !== 1 ? "s" : ""} fiscal
                    {orderDetail.invoices.length !== 1 ? "is" : ""}
                  </a>
                ) : (
                  <span className="text-muted-foreground">0 notas fiscais</span>
                )}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Criado em</label>
              <p className="text-base text-sm">{formatDateTime(orderDetail.created)}</p>
            </div>
            {orderDetail.updated && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Atualizado em</label>
                <p className="text-base text-sm">{formatDateTime(orderDetail.updated)}</p>
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">Itens do Pedido</h3>
            {orderDetail.items.length === 0 ? (
              <p className="text-muted-foreground">Nenhum item encontrado</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 border-b font-medium">Código</th>
                      <th className="text-left p-3 border-b font-medium">Descrição</th>
                      <th className="text-left p-3 border-b font-medium">Embalagem</th>
                      <th className="text-center p-3 border-b font-medium">Quantidade</th>
                      <th className="text-right p-3 border-b font-medium">Valor Unit.</th>
                      <th className="text-right p-3 border-b font-medium">Des. Com</th>
                      <th className="text-right p-3 border-b font-medium">Des. Adi</th>
                      <th className="text-right p-3 border-b font-medium">Total sem impostos</th>
                      <th className="text-right p-3 border-b font-medium">IPI</th>
                      <th className="text-right p-3 border-b font-medium">ICMS Subs.</th>
                      <th className="text-right p-3 border-b font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderDetail.items.map((item) => {
                      const totalValueNoTaxes = calculateTotalOrderItemWithDiscounts(item);
                      const totalValue = calculateTotalOrderItemWithDiscountsAndTaxes(item);
                      return (
                        <tr key={item.id} className="border-b hover:bg-muted/30">
                          <td className="p-3 font-mono">{item.product_code}</td>
                          <td className="p-3">{item.product_description}</td>
                          <td className="p-3">{item.package}</td>
                          <td className="p-3 text-center">{item.quantity}</td>
                          <td className="p-3 text-right">{formatCurrency(item.unit_value)}</td>
                          <td className="p-3 text-right">{formatPercentage(item.disc_com)}</td>
                          <td className="p-3 text-right">{formatPercentage(item.disc_adi)}</td>
                          <td className="p-3 text-right font-medium">
                            {formatCurrency(totalValueNoTaxes)}
                          </td>
                          <td className="p-3 text-right">{formatPercentage(item.ipi)}</td>
                          <td className="p-3 text-right">{formatCurrency(item.icmsubs)}</td>
                          <td className="p-3 text-right font-medium">
                            {formatCurrency(totalValue)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-muted/30">
                    <tr>
                      <td colSpan={7} className="p-3 text-right font-semibold">
                        Total sem impostos:
                      </td>
                      <td className="p-3 text-right font-bold">
                        {formatCurrency(
                          orderDetail.items.reduce(
                            (sum, item) =>
                              sum +
                              Math.round(calculateTotalOrderItemWithDiscounts(item) * 100) / 100,
                            0
                          )
                        )}
                      </td>
                      <td colSpan={2} className="p-3 text-right font-semibold">
                        Total com impostos:
                      </td>
                      <td className="p-3 text-right font-bold">
                        {formatCurrency(
                          orderDetail.items.reduce(
                            (sum, item) => sum + calculateTotalOrderItemWithDiscountsAndTaxes(item),
                            0
                          )
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-red-600">
          <p>Erro ao carregar detalhes do pedido. Tente novamente.</p>
        </div>
      )}
    </Modal>
  );
}
