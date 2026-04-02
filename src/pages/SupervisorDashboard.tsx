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
  Navigation
} from 'lucide-react';

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="h-8 w-8 text-purple-600" />
            Panel de Supervisión
          </h1>
          <p className="text-gray-500 mt-2">Monitoreo y control operacional del sistema</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bg} p-3 rounded-xl`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <span className="text-xs font-medium text-gray-400">Hoy</span>
              </div>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Monitoring Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <MapPin className="h-6 w-6 text-blue-600" />
                Monitoreo de Rutas en Tiempo Real
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-50">
                      <th className="pb-4">Ruta</th>
                      <th className="pb-4 text-center">Buses</th>
                      <th className="pb-4 text-center">Carga</th>
                      <th className="pb-4">Estado</th>
                      <th className="pb-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {activeRoutes.map((route) => (
                      <tr key={route.id} className="hover:bg-gray-50 transition">
                        <td className="py-4 font-medium text-gray-900">{route.name}</td>
                        <td className="py-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {route.buses}
                          </span>
                        </td>
                        <td className="py-4 text-center text-gray-600">{route.load}</td>
                        <td className="py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            route.status === 'Normal' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                          }`}>
                            <Activity className="h-3 w-3" />
                            {route.status}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <button className="text-blue-600 hover:text-blue-700 text-sm font-semibold">Detalles</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
               <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <BarChart className="h-6 w-6 text-green-600" />
                Análisis Operativo
              </h2>
              <div className="h-64 flex items-end justify-between gap-2 bg-gray-50 p-6 rounded-xl">
                 {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                   <div key={i} className="flex-1 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-lg transition-all hover:opacity-80" style={{ height: `${h}%` }} />
                 ))}
              </div>
              <div className="flex justify-between mt-4 text-xs font-medium text-gray-400 px-2">
                <span>Lun</span><span>Mar</span><span>Mie</span><span>Jue</span><span>Vie</span><span>Sab</span><span>Dom</span>
              </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
            <div className="bg-purple-600 rounded-2xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-purple-200" />
                Alertas de Seguridad
              </h3>
              <div className="space-y-4">
                <div className="bg-white/10 p-3 rounded-lg border border-white/20">
                  <p className="text-sm font-semibold">Desvío en Ruta 02</p>
                  <p className="text-xs text-purple-100 mt-1">Bus #102 fuera de trayectoria hace 2m</p>
                </div>
                <div className="bg-white/10 p-3 rounded-lg border border-white/20">
                  <p className="text-sm font-semibold">Aviso de Retraso</p>
                  <p className="text-xs text-purple-100 mt-1">Congestión en Punto Norte afectando 4 buses</p>
                </div>
              </div>
              <button className="w-full mt-4 bg-white text-purple-600 font-bold py-2 rounded-lg hover:bg-purple-50 transition">
                Ver Todas las Alertas
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
               <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-400" />
                Log de Actividad
              </h3>
              <div className="space-y-4">
                {[
                  { time: '14:20', text: 'Supervisor García inició sesión' },
                  { time: '14:15', text: 'Nueva ruta "Centro Progr." validada' },
                  { time: '13:50', text: 'Reporte de limpieza Bus #04 completado' },
                ].map((log, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-xs font-mono text-blue-600 font-semibold">{log.time}</span>
                    <p className="text-xs text-gray-600">{log.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
