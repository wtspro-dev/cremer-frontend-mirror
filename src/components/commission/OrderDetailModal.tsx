"use client";

import { useState } from "react";
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

interface OrderDetailModalProps {
  orderId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function OrderDetailModal({ orderId, isOpen, onClose }: OrderDetailModalProps) {
  const [hoveredItemId, setHoveredItemId] = useState<number | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);

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

  // Get related invoice IDs for a hovered item
  const getRelatedInvoiceIds = (itemId: number): Set<number> => {
    if (!orderDetail) return new Set();
    const item = orderDetail.items.find((i) => i.id === itemId);
    if (!item) return new Set();
    return new Set(item.invoices.map((inv) => inv.id));
  };

  const relatedInvoiceIds = hoveredItemId ? getRelatedInvoiceIds(hoveredItemId) : new Set<number>();

  // Get related item IDs for a selected invoice
  const getRelatedItemIds = (invoiceId: number): Set<number> => {
    if (!orderDetail) return new Set();
    const invoice = orderDetail.invoices.find((inv) => inv.id === invoiceId);
    if (!invoice) return new Set();
    // Find items that have this invoice in their invoices array
    return new Set(
      orderDetail.items
        .filter((item) => item.invoices.some((inv) => inv.id === invoiceId))
        .map((item) => item.id)
    );
  };

  const relatedItemIds = selectedInvoiceId
    ? getRelatedItemIds(selectedInvoiceId)
    : new Set<number>();

  // Filter invoices and items based on selection
  const displayedInvoices = selectedInvoiceId
    ? orderDetail?.invoices.filter((inv) => inv.id === selectedInvoiceId) || []
    : orderDetail?.invoices || [];

  const displayedItems = selectedInvoiceId
    ? orderDetail?.items.filter((item) => relatedItemIds.has(item.id)) || []
    : orderDetail?.items || [];

  const handleInvoiceClick = (invoiceId: number) => {
    if (selectedInvoiceId === invoiceId) {
      // Clicking the same invoice again deselects it
      setSelectedInvoiceId(null);
    } else {
      setSelectedInvoiceId(invoiceId);
    }
  };

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
              <label className="text-sm font-medium text-muted-foreground">Criado em</label>
              <p className="text-base text-sm">{formatDateTime(orderDetail.created)}</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">Notas Fiscais</h3>
            {/* Invoices Table */}
            {orderDetail.invoices && orderDetail.invoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 border-b font-medium">Número da Nota</th>
                      <th className="text-left p-3 border-b font-medium">Data da Nota</th>
                      <th className="text-left p-3 border-b font-medium">Data de Pagamento</th>
                      <th className="text-left p-3 border-b font-medium">
                        Data de Pagamento da Comissão
                      </th>
                      <th className="text-left p-3 border-b font-medium">Código do Produto</th>
                      <th className="text-left p-3 border-b font-medium">Descrição do Produto</th>
                      <th className="text-right p-3 border-b font-medium">Valor Total</th>
                      <th className="text-right p-3 border-b font-medium">Comissão Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedInvoices.map((invoice) => {
                      const isHighlighted = relatedInvoiceIds.has(invoice.id);
                      const isSelected = selectedInvoiceId === invoice.id;
                      return (
                        <tr
                          key={invoice.id}
                          onClick={() => handleInvoiceClick(invoice.id)}
                          className={`border-b transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-primary/20 hover:bg-primary/25"
                              : isHighlighted
                                ? "bg-primary/10 hover:bg-primary/15"
                                : "hover:bg-muted/30"
                          }`}
                        >
                          <td className="p-3 font-medium">{invoice.invoice_number}</td>
                          <td className="p-3">{formatDate(invoice.invoice_date)}</td>
                          <td className="p-3">
                            {invoice.payment_date ? formatDate(invoice.payment_date) : "-"}
                          </td>
                          <td className="p-3">
                            {invoice.commission_payment_date
                              ? formatDate(invoice.commission_payment_date)
                              : "-"}
                          </td>
                          <td className="p-3 font-mono">{invoice.product_code}</td>
                          <td className="p-3">{invoice.product_description}</td>
                          <td className="p-3 text-right font-medium">
                            {formatCurrency(invoice.value)}
                          </td>
                          <td className="p-3 text-right font-medium">
                            {formatCurrency(invoice.commission_value)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-muted/30">
                    <tr>
                      <td colSpan={3} className="p-3 text-right font-semibold">
                        Total:
                      </td>
                      <td className="p-3 text-right font-bold">
                        {formatCurrency(displayedInvoices.reduce((sum, inv) => sum + inv.value, 0))}
                      </td>
                      <td className="p-3 text-right font-bold">
                        {formatCurrency(
                          displayedInvoices.reduce((sum, inv) => sum + inv.commission_value, 0)
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground text-center text-red-500">
                Nenhuma nota fiscal encontrada
              </p>
            )}
          </div>

          {/* Order Items */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Itens do Pedido</h3>
              {selectedInvoiceId && (
                <button
                  onClick={() => setSelectedInvoiceId(null)}
                  className="text-sm text-primary hover:underline"
                >
                  Mostrar todos os itens
                </button>
              )}
            </div>
            {displayedItems.length === 0 ? (
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
                      <th className="text-right p-3 border-b font-medium">Comissão (%)</th>
                      <th className="text-right p-3 border-b font-medium">Comissão (R$)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedItems.map((item) => {
                      const isHighlighted = hoveredItemId === item.id;
                      const isRelatedToSelected = selectedInvoiceId
                        ? relatedItemIds.has(item.id)
                        : false;
                      return (
                        <tr
                          key={item.id}
                          className={`border-b transition-colors ${
                            isRelatedToSelected
                              ? "bg-primary/20 hover:bg-primary/25"
                              : isHighlighted
                                ? "bg-primary/10 hover:bg-primary/15"
                                : "hover:bg-muted/30"
                          }`}
                          onMouseEnter={() => setHoveredItemId(item.id)}
                          onMouseLeave={() => setHoveredItemId(null)}
                        >
                          <td className="p-3 font-mono">{item.product_code}</td>
                          <td className="p-3">{item.product_description}</td>
                          <td className="p-3">{item.package}</td>
                          <td className="p-3 text-center">{item.quantity}</td>
                          <td className="p-3 text-right">{formatCurrency(item.unit_value)}</td>
                          <td className="p-3 text-right">{formatPercentage(item.disc_com)}</td>
                          <td className="p-3 text-right">{formatPercentage(item.disc_adi)}</td>
                          <td className="p-3 text-right font-medium">
                            {formatCurrency(item.total_value)}
                          </td>
                          <td className="p-3 text-right">{formatPercentage(item.ipi)}</td>
                          <td className="p-3 text-right">{formatCurrency(item.icmsubs)}</td>
                          <td className="p-3 text-right font-medium">
                            {formatCurrency(item.total_with_taxes)}
                          </td>
                          <td className="p-3 text-right">
                            {formatPercentage(item.commission_percentage)}
                          </td>
                          <td className="p-3 text-right">
                            {formatCurrency(item.total_commission)}
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
                          displayedItems.reduce((sum, item) => sum + item.total_value, 0)
                        )}
                      </td>
                      <td colSpan={2} className="p-3 text-right font-semibold">
                        Total com impostos:
                      </td>
                      <td className="p-3 text-right font-bold">
                        {formatCurrency(
                          displayedItems.reduce((sum, item) => sum + item.total_with_taxes, 0)
                        )}
                      </td>
                      <td className="p-3 text-right font-semibold">Total de comissões:</td>
                      <td className="p-3 text-right font-bold">
                        {formatCurrency(
                          displayedItems.reduce((sum, item) => sum + item.total_commission, 0)
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
