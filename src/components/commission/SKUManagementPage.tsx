"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, X, Plus, Eye, Edit, ChevronLeft, ChevronRight, Package } from "lucide-react";
import { SkUsService } from "@/lib/api";
import type { SkuResponse, CreateSkuRequest, UpdateSkuRequest } from "@/lib/api";
import SKUDetailModal from "./SKUDetailModal";
import Modal from "@/components/ui/Modal";
import { formatPercentage } from "@/lib/formatters";

export default function SKUManagementPage() {
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);
  const [selectedSkuId, setSelectedSkuId] = useState<number | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSku, setEditingSku] = useState<SkuResponse | null>(null);
  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState<CreateSkuRequest>({
    order_product_code: "",
    invoice_product_code: "",
    description: "",
    package: "",
    commission_percentage: 0,
  });

  // Reset to first page when search changes
  useEffect(() => {
    setPage(0);
  }, [search]);

  // Fetch SKUs from API
  const {
    data: skusResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["skus", search, page, limit],
    queryFn: async () => {
      const response = await SkUsService.getSkusV1SkusGet(search || null, page, limit);
      return response;
    },
  });

  const skus: SkuResponse[] = skusResponse?.success && skusResponse?.data ? skusResponse.data : [];
  const totalSkus = skusResponse?.total ?? 0;
  const totalPages = Math.ceil(totalSkus / limit);

  // Create SKU mutation
  const createSkuMutation = useMutation({
    mutationFn: (data: CreateSkuRequest) => SkUsService.createSkuV1SkusPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skus"] });
      setIsFormModalOpen(false);
      resetForm();
    },
  });

  // Update SKU mutation
  const updateSkuMutation = useMutation({
    mutationFn: ({ skuId, data }: { skuId: number; data: UpdateSkuRequest }) =>
      SkUsService.updateSkuV1SkusSkuIdPut(skuId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skus"] });
      queryClient.invalidateQueries({ queryKey: ["skuDetail"] });
      setIsFormModalOpen(false);
      setEditingSku(null);
      resetForm();
    },
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleClearSearch = () => {
    setSearch("");
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = parseInt(e.target.value, 10);
    setLimit(newLimit);
    setPage(0);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleViewSku = (skuId: number) => {
    setSelectedSkuId(skuId);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedSkuId(null);
  };

  const handleCreateSku = () => {
    setEditingSku(null);
    resetForm();
    setIsFormModalOpen(true);
  };

  const handleEditSku = (sku: SkuResponse) => {
    setEditingSku(sku);
    setFormData({
      order_product_code: sku.order_product_code,
      invoice_product_code: sku.invoice_product_code,
      description: sku.description,
      package: sku.package,
      commission_percentage: sku.commission_percentage,
    });
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setEditingSku(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      order_product_code: "",
      invoice_product_code: "",
      description: "",
      package: "",
      commission_percentage: 0,
    });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "commission_percentage" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSku) {
      updateSkuMutation.mutate({
        skuId: editingSku.id,
        data: formData,
      });
    } else {
      createSkuMutation.mutate(formData);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gerenciamento de SKUs</h1>
          <p className="text-muted-foreground">Gerencie os códigos de produtos e comissões</p>
        </div>
        <button
          onClick={handleCreateSku}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Novo SKU</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card border rounded-lg p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Search className="h-4 w-4" />
            Buscar
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Código do produto, código da NF ou descrição..."
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

      {/* SKUs Table */}
      <div className="bg-card border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-2" />
            <p>Carregando SKUs...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">
            <p>Erro ao carregar SKUs. Tente novamente.</p>
          </div>
        ) : skus.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum SKU encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 border-b font-medium">Código Pedido</th>
                  <th className="text-left p-4 border-b font-medium">Código NF</th>
                  <th className="text-left p-4 border-b font-medium">Descrição</th>
                  <th className="text-left p-4 border-b font-medium">Embalagem</th>
                  <th className="text-right p-4 border-b font-medium">Comissão</th>
                  <th className="text-center p-4 border-b font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {skus.map((sku) => (
                  <tr key={sku.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-mono text-sm">{sku.order_product_code}</td>
                    <td className="p-4 font-mono text-sm">{sku.invoice_product_code}</td>
                    <td className="p-4">{sku.description}</td>
                    <td className="p-4">{sku.package}</td>
                    <td className="p-4 text-right">
                      {formatPercentage(sku.commission_percentage)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewSku(sku.id)}
                          className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditSku(sku)}
                          className="flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors text-sm"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
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
      {!isLoading && !error && totalSkus > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-card border rounded-lg">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Mostrando {page * limit + 1} - {Math.min((page + 1) * limit, totalSkus)} de{" "}
              {totalSkus} SKU
              {totalSkus !== 1 ? "s" : ""}
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

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 0}
              className="px-3 py-2 border rounded-md bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Anterior</span>
            </button>

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

      {/* SKU Detail Modal */}
      <SKUDetailModal
        skuId={selectedSkuId}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
      />

      {/* Create/Edit SKU Form Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={editingSku ? "Editar SKU" : "Novo SKU"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="order_product_code" className="text-sm font-medium">
                Código do Produto (Pedido) *
              </label>
              <input
                type="text"
                id="order_product_code"
                name="order_product_code"
                value={formData.order_product_code}
                onChange={handleFormChange}
                required
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="invoice_product_code" className="text-sm font-medium">
                Código do Produto (Nota Fiscal) *
              </label>
              <input
                type="text"
                id="invoice_product_code"
                name="invoice_product_code"
                value={formData.invoice_product_code}
                onChange={handleFormChange}
                required
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="description" className="text-sm font-medium">
                Descrição *
              </label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                required
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="package" className="text-sm font-medium">
                Embalagem *
              </label>
              <input
                type="text"
                id="package"
                name="package"
                value={formData.package}
                onChange={handleFormChange}
                required
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="commission_percentage" className="text-sm font-medium">
                Percentual de Comissão (%) *
              </label>
              <input
                type="number"
                id="commission_percentage"
                name="commission_percentage"
                value={formData.commission_percentage}
                onChange={handleFormChange}
                required
                min="0"
                max="100"
                step="0.01"
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={handleCloseFormModal}
              className="px-4 py-2 border rounded-md bg-background hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createSkuMutation.isPending || updateSkuMutation.isPending}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createSkuMutation.isPending || updateSkuMutation.isPending
                ? "Salvando..."
                : editingSku
                  ? "Atualizar"
                  : "Criar"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
