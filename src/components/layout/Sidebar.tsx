"use client";

import { useState } from "react";
import { usePathname } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import {
  Home,
  Package,
  FolderOpen,
  ShoppingCart,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const menuItems: SidebarItem[] = [
  {
    href: "/",
    label: "Principal",
    icon: Home,
  },
  {
    href: "/invoices",
    label: "Notas Fiscais",
    icon: FileText,
  },
  {
    href: "/orders",
    label: "Pedidos",
    icon: ShoppingCart,
  },
  {
    href: "/file-batches",
    label: "Arquivos",
    icon: FolderOpen,
  },
  {
    href: "/sku-management",
    label: "Produtos",
    icon: Package,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div
      className={cn(
        "border-r bg-background h-screen sticky top-0 flex flex-col transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="p-6 border-b flex items-center justify-end">
        <button
          onClick={toggleCollapse}
          className={cn(
            "p-1.5 rounded-md hover:bg-muted transition-colors",
            isCollapsed && "mx-auto"
          )}
          aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                "w-full flex items-center rounded-lg text-left transition-colors",
                isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="font-medium">{item.label}</span>}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
