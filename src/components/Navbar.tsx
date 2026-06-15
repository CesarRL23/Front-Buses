import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../context/NotificationContext';
import { Bus, LogOut, User, Shield, ChevronDown, LayoutDashboard, MapPin, Building, ArrowRight, Bell, Search, TrendingUp, X } from 'lucide-react';

// Configuración de metadatos por rol para el menú
const ROLE_CONFIG: Record<string, { path: string; icon: any; title: string; desc: string; color: string }> = {
  'ADMIN': {
    path: '/admin',
    icon: Shield,
    title: 'Administrador',
    desc: 'Gestión total del sistema',
    color: 'text-red-600 hover:bg-red-50 hover:text-red-700'
  },
  'SUPERVISOR': {
    path: '/supervisor',
    icon: Shield,
    title: 'Supervisor',
    desc: 'Monitoreo y reportes',
    color: 'text-purple-600 hover:bg-purple-50 hover:text-purple-700'
  },
  'CONDUCTOR': {
    path: '/conductor',
    icon: Bus,
    title: 'Conductor',
    desc: 'Rutas e itinerarios',
    color: 'text-blue-600 hover:bg-blue-50 hover:text-blue-700'
  },
  'CIUDADANO': {
    path: '/ciudadano',
    icon: MapPin,
    title: 'Ciudadano',
    desc: 'Consulta de rutas',
    color: 'text-green-600 hover:bg-green-50 hover:text-green-700'
  },
  'ADMINEMPRESA': {
    path: '/admin-empresa',
    icon: Building,
    title: 'Admin Empresa',
    desc: 'Gestión de rutas y buses',
    color: 'text-orange-600 hover:bg-orange-50 hover:text-orange-700'
  },

  'ANALISTA DE MARKETING': {
    path: '/marketing-analyst',
    icon: TrendingUp,
    title: 'Analista de Marketing',
    desc: 'Análisis demográfico',
    color: 'text-pink-600 hover:bg-pink-50 hover:text-pink-700'
  },
  'ADMINISTRADOR FINANCIERO': {
    path: '/financial-administrator',
    icon: TrendingUp,
    title: 'Administrador Financiero',
    desc: 'Ingresos por método de pago',
    color: 'text-green-600 hover:bg-green-50 hover:text-green-700'
  },
  'GERENTE DE OPERACIONES': {
    path: '/operations-manager',
    icon: TrendingUp,
    title: 'Gerente de Operaciones',
    desc: 'Tendencias de incidentes',
    color: 'text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700'
  },

};

const normalizeRole = (role: string) => role.toUpperCase().replace(/[_\s-]/g, ' ');
const normalizeRoleKey = (role: string) => role.toUpperCase().replace(/[_\s-]/g, '');

export const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotification();

  const panelDropdownRef = useRef<HTMLDivElement>(null);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelDropdownRef.current && !panelDropdownRef.current.contains(target)) {
        setIsDropdownOpen(false);
      }
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(target)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNotificationToggle = () => {
    setIsNotificationOpen((current) => {
      const nextState = !current;
      if (nextState) {
        markAllAsRead();
      }
      return nextState;
    });
  };

  const getUserPanels = () => {
    if (!user?.roles) return [];
    return user.roles.map(roleName => {
      const upperRole = roleName.toUpperCase();
      const normalizedKey = normalizeRoleKey(roleName);

      // Intentar buscar por nombre exacto, luego normalizado con espacios, luego sin nada
      const config = ROLE_CONFIG[upperRole] ||
        ROLE_CONFIG[normalizeRole(roleName)] ||
        ROLE_CONFIG[normalizedKey] ||
      {
        path: '/dashboard',
        icon: Shield,
        title: roleName,
        desc: 'Panel de control',
        color: 'text-gray-600 hover:bg-gray-50 hover:text-gray-700'
      };
      return { ...config, id: roleName };
    });
  };

  const userPanels = getUserPanels();
  const canAccessPanels = isAuthenticated && userPanels.length > 0;

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/70 backdrop-blur-xl shadow-[0_18px_60px_rgba(2,6,23,0.06)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-4">
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="text-lg font-extrabold text-slate-900">
            Inicio
          </Link>

          {/* Centro: Buscador (desktop) */}
          <div className="hidden md:flex flex-1 items-center justify-center px-4">
            <div className="w-full max-w-lg">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  aria-label="Buscar rutas, paradas o conductores"
                  placeholder="Buscar rutas, paradas o conductores..."
                  className="w-full rounded-full border border-slate-200 bg-white/60 py-2.5 pl-10 pr-4 text-sm placeholder-slate-400 shadow-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated ? (
              <>
                <span className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 lg:inline-flex">
                  <ArrowRight className="h-4 w-4" />
                  Operación activa
                </span>

                {/* Dropdown de Paneles Dinámico */}
                {canAccessPanels && (
                  <div className="relative" ref={panelDropdownRef}>
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-sky-200 hover:text-sky-700 hover:shadow-md"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      <span className="hidden sm:inline">Paneles</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isDropdownOpen && (
                      <div
                        className="absolute right-0 mt-3 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.14)]"
                      >
                        <div className="border-b border-slate-100 px-4 py-3">
                          <p className="soft-label">Mis paneles</p>
                          <p className="mt-1 text-sm text-slate-500">Accesos según tu rol</p>
                        </div>
                        {userPanels.map((panel) => (
                          <Link
                            key={panel.id}
                            to={panel.path}
                            className={`flex items-center px-4 py-3 text-sm transition-colors ${panel.color}`}
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            <panel.icon className="mr-3 h-4 w-4" />
                            <div className="flex flex-col">
                              <span className="font-semibold">{panel.title}</span>
                              <span className="text-xs text-current/70">{panel.desc}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {/* Notificaciones */}
                <div className="relative" ref={notificationDropdownRef}>
                  <button
                    onClick={() => {
                      handleNotificationToggle();
                      setIsDropdownOpen(false);
                    }}
                    className="relative inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-700 shadow-sm hover:shadow-md transition ml-2"
                    aria-label="Notificaciones"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white shadow">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {isNotificationOpen && (
                    <div className="absolute right-0 mt-3 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.14)]">
                      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Notificaciones</p>
                          <p className="text-xs text-slate-500">Últimos eventos de proximidad</p>
                        </div>
                        <button
                          onClick={() => setIsNotificationOpen(false)}
                          className="rounded-full p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                          aria-label="Cerrar notificaciones"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      {notifications.length === 0 ? (
                        <div className="p-4 text-sm text-slate-500">No hay notificaciones recientes.</div>
                      ) : (
                        <div className="max-h-72 overflow-y-auto">
                          {notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`border-b border-slate-100 px-4 py-3 ${
                                notification.isUrgent ? 'bg-red-50' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                                    {notification.isUrgent && (
                                      <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                        Urgente
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-1 text-xs text-slate-500">{notification.message}</p>
                                  {notification.kind !== 'announcement' && (
                                    <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-slate-400">
                                      {notification.routeName} · {notification.placa} · {notification.etaMinutes} min
                                    </p>
                                  )}
                                </div>
                                {notification.kind !== 'announcement' && (
                                  <button
                                    onClick={() => {
                                      markAsRead(notification.id);
                                      notification.onAction?.();
                                    }}
                                    className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-200"
                                  >
                                    {notification.actionLabel ?? 'Ver'}
                                  </button>
                                )}
                              </div>
                              {notification.kind === 'announcement' && !notification.read && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="mt-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-200"
                                >
                                  Marcar como leído
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <Link
                  to="/profile"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-sky-200 hover:text-sky-700 hover:shadow-md"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden md:inline">
                    {user?.firstName} {user?.lastName}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 hover:shadow-md"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden md:inline">Cerrar Sesión</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-full px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:text-sky-700"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-600 to-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md"
                >
                  <span>Registrarse</span>
                  <ChevronDown className="h-4 w-4 -rotate-90" />
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
