import React, { useState, useEffect, useCallback } from "react";
import { BarChart3, Download, Sparkles, TrendingUp, AlertTriangle } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { StatsCard, MetricBadge, QuickActionButton, EmptyState } from "../components/DashboardComponents";
import {
  operationsManagerService,
  IncidentTrendsResponse,
  CompanyOption,
  TrendMonth,
} from "../services/operationsManagerService";

const TIPO_CONFIG: Record<string, { label: string; color: string; bg: string; text: string; iconBg: string }> = {
  mecanico:  { label: "Mecánicos",          color: "#3B82F6", bg: "bg-blue-50",   text: "text-blue-700",   iconBg: "bg-blue-100"   },
  accidente: { label: "Accidentes",         color: "#EF4444", bg: "bg-red-50",    text: "text-red-700",    iconBg: "bg-red-100"    },
  retraso:   { label: "Retrasos",           color: "#F59E0B", bg: "bg-amber-50",  text: "text-amber-700",  iconBg: "bg-amber-100"  },
  pasajeros: { label: "Prob. Pasajeros",    color: "#10B981", bg: "bg-emerald-50",text: "text-emerald-700",iconBg: "bg-emerald-100" },
  otro:      { label: "Otros",              color: "#64748B", bg: "bg-slate-50",  text: "text-slate-700",  iconBg: "bg-slate-200"  },
};

const TIPOS = Object.keys(TIPO_CONFIG) as (keyof typeof TIPO_CONFIG)[];

const PERIOD_OPTIONS: { label: string; value: 3 | 6 | 12 }[] = [
  { label: "3 meses", value: 3 },
  { label: "6 meses", value: 6 },
  { label: "12 meses", value: 12 },
];

interface LineChartProps {
  data: IncidentTrendsResponse;
}

const LineChart: React.FC<LineChartProps> = ({ data }) => {
  const { trends } = data;
  if (!trends.length) return null;

  const chartW = 660;
  const chartH = 300;
  const padL = 50;
  const padR = 20;
  const padT = 20;
  const padB = 50;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;

  const maxVal = Math.max(
    1,
    ...trends.flatMap((row) => TIPOS.map((t) => (row as any)[t] as number)),
  );

  const yTicks = 5;
  const xStep = trends.length > 1 ? innerW / (trends.length - 1) : innerW;

  const toX = (i: number) => padL + i * xStep;
  const toY = (v: number) => padT + innerH - (v / maxVal) * innerH;

  return (
    <svg
      id="line-chart-svg"
      viewBox={`0 0 ${chartW} ${chartH}`}
      width="100%"
      height={chartH}
      className="overflow-visible"
    >
      {/* Grid lines */}
      {Array.from({ length: yTicks + 1 }).map((_, i) => {
        const value = (maxVal / yTicks) * i;
        const y = toY(value);
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={padL + innerW} y2={y} stroke="#e2e8f0" strokeWidth="1" />
            <text x={padL - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
              {Math.round(value)}
            </text>
          </g>
        );
      })}

      {/* Lines + dots per type */}
      {TIPOS.map((tipo) => {
        const cfg = TIPO_CONFIG[tipo];
        const points = trends.map((row, i) => ({
          x: toX(i),
          y: toY((row as any)[tipo] as number),
          v: (row as any)[tipo] as number,
          mes: row.mes,
        }));
        const d = points
          .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
          .join(" ");
        return (
          <g key={tipo}>
            <path d={d} fill="none" stroke={cfg.color} strokeWidth="2.5" strokeLinejoin="round" opacity="0.85" />
            {points.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="4" fill={cfg.color} stroke="white" strokeWidth="1.5">
                <title>{`${cfg.label} — ${p.mes}: ${p.v}`}</title>
              </circle>
            ))}
          </g>
        );
      })}

      {/* X labels */}
      {trends.map((row, i) => (
        <g key={row.mes}>
          <text x={toX(i)} y={padT + innerH + 18} textAnchor="middle" fontSize="10" fill="#64748b">
            {row.mes.slice(5)}
          </text>
          <text x={toX(i)} y={padT + innerH + 30} textAnchor="middle" fontSize="9" fill="#94a3b8">
            {row.mes.slice(0, 4)}
          </text>
        </g>
      ))}

      {/* Axes */}
      <line x1={padL} y1={padT} x2={padL} y2={padT + innerH} stroke="#cbd5e1" strokeWidth="1" />
      <line x1={padL} y1={padT + innerH} x2={padL + innerW} y2={padT + innerH} stroke="#cbd5e1" strokeWidth="1" />
    </svg>
  );
};

export const OperationsManagerDashboard: React.FC = () => {
  const [period, setPeriod] = useState<3 | 6 | 12>(6);
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [data, setData] = useState<IncidentTrendsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await operationsManagerService.getIncidentTrends(
        period,
        companyId ?? undefined,
      );
      setData(result);
    } catch (error) {
      console.error("Error loading operations data:", error);
    } finally {
      setLoading(false);
    }
  }, [period, companyId]);

  const loadCompanies = useCallback(async () => {
    try {
      const list = await operationsManagerService.getCompanies();
      setCompanies(list);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    loadData();
    loadCompanies();
  }, [loadData, loadCompanies]);

  const grandTotal = data
    ? TIPOS.reduce((s, t) => s + ((data.totals as any)[t] ?? 0), 0)
    : 0;

  const exportToCSV = () => {
    if (!data) return;
    const headers = ["Mes", ...TIPOS.map((t) => TIPO_CONFIG[t].label), "Total"];
    const rows = (data.trends as TrendMonth[]).map((row) => {
      const values = TIPOS.map((t) => (row as any)[t] as number);
      return [row.mes, ...values, values.reduce((s, v) => s + v, 0)];
    });
    let csv = headers.join(",") + "\n";
    rows.forEach((r) => (csv += r.join(",") + "\n"));
    csv += ["Total", ...TIPOS.map((t) => (data.totals as any)[t]), grandTotal].join(",") + "\n";

    const link = document.createElement("a");
    link.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    link.download = `incidentes-tendencias-${period}m-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="surface-card w-full max-w-md p-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <TrendingUp className="w-8 h-8 animate-pulse" />
            </div>
            <p className="soft-label mb-2">Operaciones</p>
            <h2 className="text-2xl font-black text-slate-900">Cargando tablero</h2>
            <p className="mt-3 text-sm text-slate-600">Preparando evolución temporal de incidentes.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Hero */}
        <section className="hero-panel relative overflow-hidden p-8 sm:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.24),transparent_24%)]" />
          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <span className="pill-badge">
                <Sparkles className="h-3.5 w-3.5" />
                Gestión operacional
              </span>
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Gerente de Operaciones</h1>
                <p className="max-w-xl text-white/80 text-sm sm:text-base leading-6">
                  Evolución temporal de incidentes por tipo para identificar tendencias, patrones estacionales y evaluar la efectividad de acciones correctivas.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <MetricBadge label="Total incidentes" value={grandTotal} color="blue" size="sm" icon={AlertTriangle} />
                <MetricBadge label="Meses analizados" value={data?.months.length ?? 0} color="purple" size="sm" icon={TrendingUp} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:w-[24rem]">
              <QuickActionButton icon={Download} label="Exportar CSV" onClick={exportToCSV} variant="secondary" fullWidth />
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/80 backdrop-blur-md">
                Filtra por empresa y período para análisis comparativos.
              </div>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="surface-card p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="soft-label mb-1">Filtros</p>
              <h2 className="text-xl font-black text-slate-900">Período y empresa</h2>
            </div>
            <div className="flex flex-wrap gap-4 items-end">
              {/* Period buttons */}
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
              {/* Company select */}
              <select
                value={companyId ?? ""}
                onChange={(e) => setCompanyId(e.target.value ? parseInt(e.target.value) : null)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              >
                <option value="">Consolidado (todas)</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Stats cards */}
        <section className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {TIPOS.map((tipo) => {
            const cfg = TIPO_CONFIG[tipo];
            return (
              <StatsCard
                key={tipo}
                title={cfg.label}
                value={(data?.totals as any)?.[tipo] ?? 0}
                subtitle={`Últimos ${period} meses`}
                icon={AlertTriangle}
                bgColor={cfg.bg}
                textColor={cfg.text}
                iconBgColor={cfg.iconBg}
              />
            );
          })}
        </section>

        {/* Line chart */}
        <section className="surface-card p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <p className="soft-label mb-2">Evolución temporal</p>
              <h3 className="text-xl font-black text-slate-900">Incidentes por tipo y mes</h3>
            </div>
            <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
              <BarChart3 className="h-6 w-6" />
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-6">
            {TIPOS.map((tipo) => (
              <div key={tipo} className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: TIPO_CONFIG[tipo].color }} />
                <span className="text-sm text-slate-700 font-medium">{TIPO_CONFIG[tipo].label}</span>
              </div>
            ))}
          </div>

          {data && grandTotal > 0 ? (
            <LineChart data={data} />
          ) : (
            <EmptyState
              icon={BarChart3}
              title="Sin incidentes en el período"
              description="No se registraron incidentes en el rango seleccionado."
            />
          )}
        </section>

        {/* Detail table */}
        <section className="surface-card p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <p className="soft-label mb-2">Detalle</p>
              <h3 className="text-xl font-black text-slate-900">Incidentes por mes y tipo</h3>
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
                  {TIPOS.map((t) => (
                    <th key={t} className="px-4 py-2 text-right">{TIPO_CONFIG[t].label}</th>
                  ))}
                  <th className="px-4 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {(data?.trends ?? []).map((row) => {
                  const values = TIPOS.map((t) => (row as any)[t] as number);
                  const rowTotal = values.reduce((s, v) => s + v, 0);
                  return (
                    <tr key={row.mes} className="rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-medium text-slate-900">{row.mes}</td>
                      {values.map((v, i) => (
                        <td key={i} className="px-4 py-3 text-right text-slate-700">{v}</td>
                      ))}
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">{rowTotal}</td>
                    </tr>
                  );
                })}
                <tr className="rounded-2xl border border-slate-300 bg-slate-50 font-semibold">
                  <td className="px-4 py-3 text-slate-900">Total período</td>
                  {TIPOS.map((t) => (
                    <td key={t} className="px-4 py-3 text-right text-slate-900">
                      {(data?.totals as any)?.[t] ?? 0}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right text-slate-900">{grandTotal}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default OperationsManagerDashboard;
