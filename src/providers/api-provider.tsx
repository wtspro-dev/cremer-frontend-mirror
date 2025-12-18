"use client";

import { useEffect } from "react";
import { OpenAPI } from "@/lib/api/core/OpenAPI";
import { getAuthToken } from "@/lib/auth";

// Environment configuration for API client
const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050",
} as const;

interface ApiProviderProps {
  children: React.ReactNode;
}

export function ApiProvider({ children }: ApiProviderProps) {
  OpenAPI.BASE = API_CONFIG.BASE_URL;
  useEffect(() => {
    // Configure OpenAPI base URL from environment variable
    OpenAPI.BASE = API_CONFIG.BASE_URL;

    // Load token from localStorage and set it
    const token = getAuthToken();
    if (token) {
      OpenAPI.TOKEN = token;
    }

    // Listen for storage events to sync token across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "auth_token") {
        if (e.newValue) {
          OpenAPI.TOKEN = e.newValue;
        } else {
          OpenAPI.TOKEN = undefined;
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return <>{children}</>;
}
