"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import {
  Search,
  Calendar,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { InvoicesService } from "@/lib/api";
import type { InvoiceResponse, InvoiceBatchResponse } from "@/lib/api";
import OrderDetailModal from "./OrderDetailModal";
import { formatDate, formatCurrency, formatPercentage } from "@/lib/formatters";

export default function InvoicesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [search, setSearch] = useState<string>("");
  const [invoiceDateStart, setInvoiceDateStart] = useState<string>("");
  const [invoiceDateEnd, setInvoiceDateEnd] = useState<string>("");
  const [batchId, setBatchId] = useState<number | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [sort, setSort] = useState<string>("desc");
  const [excludeNullDeliveryDate, setExcludeNullDeliveryDate] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);

  // Read batch_id and order_id from URL query params
  useEffect(() => {
    const batchIdParam = searchParams.get("batch_id");
    const orderIdParam = searchParams.get("order_id");

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

    if (orderIdParam) {
      const id = parseInt(orderIdParam, 10);
      if (!isNaN(id)) {
        setOrderId(id);
      } else {
        setOrderId(null);
      }
    } else {
      setOrderId(null);
    }
  }, [searchParams]);

  const handleClearBatchFilter = () => {
    setBatchId(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("batch_id");
    router.push(`/invoices?${params.toString()}`);
  };

  const handleClearOrderFilter = () => {
    setOrderId(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("order_id");
    router.push(`/invoices?${params.toString()}`);
  };

  // Fetch batches to get batch name
  const { data: batchesResponse } = useQuery({
    queryKey: ["invoiceBatches", batchId],
    queryFn: async () => {
      const response = await InvoicesService.getInvoiceBatchesV1InvoicesBatchesGet();
      return response;
    },
    enabled: !!batchId, // Only fetch if batchId is set
  });

  // Find the current batch
  const currentBatch: InvoiceBatchResponse | undefined =
    batchId && batchesResponse?.success && batchesResponse?.data
      ? batchesResponse.data.find((batch) => batch.id === batchId)
      : undefined;

  // Reset to first page when filters change
  useEffect(() => {
    setPage(0);
  }, [batchId, orderId, search, invoiceDateStart, invoiceDateEnd, sort, excludeNullDeliveryDate]);

  // Fetch invoices from API
  const {
    data: invoicesResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "invoices",
      batchId,
      orderId,
      search,
      invoiceDateStart,
      invoiceDateEnd,
      excludeNullDeliveryDate,
      sort,
      page,
      limit,
    ],
    queryFn: async () => {
      const response = await InvoicesService.getInvoicesV1InvoicesGet(
        batchId,
        orderId,
        invoiceDateStart || null,
        invoiceDateEnd || null,
        search || null,
        excludeNullDeliveryDate,
        sort,
        page,
        limit
      );
      return response;
    },
  });

  const invoices: InvoiceResponse[] =
    invoicesResponse?.success && invoicesResponse?.data ? invoicesResponse.data : [];
  const totalInvoices = invoicesResponse?.total ?? 0;
  const totalPages = Math.ceil(totalInvoices / limit);

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
    setInvoiceDateStart(e.target.value);
  };

  const handleDateEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInvoiceDateEnd(e.target.value);
  };

  const handleSortToggle = () => {
    setSort(sort === "desc" ? "asc" : "desc");
  };

  const handleExcludeNullDeliveryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExcludeNullDeliveryDate(e.target.checked);
  };

  const handleViewOrder = (orderId: number) => {
    setSelectedOrderId(orderId);
    setIsOrderModalOpen(true);
  };

  const handleCloseOrderModal = () => {
    setSelectedOrderId(null);
    setIsOrderModalOpen(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Notas Fiscais</h1>
      </div>

      {/* Filters */}
      <div className="bg-card border rounded-lg p-4 space-y-4">
        {/* Batch and Order Badges */}
        {(batchId && currentBatch) || orderId ? (
          <div className="flex items-center gap-2 flex-wrap">
            {batchId && currentBatch && (
              <>
                <span className="text-sm text-muted-foreground">Filtrado por:</span>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-md border border-primary/20">
                  <span className="text-sm font-medium">Lote: {currentBatch.name}</span>
                  <button
                    onClick={handleClearBatchFilter}
                    className="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                    aria-label="Limpar filtro de lote"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </>
            )}
            {orderId && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-md border border-primary/20">
                <span className="text-sm font-medium">Pedido: {orderId}</span>
                <button
                  onClick={handleClearOrderFilter}
                  className="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                  aria-label="Limpar filtro de pedido"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        ) : null}

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
                placeholder="Número da NF, número do pedido ou código do produto..."
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
              Data entrega inicial
            </label>
            <input
              type="date"
              value={invoiceDateStart}
              onChange={handleDateStartChange}
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Date End */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Data entrega final
            </label>
            <input
              type="date"
              value={invoiceDateEnd}
              onChange={handleDateEndChange}
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Exclude Null Delivery Date Checkbox */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="exclude-null-delivery-date"
            checked={excludeNullDeliveryDate}
            onChange={handleExcludeNullDeliveryDateChange}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label
            htmlFor="exclude-null-delivery-date"
            className="text-sm font-medium cursor-pointer"
          >
            Excluir notas fiscais sem data de entrega
          </label>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-card border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-2" />
            <p>Carregando notas fiscais...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">
            <p>Erro ao carregar notas fiscais. Tente novamente.</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma nota fiscal encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 border-b font-medium">Número da NF</th>
                  <th className="text-left p-4 border-b font-medium">Data da NF</th>
                  <th className="text-left p-4 border-b font-medium">
                    <button
                      onClick={handleSortToggle}
                      className="flex items-center gap-2 hover:text-primary transition-colors"
                    >
                      <span>Data de Entrega</span>
                      <div className="flex flex-col">
                        <ArrowUp
                          className={`h-3 w-3 ${
                            sort === "asc" ? "text-primary" : "text-muted-foreground/30"
                          }`}
                        />
                        <ArrowDown
                          className={`h-3 w-3 -mt-1 ${
                            sort === "desc" ? "text-primary" : "text-muted-foreground/30"
                          }`}
                        />
                      </div>
                    </button>
                  </th>
                  <th className="text-left p-4 border-b font-medium">Produto</th>
                  <th className="text-right p-4 border-b font-medium">Valor</th>
                  <th className="text-right p-4 border-b font-medium">Comissão (%)</th>
                  <th className="text-right p-4 border-b font-medium">Comissão (R$)</th>
                  <th className="text-center p-4 border-b font-medium">Pedido</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-medium">{invoice.invoice_number}</td>
                    <td className="p-4">{formatDate(invoice.invoice_date)}</td>
                    <td className="p-4">
                      {invoice.delivery_date ? formatDate(invoice.delivery_date) : "-"}
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="font-medium">{invoice.product_code}</div>
                        <div className="text-sm text-muted-foreground">
                          {invoice.product_description}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right font-medium">{formatCurrency(invoice.value)}</td>
                    <td className="p-4 text-right font-medium">
                      {formatPercentage(invoice.commission_percentage)}
                    </td>
                    <td className="p-4 text-right font-medium">
                      {formatCurrency(invoice.commission_value)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center">
                        {invoice.order_id ? (
                          <button
                            onClick={() => handleViewOrder(invoice.order_id!)}
                            className="text-blue-500 hover:underline text-sm font-medium"
                          >
                            {invoice.order_number}
                          </button>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
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
      {!isLoading && !error && totalInvoices > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-card border rounded-lg">
          {/* Results info and limit selector */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Mostrando {page * limit + 1} - {Math.min((page + 1) * limit, totalInvoices)} de{" "}
              {totalInvoices} nota
              {totalInvoices !== 1 ? "s" : ""} fiscal
              {totalInvoices !== 1 ? "is" : ""}
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
      <OrderDetailModal
        orderId={selectedOrderId}
        isOpen={isOrderModalOpen}
        onClose={handleCloseOrderModal}
      />
    </div>
  );
}
