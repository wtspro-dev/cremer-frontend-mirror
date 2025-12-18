"use client";

import { useState, useEffect } from "react";
import { FileText, ExternalLink, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import FileUpload from "./FileUpload";
import type { Order, DeliveryDate } from "@/types/commission";
import { ParsedOrderItem } from "@/lib/file-processors";
import type { OrderBatchResponse, InvoiceBatchResponse } from "@/lib/api";
import { useOrderBatches } from "@/hooks/use-orders";
import { useInvoiceBatches } from "@/hooks/use-invoices";

interface UploadedFile {
  id: string;
  name: string;
  uploadedAt: Date;
  data: Order[] | DeliveryDate[] | ParsedOrderItem[];
  type: "orders" | "invoices";
  orderCount?: number;
  invoiceCount?: number;
}

export default function FileBatchesPage() {
  const [activeTab, setActiveTab] = useState<"orders" | "invoices">("orders");
  const router = useRouter();
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);

  // Reset to first page when search changes
  useEffect(() => {
    setPage(0);
  }, [search]);

  // Fetch order batches from API
  const {
    data: batchesResponse,
    isLoading: isLoadingBatches,
    error: batchesError,
    refetch: refetchBatches,
  } = useOrderBatches(search || null, page, limit);

  // Fetch invoice batches from API
  const {
    data: invoiceBatchesResponse,
    isLoading: isLoadingInvoiceBatches,
    error: invoiceBatchesError,
    refetch: refetchInvoiceBatches,
  } = useInvoiceBatches(search || null, page, limit);

  // Transform API response to UploadedFile format
  const ordersFiles: UploadedFile[] =
    batchesResponse?.success && batchesResponse?.data
      ? batchesResponse.data.map((batch: OrderBatchResponse) => ({
          id: batch.id.toString(),
          name: batch.name,
          uploadedAt: new Date(batch.created * 1000), // Convert Unix timestamp to Date
          data: [], // API doesn't return order data, just metadata
          type: "orders" as const,
          orderCount: batch.order_count,
        }))
      : [];
  const totalBatches = batchesResponse?.total ?? 0;
  const totalPages = Math.ceil(totalBatches / limit);

  // Transform invoice batches API response to UploadedFile format
  const invoicesFiles: UploadedFile[] =
    invoiceBatchesResponse?.success && invoiceBatchesResponse?.data
      ? invoiceBatchesResponse.data.map((batch: InvoiceBatchResponse) => ({
          id: batch.id.toString(),
          name: batch.name,
          uploadedAt: new Date(batch.created * 1000), // Convert Unix timestamp to Date
          data: [], // API doesn't return invoice data, just metadata
          type: "invoices" as const,
          invoiceCount: batch.invoice_count,
        }))
      : [];
  const totalInvoiceBatches = invoiceBatchesResponse?.total ?? 0;
  const totalInvoicePages = Math.ceil(totalInvoiceBatches / limit);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleOrdersLoaded = (_data: Order[], _parsedItems?: ParsedOrderItem[], _file?: File) => {
    // After upload, refetch batches from API
    refetchBatches();
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleInvoicesLoaded = (_data: DeliveryDate[], _file?: File) => {
    // After upload, refetch invoice batches from API
    refetchInvoiceBatches();
  };

  const handleError = (error: string) => {
    console.error("File upload error:", error);
  };

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

  const handleViewFile = (file: UploadedFile) => {
    if (file.type === "orders") {
      // Redirect to orders page with batch_id
      router.push(`/orders?batch_id=${file.id}`);
    } else {
      // Redirect to invoices page with batch_id
      router.push(`/invoices?batch_id=${file.id}`);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Arquivos</h1>
        <p className="text-muted-foreground">Gerencie os arquivos de pedidos e acompanhamento</p>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "orders"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Pedidos</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("invoices")}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "invoices"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Planilhas de Acompanhamento</span>
            </div>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === "orders" && (
          <>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Upload de Pedidos</h2>
              <FileUpload
                type="orders-pdf"
                onOrdersLoaded={handleOrdersLoaded}
                onError={handleError}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Arquivos Carregados ({totalBatches})</h2>
              </div>

              {/* Search Input */}
              <div className="bg-card border rounded-lg p-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Buscar
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar por nome do arquivo..."
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
              </div>

              {isLoadingBatches ? (
                <p className="text-muted-foreground">Carregando arquivos...</p>
              ) : batchesError ? (
                <p className="text-red-600">Erro ao carregar arquivos. Tente novamente.</p>
              ) : ordersFiles.length === 0 ? (
                <p className="text-muted-foreground">
                  {search ? "Nenhum arquivo encontrado" : "Nenhum arquivo carregado ainda"}
                </p>
              ) : (
                <>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-4 border-b font-medium">Nome do Arquivo</th>
                            <th className="text-left p-4 border-b font-medium">Data de Upload</th>
                            <th className="text-center p-4 border-b font-medium">
                              Número de Pedidos
                            </th>
                            <th className="text-center p-4 border-b font-medium">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ordersFiles.map((file) => (
                            <tr
                              key={file.id}
                              className="border-b hover:bg-muted/30 transition-colors"
                            >
                              <td className="p-4">
                                <p className="font-medium">{file.name}</p>
                              </td>
                              <td className="p-4">
                                <p className="text-sm text-muted-foreground">
                                  {file.uploadedAt.toLocaleString("pt-BR")}
                                </p>
                              </td>
                              <td className="p-4 text-center">
                                <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                                  {file.orderCount ?? 0}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleViewFile(file)}
                                    className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    <span>Ver pedidos</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Pagination */}
                  {totalBatches > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-card border rounded-lg">
                      {/* Results info and limit selector */}
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          Mostrando {page * limit + 1} -{" "}
                          {Math.min((page + 1) * limit, totalBatches)} de {totalBatches} arquivo
                          {totalBatches !== 1 ? "s" : ""}
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
                </>
              )}
            </div>
          </>
        )}

        {activeTab === "invoices" && (
          <>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Upload de Planilhas de Acompanhamento</h2>
              <FileUpload
                type="invoices-excel"
                onDeliveryDatesLoaded={handleInvoicesLoaded}
                onError={handleError}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  Arquivos Carregados ({totalInvoiceBatches})
                </h2>
              </div>

              {/* Search Input */}
              <div className="bg-card border rounded-lg p-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Buscar
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar por nome do arquivo..."
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
              </div>

              {isLoadingInvoiceBatches ? (
                <p className="text-muted-foreground">Carregando arquivos...</p>
              ) : invoiceBatchesError ? (
                <p className="text-red-600">Erro ao carregar arquivos. Tente novamente.</p>
              ) : invoicesFiles.length === 0 ? (
                <p className="text-muted-foreground">
                  {search ? "Nenhum arquivo encontrado" : "Nenhum arquivo carregado ainda"}
                </p>
              ) : (
                <>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-4 border-b font-medium">Nome do Arquivo</th>
                            <th className="text-left p-4 border-b font-medium">Data de Upload</th>
                            <th className="text-center p-4 border-b font-medium">
                              Número de Notas Fiscais
                            </th>
                            <th className="text-center p-4 border-b font-medium">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoicesFiles.map((file) => (
                            <tr
                              key={file.id}
                              className="border-b hover:bg-muted/30 transition-colors"
                            >
                              <td className="p-4">
                                <p className="font-medium">{file.name}</p>
                              </td>
                              <td className="p-4">
                                <p className="text-sm text-muted-foreground">
                                  {file.uploadedAt.toLocaleString("pt-BR")}
                                </p>
                              </td>
                              <td className="p-4 text-center">
                                <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                                  {file.invoiceCount ?? 0}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleViewFile(file)}
                                    className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    <span>Ver notas fiscais</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Pagination */}
                  {totalInvoiceBatches > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-card border rounded-lg">
                      {/* Results info and limit selector */}
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          Mostrando {page * limit + 1} -{" "}
                          {Math.min((page + 1) * limit, totalInvoiceBatches)} de{" "}
                          {totalInvoiceBatches} arquivo
                          {totalInvoiceBatches !== 1 ? "s" : ""}
                        </span>
                        <div className="flex items-center gap-2">
                          <label
                            htmlFor="limit-select-invoices"
                            className="text-sm text-muted-foreground"
                          >
                            Itens por página:
                          </label>
                          <select
                            id="limit-select-invoices"
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
                          {Array.from({ length: Math.min(5, totalInvoicePages) }, (_, i) => {
                            let pageNum: number;
                            if (totalInvoicePages <= 5) {
                              pageNum = i;
                            } else if (page < 3) {
                              pageNum = i;
                            } else if (page > totalInvoicePages - 4) {
                              pageNum = totalInvoicePages - 5 + i;
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
                          disabled={page >= totalInvoicePages - 1}
                          className="px-3 py-2 border rounded-md bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm flex items-center gap-1"
                        >
                          <span>Próxima</span>
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
