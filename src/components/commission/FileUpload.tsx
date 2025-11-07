"use client";

import { useState, useRef } from "react";
import { Upload, File, CheckCircle2, AlertCircle } from "lucide-react";
import type { FileUploadType } from "@/types/commission";
import {
  processSKUConfigFile,
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

    setStatus("idle");
    setErrorMessage("");

    if (type === "orders-pdf") {
      setUploadedFiles(files);
      clearInput();
      return;
    }

    setIsProcessing(true);
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

  const handleConfirmOrdersUpload = async () => {
    if (type !== "orders-pdf" || uploadedFiles.length === 0) return;

    setIsProcessing(true);
    setStatus("idle");
    setErrorMessage("");

    let uploadSuccess = false;

    try {
      const formData = {
        files: uploadedFiles,
      };

      const response = await OrdersService.uploadOrdersV1OrdersUploadPost(formData);

      if (response.success && response.data) {
        uploadSuccess = true;
        setStatus("success");
        onOrdersLoaded?.([], undefined, undefined);
        setUploadedFiles([]);
      } else {
        const errorMsg = "Erro ao fazer upload do arquivo";
        setErrorMessage(errorMsg);
        setStatus("error");
        onError?.(errorMsg);
      }
    } catch (apiError: unknown) {
      const errorMsg =
        apiError instanceof Error
          ? apiError.message
          : "Erro ao fazer upload do arquivo. Tente novamente.";
      setErrorMessage(errorMsg);
      setStatus("error");
      onError?.(errorMsg);
    } finally {
      setIsProcessing(false);
      clearInput();
      if (uploadSuccess) {
        setTimeout(() => {
          setStatus("idle");
          setErrorMessage("");
        }, 2000);
      }
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
      ) : type === "orders-pdf" ? (
        isProcessing ? (
          <div className="border rounded-lg p-6 text-center flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">
              Processando {uploadedFiles.length} arquivos
              {uploadedFiles.length !== 1 ? "s" : ""}...
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
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
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2">
              <button
                onClick={handleRemove}
                className="px-3 py-2 border rounded-md text-sm text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
              >
                Limpar
              </button>
              <button
                onClick={handleConfirmOrdersUpload}
                disabled={uploadedFiles.length === 0}
                className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar envio
              </button>
            </div>
          </div>
        )
      ) : (
        <div className="space-y-2">
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
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
          </div>
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
