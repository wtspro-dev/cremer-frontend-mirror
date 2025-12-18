"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { ApiError } from "@/lib/api/core/ApiError";
import { clearAuthToken } from "@/lib/auth";
import { OpenAPI } from "@/lib/api/core/OpenAPI";

export default function QueryProvider({ children }: { children: ReactNode }) {
  // Create client once per mount with global error handlers
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            throwOnError: (error) => {
              handle401Error(error);
              return true;
            },
          },
          mutations: {
            onError: (error) => {
              handle401Error(error);
            },
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

/**
 * Handle 401 Unauthorized errors by clearing token and redirecting to login
 */
function handle401Error(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    // Clear token from localStorage
    clearAuthToken();
    // Clear OpenAPI token
    OpenAPI.TOKEN = undefined;

    // Extract locale from current pathname or use default
    const pathname = window.location.pathname;
    const locale = pathname.split("/")[1] || "pt";

    // Redirect to login page
    window.location.href = `/${locale}/login`;
  }
}
