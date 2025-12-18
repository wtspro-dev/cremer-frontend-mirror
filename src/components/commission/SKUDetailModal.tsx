"use client";

import type { SkuResponse } from "@/lib/api";
import { useSku } from "@/hooks/use-skus";
import Modal from "@/components/ui/Modal";
import { formatDateTime, formatPercentage } from "@/lib/formatters";

interface SKUDetailModalProps {
  skuId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function SKUDetailModal({ skuId, isOpen, onClose }: SKUDetailModalProps) {
  // Fetch SKU details when modal is open
  const { data: skuDetailResponse, isLoading: isLoadingSkuDetail } = useSku(
    skuId,
    !!skuId && isOpen
  );

  const skuDetail: SkuResponse | null =
    skuDetailResponse?.success && skuDetailResponse?.data ? skuDetailResponse.data : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`SKU ${skuDetail?.order_product_code || skuId || ""}`}
      size="lg"
    >
      {isLoadingSkuDetail ? (
        <div className="p-8 text-center text-muted-foreground">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-2" />
          <p>Carregando detalhes do SKU...</p>
        </div>
      ) : skuDetail ? (
        <div className="space-y-6">
          {/* SKU Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Código do Produto (Pedido)
              </label>
              <p className="text-base font-semibold font-mono">{skuDetail.order_product_code}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Código do Produto (Nota Fiscal)
              </label>
              <p className="text-base font-semibold font-mono">{skuDetail.invoice_product_code}</p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-muted-foreground">Descrição</label>
              <p className="text-base">{skuDetail.description}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Embalagem</label>
              <p className="text-base">{skuDetail.package}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Percentual de Comissão
              </label>
              <p className="text-base font-semibold">
                {formatPercentage(skuDetail.commission_percentage)}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Criado em</label>
              <p className="text-base text-sm">{formatDateTime(skuDetail.created)}</p>
            </div>
            {skuDetail.updated && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Atualizado em</label>
                <p className="text-base text-sm">{formatDateTime(skuDetail.updated)}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-red-600">
          <p>Erro ao carregar detalhes do SKU. Tente novamente.</p>
        </div>
      )}
    </Modal>
  );
}
