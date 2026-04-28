import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Bus, LogOut, User, Shield, ChevronDown, LayoutDashboard, MapPin } from 'lucide-react';
import { adminService } from '../services/adminService';

export const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const isAdmin = user?.roles?.some(r => r.toUpperCase() === 'ADMIN') ?? false;
  const isSupervisor = user?.roles?.some(r => r.toUpperCase() === 'SUPERVISOR') ?? false;
  const isConductor = user?.roles?.some(r => r.toUpperCase() === 'CONDUCTOR') ?? false;
  const isCiudadano = user?.roles?.some(r => r.toUpperCase() === 'CIUDADANO') ?? false;

  const [canManage, setCanManage] = useState(isAdmin);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (isAdmin) { setCanManage(true); return; }

    Promise.all([
      adminService.getAllUserRoles(),
      adminService.getAllRolePermissions()
    ]).then(([userRoles, allPerms]) => {
      const myRoles = userRoles.filter(ur => ur.user?.id === user?.id).map(ur => ur.role?.id);
      const myPerms = allPerms.filter(rp => myRoles.includes(rp.role?.id));
      setCanManage(myPerms.length > 0);
    }).catch(() => {});
  }, [isAuthenticated, isAdmin, user?.id]);

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
                {/* Dropdown de Paneles */}
                {(isAdmin || isSupervisor || isConductor || isCiudadano) && (
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
                        className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl py-2 z-50 border border-gray-100 overflow-hidden"
                      >
                        <div className="px-4 py-2 border-b border-gray-50">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Mis Paneles</p>
                        </div>
                        {isAdmin && (
                          <Link
                            to="/admin"
                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            <Shield className="h-4 w-4 mr-3 text-red-600" />
                            <div className="flex flex-col">
                              <span className="font-semibold">Administrador</span>
                              <span className="text-xs text-gray-500">Gestión total del sistema</span>
                            </div>
                          </Link>
                        )}
                        {isSupervisor && (
                          <Link
                            to="/supervisor"
                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            <Shield className="h-4 w-4 mr-3 text-purple-600" />
                            <div className="flex flex-col">
                              <span className="font-semibold">Supervisor</span>
                              <span className="text-xs text-gray-500">Monitoreo y reportes</span>
                            </div>
                          </Link>
                        )}
                        {isConductor && (
                          <Link
                            to="/conductor"
                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            <Bus className="h-4 w-4 mr-3 text-blue-600" />
                            <div className="flex flex-col">
                              <span className="font-semibold">Conductor</span>
                              <span className="text-xs text-gray-500">Rutas e itinerarios</span>
                            </div>
                          </Link>
                        )}
                        {isCiudadano && (
                          <Link
                            to="/ciudadano"
                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            <MapPin className="h-4 w-4 mr-3 text-green-600" />
                            <div className="flex flex-col">
                              <span className="font-semibold">Ciudadano</span>
                              <span className="text-xs text-gray-500">Consulta de rutas</span>
                            </div>
                          </Link>
                        )}
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
