"use client";

import { useState, useMemo } from "react";
import { Calendar, TrendingUp, Package, DollarSign, Eye } from "lucide-react";
import Modal from "@/components/ui/Modal";
import type { CommissionSummary, CommissionItem } from "@/types/commission";
import { groupCommissionsByPeriod, filterCommissionsByPeriod } from "@/lib/commission-calculator";

interface CommissionVisualizationProps {
  commissionItems: CommissionItem[];
  onPeriodSelect?: (period: CommissionSummary | null) => void;
}

export default function CommissionVisualization({
  commissionItems,
  onPeriodSelect,
}: CommissionVisualizationProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<CommissionSummary | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const summaries = useMemo(() => {
    return groupCommissionsByPeriod(commissionItems);
  }, [commissionItems]);

  const filteredItems = useMemo(() => {
    if (!selectedPeriod) return [];
    return filterCommissionsByPeriod(commissionItems, selectedPeriod.period).filter(
      (item) =>
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.orderId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [commissionItems, selectedPeriod, searchTerm]);

  const handlePeriodClick = (summary: CommissionSummary) => {
    const newSelection = selectedPeriod?.period.label === summary.period.label ? null : summary;
    setSelectedPeriod(newSelection);
    onPeriodSelect?.(newSelection || null);
  };

  const totalCommission = summaries.reduce((sum, s) => sum + s.totalCommission, 0);
  const totalItems = commissionItems.length;

  return (
    <div className="space-y-6">
      {/* Resumo geral */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm">Comissão Total</span>
          </div>
          <p className="text-2xl font-bold">
            R${" "}
            {totalCommission.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Package className="h-4 w-4" />
            <span className="text-sm">Total de Itens</span>
          </div>
          <p className="text-2xl font-bold">{totalItems}</p>
        </div>
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">Períodos</span>
          </div>
          <p className="text-2xl font-bold">{summaries.length}</p>
        </div>
      </div>

      {/* Períodos */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Projeções por Período
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {summaries.map((summary) => {
            const isSelected = selectedPeriod?.period.label === summary.period.label;
            return (
              <button
                key={summary.period.label}
                onClick={() => handlePeriodClick(summary)}
                className={`
                  border rounded-lg p-4 text-left transition-all
                  ${isSelected ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "hover:border-primary/50"}
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{summary.period.label}</h4>
                  <span className="text-xs text-muted-foreground">
                    {summary.items.length} item{summary.items.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <p className="text-2xl font-bold text-primary">
                  R${" "}
                  {summary.totalCommission.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary.period.periodStart.toLocaleDateString("pt-BR")} -{" "}
                  {summary.period.periodEnd.toLocaleDateString("pt-BR")}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detalhes do período selecionado */}
      {selectedPeriod && (
        <div className="border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Detalhes - {selectedPeriod.period.label}</h3>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <Eye className="h-4 w-4" />
              <span>Ver Detalhes</span>
            </button>
          </div>

          {/* Modal with Table */}
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={`Detalhes - ${selectedPeriod.period.label}`}
            size="xl"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Buscar por SKU ou Pedido..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm flex-1"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Pedido</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Data Pedido</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Data Entrega</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Data Pagamento</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">SKU</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Valor Item</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Comissão %</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Comissão</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                          {searchTerm ? "Nenhum item encontrado" : "Nenhum item para este período"}
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((item, index) => (
                        <tr
                          key={`${item.orderId}-${item.sku}-${index}`}
                          className="border-t hover:bg-muted/50"
                        >
                          <td className="px-4 py-3 font-medium">{item.orderId}</td>
                          <td className="px-4 py-3">
                            {item.orderDate.toLocaleDateString("pt-BR")}
                          </td>
                          <td className="px-4 py-3">
                            {item.deliveryDate.toLocaleDateString("pt-BR")}
                          </td>
                          <td className="px-4 py-3">
                            {item.paymentDate.toLocaleDateString("pt-BR")}
                          </td>
                          <td className="px-4 py-3">{item.sku}</td>
                          <td className="px-4 py-3 text-right">
                            R${" "}
                            {item.itemValue.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {item.commissionPercentage.toFixed(2)}%
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">
                            R${" "}
                            {item.commissionAmount.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {filteredItems.length > 0 && (
                    <tfoot className="bg-muted font-semibold">
                      <tr>
                        <td colSpan={7} className="px-4 py-3 text-right">
                          Total:
                        </td>
                        <td className="px-4 py-3 text-right">
                          R${" "}
                          {selectedPeriod.totalCommission.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </Modal>
        </div>
      )}
    </div>
  );
}
