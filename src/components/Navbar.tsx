import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Bus, LogOut, User, Shield, ChevronDown, LayoutDashboard, MapPin, Building, ArrowRight, Bell, Search } from 'lucide-react';
import { adminService } from '../services/adminService';

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
  'ADMIN EMPRESA': {
    path: '/admin-empresa',
    icon: Building,
    title: 'Admin Empresa',
    desc: 'Gestión de rutas y buses',
    color: 'text-orange-600 hover:bg-orange-50 hover:text-orange-700'
  },
  'ADMIN_EMPRESA': {
    path: '/admin-empresa',
    icon: Building,
    title: 'Admin Empresa',
    desc: 'Gestión de rutas y buses',
    color: 'text-orange-600 hover:bg-orange-50 hover:text-orange-700'
  },
  'ADMINEMPRESA': {
    path: '/admin-empresa',
    icon: Building,
    title: 'Admin Empresa',
    desc: 'Gestión de rutas y buses',
    color: 'text-orange-600 hover:bg-orange-50 hover:text-orange-700'
  }
};

const normalizeRole = (role: string) => role.toUpperCase().replace(/[_\s-]/g, ' ');
const normalizeRoleKey = (role: string) => role.toUpperCase().replace(/[_\s-]/g, '');

export const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [canManage, setCanManage] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    const isAdmin = user?.roles?.some(r => r.toUpperCase() === 'ADMIN');
    if (isAdmin) { setCanManage(true); return; }

    adminService.getAllUserRoles().then(userRoles => {
      const myRoles = userRoles.filter(ur => ur.user?.id === user?.id);
      setCanManage(myRoles.length > 0);
    }).catch(() => {});
  }, [isAuthenticated, user?.id, user?.roles]);

  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
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
                  <div className="relative" ref={dropdownRef}>
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
                <button
                  className="relative inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-700 shadow-sm hover:shadow-md transition ml-2"
                  aria-label="Notificaciones"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-white text-[10px] shadow"> </span>
                </button>
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
