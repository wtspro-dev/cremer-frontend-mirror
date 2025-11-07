"use client";

import { useState, useEffect } from "react";
import { Package } from "lucide-react";
import FileUpload from "./FileUpload";
import SKUManager from "./SKUManager";
import type { SKUCommission } from "@/types/commission";

const STORAGE_KEY = "sku_commissions";

export default function SKUManagementPage() {
  const [skuCommissions, setSkuCommissions] = useState<SKUCommission[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  // Load SKUs from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        // Convert dates if needed (currently not needed for SKUCommission)
        setSkuCommissions(data);
      } catch (error) {
        console.error("Error loading SKUs from localStorage:", error);
      }
    }
  }, []);

  const handleSKUConfigLoaded = (data: SKUCommission[]) => {
    setSkuCommissions(data);
    setErrors((prev) => prev.filter((e) => !e.includes("SKU")));
    // Save to localStorage and dispatch event
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event("sku-commissions-updated"));
  };

  const handleError = (error: string) => {
    setErrors((prev) => [...prev.filter((e) => e !== error), error]);
  };

  const handleSKUUpdate = (sku: string, commissionPercentage: number) => {
    setSkuCommissions((prev) => {
      const updated = prev.map((item) =>
        item.sku === sku ? { ...item, commissionPercentage } : item
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event("sku-commissions-updated"));
      return updated;
    });
  };

  const handleSKUDelete = (sku: string) => {
    setSkuCommissions((prev) => {
      const updated = prev.filter((item) => item.sku !== sku);
      if (updated.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
      window.dispatchEvent(new Event("sku-commissions-updated"));
      return updated;
    });
  };

  const handleSKUAdd = (sku: string, commissionPercentage: number) => {
    if (skuCommissions.some((item) => item.sku === sku)) {
      setErrors((prev) => [...prev, `SKU ${sku} já existe`]);
      return;
    }
    setSkuCommissions((prev) => {
      const updated = [...prev, { sku, commissionPercentage }];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event("sku-commissions-updated"));
      return updated;
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gerenciamento de SKUs</h1>
        <p className="text-muted-foreground">Configure e gerencie as comissões por SKU</p>
      </div>

      {/* Alertas de erro */}
      {errors.length > 0 && (
        <div className="border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-red-800 dark:text-red-200">Erros</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-300">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Upload de arquivo */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Package className="h-4 w-4" />
          <span className="text-sm font-medium">Upload de Configuração SKU</span>
        </div>
        <FileUpload
          type="sku-config"
          onSKUConfigLoaded={handleSKUConfigLoaded}
          onError={handleError}
        />
        {skuCommissions.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted p-2 text-sm font-medium">
              Amostra dos dados carregados ({skuCommissions.length} SKU
              {skuCommissions.length !== 1 ? "s" : ""})
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-2 border-b">SKU</th>
                    <th className="text-right p-2 border-b">Comissão (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {skuCommissions.slice(0, 5).map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{item.sku}</td>
                      <td className="p-2 text-right">{item.commissionPercentage.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {skuCommissions.length > 5 && (
                <div className="p-2 text-xs text-muted-foreground text-center">
                  Mostrando 5 de {skuCommissions.length} registros
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Gerenciamento de SKUs */}
      {skuCommissions.length > 0 && (
        <div className="border rounded-lg p-6">
          <SKUManager
            skus={skuCommissions}
            onUpdate={handleSKUUpdate}
            onDelete={handleSKUDelete}
            onAdd={handleSKUAdd}
          />
        </div>
      )}

      {/* Mensagem quando não há dados */}
      {skuCommissions.length === 0 && (
        <div className="border rounded-lg p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            Faça upload de um arquivo de configuração SKU para começar
          </p>
        </div>
      )}
    </div>
  );
}
