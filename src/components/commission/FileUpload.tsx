"use client";

import { useState, useRef } from "react";
import { Upload, File, CheckCircle2, AlertCircle } from "lucide-react";
import type { FileUploadType } from "@/types/commission";
import {
  processSKUConfigFile,
  processOrdersPDF,
  processDeliveryDatesFile,
  type ParsedOrderItem,
} from "@/lib/file-processors";
import type { SKUCommission, Order, DeliveryDate } from "@/types/commission";
import { OrdersService } from "@/lib/api";

interface FileUploadProps {
  type: FileUploadType;
  onSKUConfigLoaded?: (data: SKUCommission[], file?: File) => void;
  onOrdersLoaded?: (data: Order[], parsedItems?: ParsedOrderItem[], file?: File) => void;
  onDeliveryDatesLoaded?: (data: DeliveryDate[], file?: File) => void;
  onError?: (error: string) => void;
}

/**
 * Transforma ParsedOrderItem[] em Order[] agrupando itens por pedido
 */
function transformParsedItemsToOrders(parsedItems: ParsedOrderItem[]): Order[] {
  const orderMap = new Map<string, Order>();

  parsedItems.forEach((item) => {
    const orderId = item.n_order;

    if (!orderMap.has(orderId)) {
      orderMap.set(orderId, {
        id: orderId,
        date: item.dt_order,
        items: [],
        totalValue: 0,
      });
    }

    const order = orderMap.get(orderId)!;
    const totalValue = item.unit_value * item.qty;

    order.items.push({
      sku: item.code,
      quantity: item.qty,
      price: item.unit_value,
      totalValue,
    });

    order.totalValue += totalValue;
  });

  return Array.from(orderMap.values());
}

const fileTypeLabels: Record<FileUploadType, { label: string; accept: string }> = {
  "sku-config": {
    label: "Configuração de Comissão SKU (Excel)",
    accept: ".xlsx,.xls",
  },
  "orders-pdf": {
    label: "Pedidos (PDF)",
    accept: ".pdf",
  },
  "delivery-dates": {
    label: "Datas de Entrega (Excel)",
    accept: ".xlsx,.xls",
  },
};

export default function FileUpload({
  type,
  onSKUConfigLoaded,
  onOrdersLoaded,
  onDeliveryDatesLoaded,
  onError,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = fileTypeLabels[type];

  const clearInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFiles = async (files: File[]) => {
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setStatus("idle");
    setErrorMessage("");
    setUploadedFiles(files);

    try {
      switch (type) {
        case "sku-config": {
          // Process each file individually
          for (const file of files) {
            const data = await processSKUConfigFile(file);
            onSKUConfigLoaded?.(data, file);
          }
          setStatus("success");
          break;
        }
        case "orders-pdf": {
          try {
            // Upload all files to API at once
            const formData = {
              files: files,
            };

            const response = await OrdersService.uploadOrdersV1OrdersUploadPost(formData);

            if (response.success && response.data) {
              // Successfully uploaded to API
              // Still process locally for UI purposes if needed
              for (const file of files) {
                const parsedData = await processOrdersPDF(file);
                const orders = transformParsedItemsToOrders(parsedData);
                onOrdersLoaded?.(orders, parsedData, file);
              }
              setStatus("success");
            } else {
              // API returned an error in response
              const errorMsg = "Erro ao fazer upload do arquivo";
              setErrorMessage(errorMsg);
              setStatus("error");
              onError?.(errorMsg);
            }
          } catch (apiError: unknown) {
            // Handle API exceptions (network errors, etc.)
            const errorMsg =
              apiError instanceof Error
                ? apiError.message
                : "Erro ao fazer upload do arquivo. Tente novamente.";
            setErrorMessage(errorMsg);
            setStatus("error");
            onError?.(errorMsg);
          }
          break;
        }
        case "delivery-dates": {
          // Process each file individually
          for (const file of files) {
            const data = await processDeliveryDatesFile(file);
            onDeliveryDatesLoaded?.(data, file);
          }
          setStatus("success");
          break;
        }
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido ao processar arquivo";
      setErrorMessage(message);
      setStatus("error");
      onError?.(message);
    } finally {
      setIsProcessing(false);
      // Clear input after success or failure
      clearInput();
      // Clear uploaded files after a short delay to show status
      setTimeout(() => {
        setUploadedFiles([]);
        setStatus("idle");
        setErrorMessage("");
      }, 2000);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) handleFiles(files);
  };

  const handleRemove = () => {
    setUploadedFiles([]);
    setStatus("idle");
    setErrorMessage("");
    clearInput();
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium mb-2">{config.label}</label>

      {uploadedFiles.length === 0 ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-3 text-center cursor-pointer
            transition-colors
            ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
            ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={config.accept}
            onChange={handleFileInput}
            disabled={isProcessing}
            multiple
            className="hidden"
            id={`file-upload-${type}`}
          />
          <label htmlFor={`file-upload-${type}`} className="cursor-pointer">
            <Upload className="mx-auto h-4 w-4 text-muted-foreground mb-1" />
            <p className="text-sm text-muted-foreground">
              Clique para selecionar ou arraste os arquivos aqui
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {config.accept} (múltiplos arquivos permitidos)
            </p>
          </label>
        </div>
      ) : (
        <div className="space-y-2">
          {uploadedFiles.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="border rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <File className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {status === "success" && index === uploadedFiles.length - 1 && (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
                {status === "error" && index === uploadedFiles.length - 1 && (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                {isProcessing && index === uploadedFiles.length - 1 && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                )}
              </div>
            </div>
          ))}
          {!isProcessing && (
            <button
              onClick={handleRemove}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Limpar
            </button>
          )}
        </div>
      )}

      {status === "error" && errorMessage && (
        <div className="mt-2 text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          {errorMessage}
        </div>
      )}
    </div>
  );
}
