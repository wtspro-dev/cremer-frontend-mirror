"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "@/i18n/navigation";
import { CommissionPeriodsService } from "@/lib/api";
import type { CommissionPeriodResponse } from "@/lib/api";
import { formatCurrency } from "@/lib/formatters";
import { TrendingUp, Calendar, DollarSign, X } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export default function CommissionDashboard() {
  const router = useRouter();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch all commission periods
  const {
    data: periodsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["commissionPeriods"],
    queryFn: async () => {
      const response = await CommissionPeriodsService.getCommissionPeriodsV1CommissionPeriodsGet(
        null,
        null,
        0,
        100 // Get a large number to fetch all periods
      );
      return response;
    },
  });

  // Calculate current date and determine period categories
  const {
    currentPeriod,
    lastPeriod,
    futurePeriods,
    chartData,
    lastTotal,
    currentTotal,
    futureTotal,
  } = useMemo(() => {
    const periods: CommissionPeriodResponse[] =
      periodsResponse?.success && periodsResponse?.data ? periodsResponse.data : [];

    const now = new Date();

    // Sort all periods by date (oldest first)
    const sortedPeriods = [...periods].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      if (a.month !== b.month) return a.month - b.month;
      return a.day - b.day;
    });

    // Find current period: first period after today
    const current = sortedPeriods.find((p) => {
      const periodDate = new Date(p.year, p.month - 1, p.day);
      return periodDate > now;
    });

    // Find last period: most recent period before or equal to today
    const last = sortedPeriods
      .filter((p) => {
        const periodDate = new Date(p.year, p.month - 1, p.day);
        return periodDate <= now;
      })
      .slice(-1)[0]; // Get the last one (most recent)

    // Find future periods (all periods after current)
    const future: CommissionPeriodResponse[] = [];
    if (current) {
      const currentDate = new Date(current.year, current.month - 1, current.day);
      future.push(
        ...periods.filter((p) => {
          const periodDate = new Date(p.year, p.month - 1, p.day);
          return periodDate > currentDate;
        })
      );
    } else {
      // If no current period, all periods after today are future
      future.push(
        ...periods.filter((p) => {
          const periodDate = new Date(p.year, p.month - 1, p.day);
          return periodDate > now;
        })
      );
    }

    // Calculate totals
    const lastTotal = last ? last.total_commission : 0;
    const currentTotal = current ? current.total_commission : 0;
    const futureTotal = future.reduce((sum, p) => sum + p.total_commission, 0);

    // Format period labels
    const monthNames = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];

    // Get all past periods (old periods)
    const allPeriods = [...periods].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      if (a.month !== b.month) return b.month - a.month;
      return b.day - a.day;
    });

    const pastPeriods = allPeriods.filter((p) => {
      const periodDate = new Date(p.year, p.month - 1, p.day);
      return periodDate <= now;
    });

    const last12Periods = pastPeriods.slice(0, 12).reverse(); // Reverse to show oldest first

    // Get 3 immediate future periods
    const immediateFuturePeriods = future.slice(0, 3);

    // Prepare chart data with color coding
    const chartData: Array<{
      period: CommissionPeriodResponse;
      label: string;
      value: number;
      id: number;
      type: "old" | "current" | "future";
    }> = [];

    // Add old periods (last 12)
    last12Periods.forEach((period) => {
      const periodLabel = `${period.day}/${monthNames[period.month - 1]}/${period.year.toString().slice(-2)}`;
      chartData.push({
        period,
        label: periodLabel,
        value: period.total_commission,
        id: period.id,
        type: "old",
      });
    });

    // Add current period (next period)
    if (current) {
      const periodLabel = `${current.day}/${monthNames[current.month - 1]}/${current.year.toString().slice(-2)}`;
      chartData.push({
        period: current,
        label: periodLabel,
        value: current.total_commission,
        id: current.id,
        type: "current",
      });
    }

    // Add 3 immediate future periods
    immediateFuturePeriods.forEach((period) => {
      const periodLabel = `${period.day}/${monthNames[period.month - 1]}/${period.year.toString().slice(-2)}`;
      chartData.push({
        period,
        label: periodLabel,
        value: period.total_commission,
        id: period.id,
        type: "future",
      });
    });

    return {
      currentPeriod: current,
      lastPeriod: last,
      futurePeriods: future,
      chartData,
      lastTotal,
      currentTotal,
      futureTotal,
    };
  }, [periodsResponse]);

  // Handle toast auto-dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handlePeriodClick = (periodId: number, periodLabel: string) => {
    setToastMessage(`Filtrando por período: ${periodLabel}`);
    router.push(`/invoices?commission_period_id=${periodId}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="p-8 text-center text-muted-foreground">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-2" />
          <p>Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="p-8 text-center text-red-600">
          <p>Erro ao carregar dados. Tente novamente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard de Comissões</h1>
        <p className="text-muted-foreground">Visão geral das comissões por período</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Last Period */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Último recebimento
            </h3>
            <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="space-y-1">
            {lastPeriod && (
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {lastPeriod.day}/{lastPeriod.month}/{lastPeriod.year}
              </p>
            )}
            <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
              {formatCurrency(lastTotal)}
            </p>
          </div>
        </div>

        {/* Current Period */}
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-primary">Próximo recebimento</h3>
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            {currentPeriod && (
              <p className="text-xs text-primary/80">
                {currentPeriod.day}/{currentPeriod.month}/{currentPeriod.year}
              </p>
            )}
            <p className="text-3xl font-bold text-primary">{formatCurrency(currentTotal)}</p>
          </div>
        </div>

        {/* Future Periods */}
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              Recebimentos futuros
            </h3>
            <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              {futurePeriods.length} período{futurePeriods.length !== 1 ? "s" : ""}
            </p>
            <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
              {formatCurrency(futureTotal)}
            </p>
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-6">Comissões</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
            <XAxis
              dataKey="label"
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-card border rounded-lg p-3 shadow-lg">
                      <p className="font-medium mb-1">{data.label}</p>
                      <p className="text-sm text-primary">{formatCurrency(data.value)}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="value"
              onClick={(data, index) => {
                if (data && index !== undefined && chartData[index]) {
                  const chartItem = chartData[index];
                  handlePeriodClick(chartItem.id, chartItem.label);
                }
              }}
              style={{ cursor: "pointer" }}
            >
              {chartData.map((entry, index) => {
                let color: string;
                if (entry.type === "old") {
                  color = "#3b82f6"; // Blue for old periods
                } else if (entry.type === "current") {
                  color = "hsl(var(--primary))"; // Primary color for current
                } else {
                  color = "#10b981"; // Emerald green for future periods
                }
                return <Cell key={`cell-${index}`} fill={color} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "#3b82f6" }} />
            <span className="text-muted-foreground">Períodos anteriores</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary" />
            <span className="text-muted-foreground">Próximo recebimento</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "#10b981" }} />
            <span className="text-muted-foreground">Recebimentos futuros</span>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-card border border-primary/20 rounded-lg shadow-lg p-4 flex items-center gap-3 z-50 transition-all duration-300">
          <p className="text-sm">{toastMessage}</p>
          <button
            onClick={() => setToastMessage(null)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Fechar notificação"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
