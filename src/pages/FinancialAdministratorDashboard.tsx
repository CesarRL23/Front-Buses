import React, { useState, useEffect, useCallback } from "react";
import { BarChart3, DollarSign, Download, Sparkles, TrendingUp } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { StatsCard, MetricBadge, QuickActionButton, EmptyState } from "../components/DashboardComponents";
import {
  financialAdministratorService,
  IncomeByPaymentResponse,
  PaymentMethodData,
} from "../services/financialAdministratorService";

const METHOD_COLORS: Record<string, string> = {
  CARD: "#3B82F6",
  CASH: "#10B981",
  APP: "#8B5CF6",
};

const METHOD_LABELS: Record<string, string> = {
  CARD: "Tarjeta",
  CASH: "Efectivo",
  APP: "App",
};

const METHOD_BG: Record<string, string> = {
  CARD: "bg-blue-500",
  CASH: "bg-emerald-500",
  APP: "bg-violet-500",
};

const PERIOD_OPTIONS: { label: string; value: 3 | 6 | 12 }[] = [
  { label: "3 meses", value: 3 },
  { label: "6 meses", value: 6 },
  { label: "12 meses", value: 12 },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

interface StackedBarChartProps {
  data: IncomeByPaymentResponse;
}

const StackedBarChart: React.FC<StackedBarChartProps> = ({ data }) => {
  const { months, paymentMethods } = data;

  const chartW = 640;
  const chartH = 300;
  const paddingLeft = 70;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 50;
  const innerW = chartW - paddingLeft - paddingRight;
  const innerH = chartH - paddingTop - paddingBottom;

  const monthTotals = months.map((m) =>
    paymentMethods.reduce((sum, pm) => {
      const entry = pm.monthlyData.find((d) => d.month === m);
      return sum + (entry?.total ?? 0);
    }, 0),
  );
  const maxTotal = Math.max(...monthTotals, 1);

  const barWidth = Math.min(40, (innerW / months.length) * 0.6);
  const barSpacing = innerW / months.length;

  const yTicks = 5;
  const yStep = maxTotal / yTicks;

  return (
    <svg
      id="stacked-bar-svg"
      viewBox={`0 0 ${chartW} ${chartH}`}
      width="100%"
      height={chartH}
      className="overflow-visible"
    >
      {/* Y-axis ticks and grid */}
      {Array.from({ length: yTicks + 1 }).map((_, i) => {
        const value = yStep * i;
        const y = paddingTop + innerH - (value / maxTotal) * innerH;
        return (
          <g key={i}>
            <line
              x1={paddingLeft}
              y1={y}
              x2={paddingLeft + innerW}
              y2={y}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
            <text
              x={paddingLeft - 8}
              y={y + 4}
              textAnchor="end"
              fontSize="10"
              fill="#94a3b8"
            >
              {value >= 1000 ? `${Math.round(value / 1000)}k` : Math.round(value)}
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {months.map((month, mIdx) => {
        const cx = paddingLeft + mIdx * barSpacing + barSpacing / 2;
        let yOffset = paddingTop + innerH;

        return (
          <g key={month}>
            {paymentMethods.map((pm) => {
              const entry = pm.monthlyData.find((d) => d.month === month);
              const value = entry?.total ?? 0;
              if (value <= 0) return null;
              const barH = (value / maxTotal) * innerH;
              yOffset -= barH;
              return (
                <rect
                  key={pm.type}
                  x={cx - barWidth / 2}
                  y={yOffset}
                  width={barWidth}
                  height={barH}
                  fill={METHOD_COLORS[pm.type] ?? "#94a3b8"}
                  rx="2"
                  opacity="0.85"
                  className="hover:opacity-100 transition-opacity"
                >
                  <title>
                    {METHOD_LABELS[pm.type] ?? pm.type}: {formatCurrency(value)}
                  </title>
                </rect>
              );
            })}
            {/* X-axis label */}
            <text
              x={cx}
              y={paddingTop + innerH + 18}
              textAnchor="middle"
              fontSize="10"
              fill="#64748b"
            >
              {month.slice(5)}
            </text>
            <text
              x={cx}
              y={paddingTop + innerH + 30}
              textAnchor="middle"
              fontSize="9"
              fill="#94a3b8"
            >
              {month.slice(0, 4)}
            </text>
          </g>
        );
      })}

      {/* Axes */}
      <line
        x1={paddingLeft}
        y1={paddingTop}
        x2={paddingLeft}
        y2={paddingTop + innerH}
        stroke="#cbd5e1"
        strokeWidth="1"
      />
      <line
        x1={paddingLeft}
        y1={paddingTop + innerH}
        x2={paddingLeft + innerW}
        y2={paddingTop + innerH}
        stroke="#cbd5e1"
        strokeWidth="1"
      />
    </svg>
  );
};

export const FinancialAdministratorDashboard: React.FC = () => {
  const [period, setPeriod] = useState<3 | 6 | 12>(6);
  const [data, setData] = useState<IncomeByPaymentResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await financialAdministratorService.getIncomeByPaymentMethod(period);
      setData(result);
    } catch (error) {
      console.error("Error loading financial data:", error);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const exportToCSV = () => {
    if (!data) return;
    const headers = ["Mes", ...data.paymentMethods.map((pm) => METHOD_LABELS[pm.type] ?? pm.type), "Total"];
    const rows = data.months.map((month) => {
      const values = data.paymentMethods.map((pm) => {
        const entry = pm.monthlyData.find((d) => d.month === month);
        return entry?.total ?? 0;
      });
      const rowTotal = values.reduce((s, v) => s + v, 0);
      return [month, ...values, rowTotal];
    });

    let csv = headers.join(",") + "\n";
    rows.forEach((row) => (csv += row.join(",") + "\n"));
    csv += ["Total", ...data.paymentMethods.map((pm) => pm.periodTotal), data.grandTotal].join(",") + "\n";

    const link = document.createElement("a");
    link.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    link.download = `ingresos-metodo-pago-${period}m-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="surface-card w-full max-w-md p-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-green-600">
              <BarChart3 className="w-8 h-8 animate-pulse" />
            </div>
            <p className="soft-label mb-2">Análisis financiero</p>
            <h2 className="text-2xl font-black text-slate-900">Cargando tablero</h2>
            <p className="mt-3 text-sm text-slate-600">Preparando evolución de ingresos por método de pago.</p>
          </div>
        </div>
      </div>
    );
  }

  const methods: PaymentMethodData[] = data?.paymentMethods ?? [];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Hero */}
        <section className="hero-panel relative overflow-hidden p-8 sm:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.24),transparent_24%)]" />
          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <span className="pill-badge">
                <Sparkles className="h-3.5 w-3.5" />
                Analítica financiera
              </span>
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Administrador Financiero</h1>
                <p className="max-w-xl text-white/80 text-sm sm:text-base leading-6">
                  Evolución de ingresos por método de pago para entender tendencias de digitalización y preferencias de usuarios.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <MetricBadge
                  label="Total período"
                  value={formatCurrency(data?.grandTotal ?? 0)}
                  color="green"
                  size="sm"
                  icon={DollarSign}
                />
                <MetricBadge
                  label="Meses analizados"
                  value={data?.months.length ?? 0}
                  color="blue"
                  size="sm"
                  icon={TrendingUp}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:w-[24rem]">
              <QuickActionButton icon={Download} label="Exportar CSV" onClick={exportToCSV} variant="secondary" fullWidth />
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/80 backdrop-blur-md">
                Cambia el período para comparar distintos rangos antes de exportar.
              </div>
            </div>
          </div>
        </section>

        {/* Period selector */}
        <section className="surface-card p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="soft-label mb-1">Filtro temporal</p>
              <h2 className="text-xl font-black text-slate-900">Período de análisis</h2>
            </div>
            <div className="flex gap-2">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPeriod(opt.value)}
                  className={`rounded-2xl px-5 py-2.5 text-sm font-semibold transition ${
                    period === opt.value
                      ? "bg-slate-900 text-white shadow"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Stats cards */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {methods.map((pm) => (
            <StatsCard
              key={pm.type}
              title={`Ingresos ${METHOD_LABELS[pm.type] ?? pm.type}`}
              value={formatCurrency(pm.periodTotal)}
              subtitle={`Total en los últimos ${period} meses`}
              icon={DollarSign}
              bgColor={pm.type === "CARD" ? "bg-blue-50" : pm.type === "CASH" ? "bg-emerald-50" : "bg-violet-50"}
              textColor={pm.type === "CARD" ? "text-blue-700" : pm.type === "CASH" ? "text-emerald-700" : "text-violet-700"}
              iconBgColor={pm.type === "CARD" ? "bg-blue-100" : pm.type === "CASH" ? "bg-emerald-100" : "bg-violet-100"}
            />
          ))}
        </section>

        {/* Chart */}
        <section className="surface-card p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <p className="soft-label mb-2">Evolución mensual</p>
              <h3 className="text-xl font-black text-slate-900">Ingresos por método de pago</h3>
            </div>
            <div className="rounded-2xl bg-green-50 p-3 text-green-600">
              <BarChart3 className="h-6 w-6" />
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-6">
            {methods.map((pm) => (
              <div key={pm.type} className="flex items-center gap-2">
                <span
                  className={`h-3 w-3 rounded-full ${METHOD_BG[pm.type] ?? "bg-slate-400"}`}
                />
                <span className="text-sm text-slate-700 font-medium">{METHOD_LABELS[pm.type] ?? pm.type}</span>
              </div>
            ))}
          </div>

          {data && data.months.length > 0 && data.grandTotal > 0 ? (
            <StackedBarChart data={data} />
          ) : (
            <EmptyState
              icon={BarChart3}
              title="Sin datos para mostrar"
              description="No hay tickets completados en el período seleccionado."
            />
          )}
        </section>

        {/* Detail table */}
        <section className="surface-card p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <p className="soft-label mb-2">Detalle</p>
              <h3 className="text-xl font-black text-slate-900">Ingresos por mes y método</h3>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3 text-slate-600">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-1 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                  <th className="px-4 py-2">Mes</th>
                  {methods.map((pm) => (
                    <th key={pm.type} className="px-4 py-2 text-right">
                      {METHOD_LABELS[pm.type] ?? pm.type}
                    </th>
                  ))}
                  <th className="px-4 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {data?.months.map((month) => {
                  const rowValues = methods.map((pm) => {
                    const entry = pm.monthlyData.find((d) => d.month === month);
                    return entry?.total ?? 0;
                  });
                  const rowTotal = rowValues.reduce((s, v) => s + v, 0);
                  return (
                    <tr key={month} className="rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-medium text-slate-900">{month}</td>
                      {rowValues.map((val, i) => (
                        <td key={i} className="px-4 py-3 text-right text-slate-700">
                          {formatCurrency(val)}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        {formatCurrency(rowTotal)}
                      </td>
                    </tr>
                  );
                })}
                {/* Totals row */}
                <tr className="rounded-2xl border border-slate-300 bg-slate-50 font-semibold">
                  <td className="px-4 py-3 text-slate-900">Total período</td>
                  {methods.map((pm) => (
                    <td key={pm.type} className="px-4 py-3 text-right text-slate-900">
                      {formatCurrency(pm.periodTotal)}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right text-slate-900">{formatCurrency(data?.grandTotal ?? 0)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default FinancialAdministratorDashboard;
