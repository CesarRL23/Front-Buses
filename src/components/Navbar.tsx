import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Bus, LogOut, User, Shield } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.roles?.some(r => r.toUpperCase() === 'ADMIN') ?? false;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg">
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
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center space-x-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md transition text-sm font-medium"
                  >
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline">Panel Admin</span>
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 text-white hover:text-blue-100 transition px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  <User className="h-5 w-5" />
                  <span className="hidden sm:inline">
                    {user?.firstName} {user?.lastName}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="hidden sm:inline">Cerrar Sesión</span>
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
