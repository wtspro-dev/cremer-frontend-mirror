import type { Metadata } from "next";
import "../globals.css";
import QueryProvider from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { ApiProvider } from "@/providers/api-provider";
import { GoogleOAuthProviderWrapper } from "@/providers/google-oauth-provider";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";
import ConditionalLayout from "@/components/layout/ConditionalLayout";

export const metadata: Metadata = {
  title: "Dashboard de Comissão de Vendas",
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html suppressHydrationWarning>
      <body>
        <NextIntlClientProvider>
          <AuthGuard>
            <ApiProvider>
              <QueryProvider>
                <GoogleOAuthProviderWrapper>
                  <ThemeProvider
                    attribute="class"
                    defaultTheme="light"
                    enableSystem
                    disableTransitionOnChange
                  >
                    <ConditionalLayout>{children}</ConditionalLayout>
                  </ThemeProvider>
                </GoogleOAuthProviderWrapper>
              </QueryProvider>
            </ApiProvider>
          </AuthGuard>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
