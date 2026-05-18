import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';
import { businessService } from '../services/businessService';
import { 
  Shield, 
  Activity, 
  MapPin, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Clock, 
  BarChart,
  Navigation,
  Zap,
  CheckCircle,
  XCircle,
  Radio,
  Eye,
  Download,
  Building2,
  RefreshCw,
  Sparkles,
  Calendar
} from 'lucide-react';
import { StatsCard, MetricBadge, ProgressCard, InfoPanel, ActivityFeed } from '../components/DashboardComponents';

interface Company {
  id: number;
  nombre: string;
  nit: string;
}

interface TrendMonth {
  mes: string;
  mecanico: number;
  accidente: number;
  retraso: number;
  pasajeros: number;
  otro: number;
}

const INCIDENT_TYPES_CONFIG = {
  mecanico: { label: 'Mecánicos', color: '#3b82f6', bg: 'bg-blue-500' },
  accidente: { label: 'Accidentes', color: '#ef4444', bg: 'bg-red-500' },
  retraso: { label: 'Retrasos', color: '#f59e0b', bg: 'bg-amber-500' },
  pasajeros: { label: 'Pasajeros', color: '#a855f7', bg: 'bg-purple-500' },
  otro: { label: 'Otros', color: '#6b7280', bg: 'bg-gray-500' }
};

export const SupervisorDashboard: React.FC = () => {
  const { user } = useAuth();
  
  // Incident trends states
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | 'all'>('all');
  const [trends, setTrends] = useState<TrendMonth[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(true);
  const [errorTrends, setErrorTrends] = useState<string | null>(null);

  const [hoveredPoint, setHoveredPoint] = useState<{ monthIdx: number; x: number; y: number } | null>(null);
  const [activeLines, setActiveLines] = useState<Record<string, boolean>>({
    mecanico: true,
    accidente: true,
    retraso: true,
    pasajeros: true,
    otro: true
  });

  const isGerenteOrSupervisor = user?.roles?.some(roleName => {
    const r = roleName.toUpperCase().replace(/[_\s-]/g, '');
    return [
      'GERENTEOPERACIONES',
      'GERENTEOPERACION',
      'GERENTEDEOPERACION',
      'GERENTEDEOPERACIONES',
      'GERENTE',
      'SUPERVISOR',
      'ADMIN'
    ].includes(r);
  }) ?? false;

  // Load companies and trends data
  const loadTrendsData = async () => {
    try {
      setLoadingTrends(true);
      setErrorTrends(null);
      
      const comps = await businessService.getCompanies();
      setCompanies(comps);

      const companyParam = selectedCompanyId === 'all' ? undefined : selectedCompanyId;
      const data = await businessService.getIncidentTrends(companyParam);
      setTrends(data);
    } catch (err: any) {
      console.error(err);
      setErrorTrends('Error al cargar datos del reporte de tendencias de incidentes.');
    } finally {
      setLoadingTrends(false);
    }
  };

  useEffect(() => {
    if (isGerenteOrSupervisor) {
      loadTrendsData();
    }
  }, [selectedCompanyId, isGerenteOrSupervisor]);

  const activeRoutes = [
    { id: 1, name: 'Centro - Uninorte', buses: 4, load: '75%', status: 'Normal' },
    { id: 2, name: 'Sur - Buenavista', buses: 6, load: '90%', status: 'Congestionado' },
    { id: 3, name: 'Oriente - Terminal', buses: 3, load: '40%', status: 'Normal' },
  ];

  if (!isGerenteOrSupervisor) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[80vh] text-center px-4">
          <div className="bg-indigo-100 rounded-full p-6 mb-6">
            <Shield className="h-16 w-16 text-indigo-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600 max-w-md">
            Solo los usuarios con rol <span className="font-semibold text-indigo-600">GERENTE DE OPERACIONES</span> o <span className="font-semibold text-indigo-600">SUPERVISOR</span> pueden acceder a este panel.
          </p>
        </div>
      </div>
    );
  }

  // Calculate statistics from trends
  const totalIncidents = trends.reduce((acc, month) => {
    return acc + month.mecanico + month.accidente + month.retraso + month.pasajeros + month.otro;
  }, 0);

  const totalsByType = trends.reduce((acc, month) => {
    acc.mecanico += month.mecanico;
    acc.accidente += month.accidente;
    acc.retraso += month.retraso;
    acc.pasajeros += month.pasajeros;
    acc.otro += month.otro;
    return acc;
  }, { mecanico: 0, accidente: 0, retraso: 0, pasajeros: 0, otro: 0 });

  const maxVal = Math.max(
    ...trends.flatMap(month => [
      month.mecanico,
      month.accidente,
      month.retraso,
      month.pasajeros,
      month.otro
    ]),
    5
  );

  const formatMonthName = (monthStr: string) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const monthNames = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];
    return `${monthNames[parseInt(month, 10) - 1]} ${year.substring(2)}`;
  };

  const toggleLine = (type: string) => {
    setActiveLines(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  // SVG Chart Dimensions
  const paddingX = 60;
  const paddingY = 40;
  const width = 800;
  const height = 320;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;
  const pointsCount = trends.length;

  const getSvgPathData = (key: keyof Omit<TrendMonth, 'mes'>) => {
    if (pointsCount === 0) return '';
    return trends.map((month, idx) => {
      const val = month[key] as number;
      const x = paddingX + (idx / (pointsCount - 1)) * chartWidth;
      const y = paddingY + chartHeight - (val / maxVal) * chartHeight;
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-gradient-to-r from-indigo-900 to-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/[0.03] bg-[size:20px_20px]" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
          
          <div className="relative z-10 space-y-2">
            <span className="inline-flex items-center gap-1.5 bg-indigo-500/30 text-indigo-200 text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              Operaciones y Control Ejecutivo
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Panel de Gerencia de Operaciones</h1>
            <p className="text-indigo-200/80 max-w-xl font-medium">Monitoreo en tiempo real de operaciones, rutas y análisis de tendencias de incidentes.</p>
          </div>
          
          <div className="relative z-10 flex flex-wrap gap-3 items-center w-full md:w-auto mt-4 md:mt-0">
            {/* Filter by Company */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 w-full sm:w-auto">
              <Building2 className="h-5 w-5 text-indigo-300" />
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="bg-transparent text-white font-extrabold text-sm border-none outline-none focus:ring-0 cursor-pointer w-full"
              >
                <option value="all" className="bg-slate-900 text-white">Todas las empresas</option>
                {companies.map((comp) => (
                  <option key={comp.id} value={comp.id} className="bg-slate-900 text-white">
                    {comp.nombre}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={loadTrendsData}
              disabled={loadingTrends}
              className="flex items-center justify-center p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              title="Actualizar datos"
            >
              <RefreshCw className={`h-5 w-5 ${loadingTrends ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Rutas Activas"
            value={18}
            icon={Navigation}
            bgColor="bg-blue-50"
            textColor="text-blue-600"
            iconBgColor="bg-blue-100"
            trend="up"
            trendValue="+2 esta semana"
          />
          <StatsCard
            title="Conductores Activos"
            value={42}
            icon={Users}
            bgColor="bg-purple-50"
            textColor="text-purple-600"
            iconBgColor="bg-purple-100"
            trend="up"
            trendValue="+5 hoy"
          />
          <StatsCard
            title="Incidentes Totales"
            value={loadingTrends ? '...' : totalIncidents}
            subtitle={`${totalsByType.mecanico} Mec | ${totalsByType.accidente} Acc`}
            icon={AlertTriangle}
            bgColor="bg-orange-50"
            textColor="text-orange-600"
            iconBgColor="bg-orange-100"
          />
          <StatsCard
            title="Eficiencia Flota"
            value="94%"
            icon={TrendingUp}
            bgColor="bg-green-50"
            textColor="text-green-600"
            iconBgColor="bg-green-100"
            trend="up"
            trendValue="+3% vs ayer"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Monitoring Area */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Real-time Routes Monitoring */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-8 py-6 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="bg-blue-600 p-2 rounded-lg">
                    <Radio className="h-6 w-6 text-white animate-pulse" />
                  </div>
                  Monitoreo en Vivo - Rutas Activas
                  <span className="ml-auto bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold animate-pulse">EN LÍNEA</span>
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      <th className="px-6 py-4">Ruta</th>
                      <th className="px-6 py-4 text-center">Buses</th>
                      <th className="px-6 py-4 text-center">Carga</th>
                      <th className="px-6 py-4">Estado</th>
                      <th className="px-6 py-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {activeRoutes.map((route) => (
                      <tr key={route.id} className="hover:bg-blue-50 transition">
                        <td className="px-6 py-4 font-bold text-gray-900">{route.name}</td>
                        <td className="px-6 py-4 text-center">
                          <MetricBadge label="Buses" value={route.buses} color="blue" size="sm" />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full" 
                                style={{ width: route.load }}
                              ></div>
                            </div>
                            <span className="text-sm font-bold text-gray-700 min-w-max">{route.load}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold ${
                            route.status === 'Normal' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            <div className={`w-2 h-2 rounded-full ${route.status === 'Normal' ? 'bg-green-600 animate-pulse' : 'bg-orange-600 animate-pulse'}`}></div>
                            {route.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-blue-600 hover:text-blue-700 font-bold text-sm hover:underline">Ver Detalles →</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* HU-ENTR-2-016: Premium Incident Trends Chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                      <BarChart className="h-6 w-6" />
                    </div>
                    Tendencia de Incidentes por Tipo (Último Año)
                  </h2>
                  <p className="text-xs text-gray-400 font-medium mt-1">
                    Evolución histórica. Activa/desactiva categorías haciendo clic en los botones.
                  </p>
                </div>
              </div>

              {/* Interactive toggle pills */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-50">
                {Object.entries(INCIDENT_TYPES_CONFIG).map(([key, cfg]) => {
                  const isActive = activeLines[key];
                  return (
                    <button
                      key={key}
                      onClick={() => toggleLine(key)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                        isActive
                          ? `${cfg.bg} text-white shadow-sm scale-100`
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-gray-300'}`} />
                      {cfg.label}
                      <span className="text-[10px] opacity-75">({totalsByType[key as keyof typeof totalsByType]})</span>
                    </button>
                  );
                })}
              </div>

              {/* SVG Line chart visualization */}
              <div className="relative border border-gray-50 rounded-2xl p-4 bg-gradient-to-b from-gray-50/50 to-white overflow-hidden">
                {loadingTrends ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
                    <RefreshCw className="h-8 w-8 animate-spin" />
                    <span className="font-medium text-sm">Cargando tendencias...</span>
                  </div>
                ) : errorTrends ? (
                  <div className="py-20 text-center text-red-500 font-medium text-sm">
                    {errorTrends}
                  </div>
                ) : trends.length === 0 ? (
                  <div className="py-20 text-center text-gray-400 font-medium text-sm">
                    No hay suficientes datos históricos de incidentes.
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto">
                    <svg
                      viewBox={`0 0 ${width} ${height}`}
                      className="w-full h-auto min-w-[600px] overflow-visible"
                    >
                      {/* Grid Y axis */}
                      {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
                        const y = paddingY + chartHeight * p;
                        const gridVal = Math.round(maxVal - (p * maxVal));
                        return (
                          <g key={i}>
                            <line
                              x1={paddingX}
                              y1={y}
                              x2={width - paddingX}
                              y2={y}
                              stroke="#f1f5f9"
                              strokeWidth="1.5"
                              strokeDasharray="4 4"
                            />
                            <text
                              x={paddingX - 12}
                              y={y + 4}
                              fill="#94a3b8"
                              className="text-[10px] font-black text-right"
                              textAnchor="end"
                            >
                              {gridVal}
                            </text>
                          </g>
                        );
                      })}

                      {/* X-axis months */}
                      {trends.map((month, idx) => {
                        const x = paddingX + (idx / (pointsCount - 1)) * chartWidth;
                        return (
                          <g key={idx}>
                            <text
                              x={x}
                              y={height - paddingY + 20}
                              fill="#64748b"
                              className="text-[9px] font-black"
                              textAnchor="middle"
                            >
                              {formatMonthName(month.mes)}
                            </text>
                          </g>
                        );
                      })}

                      {/* Render lines dynamically based on toggle */}
                      {Object.entries(INCIDENT_TYPES_CONFIG).map(([key, cfg]) => {
                        if (!activeLines[key]) return null;
                        return (
                          <g key={key}>
                            {/* Glow */}
                            <path
                              d={getSvgPathData(key as keyof Omit<TrendMonth, 'mes'>)}
                              fill="none"
                              stroke={cfg.color}
                              strokeWidth="5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="opacity-10"
                            />
                            {/* Actual line */}
                            <path
                              d={getSvgPathData(key as keyof Omit<TrendMonth, 'mes'>)}
                              fill="none"
                              stroke={cfg.color}
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            {/* Circle nodes */}
                            {trends.map((month, idx) => {
                              const val = month[key as keyof Omit<TrendMonth, 'mes'>] as number;
                              const x = paddingX + (idx / (pointsCount - 1)) * chartWidth;
                              const y = paddingY + chartHeight - (val / maxVal) * chartHeight;
                              return (
                                <circle
                                  key={idx}
                                  cx={x}
                                  cy={y}
                                  r="3.5"
                                  fill={cfg.color}
                                  stroke="white"
                                  strokeWidth="1.5"
                                  className="cursor-pointer hover:r-5 transition-all"
                                  onMouseEnter={() => setHoveredPoint({ monthIdx: idx, x, y })}
                                  onMouseLeave={() => setHoveredPoint(null)}
                                />
                              );
                            })}
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                )}

                {/* Tooltip detail popup */}
                {hoveredPoint !== null && trends[hoveredPoint.monthIdx] && (
                  <div
                    className="absolute bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-xl shadow-xl text-[10px] space-y-1.5 border border-slate-700/50 z-20 pointer-events-none transition-all duration-100 w-44"
                    style={{
                      left: `${(hoveredPoint.x / width) * 100}%`,
                      top: `${((hoveredPoint.y - 70) / height) * 100}%`,
                      transform: 'translateX(-50%)'
                    }}
                  >
                    <p className="font-black text-indigo-300 border-b border-slate-700/60 pb-1 text-center">
                      {formatMonthName(trends[hoveredPoint.monthIdx].mes)}
                    </p>
                    <div className="space-y-1">
                      {Object.entries(INCIDENT_TYPES_CONFIG).map(([key, cfg]) => {
                        const count = trends[hoveredPoint.monthIdx][key as keyof Omit<TrendMonth, 'mes'>] as number;
                        return (
                          <div key={key} className="flex justify-between items-center font-medium">
                            <span className="flex items-center gap-1.5 text-slate-300">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                              {cfg.label}
                            </span>
                            <span className="font-extrabold">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Sidebar Area - Alerts & Activity */}
          <div className="space-y-6">
            
            {/* Security Alerts */}
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl border border-red-100 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-4 text-white">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <AlertTriangle className="h-6 w-6" />
                  Alertas de Seguridad
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-white border-l-4 border-orange-500 p-4 rounded-lg hover:shadow-md transition">
                  <p className="text-sm font-bold text-gray-900">Desvío en Ruta 02</p>
                  <p className="text-xs text-gray-500 mt-2">Bus #102 fuera de trayectoria hace 2 minutos</p>
                  <button className="mt-3 text-xs font-bold text-orange-600 hover:text-orange-700">Investigar →</button>
                </div>
                <div className="bg-white border-l-4 border-yellow-500 p-4 rounded-lg hover:shadow-md transition">
                  <p className="text-sm font-bold text-gray-900">Aviso de Retraso</p>
                  <p className="text-xs text-gray-500 mt-2">Congestión afectando 4 buses en Punto Norte</p>
                  <button className="mt-3 text-xs font-bold text-yellow-600 hover:text-yellow-700">Ver Más →</button>
                </div>
              </div>
              <div className="px-6 py-3 bg-white border-t border-gray-100">
                <button className="w-full font-bold text-red-600 hover:text-red-700 text-sm transition">
                  Ver Todas las Alertas
                </button>
              </div>
            </div>

            {/* Key Performance Indicators */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-600" />
                KPIs del Día
              </h3>
              <div className="space-y-4">
                <ProgressCard
                  title="Puntualidad"
                  value={94}
                  target={100}
                  unit="%"
                  color="green"
                  icon={CheckCircle}
                />
                <ProgressCard
                  title="Ocupación Promedio"
                  value={72}
                  target={100}
                  unit="%"
                  color="blue"
                  icon={Users}
                />
                <ProgressCard
                  title="Disponibilidad Flota"
                  value={38}
                  target={40}
                  color="purple"
                  icon={Radio}
                />
              </div>
            </div>

            {/* Activity Log */}
            <ActivityFeed
              title="Actividad Reciente"
              activities={[
                {
                  id: '1',
                  title: 'Supervisor García inició sesión',
                  description: 'Acceso al panel de supervisión',
                  timestamp: 'hace 5 min',
                  icon: CheckCircle,
                  color: 'green',
                },
                {
                  id: '2',
                  title: 'Nueva ruta validada',
                  description: 'Ruta "Centro Progresista" agregada al sistema',
                  timestamp: 'hace 15 min',
                  icon: Navigation,
                  color: 'blue',
                },
                {
                  id: '3',
                  title: 'Reporte completado',
                  description: 'Limpieza Bus #04 validada',
                  timestamp: 'hace 42 min',
                  icon: CheckCircle,
                  color: 'green',
                },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
