import React, { useState, useEffect } from "react";
import { Calendar, Download, Filter, PieChart as PieIcon, TrendingUp } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { marketingAnalysisService, PassengerByAgeRange, AgeRange } from "../services/marketingAnalysisService";


// Color palette
const COLORS = {
  [AgeRange.MINORS]: "#3B82F6", // Blue
  [AgeRange.YOUNG]: "#8B5CF6", // Purple
  [AgeRange.YOUNG_ADULTS]: "#EC4899", // Pink
  [AgeRange.ADULTS]: "#F97316", // Orange
  [AgeRange.SENIORS]: "#EF4444", // Red
};

interface PieChartProps {
  data: PassengerByAgeRange[];
  onSegmentClick?: (range: AgeRange) => void;
}

const PieChart: React.FC<PieChartProps> = ({ data, onSegmentClick }) => {
  const size = 300;
  const radius = 100;
  const cx = size / 2;
  const cy = size / 2;

  let currentAngle = -90;
  const slices = data.map((segment) => {
    const sliceAngle = (segment.count / data.reduce((sum, s) => sum + s.count, 0)) * 360;
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
      color: COLORS[segment.range],
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
  averageAge: number;
  dominantSegment: PassengerByAgeRange | null;
}

export const MarketingAnalystDashboard: React.FC = () => {
  const [analysisData, setAnalysisData] = useState<PassengerByAgeRange[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<AgeRange | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedRoute, setSelectedRoute] = useState<number | null>(null);
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AnalystStats>({
    totalPassengers: 0,
    averageAge: 0,
    dominantSegment: null,
  });
  

  useEffect(() => {
    loadData();
    loadRoutes();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await marketingAnalysisService.getPassengersByAgeRange(startDate, endDate, selectedRoute || undefined);
      setAnalysisData(result.byAgeRange);

      // Calculate stats
      const dominant = result.byAgeRange.reduce((prev, current) =>
        current.count > prev.count ? current : prev
      );

      const totalPassengers = result.byAgeRange.reduce((sum, r) => sum + r.count, 0);

      // Calculate average age (would be done better server-side)
      const citizens = await marketingAnalysisService.getCitizensWithAge();
      const avgAge = citizens.length
        ? Math.round(citizens.reduce((sum: number, c: any) => sum + (c.age || 0), 0) / citizens.length)
        : 0;

      setStats({
        totalPassengers,
        averageAge: avgAge,
        dominantSegment: dominant.count > 0 ? dominant : null,
      });
    } catch (error) {
      console.error("Error loading analysis data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoutes = async () => {
    try {
      const routesData = await marketingAnalysisService.getRoutes();
      setRoutes(routesData);
    } catch (error) {
      console.error("Error loading routes:", error);
    }
  };

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

  if (loading) {
    return (
      <div className="flex flex-col h-screen">
        <Navbar />
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="text-center">
            <div className="inline-block animate-spin">
              <PieIcon className="w-12 h-12 text-indigo-600" />
            </div>
            <p className="mt-4 text-gray-600">Cargando datos de análisis...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar />

      {/* Header: same structure as other dashboards (greeting + subtitle) */}
      <main className="max-w-7xl mx-auto w-full px-6 sm:px-8 lg:px-12 py-16 space-y-6">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-indigo-50 opacity-10 rounded-3xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-10 bg-gradient-to-r from-white to-white rounded-3xl border border-gray-100">
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Analista de Marketing</h1>
              <p className="text-gray-600 text-sm mt-2">Análisis de pasajeros por segmento demográfico</p>
            </div>
            {/* Removed duplicate user info (Navbar already displays user) */}
          </div>
        </section>
      </main>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <PieIcon className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Analista de Marketing
            </h1>
          </div>
          <p className="text-gray-600">
            Análisis de pasajeros por segmento demográfico
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total de Pasajeros</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalPassengers}
                </p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <PieIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Edad Promedio</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.averageAge} años
                </p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Segmento Predominante</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stats.dominantSegment ? stats.dominantSegment.label : "N/A"}
                </p>
                {stats.dominantSegment && (
                  <p className="text-sm text-gray-500 mt-1">
                    {stats.dominantSegment.count} pasajeros
                  </p>
                )}
              </div>
              <div
                className="rounded-full p-3"
                style={{
                  backgroundColor: stats.dominantSegment
                    ? COLORS[stats.dominantSegment.range]
                    : "#E5E7EB",
                  opacity: 0.2,
                }}
              >
                <TrendingUp
                  className="w-6 h-6"
                  style={{
                    color: stats.dominantSegment
                      ? COLORS[stats.dominantSegment.range]
                      : "#999",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ruta
              </label>
              <select
                value={selectedRoute || ""}
                onChange={(e) => setSelectedRoute(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Consolidado</option>
                {routes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.nombre || `Ruta ${route.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Desde
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hasta
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleDateFilter}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                Filtrar
              </button>
            </div>
          </div>
        </div>

        {/* Charts and Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pie Chart */}
          <div className="bg-white rounded-lg shadow p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Distribución por Rango Etario
            </h3>
            <div id="pie-chart-svg">
              <PieChart data={analysisData} onSegmentClick={setSelectedSegment} />
            </div>

            {/* Legend */}
            <div className="mt-6 space-y-2">
              {analysisData.map((item) => (
                <div key={item.range} className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: COLORS[item.range] }}
                  ></div>
                  <span className="text-sm text-gray-700">{item.label}</span>
                  <span className="text-sm font-semibold text-gray-900 ml-auto">
                    {item.percentage}%
                  </span>
                </div>
              ))}
            </div>

            {/* Export Buttons */}
            <div className="mt-8 flex gap-3">
              <button
                onClick={exportToPNG}
                className="flex-1 px-4 py-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition font-medium flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Descargar PNG
              </button>
              <button
                onClick={exportToExcel}
                className="flex-1 px-4 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition font-medium flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Descargar Excel
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Estadísticas Detalladas
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                      Rango Etario
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">
                      Cantidad
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">
                      %
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">
                      Var. Mes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analysisData.map((row) => (
                    <tr
                      key={row.range}
                      className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                        selectedSegment === row.range ? "bg-indigo-50" : ""
                      }`}
                      onClick={() => setSelectedSegment(row.range)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[row.range] }}
                          ></div>
                          <span className="text-sm text-gray-900">
                            {row.label}
                          </span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 text-sm font-semibold text-gray-900">
                        {row.count}
                      </td>
                      <td className="text-right py-3 px-4 text-sm text-gray-600">
                        {row.percentage}%
                      </td>
                      <td className="text-right py-3 px-4 text-sm">
                        <span
                          className={
                            (row.variation || 0) > 0
                              ? "text-green-600 font-semibold"
                              : "text-red-600 font-semibold"
                          }
                        >
                          {(row.variation || 0) > 0 ? "+" : ""}
                          {row.variation || 0}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Segment Details */}
            {selectedSegment && (
              <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <p className="text-sm text-indigo-900">
                  <span className="font-semibold">
                    {analysisData
                      .find((r) => r.range === selectedSegment)
                      ?.label.split(" ")[0]}{" "}
                  </span>
                  Pasajeros Seleccionados:{" "}
                  <span className="font-bold">
                    {
                      analysisData.find((r) => r.range === selectedSegment)
                        ?.count
                    }
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketingAnalystDashboard;
