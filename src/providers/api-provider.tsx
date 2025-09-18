"use client";

import { useEffect } from "react";
import { OpenAPI } from "@/lib/api/core/OpenAPI";

// Environment configuration for API client
const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050",
} as const;

interface ApiProviderProps {
  children: React.ReactNode;
}

export function ApiProvider({ children }: ApiProviderProps) {
  useEffect(() => {
    // Configure OpenAPI base URL from environment variable
    OpenAPI.BASE = API_CONFIG.BASE_URL;
  }, []);

  return <>{children}</>;
}
