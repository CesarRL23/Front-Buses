import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Navbar } from '../components/Navbar';
import { adminService } from '../services/adminService';
import {
  Bus,
  Users,
  MapPin,
  Activity,
  Shield,
  Clock,
  TrendingUp,
  AlertCircle,
  Key,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { CompanyManager } from '../components/CompanyManager';


const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-800',
  CONDUCTOR: 'bg-blue-100 text-blue-800',
  SUPERVISOR: 'bg-purple-100 text-purple-800',
  CIUDADANO: 'bg-green-100 text-green-800',
};

export const Dashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [userCount, setUserCount] = useState<number>(0);
  const [userRolesData, setUserRolesData] = useState<any[]>([]);
  const [rolePermissions, setRolePermissions] = useState<any[]>([]);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);

  const isAdmin = user?.roles?.some(r => r.toUpperCase() === 'ADMIN') ?? false;
  const isSupervisor = user?.roles?.some(r => r.toUpperCase() === 'SUPERVISOR') ?? false;
  const isConductor = user?.roles?.some(r => r.toUpperCase() === 'CONDUCTOR') ?? false;
  const isCiudadano = user?.roles?.some(r => r.toUpperCase() === 'CIUDADANO') ?? false;

  useEffect(() => {
    if (!token || !user?.id) return;

    // Fetch user count
    adminService.getUsers()
      .then(users => setUserCount(users.length))
      .catch(() => {});

    // Fetch current user's roles with their associated permissions
    adminService.getUserRoles(user.id)
      .then(ur => setUserRolesData(ur))
      .catch(() => {});

    // Fetch all role permissions
    adminService.getAllRolePermissions()
      .then(rp => setRolePermissions(rp))
      .catch(() => {});
  }, [token, user?.id]);

  const getPermissionsForRole = (roleId: string) =>
    rolePermissions
      .filter(rp => rp.role?.id === roleId)
      .map(rp => rp.permission)
      .filter(Boolean);

  const stats = [
    {
      title: 'Buses Activos',
      value: '24',
      change: '+12%',
      icon: Bus,
      color: 'bg-blue-500',
    },
    {
      title: 'Usuarios Totales',
      value: userCount.toString(),
      change: '+8%',
      icon: Users,
      color: 'bg-green-500',
    },
    {
      title: 'Rutas Activas',
      value: '15',
      change: '+3%',
      icon: MapPin,
      color: 'bg-purple-500',
    },
    {
      title: 'Alertas Hoy',
      value: '7',
      change: '-5%',
      icon: AlertCircle,
      color: 'bg-orange-500',
    },
  ];

  const recentActivity = [
    { id: 1, action: 'Bus #45 completó ruta Centro-Norte', time: 'Hace 5 minutos', type: 'success' },
    { id: 2, action: 'Nueva alerta: Tráfico en Av. Principal', time: 'Hace 15 minutos', type: 'warning' },
    { id: 3, action: 'Usuario nuevo registrado', time: 'Hace 1 hora', type: 'info' },
    { id: 4, action: 'Mantenimiento programado Bus #12', time: 'Hace 2 horas', type: 'info' },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="hero-panel mb-8 overflow-hidden p-6 lg:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr] lg:items-center">
            <div>
              <span className="pill-badge">Red de buses y rutas urbanas</span>
              <h1 className="mt-4 font-['Space_Grotesk'] text-3xl font-bold tracking-tight sm:text-4xl">
                Bienvenido, {user?.firstName} {user?.lastName}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-sky-50/90 sm:text-base">
                Controla la operación, revisa rutas activas y supervisa el estado de la flota desde un panel más claro y profesional.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
            {user?.roles && user.roles.length > 0 ? (
              user.roles.map(role => (
                <span
                  key={role}
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${
                    ROLE_COLORS[role.toUpperCase()] || 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <Shield className="h-4 w-4 mr-1" />
                  {role}
                </span>
              ))
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                <Shield className="h-4 w-4 mr-1" />
                Sin rol asignado
              </span>
            )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {[
                { label: 'Buses activos', value: '24' },
                { label: 'Rutas en servicio', value: '15' },
                { label: 'Alertas hoy', value: '7' },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/15 bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-sky-50/70">{item.label}</p>
                  <p className="mt-2 text-2xl font-bold">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={index} className="surface-card p-6 transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
              <div className="mb-4 flex items-center justify-between">
                <div className={`${stat.color} rounded-2xl p-3 shadow-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <span className="flex items-center text-sm font-medium text-emerald-600">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  {stat.change}
                </span>
              </div>
              <h3 className="text-sm font-medium text-slate-500">{stat.title}</h3>
              <p className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* GESTIÓN DE EMPRESAS (Dinámico por permisos) */}
        <div className="mb-8">
          <CompanyManager />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent activity */}
          <div className="surface-card lg:col-span-2 p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="flex items-center text-xl font-bold text-slate-900">
                <Activity className="h-6 w-6 mr-2 text-blue-600" />
                Actividad Reciente
              </h2>
              <button className="text-sm font-medium text-sky-700 hover:text-sky-800">Ver todas</button>
            </div>
            <div className="space-y-4">
              {recentActivity.map(activity => (
                <div key={activity.id} className="flex items-start space-x-4 rounded-2xl p-4 transition hover:bg-slate-50">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === 'success'
                        ? 'bg-green-500'
                        : activity.type === 'warning'
                        ? 'bg-orange-500'
                        : 'bg-blue-500'
                    }`}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{activity.action}</p>
                    <p className="mt-1 flex items-center text-sm text-slate-500">
                      <Clock className="h-4 w-4 mr-1" />
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* My Roles & Permissions */}
          <div className="surface-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900">
              <Key className="h-5 w-5 text-purple-600" />
              Mis Roles y Permisos
            </h2>
            <div className="space-y-3">
              {userRolesData.length === 0 ? (
                <p className="text-sm text-slate-400">No tienes roles asignados aún.</p>
              ) : (
                userRolesData.map(ur => {
                  const role = ur.role;
                  if (!role) return null;
                  const perms = getPermissionsForRole(role.id);
                  const isOpen = expandedRole === role.id;
                  return (
                    <div key={ur.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedRole(isOpen ? null : role.id)}
                        className="flex w-full items-center justify-between px-3 py-3 text-left transition hover:bg-slate-50"
                      >
                        <span
                          className={`rounded-full px-2 py-0.5 text-sm font-semibold ${
                            ROLE_COLORS[role.name?.toUpperCase()] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {role.name}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          {perms.length} permisos
                          {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </span>
                      </button>
                      {isOpen && (
                        <div className="border-t border-slate-100 bg-slate-50 px-3 pb-2">
                          {perms.length === 0 ? (
                            <p className="mt-2 text-xs text-slate-400">Sin permisos</p>
                          ) : (
                            <ul className="mt-2 space-y-1">
                              {perms.map(p => (
                                <li key={p.id} className="flex items-center gap-1 text-xs text-slate-700">
                                  <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
                                  {p.name}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Popular routes section */}
            <h2 className="mt-6 mb-4 flex items-center text-xl font-bold text-slate-900">
              <MapPin className="h-6 w-6 mr-2 text-purple-600" />
              Rutas Populares
            </h2>
            <div className="space-y-4">
              {[
                { name: 'Centro - Norte', trips: 45, color: 'bg-blue-500' },
                { name: 'Sur - Este', trips: 38, color: 'bg-green-500' },
                { name: 'Oeste - Centro', trips: 32, color: 'bg-purple-500' },
                { name: 'Norte - Sur', trips: 28, color: 'bg-orange-500' },
              ].map((route, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700">{route.name}</span>
                    <span className="text-slate-600">{route.trips} viajes</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200">
                    <div
                      className={`${route.color} h-2 rounded-full`}
                      style={{ width: `${(route.trips / 45) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-6 w-full rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-600 py-3 font-semibold text-white transition hover:shadow-lg">
              Ver Mapa Completo
            </button>
          </div>
        </div>

        {/* Security banner */}
        <div className="hero-panel mt-6 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Sistema de Seguridad Activo</h3>
              <p className="text-blue-100">Todos los buses están monitoreados en tiempo real</p>
            </div>
            <Shield className="h-16 w-16 text-cyan-100" />
          </div>
        </div>
      </div>
    </div>
  );
};
