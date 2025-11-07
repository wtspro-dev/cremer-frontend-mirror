import type { Metadata } from "next";
import "../globals.css";
import QueryProvider from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { ApiProvider } from "@/providers/api-provider";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";

export const metadata: Metadata = {
  title: "Comissão de Vendas Cremer",
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
        <ApiProvider>
          <QueryProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              disableTransitionOnChange
            >
              <NextIntlClientProvider>
                <MainLayout>{children}</MainLayout>
              </NextIntlClientProvider>
            </ThemeProvider>
          </QueryProvider>
        </ApiProvider>
      </body>
    </html>
  );
}
