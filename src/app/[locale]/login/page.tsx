"use client";

import { GoogleCredentialResponse, GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/hooks/use-auth";
import { useParams } from "next/navigation";

export default function LoginPage() {
  const { login, isLoading, error } = useAuth();
  const params = useParams();
  const locale = params.locale as string;

  const handleGoogleSuccess = async (credentialResponse: GoogleCredentialResponse) => {
    if (credentialResponse.credential) {
      try {
        await login(credentialResponse.credential);
      } catch (err) {
        // Error is handled by useAuth hook
        console.error("Login error:", err);
      }
    }
  };

  const handleGoogleError = () => {
    console.error("Google OAuth error");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {locale === "pt" ? "Entrar" : "Sign In"}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {locale === "pt"
              ? "Faça login com sua conta Google"
              : "Sign in with your Google account"}
          </p>
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap={false}
          />
        </div>

        {isLoading && (
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            {locale === "pt" ? "Autenticando..." : "Authenticating..."}
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
