"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { Search, Calendar, Package, X, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { OrdersService } from "@/lib/api";
import type { OrderResponse, OrderBatchResponse, OrderDetailResponse } from "@/lib/api";
import Modal from "@/components/ui/Modal";
import {
  formatDate,
  formatDateTime,
  formatCurrency,
  formatWeight,
  formatCNPJ,
  formatPercentage,
} from "@/lib/formatters";
import { calculateTotalOrderItemWithDiscounts } from "@/lib/commission-calculator";

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [search, setSearch] = useState<string>("");
  const [orderDateStart, setOrderDateStart] = useState<string>("");
  const [orderDateEnd, setOrderDateEnd] = useState<string>("");
  const [batchId, setBatchId] = useState<number | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);

  // Read batch_id from URL query params
  useEffect(() => {
    const batchIdParam = searchParams.get("batch_id");
    if (batchIdParam) {
      const id = parseInt(batchIdParam, 10);
      if (!isNaN(id)) {
        setBatchId(id);
      } else {
        setBatchId(null);
      }
    } else {
      setBatchId(null);
    }
  }, [searchParams]);

  const handleClearBatchFilter = () => {
    setBatchId(null);
    router.push("/orders");
  };

  // Fetch batches to get batch name
  const { data: batchesResponse } = useQuery({
    queryKey: ["orderBatches"],
    queryFn: async () => {
      const response = await OrdersService.getOrderBatchesV1OrdersBatchesGet();
      return response;
    },
    enabled: !!batchId, // Only fetch if batchId is set
  });

  // Find the current batch
  const currentBatch: OrderBatchResponse | undefined =
    batchId && batchesResponse?.success && batchesResponse?.data
      ? batchesResponse.data.find((batch) => batch.id === batchId)
      : undefined;

  // Reset to first page when filters change
  useEffect(() => {
    setPage(0);
  }, [batchId, search, orderDateStart, orderDateEnd]);

  // Fetch orders from API
  const {
    data: ordersResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["orders", batchId, search, orderDateStart, orderDateEnd, page, limit],
    queryFn: async () => {
      const response = await OrdersService.getOrdersV1OrdersGet(
        batchId,
        orderDateStart || null,
        orderDateEnd || null,
        search || null,
        page,
        limit
      );
      return response;
    },
  });

  const orders: OrderResponse[] =
    ordersResponse?.success && ordersResponse?.data ? ordersResponse.data : [];
  const totalOrders = ordersResponse?.total ?? 0;
  const totalPages = Math.ceil(totalOrders / limit);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleClearSearch = () => {
    setSearch("");
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = parseInt(e.target.value, 10);
    setLimit(newLimit);
    setPage(0); // Reset to first page when changing limit
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleDateStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOrderDateStart(e.target.value);
  };

  const handleDateEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOrderDateEnd(e.target.value);
  };

  // Fetch order details when modal is open
  const { data: orderDetailResponse, isLoading: isLoadingOrderDetail } = useQuery({
    queryKey: ["orderDetail", selectedOrderId],
    queryFn: async () => {
      if (!selectedOrderId) return null;
      const response = await OrdersService.getOrderV1OrdersOrderIdGet(selectedOrderId);
      return response;
    },
    enabled: !!selectedOrderId && isModalOpen,
  });

  const orderDetail: OrderDetailResponse | null =
    orderDetailResponse?.success && orderDetailResponse?.data ? orderDetailResponse.data : null;

  const handleViewOrder = (orderId: number) => {
    setSelectedOrderId(orderId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrderId(null);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Pedidos</h1>
      </div>

      {/* Filters */}
      <div className="bg-card border rounded-lg p-4 space-y-4">
        {/* Batch Badge */}
        {batchId && currentBatch && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filtrado por:</span>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-md border border-primary/20">
              <span className="text-sm font-medium">{currentBatch.name}</span>
              <button
                onClick={handleClearBatchFilter}
                className="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                aria-label="Limpar filtro de lote"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Search className="h-4 w-4" />
              Buscar
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Número do pedido, cliente ou CNPJ..."
                value={search}
                onChange={handleSearchChange}
                className="w-full px-3 py-2 pr-10 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {search && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted transition-colors"
                  aria-label="Limpar busca"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Date Start */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Data Inicial
            </label>
            <input
              type="date"
              value={orderDateStart}
              onChange={handleDateStartChange}
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Date End */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Data Final
            </label>
            <input
              type="date"
              value={orderDateEnd}
              onChange={handleDateEndChange}
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-card border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-2" />
            <p>Carregando pedidos...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">
            <p>Erro ao carregar pedidos. Tente novamente.</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum pedido encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 border-b font-medium">Número do Pedido</th>
                  <th className="text-left p-4 border-b font-medium">Data do Pedido</th>
                  <th className="text-left p-4 border-b font-medium">Cliente</th>
                  <th className="text-left p-4 border-b font-medium">CNPJ</th>
                  <th className="text-left p-4 border-b font-medium">Endereço</th>
                  <th className="text-center p-4 border-b font-medium">Itens</th>
                  <th className="text-center p-4 border-b font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-medium">{order.order_number}</td>
                    <td className="p-4">{formatDate(order.order_date)}</td>
                    <td className="p-4">{order.customer_name}</td>
                    <td className="p-4 font-mono text-sm">{formatCNPJ(order.customer_cnpj)}</td>
                    <td className="p-4 text-sm text-muted-foreground">{order.address}</td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium">
                        {order.item_count}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => handleViewOrder(order.id)}
                          className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && !error && totalOrders > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-card border rounded-lg">
          {/* Results info and limit selector */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Mostrando {page * limit + 1} - {Math.min((page + 1) * limit, totalOrders)} de{" "}
              {totalOrders} pedido
              {totalOrders !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-2">
              <label htmlFor="limit-select" className="text-sm text-muted-foreground">
                Itens por página:
              </label>
              <select
                id="limit-select"
                value={limit}
                onChange={handleLimitChange}
                className="px-3 py-1.5 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Pagination buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 0}
              className="px-3 py-2 border rounded-md bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Anterior</span>
            </button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i;
                } else if (page < 3) {
                  pageNum = i;
                } else if (page > totalPages - 4) {
                  pageNum = totalPages - 5 + i;
                } else {
                  pageNum = page - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-2 border rounded-md text-sm transition-colors ${
                      page === pageNum
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-muted"
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages - 1}
              className="px-3 py-2 border rounded-md bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm flex items-center gap-1"
            >
              <span>Próxima</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={`Pedido ${orderDetail?.order_number || selectedOrderId || ""}`}
        size="xl"
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
                <label className="text-sm font-medium text-muted-foreground">
                  Número do Pedido
                </label>
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
                <label className="text-sm font-medium text-muted-foreground">Total de Itens</label>
                <p className="text-base">{orderDetail.item_count}</p>
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
                        <th className="text-right p-3 border-b font-medium">IPI</th>
                        <th className="text-right p-3 border-b font-medium">ICMS Subs.</th>
                        <th className="text-right p-3 border-b font-medium">B.C. Subs.</th>
                        <th className="text-right p-3 border-b font-medium">Des. Com</th>
                        <th className="text-right p-3 border-b font-medium">Des. Adi</th>
                        <th className="text-right p-3 border-b font-medium">Peso (kg)</th>
                        <th className="text-right p-3 border-b font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderDetail.items.map((item) => {
                        const totalValue = calculateTotalOrderItemWithDiscounts(item);
                        return (
                          <tr key={item.id} className="border-b hover:bg-muted/30">
                            <td className="p-3 font-mono">{item.product_code}</td>
                            <td className="p-3">{item.product_description}</td>
                            <td className="p-3">{item.package}</td>
                            <td className="p-3 text-center">{item.quantity}</td>
                            <td className="p-3 text-right">{formatCurrency(item.unit_value)}</td>
                            <td className="p-3 text-right">{formatCurrency(item.ipi)}</td>
                            <td className="p-3 text-right">{formatCurrency(item.icmsubs)}</td>
                            <td className="p-3 text-right">{formatCurrency(item.bcsubs)}</td>
                            <td className="p-3 text-right">{formatPercentage(item.disc_com)}</td>
                            <td className="p-3 text-right">{formatPercentage(item.disc_adi)}</td>
                            <td className="p-3 text-right">{formatWeight(item.weight_kg)}</td>
                            <td className="p-3 text-right font-medium">
                              {formatCurrency(totalValue)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-muted/30">
                      <tr>
                        <td colSpan={8} className="p-3 text-right font-semibold">
                          Total Geral:
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
    </div>
  );
}
