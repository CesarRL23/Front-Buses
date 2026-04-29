import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Bus, LogOut, User, Shield, ChevronDown, LayoutDashboard, MapPin, Building } from 'lucide-react';
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
    console.log("Current User Roles:", user.roles); // Para depuración
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

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            to={isAuthenticated ? '/dashboard' : '/'}
            className="flex items-center space-x-3 text-white hover:text-blue-100 transition"
          >
            <Bus className="h-8 w-8" />
            <span className="text-xl font-bold">Buses Inteligentes</span>
          </Link>
 
          <div className="flex items-center space-x-2">
            {isAuthenticated ? (
              <>
                {/* Dropdown de Paneles Dinámico */}
                {userPanels.length > 0 && (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center space-x-1 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-md transition text-sm font-medium border border-white/20"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      <span className="hidden xs:inline">Paneles</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isDropdownOpen && (
                      <div 
                        className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl py-2 z-50 border border-gray-100 overflow-hidden"
                      >
                        <div className="px-4 py-2 border-b border-gray-50">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Mis Paneles</p>
                        </div>
                        {userPanels.map((panel) => (
                          <Link
                            key={panel.id}
                            to={panel.path}
                            className={`flex items-center px-4 py-3 text-sm transition-colors ${panel.color}`}
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            <panel.icon className="h-4 w-4 mr-3" />
                            <div className="flex flex-col">
                              <span className="font-semibold">{panel.title}</span>
                              <span className="text-xs opacity-70">{panel.desc}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 text-white hover:text-blue-100 transition px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  <User className="h-5 w-5" />
                  <span className="hidden md:inline">
                    {user?.firstName} {user?.lastName}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="hidden md:inline">Cerrar Sesión</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-white hover:text-blue-100 px-4 py-2 rounded-md hover:bg-blue-700 transition"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/register"
                  className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-md font-medium transition"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
