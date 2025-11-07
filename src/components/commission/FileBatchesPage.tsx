"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Calendar,
  Eye,
  ExternalLink,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import Modal from "@/components/ui/Modal";
import FileUpload from "./FileUpload";
import type { Order, DeliveryDate } from "@/types/commission";
import { ParsedOrderItem } from "@/lib/file-processors";
import { OrdersService } from "@/lib/api";
import type { OrderBatchResponse } from "@/lib/api";
import { calculateTotalOrderItemWithDiscounts } from "@/lib/commission-calculator";

const STORAGE_KEYS = {
  deliveryDates: "uploaded_delivery_dates",
};

interface UploadedFile {
  id: string;
  name: string;
  uploadedAt: Date;
  data: Order[] | DeliveryDate[] | ParsedOrderItem[];
  type: "orders" | "delivery-dates";
  orderCount?: number;
}

export default function FileBatchesPage() {
  const [activeTab, setActiveTab] = useState<"orders" | "delivery-dates">("orders");
  const [deliveryDatesFiles, setDeliveryDatesFiles] = useState<UploadedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
  } = useQuery({
    queryKey: ["orderBatches", search, page, limit],
    queryFn: async () => {
      const response = await OrdersService.getOrderBatchesV1OrdersBatchesGet(
        search || null,
        page,
        limit
      );
      return response;
    },
  });

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

  // Load delivery dates files from localStorage on mount
  useEffect(() => {
    const loadDeliveryDatesFiles = () => {
      const storedDeliveryDates = localStorage.getItem(STORAGE_KEYS.deliveryDates);
      if (storedDeliveryDates) {
        try {
          const files = JSON.parse(storedDeliveryDates) as Array<
            Omit<UploadedFile, "uploadedAt"> & { uploadedAt: string }
          >;
          setDeliveryDatesFiles(
            files.map((f) => ({
              ...f,
              uploadedAt: new Date(f.uploadedAt),
            }))
          );
        } catch (error) {
          console.error("Error loading delivery dates files:", error);
        }
      }
    };
    loadDeliveryDatesFiles();
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleOrdersLoaded = (_data: Order[], _parsedItems?: ParsedOrderItem[], _file?: File) => {
    // After upload, refetch batches from API
    refetchBatches();
  };

  const handleDeliveryDatesLoaded = (data: DeliveryDate[], file?: File) => {
    if (!file) return;

    const newFile: UploadedFile = {
      id: Date.now().toString(),
      name: file.name,
      uploadedAt: new Date(),
      data,
      type: "delivery-dates",
    };

    const updated = [...deliveryDatesFiles, newFile];
    setDeliveryDatesFiles(updated);
    localStorage.setItem(STORAGE_KEYS.deliveryDates, JSON.stringify(updated));
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
      // For delivery dates, show in modal
      setSelectedFile(file);
      setIsModalOpen(true);
    }
  };

  const handleDeleteFile = (id: string, type: "orders" | "delivery-dates") => {
    if (type === "orders") {
      // TODO: Implement API call to delete batch if endpoint exists
      // For now, just refetch to get updated list
      refetchBatches();
    } else {
      const updated = deliveryDatesFiles.filter((f) => f.id !== id);
      setDeliveryDatesFiles(updated);
      localStorage.setItem(STORAGE_KEYS.deliveryDates, JSON.stringify(updated));
    }
  };

  const renderOrdersTable = (items: ParsedOrderItem[] | Order[]) => {
    if (items.length === 0) return null;

    // Check if it's ParsedOrderItem[]
    const isParsedItems = items[0] && "n_order" in items[0];

    if (isParsedItems) {
      const parsedItems = items as ParsedOrderItem[];
      return (
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-2 border-b">Pedido</th>
              <th className="text-left p-2 border-b">Data Pedido</th>
              <th className="text-left p-2 border-b">Código</th>
              <th className="text-left p-2 border-b">Descrição</th>
              <th className="text-right p-2 border-b">Qtd</th>
              <th className="text-right p-2 border-b">Valor Unit.</th>
              <th className="text-right p-2 border-b">Total</th>
            </tr>
          </thead>
          <tbody>
            {parsedItems.map((item, index) => (
              <tr key={index} className="border-b">
                <td className="p-2">{item.n_order}</td>
                <td className="p-2">{item.dt_order.toLocaleDateString("pt-BR")}</td>
                <td className="p-2">{item.code}</td>
                <td className="p-2">{item.description}</td>
                <td className="p-2 text-right">{item.qty}</td>
                <td className="p-2 text-right">
                  R$ {item.unit_value.toFixed(2).replace(".", ",")}
                </td>
                <td className="p-2 text-right">
                  R$ {(item.unit_value * item.qty).toFixed(2).replace(".", ",")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    } else {
      const orders = items as Order[];
      return (
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-2 border-b">Pedido</th>
              <th className="text-left p-2 border-b">Data Pedido</th>
              <th className="text-left p-2 border-b">SKU</th>
              <th className="text-right p-2 border-b">Quantidade</th>
              <th className="text-right p-2 border-b">Valor</th>
            </tr>
          </thead>
          <tbody>
            {orders.flatMap((order) =>
              order.items.map((item, idx) => (
                <tr key={`${order.id}-${idx}`} className="border-b">
                  <td className="p-2">{order.id}</td>
                  <td className="p-2">{order.date.toLocaleDateString("pt-BR")}</td>
                  <td className="p-2">{item.product_description}</td>
                  <td className="p-2 text-right">{item.quantity}</td>
                  <td className="p-2 text-right">
                    R$ {calculateTotalOrderItemWithDiscounts(item).toFixed(2).replace(".", ",")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      );
    }
  };

  const renderDeliveryDatesTable = (items: DeliveryDate[]) => {
    return (
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left p-2 border-b">Pedido</th>
            <th className="text-left p-2 border-b">SKU</th>
            <th className="text-left p-2 border-b">Data de Entrega</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index} className="border-b">
              <td className="p-2">{item.orderId}</td>
              <td className="p-2">{item.sku}</td>
              <td className="p-2">{item.expectedDeliveryDate.toLocaleDateString("pt-BR")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Arquivos</h1>
        <p className="text-muted-foreground">Gerencie os arquivos de pedidos e datas de entrega</p>
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
            onClick={() => setActiveTab("delivery-dates")}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "delivery-dates"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Acompanhamento de Pedidos</span>
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
                                  <button
                                    onClick={() => handleDeleteFile(file.id, "orders")}
                                    className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors text-sm"
                                  >
                                    Excluir
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

        {activeTab === "delivery-dates" && (
          <>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Upload de Datas de Entrega</h2>
              <FileUpload
                type="delivery-dates"
                onDeliveryDatesLoaded={handleDeliveryDatesLoaded}
                onError={handleError}
              />
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">
                Arquivos Carregados ({deliveryDatesFiles.length})
              </h2>
              {deliveryDatesFiles.length === 0 ? (
                <p className="text-muted-foreground">Nenhum arquivo carregado ainda</p>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <div className="divide-y">
                    {deliveryDatesFiles.map((file) => (
                      <div
                        key={file.id}
                        className="p-4 flex items-center justify-between hover:bg-muted/50"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Carregado em {file.uploadedAt.toLocaleString("pt-BR")} •{" "}
                            {Array.isArray(file.data) ? file.data.length : 0} registro
                            {Array.isArray(file.data) && file.data.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewFile(file)}
                            className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
                          >
                            <Eye className="h-4 w-4" />
                            <span>Ver</span>
                          </button>
                          <button
                            onClick={() => handleDeleteFile(file.id, "delivery-dates")}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors text-sm"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal for viewing file details */}
      {selectedFile && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedFile(null);
          }}
          title={selectedFile.name}
          size="xl"
        >
          <div className="overflow-x-auto">
            {selectedFile.type === "orders" ? (
              selectedFile.data && selectedFile.data.length > 0 ? (
                renderOrdersTable(selectedFile.data as ParsedOrderItem[] | Order[])
              ) : (
                <p className="text-muted-foreground">
                  Os dados dos pedidos não estão disponíveis. Este arquivo contém{" "}
                  {selectedFile.orderCount ?? 0} pedido(s).
                </p>
              )
            ) : (
              renderDeliveryDatesTable(selectedFile.data as DeliveryDate[])
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
