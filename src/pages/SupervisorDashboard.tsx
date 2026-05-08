import React from 'react';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';
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
  Download
} from 'lucide-react';
import { StatsCard, MetricBadge, ProgressCard, InfoPanel, ActivityFeed } from '../components/DashboardComponents';

export const SupervisorDashboard: React.FC = () => {
  const { user } = useAuth();
  const isSupervisor = user?.roles?.some(r => r.toUpperCase() === 'SUPERVISOR') ?? false;

  const stats = [
    { label: 'Rutas en Servicio', value: '18', icon: Navigation, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Conductores Activos', value: '42', icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Incidentes Reportados', value: '3', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100' },
    { label: 'Eficiencia Flota', value: '94%', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
  ];

  const activeRoutes = [
    { id: 1, name: 'Centro - Uninorte', buses: 4, load: '75%', status: 'Normal' },
    { id: 2, name: 'Sur - Buenavista', buses: 6, load: '90%', status: 'Congestionado' },
    { id: 3, name: 'Oriente - Terminal', buses: 3, load: '40%', status: 'Normal' },
  ];

  if (!isSupervisor) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[80vh] text-center px-4">
          <div className="bg-purple-100 rounded-full p-6 mb-6">
            <Shield className="h-16 w-16 text-purple-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600 max-w-md">
            Solo los usuarios con rol <span className="font-semibold text-purple-600">SUPERVISOR</span> pueden acceder a este panel.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-gray-900 flex items-center gap-3 mb-2">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-2xl shadow-lg">
                <Shield className="h-8 w-8 text-white" />
              </div>
              Panel de Supervisión
            </h1>
            <p className="text-gray-600 text-lg">Monitoreo en tiempo real de operaciones y rutas</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 font-bold px-6 py-3 rounded-xl hover:bg-gray-50 transition shadow-sm">
              <Eye className="h-5 w-5" />
              Ver Mapa
            </button>
            <button className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold px-6 py-3 rounded-xl hover:shadow-lg transition shadow-md">
              <Download className="h-5 w-5" />
              Reportes
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
            title="Incidentes"
            value={3}
            subtitle="2 Resueltos | 1 Pendiente"
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
                  <span className="ml-auto bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">EN LÍNEA</span>
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

            {/* Analytics Chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <BarChart className="h-6 w-6 text-green-600" />
                </div>
                Análisis Operativo Semanal
              </h2>
              <div className="bg-gradient-to-b from-gray-50 to-white p-6 rounded-xl">
                <div className="h-64 flex items-end justify-between gap-3">
                  {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                    <div key={i} className="flex flex-col items-center flex-1 group">
                      <div 
                        className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all hover:opacity-80 cursor-pointer hover:shadow-lg" 
                        style={{ height: `${h}%` }}
                      />
                      <span className="text-xs font-bold text-gray-400 mt-2 group-hover:text-gray-600 transition">
                        {['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'][i]}
                      </span>
                    </div>
                  ))}
                </div>
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
