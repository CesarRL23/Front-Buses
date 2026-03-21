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
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Bienvenido, {user?.firstName} {user?.lastName}
          </h1>
          <p className="text-gray-600 mt-2">Panel de control del sistema de Buses Inteligentes</p>

          {/* Roles badges */}
          <div className="mt-4 flex flex-wrap gap-2">
            {user?.roles && user.roles.length > 0 ? (
              user.roles.map(role => (
                <span
                  key={role}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
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
            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition"
              >
                <Shield className="h-4 w-4 mr-1" />
                Ir al Panel Admin →
              </Link>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-green-600 text-sm font-medium flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  {stat.change}
                </span>
              </div>
              <h3 className="text-gray-600 text-sm font-medium">{stat.title}</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent activity */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Activity className="h-6 w-6 mr-2 text-blue-600" />
                Actividad Reciente
              </h2>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">Ver todas</button>
            </div>
            <div className="space-y-4">
              {recentActivity.map(activity => (
                <div key={activity.id} className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition">
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
                    <p className="text-gray-900 font-medium">{activity.action}</p>
                    <p className="text-gray-500 text-sm flex items-center mt-1">
                      <Clock className="h-4 w-4 mr-1" />
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* My Roles & Permissions */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Key className="h-5 w-5 text-purple-600" />
              Mis Roles y Permisos
            </h2>
            <div className="space-y-3">
              {userRolesData.length === 0 ? (
                <p className="text-gray-400 text-sm">No tienes roles asignados aún.</p>
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
                        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 transition"
                      >
                        <span
                          className={`font-semibold text-sm px-2 py-0.5 rounded-full ${
                            ROLE_COLORS[role.name?.toUpperCase()] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {role.name}
                        </span>
                        <span className="text-gray-400 text-xs flex items-center gap-1">
                          {perms.length} permisos
                          {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </span>
                      </button>
                      {isOpen && (
                        <div className="px-3 pb-2 border-t border-gray-100 bg-gray-50">
                          {perms.length === 0 ? (
                            <p className="text-gray-400 text-xs mt-2">Sin permisos</p>
                          ) : (
                            <ul className="mt-2 space-y-1">
                              {perms.map(p => (
                                <li key={p.id} className="text-xs text-gray-700 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
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
            <h2 className="text-xl font-bold text-gray-900 mt-6 mb-4 flex items-center">
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
                    <span className="font-medium text-gray-700">{route.name}</span>
                    <span className="text-gray-600">{route.trips} viajes</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${route.color} h-2 rounded-full`}
                      style={{ width: `${(route.trips / 45) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-6 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition">
              Ver Mapa Completo
            </button>
          </div>
        </div>

        {/* Security banner */}
        <div className="mt-6 bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Sistema de Seguridad Activo</h3>
              <p className="text-blue-100">Todos los buses están monitoreados en tiempo real</p>
            </div>
            <Shield className="h-16 w-16 text-blue-200" />
          </div>
        </div>
      </div>
    </div>
  );
};
