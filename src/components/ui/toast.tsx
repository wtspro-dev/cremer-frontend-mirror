"use client";

import React, { createContext, useCallback, useContext, useId, useState } from "react";
import { X } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ToastType = "error" | "success" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  description: React.ReactNode;
}

interface ToastContextValue {
  addToast: (toast: Omit<ToastItem, "id">) => void;
  removeToast: (id: string) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((toast: Omit<ToastItem, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [{ ...toast, id }, ...prev]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");

  const { addToast, removeToast } = ctx;

  const error = useCallback(
    (title: string, description: React.ReactNode) => {
      addToast({ type: "error", title, description });
    },
    [addToast]
  );

  const success = useCallback(
    (title: string, description: React.ReactNode) => {
      addToast({ type: "success", title, description });
    },
    [addToast]
  );

  const info = useCallback(
    (title: string, description: React.ReactNode) => {
      addToast({ type: "info", title, description });
    },
    [addToast]
  );

  return { error, success, info, removeToast };
}

// ─── UI ──────────────────────────────────────────────────────────────────────

const typeStyles: Record<ToastType, string> = {
  error:
    "border-red-300 bg-red-50 text-red-900 dark:border-red-700 dark:bg-red-950 dark:text-red-100",
  success:
    "border-green-300 bg-green-50 text-green-900 dark:border-green-700 dark:bg-green-950 dark:text-green-100",
  info: "border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-100",
};

const titleStyles: Record<ToastType, string> = {
  error: "text-red-800 dark:text-red-200",
  success: "text-green-800 dark:text-green-200",
  info: "text-blue-800 dark:text-blue-200",
};

function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="assertive"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastCard({ toast, onRemove }: { toast: ToastItem; onRemove: (id: string) => void }) {
  return (
    <div
      role="alert"
      className={`pointer-events-auto w-full rounded-lg border p-4 shadow-md flex gap-3 items-start ${typeStyles[toast.type]}`}
    >
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className={`text-sm font-semibold mb-1 ${titleStyles[toast.type]}`}>{toast.title}</p>
        )}
        <div className="text-sm">{toast.description}</div>
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        aria-label="Fechar notificação"
        className="shrink-0 rounded p-0.5 opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-current"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
