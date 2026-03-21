import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navbar } from '../components/Navbar';
import { adminService } from '../services/adminService';
import {
  Users,
  Shield,
  Key,
  UserCheck,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

interface Role {
  id: string;
  name: string;
}

interface Permission {
  id: string;
  name: string;
}

interface UserRecord {
  id: string;
  name: string;
  email: string;
}

interface UserRoleRecord {
  id: string;
  user: UserRecord;
  role: Role;
}

interface RolePermissionRecord {
  id: string;
  role: Role;
  permission: Permission;
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-800 border-red-200',
  CONDUCTOR: 'bg-blue-100 text-blue-800 border-blue-200',
  SUPERVISOR: 'bg-purple-100 text-purple-800 border-purple-200',
  CIUDADANO: 'bg-green-100 text-green-800 border-green-200',
};

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  const isAdmin = user?.roles?.some(r => r.toUpperCase() === 'ADMIN') ?? false;

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [allUserRoles, setAllUserRoles] = useState<UserRoleRecord[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Role assignment form state
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Collapsible sections
  const [expandedRole, setExpandedRole] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [usersData, rolesData, userRolesData, rpData] = await Promise.all([
        adminService.getUsers(),
        adminService.getRoles(),
        adminService.getAllUserRoles(),
        adminService.getAllRolePermissions(),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
      setAllUserRoles(userRolesData);
      setRolePermissions(rpData);
    } catch (e) {
      setError('Error al cargar datos. Verifica que el backend esté activo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin, loadData]);

  const getUserRoles = (userId: string): Role[] =>
    allUserRoles
      .filter(ur => ur.user?.id === userId)
      .map(ur => ur.role)
      .filter(Boolean);

  const getRolePermissions = (roleId: string): Permission[] =>
    rolePermissions
      .filter(rp => rp.role?.id === roleId)
      .map(rp => rp.permission)
      .filter(Boolean);

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !selectedRoleId) return;
    setAssigning(true);
    setError('');
    setSuccess('');
    try {
      await adminService.assignRole(selectedUserId, selectedRoleId);
      setSuccess('Rol asignado correctamente.');
      setSelectedUserId('');
      setSelectedRoleId('');
      await loadData();
    } catch {
      setError('Error al asignar el rol. Puede que el usuario ya tenga ese rol.');
    } finally {
      setAssigning(false);
    }
  };

  // Access denied for non-admins
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[80vh] text-center px-4">
          <div className="bg-red-100 rounded-full p-6 mb-6">
            <Shield className="h-16 w-16 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600 max-w-md">
            Solo los usuarios con rol <span className="font-semibold text-red-600">ADMIN</span> pueden
            acceder al panel de administración.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Shield className="h-8 w-8 text-red-600" />
              Panel de Administración
            </h1>
            <p className="text-gray-600 mt-1">Gestión de usuarios, roles y permisos</p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {/* Feedback messages */}
        {error && (
          <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <XCircle className="h-5 w-5 flex-shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            {success}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── LEFT COLUMN: Users Table ── */}
            <div className="lg:col-span-2 space-y-6">

              {/* Role Assignment Form */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                  Asignar Rol a Usuario
                </h2>
                <form onSubmit={handleAssignRole} className="flex flex-col sm:flex-row gap-3">
                  <select
                    id="select-user"
                    value={selectedUserId}
                    onChange={e => setSelectedUserId(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">— Seleccionar usuario —</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                  <select
                    id="select-role"
                    value={selectedRoleId}
                    onChange={e => setSelectedRoleId(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">— Seleccionar rol —</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={assigning}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg transition disabled:opacity-50"
                  >
                    {assigning ? 'Asignando...' : 'Asignar'}
                  </button>
                </form>
              </div>

              {/* Users List */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  Usuarios Registrados
                  <span className="ml-auto text-sm font-normal text-gray-500">
                    {users.length} total
                  </span>
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-gray-500 text-xs uppercase tracking-wider">
                        <th className="pb-3 pr-4">Nombre</th>
                        <th className="pb-3 pr-4">Email</th>
                        <th className="pb-3">Roles</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users.map(u => {
                        const userRoles = getUserRoles(u.id);
                        return (
                          <tr key={u.id} className="hover:bg-gray-50 transition">
                            <td className="py-3 pr-4 font-medium text-gray-900">{u.name}</td>
                            <td className="py-3 pr-4 text-gray-600">{u.email}</td>
                            <td className="py-3">
                              <div className="flex flex-wrap gap-1">
                                {userRoles.length === 0 ? (
                                  <span className="flex items-center gap-1 text-gray-400 text-xs">
                                    <AlertTriangle className="h-3 w-3" /> Sin rol
                                  </span>
                                ) : (
                                  userRoles.map(r => (
                                    <span
                                      key={r.id}
                                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                                        ROLE_COLORS[r.name?.toUpperCase()] || 'bg-gray-100 text-gray-700 border-gray-200'
                                      }`}
                                    >
                                      {r.name}
                                    </span>
                                  ))
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN: Roles & Permissions ── */}
            <div className="bg-white rounded-xl shadow-md p-6 h-fit">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Key className="h-5 w-5 text-purple-600" />
                Roles y Permisos
              </h2>
              <div className="space-y-3">
                {roles.map(role => {
                  const perms = getRolePermissions(role.id);
                  const isOpen = expandedRole === role.id;
                  return (
                    <div key={role.id} className={`border rounded-lg overflow-hidden ${ROLE_COLORS[role.name?.toUpperCase()] ? 'border-current/20' : 'border-gray-200'}`}>
                      <button
                        onClick={() => setExpandedRole(isOpen ? null : role.id)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition"
                      >
                        <span className={`font-semibold text-sm px-2 py-0.5 rounded-full border ${ROLE_COLORS[role.name?.toUpperCase()] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                          {role.name}
                        </span>
                        <span className="text-gray-400 ml-2 flex items-center gap-1 text-xs">
                          {perms.length} permisos
                          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </span>
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-3 border-t border-gray-100 bg-gray-50">
                          {perms.length === 0 ? (
                            <p className="text-gray-400 text-xs mt-2">Sin permisos asignados</p>
                          ) : (
                            <ul className="mt-2 space-y-1">
                              {perms.map(p => (
                                <li key={p.id} className="flex items-center gap-2 text-xs text-gray-700">
                                  <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                                  {p.name}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
