import { AuthService } from "./api/services/AuthService";
import { OpenAPI } from "./api/core/OpenAPI";

const AUTH_TOKEN_KEY = "auth_token";

/**
 * Retrieve the authentication token from localStorage
 * @returns The auth token string or null if not found
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * Store the authentication token in localStorage
 * @param token The auth token to store
 */
export function setAuthToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

/**
 * Remove the authentication token from localStorage
 */
export function clearAuthToken(): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

/**
 * Check if the user is authenticated by verifying token exists and API endpoint returns 200
 * @returns Promise<boolean> - true if authenticated (token exists and API returns 200), false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  // First check if token exists
  const token = getAuthToken();
  if (!token) {
    return false;
  }

  // Ensure OpenAPI token is set
  if (OpenAPI.TOKEN !== token) {
    OpenAPI.TOKEN = token;
  }

  try {
    // Call the API endpoint to verify authentication
    const response = await AuthService.getCurrentUserInfoV1AuthMeGet();
    // Return true if we get a successful response (200 status)
    return response.success === true;
  } catch {
    // If API call fails (e.g., 401, network error), user is not authenticated
    return false;
  }
}
