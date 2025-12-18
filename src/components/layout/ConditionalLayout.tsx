"use client";

import { usePathname } from "@/i18n/navigation";
import MainLayout from "./MainLayout";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();

  // Don't show MainLayout (with sidebar) on login page
  if (pathname?.endsWith("/login") || pathname === "/login") {
    return <>{children}</>;
  }

  return <MainLayout>{children}</MainLayout>;
}
