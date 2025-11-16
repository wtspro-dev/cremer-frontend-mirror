"use client";

import { usePathname } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { Home, Package, FolderOpen, ShoppingCart, FileText } from "lucide-react";
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
    href: "/orders",
    label: "Pedidos",
    icon: ShoppingCart,
  },
  {
    href: "/invoices",
    label: "Notas Fiscais",
    icon: FileText,
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

  return (
    <div className="w-64 border-r bg-background h-screen sticky top-0 flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold">Comissões Cremer</h1>
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
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
