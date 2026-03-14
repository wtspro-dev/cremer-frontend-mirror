"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
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
  LogOut,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { BRAZIL_STATES, type BrazilState } from "@/data/brazil-states";

function normalizeForSearch(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function filterStates(states: BrazilState[], query: string): BrazilState[] {
  if (!query.trim()) return states;
  const normalized = normalizeForSearch(query);
  return states.filter(
    (state) =>
      normalizeForSearch(state.name).includes(normalized) ||
      normalizeForSearch(state.sigla).includes(normalized)
  );
}

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
  const searchParams = useSearchParams();
  const router = useRouter();
  const { logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const selectedStateSigla = searchParams.get("state") ?? "";
  const selectedState = BRAZIL_STATES.find((s) => s.sigla === selectedStateSigla);
  const selectedStateDisplay = selectedState?.name ?? "Todos os estados";

  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filteredStates = filterStates(BRAZIL_STATES, inputValue);
  const showList = isOpen && (inputValue.trim() === "" || filteredStates.length > 0);

  const handleStateSelect = useCallback(
    (sigla: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (sigla && sigla !== "all") {
        params.set("state", sigla);
      } else {
        params.delete("state");
      }
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
      setInputValue("");
      setIsOpen(false);
      setHighlightedIndex(-1);
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
        setInputValue("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!showList) return;
    const childIndex = highlightedIndex + 1;
    listRef.current?.children[childIndex]?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex, showList]);

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
      <div className={cn("px-4 pb-4 border-b", isCollapsed ? "flex justify-center" : "space-y-2")}>
        <label htmlFor="state-filter" className="sr-only">
          Estado
        </label>
        <div ref={containerRef} className="relative">
          <div
            className={cn(
              "w-full rounded-lg border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 flex items-center gap-1",
              isCollapsed && "px-2"
            )}
          >
            <input
              id="state-filter"
              type="text"
              role="combobox"
              aria-label="Filtrar por estado"
              aria-expanded={isOpen}
              aria-autocomplete="list"
              aria-controls="state-filter-list"
              aria-activedescendant={
                showList && highlightedIndex === -1
                  ? "state-option-all"
                  : showList && highlightedIndex >= 0 && highlightedIndex < filteredStates.length
                    ? `state-option-${filteredStates[highlightedIndex].sigla}`
                    : undefined
              }
              value={isOpen ? inputValue : selectedStateDisplay}
              onChange={(e) => {
                setInputValue(e.target.value);
                setIsOpen(true);
                setHighlightedIndex(0);
              }}
              onFocus={() => {
                setIsOpen(true);
                setInputValue("");
                setHighlightedIndex(-1);
              }}
              onKeyDown={(e) => {
                if (!showList) {
                  if (e.key === "ArrowDown" || e.key === "Enter") {
                    e.preventDefault();
                    setIsOpen(true);
                    setHighlightedIndex(-1);
                  }
                  return;
                }
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setHighlightedIndex((i) => (i < filteredStates.length - 1 ? i + 1 : i));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setHighlightedIndex((i) => (i > -1 ? i - 1 : -1));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  if (highlightedIndex === -1) {
                    handleStateSelect("");
                  } else if (highlightedIndex >= 0 && highlightedIndex < filteredStates.length) {
                    handleStateSelect(filteredStates[highlightedIndex].sigla);
                  }
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  setIsOpen(false);
                  setHighlightedIndex(-1);
                  setInputValue("");
                }
              }}
              className={cn(
                "flex-1 min-w-0 rounded-lg bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground",
                isCollapsed && "px-2"
              )}
              placeholder="Buscar estado..."
              title={isCollapsed ? selectedStateDisplay : undefined}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setIsOpen((open) => !open)}
              className="shrink-0 p-1.5 text-muted-foreground hover:text-foreground rounded"
              aria-label={isOpen ? "Fechar lista" : "Abrir lista"}
            >
              <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
            </button>
          </div>
          {showList && (
            <ul
              id="state-filter-list"
              ref={listRef}
              role="listbox"
              className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-input bg-background py-1 text-sm shadow-lg"
            >
              <li
                role="option"
                id="state-option-all"
                aria-selected={!selectedStateSigla}
                className={cn(
                  "cursor-pointer px-3 py-2 hover:bg-muted",
                  highlightedIndex === -1 && "bg-muted"
                )}
                onClick={() => handleStateSelect("")}
                onMouseEnter={() => setHighlightedIndex(-1)}
              >
                Todos os estados
              </li>
              {filteredStates.map((state, index) => (
                <li
                  key={state.sigla}
                  role="option"
                  id={`state-option-${state.sigla}`}
                  aria-selected={selectedStateSigla === state.sigla}
                  className={cn(
                    "cursor-pointer px-3 py-2 hover:bg-muted",
                    highlightedIndex === index && "bg-muted"
                  )}
                  onClick={() => handleStateSelect(state.sigla)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {state.name} ({state.sigla})
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => {
                const query = searchParams.toString();
                router.push(query ? `${item.href}?${query}` : item.href);
              }}
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
      <div className="p-4 border-t">
        <button
          onClick={logout}
          className={cn(
            "w-full flex items-center rounded-lg text-left transition-colors",
            isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3",
            "hover:bg-muted text-muted-foreground hover:text-foreground"
          )}
          title={isCollapsed ? "Sair" : undefined}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span className="font-medium">Sair</span>}
        </button>
      </div>
    </div>
  );
}
