"use client";

import { useState, useCallback, useEffect } from "react";
import { AuthService } from "@/lib/api/services/AuthService";
import { OpenAPI } from "@/lib/api/core/OpenAPI";
import { ApiError } from "@/lib/api/core/ApiError";
import { setAuthToken, clearAuthToken, isAuthenticated } from "@/lib/auth";
import { useRouter } from "@/i18n/navigation";

export function useAuth() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState<boolean>(false);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const authStatus = await isAuthenticated();
      setAuthenticated(authStatus);
    };
    checkAuth();
  }, []);

  /**
   * Login with Google token
   * Exchanges Google OAuth token for backend auth token
   */
  const login = useCallback(
    async (googleToken: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await AuthService.authenticateGoogleV1AuthGooglePost({
          token: googleToken,
        });

        if (response.success && response.data) {
          // Update OpenAPI token
          OpenAPI.TOKEN = response.data.access_token;
          // Store the auth token
          setAuthToken(response.data.access_token);
          // Update authenticated state
          setAuthenticated(true);

          // Redirect to home page (pathname already includes locale)
          router.push("/");
        } else {
          setError(
            response.error ? `Authentication failed: ${response.error}` : "Authentication failed"
          );
        }
      } catch (err) {
        const errorMessage =
          err instanceof ApiError
            ? err.body?.error || err.message || "Authentication failed"
            : err instanceof Error
              ? err.message
              : "Authentication failed";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  /**
   * Logout - clear token and redirect to login
   */
  const logout = useCallback(() => {
    clearAuthToken();
    OpenAPI.TOKEN = undefined;
    setAuthenticated(false);
    router.push("/login");
  }, [router]);

  return {
    isAuthenticated: authenticated,
    isLoading,
    error,
    login,
    logout,
  };
}
