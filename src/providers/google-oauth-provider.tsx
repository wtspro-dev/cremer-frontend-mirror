"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { ReactNode } from "react";

interface GoogleOAuthProviderProps {
  children: ReactNode;
}

export function GoogleOAuthProviderWrapper({ children }: GoogleOAuthProviderProps) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    console.warn("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set. Google OAuth will not work.");
    return <>{children}</>;
  }

  return <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>;
}
