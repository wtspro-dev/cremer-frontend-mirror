"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { Search, Calendar, Package, X, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { OrdersService, OrderBillingStatus } from "@/lib/api";
import type { OrderResponse, OrderBatchResponse } from "@/lib/api";
import OrderDetailModal from "./OrderDetailModal";
import { formatDate, formatCNPJ } from "@/lib/formatters";

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [search, setSearch] = useState<string>("");
  const [orderDateStart, setOrderDateStart] = useState<string>("");
  const [orderDateEnd, setOrderDateEnd] = useState<string>("");
  const [batchId, setBatchId] = useState<number | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [billingStatus, setBillingStatus] = useState<OrderBillingStatus>(OrderBillingStatus.ALL);
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);

  // Read batch_id and billing_status from URL query params
  useEffect(() => {
    const batchIdParam = searchParams.get("batch_id");
    const billingStatusParam = searchParams.get("billing_status");

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

    if (billingStatusParam) {
      if (billingStatusParam === OrderBillingStatus.ALL) {
        setBillingStatus(OrderBillingStatus.ALL);
      } else if (billingStatusParam === OrderBillingStatus.FULLY_BILLED) {
        setBillingStatus(OrderBillingStatus.FULLY_BILLED);
      } else if (billingStatusParam === OrderBillingStatus.NOT_FULLY_BILLED) {
        setBillingStatus(OrderBillingStatus.NOT_FULLY_BILLED);
      }
    }
  }, [searchParams]);

  const handleClearBatchFilter = () => {
    setBatchId(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("batch_id");
    router.push(`/orders?${params.toString()}`);
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
  }, [batchId, search, orderDateStart, orderDateEnd, billingStatus]);

  // Fetch orders from API
  const {
    data: ordersResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["orders", batchId, search, orderDateStart, orderDateEnd, billingStatus, page, limit],
    queryFn: async () => {
      const response = await OrdersService.getOrdersV1OrdersGet(
        batchId,
        orderDateStart || null,
        orderDateEnd || null,
        search || null,
        billingStatus,
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

  const handleBillingStatusChange = (value: OrderBillingStatus) => {
    setBillingStatus(value);
  };

  const handleViewOrder = (orderId: number) => {
    setSelectedOrderId(orderId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedOrderId(null);
    setIsModalOpen(false);
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

        {/* Billing Status Filter Radio Buttons */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Filtrar por status de faturamento:</label>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="billing-status-filter"
                value={OrderBillingStatus.ALL}
                checked={billingStatus === OrderBillingStatus.ALL}
                onChange={() => handleBillingStatusChange(OrderBillingStatus.ALL)}
                className="h-4 w-4 text-primary focus:ring-primary"
              />
              <span className="text-sm">Todos</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="billing-status-filter"
                value={OrderBillingStatus.FULLY_BILLED}
                checked={billingStatus === OrderBillingStatus.FULLY_BILLED}
                onChange={() => handleBillingStatusChange(OrderBillingStatus.FULLY_BILLED)}
                className="h-4 w-4 text-primary focus:ring-primary"
              />
              <span className="text-sm">Totalmente faturados</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="billing-status-filter"
                value={OrderBillingStatus.NOT_FULLY_BILLED}
                checked={billingStatus === OrderBillingStatus.NOT_FULLY_BILLED}
                onChange={() => handleBillingStatusChange(OrderBillingStatus.NOT_FULLY_BILLED)}
                className="h-4 w-4 text-primary focus:ring-primary"
              />
              <span className="text-sm">Não totalmente faturados</span>
            </label>
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
      <OrderDetailModal orderId={selectedOrderId} isOpen={isModalOpen} onClose={handleCloseModal} />
    </div>
  );
}
