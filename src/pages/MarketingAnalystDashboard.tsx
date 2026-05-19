import React, { useState, useEffect, useCallback } from "react";
import { Calendar, Download, PieChart as PieIcon, TrendingUp, BarChart3, Sparkles } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { StatsCard, MetricBadge, QuickActionButton, EmptyState } from "../components/DashboardComponents";
import {
  marketingAnalysisService,
  PassengerByAgeRange,
  AgeRange,
  AgeSegmentRange,
  UNKNOWN_AGE_RANGE,
} from "../services/marketingAnalysisService";


// Color palette
const PIE_COLORS = {
  [AgeRange.MINORS]: "#0EA5E9",
  [AgeRange.YOUNG]: "#8B5CF6",
  [AgeRange.YOUNG_ADULTS]: "#EC4899",
  [AgeRange.ADULTS]: "#F97316",
  [AgeRange.SENIORS]: "#EF4444",
  [UNKNOWN_AGE_RANGE]: "#64748B",
};

const BADGE_COLORS = {
  [AgeRange.MINORS]: "bg-sky-500",
  [AgeRange.YOUNG]: "bg-violet-500",
  [AgeRange.YOUNG_ADULTS]: "bg-pink-500",
  [AgeRange.ADULTS]: "bg-orange-500",
  [AgeRange.SENIORS]: "bg-red-500",
  [UNKNOWN_AGE_RANGE]: "bg-slate-500",
};

type RouteOption = {
  id: number;
  nombre?: string;
  name?: string;
};

interface PieChartProps {
  data: PassengerByAgeRange[];
  onSegmentClick?: (range: AgeSegmentRange) => void;
}

const PieChart: React.FC<PieChartProps> = ({ data, onSegmentClick }) => {
  const size = 300;
  const radius = 100;
  const cx = size / 2;
  const cy = size / 2;
  const total = data.reduce((sum, segment) => sum + segment.count, 0);

  if (total <= 0) {
    return null;
  }

  let currentAngle = -90;
  const slices = data.map((segment) => {
    const sliceAngle = (segment.count / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const largeArc = sliceAngle > 180 ? 1 : 0;

    const path = [
      `M ${cx} ${cy}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      "Z",
    ].join(" ");

    const labelAngle = startAngle + sliceAngle / 2;
    const labelRad = (labelAngle * Math.PI) / 180;
    const labelRadius = radius * 0.65;
    const labelX = cx + labelRadius * Math.cos(labelRad);
    const labelY = cy + labelRadius * Math.sin(labelRad);

    return {
      path,
      color: PIE_COLORS[segment.range],
      segment,
      labelX,
      labelY,
    };
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={400} height={400} className="mx-auto">
      {slices.map((slice, idx) => (
        <g key={idx}>
          <path
            d={slice.path}
            fill={slice.color}
            stroke="white"
            strokeWidth="2"
            opacity="0.8"
            className="cursor-pointer hover:opacity-100 transition-opacity"
            onClick={() => onSegmentClick?.(slice.segment.range)}
          />
          <text
            x={slice.labelX}
            y={slice.labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs font-bold fill-white pointer-events-none"
          >
            {slice.segment.percentage}%
          </text>
        </g>
      ))}
    </svg>
  );
};

interface AnalystStats {
  totalPassengers: number;
  averageAge: number | null;
  dominantSegment: PassengerByAgeRange | null;
}

export const MarketingAnalystDashboard: React.FC = () => {
  const [analysisData, setAnalysisData] = useState<PassengerByAgeRange[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<AgeSegmentRange | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedRoute, setSelectedRoute] = useState<number | null>(null);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AnalystStats>({
    totalPassengers: 0,
    averageAge: null,
    dominantSegment: null,
  });
  

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await marketingAnalysisService.getPassengersByAgeRange(startDate, endDate, selectedRoute || undefined);
      const rows = result.byAgeRange || [];
      setAnalysisData(rows);

      // Calculate stats
      const dominant = rows.length
        ? rows.reduce((prev, current) => (current.count > prev.count ? current : prev))
        : null;

      const totalPassengers = rows.reduce((sum, r) => sum + r.count, 0);

      // Calculate average age (would be done better server-side)
      const citizens = await marketingAnalysisService.getCitizensWithAge();
      const avgAge = marketingAnalysisService.getAverageAge(citizens);

      setStats({
        totalPassengers,
        averageAge: avgAge,
        dominantSegment: dominant && dominant.count > 0 ? dominant : null,
      });
    } catch (error) {
      console.error("Error loading analysis data:", error);
    } finally {
      setLoading(false);
    }
  }, [endDate, selectedRoute, startDate]);

  const loadRoutes = useCallback(async () => {
    try {
      const routesData = await marketingAnalysisService.getRoutes();
      setRoutes(routesData);
    } catch (error) {
      console.error("Error loading routes:", error);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadRoutes();
  }, [loadData, loadRoutes]);

  const handleDateFilter = () => {
    loadData();
  };

  const exportToPNG = () => {
    // Obtener el elemento <svg> dentro del contenedor
    const container = document.getElementById("pie-chart-svg");
    if (!container) return;
    const svgEl = container.querySelector("svg") as SVGElement | null;
    if (!svgEl) return;

    // Serializar SVG y asegurar el namespace
    let svgData = new XMLSerializer().serializeToString(svgEl);
    if (!svgData.includes('xmlns')) {
      svgData = svgData.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    // Crear imagen a partir del SVG (usar encodeURIComponent para evitar btoa issues con unicode)
    const img = new Image();
    const svgBlob = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Ajustar tamaño del canvas según el tamaño renderizado del SVG
      const rect = svgEl.getBoundingClientRect();
      canvas.width = Math.ceil(rect.width) || Number(svgEl.getAttribute('width')) || 800;
      canvas.height = Math.ceil(rect.height) || Number(svgEl.getAttribute('height')) || 600;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `marketing-analysis-${new Date().toISOString().split('T')[0]}.png`;
      link.click();
    };

    img.onerror = (e) => {
      console.error('Error converting SVG to image', e);
    };

    img.src = svgBlob;
  };

  const exportToExcel = () => {
    const headers = ["Rango Etario", "Cantidad", "Porcentaje", "Variación"];
    const rows = analysisData.map((row) => [
      row.label,
      row.count,
      `${row.percentage}%`,
      `${row.variation || 0}%`,
    ]);

    let csv = headers.join(",") + "\n";
    rows.forEach((row) => {
      csv += row.join(",") + "\n";
    });

    const link = document.createElement("a");
    link.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    link.download = `marketing-analysis-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const selectedSegmentData = analysisData.find((row) => row.range === selectedSegment) || null;
  const averageAgeLabel = stats.averageAge !== null ? `${stats.averageAge} años` : 'Sin Informacion';

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="surface-card w-full max-w-md p-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
              <PieIcon className="w-8 h-8 animate-spin" />
            </div>
            <p className="soft-label mb-2">Analítica demográfica</p>
            <h2 className="text-2xl font-black text-slate-900">Cargando tablero</h2>
            <p className="mt-3 text-sm text-slate-600">Estamos preparando los datos de pasajeros por segmento etario.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <section className="hero-panel relative overflow-hidden p-8 sm:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.24),transparent_24%)]" />
          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <span className="pill-badge">
                <Sparkles className="h-3.5 w-3.5" />
                Analítica de mercado
              </span>
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Analista de Marketing</h1>
                <p className="max-w-xl text-white/80 text-sm sm:text-base leading-6">
                  Segmentación demográfica de pasajeros para detectar oportunidades de campaña, rutas con mayor demanda y cambios de comportamiento.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <MetricBadge label="Total pasajeros" value={stats.totalPassengers} color="blue" size="sm" icon={PieIcon} />
                <MetricBadge label="Edad promedio" value={averageAgeLabel} color="green" size="sm" icon={TrendingUp} />
                <MetricBadge label="Segmento líder" value={stats.dominantSegment ? stats.dominantSegment.label : 'Sin datos'} color="purple" size="sm" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:w-[24rem]">
              <QuickActionButton icon={Download} label="Exportar PNG" onClick={exportToPNG} variant="secondary" fullWidth />
              <QuickActionButton icon={Download} label="Exportar CSV" onClick={exportToExcel} variant="secondary" fullWidth />
              <div className="sm:col-span-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/80 backdrop-blur-md">
                Usa los filtros para comparar rutas y periodos antes de descargar el análisis.
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatsCard
            title="Total de pasajeros"
            value={stats.totalPassengers}
            subtitle="Incluye la ventana de fechas y ruta seleccionada"
            icon={PieIcon}
            bgColor="bg-sky-50"
            textColor="text-sky-700"
            iconBgColor="bg-sky-100"
          />
          <StatsCard
            title="Edad promedio"
            value={averageAgeLabel}
            subtitle="Promedio calculado solo con ciudadanos que tienen edad registrada"
            icon={TrendingUp}
            bgColor="bg-emerald-50"
            textColor="text-emerald-700"
            iconBgColor="bg-emerald-100"
          />
          <StatsCard
            title="Segmento predominante"
            value={stats.dominantSegment ? stats.dominantSegment.label : 'Sin datos'}
            subtitle={stats.dominantSegment ? `${stats.dominantSegment.count} pasajeros` : 'Esperando resultados'}
            icon={BarChart3}
            bgColor="bg-slate-50"
            textColor="text-slate-700"
            iconBgColor="bg-slate-200"
          />
        </section>

        <section className="surface-card p-6 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="soft-label mb-2">Filtros de análisis</p>
              <h2 className="text-2xl font-black text-slate-900">Segmentación por ruta y periodo</h2>
              <p className="mt-2 text-sm text-slate-600">Ajusta la consulta y vuelve a cargar la vista para actualizar la distribución.</p>
            </div>
            <button
              onClick={handleDateFilter}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              <Calendar className="w-4 h-4" />
              Aplicar filtros
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-4">
            <label className="space-y-2">
              <span className="soft-label">Ruta</span>
              <select
                value={selectedRoute || ""}
                onChange={(e) => setSelectedRoute(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              >
                <option value="">Consolidado</option>
                {routes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.nombre || `Ruta ${route.id}`}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="soft-label">Desde</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              />
            </label>

            <label className="space-y-2">
              <span className="soft-label">Hasta</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              />
            </label>

            <div className="flex items-end">
              <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {selectedRoute ? 'Ruta seleccionada' : 'Todas las rutas'}
                <br />
                {startDate || endDate ? `${startDate || 'inicio'} → ${endDate || 'hoy'}` : 'Sin rango de fechas'}
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="surface-card p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="soft-label mb-2">Distribución</p>
                <h3 className="text-xl font-black text-slate-900">Rango etario de pasajeros</h3>
              </div>
              <div className="rounded-2xl bg-sky-50 p-3 text-sky-600">
                <PieIcon className="h-6 w-6" />
              </div>
            </div>

            <div id="pie-chart-svg" className="mt-6">
              {analysisData.some((item) => item.count > 0) ? (
                <PieChart data={analysisData} onSegmentClick={setSelectedSegment} />
              ) : (
                <EmptyState
                  icon={PieIcon}
                  title="Sin datos para mostrar"
                  description="Ajusta el filtro de ruta o fechas para cargar una distribución con resultados."
                />
              )}
            </div>

            <div className="mt-6 space-y-3">
              {analysisData.map((item) => (
                <button
                  key={item.range}
                  onClick={() => setSelectedSegment(item.range)}
                  className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                    selectedSegment === item.range
                      ? 'border-sky-300 bg-sky-50'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                          <span className={`h-3 w-3 rounded-full ${BADGE_COLORS[item.range]}`} />
                  <span className="text-sm font-medium text-slate-800">{item.label}</span>
                  <span className="ml-auto text-sm font-semibold text-slate-900">{item.percentage}%</span>
                </button>
              ))}
            </div>
          </div>

          <div className="surface-card p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="soft-label mb-2">Detalle</p>
                <h3 className="text-xl font-black text-slate-900">Estadísticas detalladas</h3>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                    <th className="px-4 py-2">Rango</th>
                    <th className="px-4 py-2 text-right">Cantidad</th>
                    <th className="px-4 py-2 text-right">%</th>
                    <th className="px-4 py-2 text-right">Var. mes</th>
                  </tr>
                </thead>
                <tbody>
                  {analysisData.map((row) => (
                    <tr
                      key={row.range}
                      onClick={() => setSelectedSegment(row.range)}
                      className={`cursor-pointer rounded-2xl border transition ${
                        selectedSegment === row.range
                          ? 'border-sky-200 bg-sky-50'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <span className={`h-3 w-3 rounded-full ${BADGE_COLORS[row.range]}`} />
                          <span className="text-sm font-medium text-slate-900">{row.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-semibold text-slate-900">{row.count}</td>
                      <td className="px-4 py-4 text-right text-sm text-slate-600">{row.percentage}%</td>
                      <td className="px-4 py-4 text-right text-sm font-semibold">
                        <span className={(row.variation || 0) > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                          {(row.variation || 0) > 0 ? '+' : ''}{row.variation || 0}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedSegmentData && (
              <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                <span className="font-semibold">{selectedSegmentData.label}</span> · Pasajeros seleccionados: <span className="font-bold">{selectedSegmentData.count}</span>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default MarketingAnalystDashboard;
