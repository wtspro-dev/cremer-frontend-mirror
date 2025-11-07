"use client";

import { useState } from "react";
import { Edit2, Trash2, Plus, Search } from "lucide-react";
import type { SKUCommission } from "@/types/commission";

interface SKUManagerProps {
  skus: SKUCommission[];
  onUpdate: (sku: string, commissionPercentage: number) => void;
  onDelete: (sku: string) => void;
  onAdd: (sku: string, commissionPercentage: number) => void;
}

export default function SKUManager({ skus, onUpdate, onDelete, onAdd }: SKUManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingSku, setEditingSku] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [newSku, setNewSku] = useState({ sku: "", commissionPercentage: 0 });

  const filteredSKUs = skus.filter((item) =>
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (item: SKUCommission) => {
    setEditingSku(item.sku);
    setEditValue(item.commissionPercentage);
  };

  const handleSave = (sku: string) => {
    onUpdate(sku, editValue);
    setEditingSku(null);
    setEditValue(0);
  };

  const handleCancel = () => {
    setEditingSku(null);
    setEditValue(0);
  };

  const handleAdd = () => {
    if (newSku.sku && newSku.commissionPercentage > 0) {
      onAdd(newSku.sku, newSku.commissionPercentage);
      setNewSku({ sku: "", commissionPercentage: 0 });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Gerenciar SKUs e Comissões</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-4 py-2 border rounded-md text-sm"
            />
          </div>
        </div>
      </div>

      {/* Adicionar novo SKU */}
      <div className="border rounded-lg p-4 bg-muted/30">
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Novo SKU
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Código SKU"
            value={newSku.sku}
            onChange={(e) => setNewSku({ ...newSku, sku: e.target.value.toUpperCase() })}
            className="px-3 py-2 border rounded-md text-sm"
          />
          <div className="flex gap-2">
            <input
              type="number"
              step="0.1"
              placeholder="Comissão %"
              value={newSku.commissionPercentage || ""}
              onChange={(e) =>
                setNewSku({ ...newSku, commissionPercentage: parseFloat(e.target.value) || 0 })
              }
              className="px-3 py-2 border rounded-md text-sm flex-1"
            />
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
            >
              Adicionar
            </button>
          </div>
        </div>
      </div>

      {/* Lista de SKUs */}
      <div className="border rounded-lg overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-muted sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">SKU</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Comissão (%)</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredSKUs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                    {searchTerm ? "Nenhum SKU encontrado" : "Nenhum SKU cadastrado"}
                  </td>
                </tr>
              ) : (
                filteredSKUs.map((item) => (
                  <tr key={item.sku} className="border-t hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium">{item.sku}</td>
                    <td className="px-4 py-3">
                      {editingSku === item.sku ? (
                        <input
                          type="number"
                          step="0.1"
                          value={editValue}
                          onChange={(e) => setEditValue(parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 border rounded text-sm"
                          autoFocus
                        />
                      ) : (
                        <span>{item.commissionPercentage.toFixed(2)}%</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {editingSku === item.sku ? (
                          <>
                            <button
                              onClick={() => handleSave(item.sku)}
                              className="text-green-600 hover:text-green-700 text-sm"
                            >
                              Salvar
                            </button>
                            <button
                              onClick={handleCancel}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(item)}
                              className="text-primary hover:text-primary/80"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => onDelete(item.sku)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Total: {skus.length} SKU{skus.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
