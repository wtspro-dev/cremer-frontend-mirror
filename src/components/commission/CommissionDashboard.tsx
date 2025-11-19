"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "@/i18n/navigation";
import {
  CommissionPeriodsService,
  InvoiceDeliveryState,
  InvoicesService,
  OrdersService,
  OrderBillingStatus,
} from "@/lib/api";
import type { CommissionPeriodResponse } from "@/lib/api";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { TrendingUp, Calendar, DollarSign, AlertCircle, ShoppingCart } from "lucide-react";
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

  // Fetch unscheduled invoices
  const { data: unscheduledInvoicesResponse } = useQuery({
    queryKey: ["unscheduledInvoices"],
    queryFn: async () => {
      const response = await InvoicesService.getInvoicesV1InvoicesGet(
        null,
        null,
        null,
        null,
        null,
        null,
        InvoiceDeliveryState.UNSCHEDULED,
        0,
        100 // Get a large number to calculate total
      );
      return response;
    },
  });

  // Calculate total commission value of unscheduled invoices
  const unscheduledTotal = useMemo(() => {
    if (unscheduledInvoicesResponse?.success && unscheduledInvoicesResponse?.data) {
      return unscheduledInvoicesResponse.data.reduce(
        (sum, invoice) => sum + invoice.commission_value,
        0
      );
    }
    return 0;
  }, [unscheduledInvoicesResponse]);

  // Fetch fully billed orders
  const { data: fullyBilledOrdersResponse } = useQuery({
    queryKey: ["fullyBilledOrders"],
    queryFn: async () => {
      const response = await OrdersService.getOrdersV1OrdersGet(
        null,
        null,
        null,
        null,
        OrderBillingStatus.FULLY_BILLED,
        0,
        1 // Only need the total, so limit to 1
      );
      return response;
    },
  });

  // Fetch not fully billed orders
  const { data: notFullyBilledOrdersResponse } = useQuery({
    queryKey: ["notFullyBilledOrders"],
    queryFn: async () => {
      const response = await OrdersService.getOrdersV1OrdersGet(
        null,
        null,
        null,
        null,
        OrderBillingStatus.NOT_FULLY_BILLED,
        0,
        1 // Only need the total, so limit to 1
      );
      return response;
    },
  });

  const fullyBilledCount = fullyBilledOrdersResponse?.total ?? 0;
  const notFullyBilledCount = notFullyBilledOrdersResponse?.total ?? 0;

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

  const handlePeriodClick = (periodId: number) => {
    router.push(`/invoices?commission_period_id=${periodId}`);
  };

  const handleLastPeriodClick = () => {
    if (lastPeriod) {
      router.push(`/invoices?commission_period_id=${lastPeriod.id}`);
    }
  };

  const handleCurrentPeriodClick = () => {
    if (currentPeriod) {
      router.push(`/invoices?commission_period_id=${currentPeriod.id}`);
    }
  };

  const handleFuturePeriodsClick = () => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0]; // Format: YYYY-MM-DD
    router.push(
      `/invoices?commission_date_start=${todayStr}&delivery_state=${InvoiceDeliveryState.SCHEDULED}`
    );
  };

  const handleUnscheduledClick = () => {
    router.push(`/invoices?delivery_state=${InvoiceDeliveryState.UNSCHEDULED}`);
  };

  const handleFullyBilledClick = () => {
    router.push(`/orders?billing_status=${OrderBillingStatus.FULLY_BILLED}`);
  };

  const handleNotFullyBilledClick = () => {
    router.push(`/orders?billing_status=${OrderBillingStatus.NOT_FULLY_BILLED}`);
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Last Period */}
        <div
          onClick={handleLastPeriodClick}
          className={cn(
            "bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6",
            lastPeriod &&
              "cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors"
          )}
        >
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
        <div
          onClick={handleCurrentPeriodClick}
          className={cn(
            "bg-primary/10 border border-primary/30 rounded-lg p-6",
            currentPeriod && "cursor-pointer hover:bg-primary/15 transition-colors"
          )}
        >
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
        <div
          onClick={handleFuturePeriodsClick}
          className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-6 cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-950/30 transition-colors"
        >
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

        {/* Unscheduled Invoices */}
        <div
          onClick={handleUnscheduledClick}
          className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-6 cursor-pointer hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-red-700 dark:text-red-300">Sem agendamento</h3>
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-red-600 dark:text-red-400">
              {unscheduledInvoicesResponse?.success && unscheduledInvoicesResponse?.data
                ? `${unscheduledInvoicesResponse.data.length} nota${unscheduledInvoicesResponse.data.length !== 1 ? "s" : ""} fisca${unscheduledInvoicesResponse.data.length !== 1 ? "is" : "l"}`
                : "0 nota fiscal"}
            </p>
            <p className="text-3xl font-bold text-red-700 dark:text-red-300">
              {formatCurrency(unscheduledTotal)}
            </p>
          </div>
        </div>

        {/* Billing Status */}
        <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Status de Faturamento
            </h3>
            <ShoppingCart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="space-y-2">
            <div
              onClick={handleFullyBilledClick}
              className="cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-950/30 rounded-md p-2 -m-2 transition-colors"
            >
              <p className="text-xs text-purple-600 dark:text-purple-400">Totalmente faturados</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {fullyBilledCount}
              </p>
            </div>
            <div className="border-t border-purple-200 dark:border-purple-800 pt-2">
              <div
                onClick={handleNotFullyBilledClick}
                className="cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-950/30 rounded-md p-2 -m-2 transition-colors"
              >
                <p className="text-xs text-purple-600 dark:text-purple-400">
                  Não totalmente faturados
                </p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {notFullyBilledCount}
                </p>
              </div>
            </div>
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
                  handlePeriodClick(chartItem.id);
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
    </div>
  );
}
