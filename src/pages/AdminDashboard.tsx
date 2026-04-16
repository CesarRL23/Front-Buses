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
  Trash2,
  Pencil,
  Plus,
  X,
  Save,
  Lock,
  Unlock,
  Briefcase,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Role { id: string; name: string; description?: string; }
interface Permission { id: string; url: string; method: string; description: string; }
interface UserRecord { id: string; name: string; email: string; }
interface UserRoleRecord { id: string; user: UserRecord; role: Role; }
interface RolePermissionRecord { id: string; role: Role; permission: Permission; }

// ─── Constants ────────────────────────────────────────────────────────────────
const ROLE_COLORS: Record<string, string> = {
  ADMIN:      'bg-red-100 text-red-800 border-red-200',
  CONDUCTOR:  'bg-blue-100 text-blue-800 border-blue-200',
  SUPERVISOR: 'bg-purple-100 text-purple-800 border-purple-200',
  CIUDADANO:  'bg-green-100 text-green-800 border-green-200',
};

const METHOD_COLORS: Record<string, string> = {
  GET:    'bg-emerald-100 text-emerald-700 border-emerald-300',
  POST:   'bg-blue-100 text-blue-700 border-blue-300',
  PUT:    'bg-amber-100 text-amber-700 border-amber-300',
  DELETE: 'bg-red-100 text-red-700 border-red-300',
  PATCH:  'bg-purple-100 text-purple-700 border-purple-300',
};

// ─── Feedback component ────────────────────────────────────────────────────────
const Feedback: React.FC<{ error: string; success: string }> = ({ error, success }) => (
  <>
    {error && (
      <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
        <XCircle className="h-4 w-4 flex-shrink-0" /> {error}
      </div>
    )}
    {success && (
      <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
        <CheckCircle className="h-4 w-4 flex-shrink-0" /> {success}
      </div>
    )}
  </>
);

// ─── Confirm Dialog ────────────────────────────────────────────────────────────
const ConfirmDialog: React.FC<{
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-gray-700 text-sm">{message}</p>
      </div>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition"
        >
          Confirmar
        </button>
      </div>
    </div>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────
export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.roles?.some(r => r.toUpperCase() === 'ADMIN') ?? false;

  // Data
  const [users, setUsers]               = useState<UserRecord[]>([]);
  const [roles, setRoles]               = useState<Role[]>([]);
  const [allUserRoles, setAllUserRoles] = useState<UserRoleRecord[]>([]);
  const [permissions, setPermissions]   = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermissionRecord[]>([]);

  // UI
  const [activeTab, setActiveTab]       = useState<'users' | 'roles' | 'permissions' | 'rolePerms'>('users');
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);

  // ── Users tab state ──
  const [editingUser, setEditingUser]   = useState<UserRecord | null>(null);
  const [editUserForm, setEditUserForm] = useState({ name: '', email: '' });
  const [savingUser, setSavingUser]     = useState(false);

  // Role assignment
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [assigning, setAssigning]           = useState(false);

  // Expanded row for user roles
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  // ── Roles tab state ──
  const [roleForm, setRoleForm]         = useState({ name: '', description: '' });
  const [editingRole, setEditingRole]   = useState<Role | null>(null);
  const [savingRole, setSavingRole]     = useState(false);

  // ── Permissions tab state ──
  const [permForm, setPermForm]         = useState({ url: '', method: 'GET', description: '' });
  const [editingPerm, setEditingPerm]   = useState<Permission | null>(null);
  const [savingPerm, setSavingPerm]     = useState(false);

  // ── Role-Permissions tab state ──
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [selectedRoleForPerm, setSelectedRoleForPerm] = useState('');
  const [selectedPermForRole, setSelectedPermForRole] = useState('');
  const [assigningPerm, setAssigningPerm] = useState(false);

  // ── Permissions State ──
  const [perms, setPerms] = useState({
    canListUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canAssignRoles: false,
    canManageRoles: false,
    canManagePerms: false,
  });

  // ─── Feedback auto-clear ───────────────────────────────────────────────────
  useEffect(() => {
    if (!success && !error) return;
    const t = setTimeout(() => { setSuccess(''); setError(''); }, 4000);
    return () => clearTimeout(t);
  }, [success, error]);

  // ─── Load data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [rolesData, userRolesData, rpData, permsData] = await Promise.all([
        adminService.getRoles(),
        adminService.getAllUserRoles(),
        adminService.getAllRolePermissions(),
        adminService.getPermissions(),
      ]);

      const myRoles = userRolesData.filter(ur => ur.user?.id === user?.id).map(ur => ur.role?.id);
      const myPermRecords = rpData.filter(rp => myRoles.includes(rp.role?.id)).map(rp => rp.permission);

      const hasPerm = (urlPart: string, method: string) => 
        isAdmin || myPermRecords.some((p: any) => p?.url?.includes(urlPart) && p?.method === method);

      const canListUsers = hasPerm('/users', 'GET');
      const canEditUsers = hasPerm('/users', 'PUT');
      const canDeleteUsers = hasPerm('/users', 'DELETE');
      const canAssignRoles = hasPerm('/user-role', 'POST'); 
      const canManageRoles = hasPerm('/roles', 'POST') || hasPerm('/roles', 'PUT');
      const canManagePerms = hasPerm('/permissions', 'POST');

      setPerms({ canListUsers, canEditUsers, canDeleteUsers, canAssignRoles, canManageRoles, canManagePerms });

      if (canListUsers) {
        setUsers(await adminService.getUsers());
      } else {
        setUsers([]);
      }
      setRoles(rolesData);
      setAllUserRoles(userRolesData);
      setRolePermissions(rpData);
      setPermissions(permsData);

      if (!canListUsers && activeTab === 'users') {
         if (canManageRoles) setActiveTab('roles');
         else if (canManagePerms) setActiveTab('permissions');
      }

    } catch {
      setError('Error al cargar datos. Verifica que tu token sea válido.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, isAdmin, activeTab]);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const getUserRoles = (userId: string): UserRoleRecord[] =>
    allUserRoles.filter(ur => ur.user?.id === userId);

  const getRolePerms = (roleId: string): RolePermissionRecord[] =>
    rolePermissions.filter(rp => rp.role?.id === roleId);

  const ask = (message: string, onConfirm: () => void) =>
    setConfirmDialog({ message, onConfirm });

  // ─── User handlers ─────────────────────────────────────────────────────────
  const startEditUser = (u: UserRecord) => {
    setEditingUser(u);
    setEditUserForm({ name: u.name, email: u.email });
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    setSavingUser(true);
    setError(''); setSuccess('');
    try {
      await adminService.updateUser(editingUser.id, editUserForm);
      setSuccess('Usuario actualizado correctamente.');
      setEditingUser(null);
      await loadData();
    } catch {
      setError('Error al actualizar el usuario.');
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = (u: UserRecord) => {
    ask(`¿Eliminar al usuario "${u.name}"? Esta acción no se puede deshacer.`, async () => {
      setConfirmDialog(null);
      setError(''); setSuccess('');
      try {
        await adminService.deleteUser(u.id);
        setSuccess(`Usuario "${u.name}" eliminado.`);
        await loadData();
      } catch {
        setError('Error al eliminar el usuario.');
      }
    });
  };

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !selectedRoleId) return;
    setAssigning(true); setError(''); setSuccess('');
    try {
      await adminService.assignRole(selectedUserId, selectedRoleId);
      setSuccess('Rol asignado correctamente.');
      setSelectedUserId(''); setSelectedRoleId('');
      await loadData();
    } catch {
      setError('Error al asignar el rol. Puede que el usuario ya tenga ese rol.');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveUserRole = (ur: UserRoleRecord) => {
    ask(`¿Quitar el rol "${ur.role?.name}" al usuario "${ur.user?.name}"?`, async () => {
      setConfirmDialog(null);
      try {
        await adminService.removeUserRole(ur.id);
        setSuccess('Rol eliminado del usuario.');
        await loadData();
      } catch {
        setError('Error al quitar el rol.');
      }
    });
  };

  // ─── Permission handlers ───────────────────────────────────────────────────
  const handleSavePerm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPerm(true); setError(''); setSuccess('');
    try {
      if (editingPerm) {
        await adminService.updatePermission(editingPerm.id, permForm);
        setSuccess('Permiso actualizado.');
      } else {
        await adminService.createPermission(permForm);
        setSuccess('Permiso creado.');
      }
      setEditingPerm(null);
      setPermForm({ url: '', method: 'GET', description: '' });
      await loadData();
    } catch {
      setError('Error al guardar el permiso.');
    } finally {
      setSavingPerm(false);
    }
  };

  const startEditPerm = (p: Permission) => {
    setEditingPerm(p);
    setPermForm({ url: p.url, method: p.method, description: p.description });
  };

  const handleDeletePerm = (p: Permission) => {
    ask(`¿Eliminar el permiso "${p.description || p.url}"?`, async () => {
      setConfirmDialog(null);
      try {
        await adminService.deletePermission(p.id);
        setSuccess('Permiso eliminado.');
        await loadData();
      } catch {
        setError('Error al eliminar el permiso.');
      }
    });
  };

  // ─── Role handlers ──────────────────────────────────────────────────────────
  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingRole(true); setError(''); setSuccess('');
    try {
      if (editingRole) {
        await adminService.updateRole(editingRole.id, roleForm);
        setSuccess('Rol actualizado.');
      } else {
        await adminService.createRole(roleForm);
        setSuccess('Rol creado.');
      }
      setEditingRole(null);
      setRoleForm({ name: '', description: '' });
      await loadData();
    } catch {
      setError('Error al guardar el rol.');
    } finally {
      setSavingRole(false);
    }
  };

  const startEditRole = (r: Role) => {
    setEditingRole(r);
    setRoleForm({ name: r.name, description: r.description || '' });
  };

  const handleDeleteRole = (r: Role) => {
    ask(`¿Eliminar el rol "${r.name}"?`, async () => {
      setConfirmDialog(null);
      try {
        await adminService.deleteRole(r.id);
        setSuccess('Rol eliminado.');
        await loadData();
      } catch {
        setError('Error al eliminar el rol.');
      }
    });
  };

  // ─── Role-Permission handlers ──────────────────────────────────────────────
  const handleAssignPermToRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoleForPerm || !selectedPermForRole) return;
    setAssigningPerm(true); setError(''); setSuccess('');
    try {
      await adminService.addPermissionToRole(selectedRoleForPerm, selectedPermForRole);
      setSuccess('Permiso asignado al rol correctamente.');
      setSelectedRoleForPerm(''); setSelectedPermForRole('');
      await loadData();
    } catch {
      setError('Error al asignar el permiso al rol.');
    } finally {
      setAssigningPerm(false);
    }
  };

  const handleRemoveRolePerm = (rp: RolePermissionRecord) => {
    ask(
      `¿Quitar el permiso "${rp.permission?.description || rp.permission?.url}" del rol "${rp.role?.name}"?`,
      async () => {
        setConfirmDialog(null);
        try {
          await adminService.removeRolePermission(rp.id);
          setSuccess('Permiso quitado del rol.');
          await loadData();
        } catch {
          setError('Error al quitar el permiso.');
        }
      }
    );
  };

  // ─── Access denied ─────────────────────────────────────────────────────────
  if (!loading && !perms.canListUsers && !perms.canManageRoles && !perms.canManagePerms) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[80vh] text-center px-4">
          <div className="bg-red-100 rounded-full p-6 mb-6">
            <Shield className="h-16 w-16 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600 max-w-md">
            Solo los usuarios con rol <span className="font-semibold text-red-600">ADMIN</span> o con los permisos correspondientes pueden acceder al panel de gestión.
          </p>
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {confirmDialog && (
        <ConfirmDialog
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Shield className="h-8 w-8 text-red-600" />
              Panel de Administración
            </h1>
            <p className="text-gray-500 mt-1 text-sm">Gestión completa de usuarios, permisos y roles</p>
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

        <Feedback error={error} success={success} />

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-6 shadow-sm w-fit">
          {([
            perms.canListUsers ? { key: 'users', label: 'Usuarios', icon: Users } : null,
            perms.canManageRoles ? { key: 'roles', label: 'Roles', icon: Briefcase } : null,
            perms.canManagePerms ? { key: 'permissions', label: 'Permisos', icon: Key } : null,
            perms.canManagePerms ? { key: 'rolePerms', label: 'Roles → Permisos', icon: Lock } : null,
          ].filter(Boolean) as any[]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === key
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            {/* ══════════════════════════════════════════
                TAB: USUARIOS
            ══════════════════════════════════════════ */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                {/* Assign role form */}
                {perms.canAssignRoles && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <UserCheck className="h-5 w-5 text-blue-600" />
                      Asignar Rol a Usuario
                    </h2>
                    <form onSubmit={handleAssignRole} className="flex flex-col sm:flex-row gap-3">
                      <select
                        id="select-user"
                        value={selectedUserId}
                        onChange={e => setSelectedUserId(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">— Seleccionar usuario —</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                        ))}
                      </select>
                      <select
                        id="select-role"
                        value={selectedRoleId}
                        onChange={e => setSelectedRoleId(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">— Seleccionar rol —</option>
                        {roles.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        disabled={assigning}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition disabled:opacity-50 whitespace-nowrap"
                      >
                        {assigning ? 'Asignando...' : 'Asignar Rol'}
                      </button>
                    </form>
                  </div>
                )}

                {/* Edit user modal-inline */}
                {editingUser && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                    <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <Pencil className="h-4 w-4" /> Editando usuario
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        placeholder="Nombre"
                        value={editUserForm.name}
                        onChange={e => setEditUserForm(f => ({ ...f, name: e.target.value }))}
                        className="flex-1 border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={editUserForm.email}
                        onChange={e => setEditUserForm(f => ({ ...f, email: e.target.value }))}
                        className="flex-1 border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleSaveUser}
                        disabled={savingUser}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50"
                      >
                        <Save className="h-4 w-4" />
                        {savingUser ? 'Guardando...' : 'Guardar'}
                      </button>
                      <button
                        onClick={() => setEditingUser(null)}
                        className="flex items-center gap-1 text-gray-600 hover:text-gray-900 text-sm px-3 py-2 rounded-lg border border-gray-300 bg-white transition"
                      >
                        <X className="h-4 w-4" /> Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Users table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-600" />
                    Usuarios Registrados
                    <span className="ml-auto text-xs font-normal text-gray-400">{users.length} total</span>
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-left text-gray-400 text-xs uppercase tracking-wider">
                          <th className="pb-3 pr-4">Nombre</th>
                          <th className="pb-3 pr-4">Email</th>
                          <th className="pb-3 pr-4">Roles</th>
                          <th className="pb-3 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(u => {
                          const userRoles = getUserRoles(u.id);
                          const isExpanded = expandedUser === u.id;
                          return (
                            <React.Fragment key={u.id}>
                              <tr className="border-b border-gray-50 hover:bg-gray-50 transition">
                                <td className="py-3 pr-4 font-medium text-gray-900">{u.name}</td>
                                <td className="py-3 pr-4 text-gray-500">{u.email}</td>
                                <td className="py-3 pr-4">
                                  <button
                                    onClick={() => setExpandedUser(isExpanded ? null : u.id)}
                                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                                  >
                                    {userRoles.length} rol{userRoles.length !== 1 ? 'es' : ''}
                                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                  </button>
                                </td>
                                <td className="py-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    {perms.canEditUsers && (
                                      <button
                                        onClick={() => startEditUser(u)}
                                        title="Editar usuario"
                                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </button>
                                    )}
                                    {perms.canDeleteUsers && (
                                      <button
                                        onClick={() => handleDeleteUser(u)}
                                        title="Eliminar usuario"
                                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr className="bg-gray-50 border-b border-gray-100">
                                  <td colSpan={4} className="px-4 py-3">
                                    {userRoles.length === 0 ? (
                                      <p className="text-gray-400 text-xs flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3" /> Sin roles asignados
                                      </p>
                                    ) : (
                                      <div className="flex flex-wrap gap-2">
                                        {userRoles.map(ur => (
                                          <span
                                            key={ur.id}
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                                              ROLE_COLORS[ur.role?.name?.toUpperCase()] || 'bg-gray-100 text-gray-700 border-gray-200'
                                            }`}
                                          >
                                            {ur.role?.name}
                                            {perms.canAssignRoles && (
                                              <button
                                                onClick={() => handleRemoveUserRole(ur)}
                                                title="Quitar rol"
                                                className="hover:opacity-70 transition"
                                              >
                                                <X className="h-3 w-3" />
                                              </button>
                                            )}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                        {users.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-gray-400 text-sm">
                              No hay usuarios registrados.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════
                TAB: ROLES
            ══════════════════════════════════════════ */}
            {activeTab === 'roles' && (
              <div className="space-y-6">
                {/* Create / Edit role form */}
                <div className={`rounded-xl border p-6 ${editingRole ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200 shadow-sm'}`}>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    {editingRole ? <Pencil className="h-5 w-5 text-amber-600" /> : <Plus className="h-5 w-5 text-blue-600" />}
                    {editingRole ? 'Editando Rol' : 'Nuevo Rol'}
                  </h2>
                  <form onSubmit={handleSaveRole} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Nombre (ej: ADMIN)"
                      value={roleForm.name}
                      onChange={e => setRoleForm(f => ({ ...f, name: e.target.value.toUpperCase() }))}
                      required
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Descripción"
                      value={roleForm.description}
                      onChange={e => setRoleForm(f => ({ ...f, description: e.target.value }))}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2">
                       <button
                        type="submit"
                        disabled={savingRole}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50"
                      >
                        <Save className="h-4 w-4" />
                        {savingRole ? 'Guardando...' : editingRole ? 'Actualizar' : 'Crear'}
                      </button>
                      {editingRole && (
                        <button
                          type="button"
                          onClick={() => { setEditingRole(null); setRoleForm({ name: '', description: '' }); }}
                          className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Roles list */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-purple-600" />
                    Roles del Sistema
                    <span className="ml-auto text-xs font-normal text-gray-400">{roles.length} total</span>
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-left text-gray-400 text-xs uppercase tracking-wider">
                          <th className="pb-3 pr-4">Nombre</th>
                          <th className="pb-3 pr-4">Descripción</th>
                          <th className="pb-3 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roles.map(r => (
                          <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                            <td className="py-3 pr-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${ROLE_COLORS[r.name?.toUpperCase()] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                {r.name}
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-gray-600">{r.description || 'Sin descripción'}</td>
                            <td className="py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => startEditRole(r)}
                                  title="Editar rol"
                                  className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRole(r)}
                                  title="Eliminar rol"
                                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════
                TAB: PERMISOS
            ══════════════════════════════════════════ */}
            {activeTab === 'permissions' && (
              <div className="space-y-6">
                {/* Create / Edit permission form */}
                <div className={`rounded-xl border p-6 ${editingPerm ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200 shadow-sm'}`}>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    {editingPerm ? <Pencil className="h-5 w-5 text-amber-600" /> : <Plus className="h-5 w-5 text-blue-600" />}
                    {editingPerm ? 'Editando Permiso' : 'Nuevo Permiso'}
                  </h2>
                  <form onSubmit={handleSavePerm} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <input
                      type="text"
                      placeholder="URL  (ej: /users)"
                      value={permForm.url}
                      onChange={e => setPermForm(f => ({ ...f, url: e.target.value }))}
                      required
                      className="sm:col-span-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={permForm.method}
                      onChange={e => setPermForm(f => ({ ...f, method: e.target.value }))}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Descripción"
                      value={permForm.description}
                      onChange={e => setPermForm(f => ({ ...f, description: e.target.value }))}
                      required
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={savingPerm}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50"
                      >
                        <Save className="h-4 w-4" />
                        {savingPerm ? 'Guardando...' : editingPerm ? 'Actualizar' : 'Crear'}
                      </button>
                      {editingPerm && (
                        <button
                          type="button"
                          onClick={() => { setEditingPerm(null); setPermForm({ url: '', method: 'GET', description: '' }); }}
                          className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Permissions list */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Key className="h-5 w-5 text-purple-600" />
                    Permisos del Sistema
                    <span className="ml-auto text-xs font-normal text-gray-400">{permissions.length} total</span>
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-left text-gray-400 text-xs uppercase tracking-wider">
                          <th className="pb-3 pr-4">Método</th>
                          <th className="pb-3 pr-4">URL</th>
                          <th className="pb-3 pr-4">Descripción</th>
                          <th className="pb-3 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {permissions.map(p => (
                          <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                            <td className="py-3 pr-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${
                                METHOD_COLORS[p.method?.toUpperCase()] || 'bg-gray-100 text-gray-600 border-gray-200'
                              }`}>
                                {p.method}
                              </span>
                            </td>
                            <td className="py-3 pr-4 font-mono text-xs text-gray-700">{p.url}</td>
                            <td className="py-3 pr-4 text-gray-600">{p.description}</td>
                            <td className="py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => startEditPerm(p)}
                                  title="Editar permiso"
                                  className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeletePerm(p)}
                                  title="Eliminar permiso"
                                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {permissions.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-gray-400 text-sm">
                              No hay permisos registrados.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════
                TAB: ROLES → PERMISOS
            ══════════════════════════════════════════ */}
            {activeTab === 'rolePerms' && (
              <div className="space-y-6">
                {/* Assign permission to role */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Unlock className="h-5 w-5 text-green-600" />
                    Asignar Permiso a Rol
                  </h2>
                  <form onSubmit={handleAssignPermToRole} className="flex flex-col sm:flex-row gap-3">
                    <select
                      value={selectedRoleForPerm}
                      onChange={e => setSelectedRoleForPerm(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">— Seleccionar rol —</option>
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                    <select
                      value={selectedPermForRole}
                      onChange={e => setSelectedPermForRole(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">— Seleccionar permiso —</option>
                      {permissions.map(p => (
                        <option key={p.id} value={p.id}>
                          [{p.method}] {p.url} — {p.description}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      disabled={assigningPerm}
                      className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition disabled:opacity-50 whitespace-nowrap"
                    >
                      {assigningPerm ? 'Asignando...' : 'Asignar'}
                    </button>
                  </form>
                </div>

                {/* Roles with their permissions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-red-600" />
                    Permisos por Rol
                  </h2>
                  <div className="space-y-3">
                    {roles.map(role => {
                      const perms = getRolePerms(role.id);
                      const isOpen = expandedRole === role.id;
                      return (
                        <div key={role.id} className="border border-gray-200 rounded-xl overflow-hidden">
                          <button
                            onClick={() => setExpandedRole(isOpen ? null : role.id)}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition text-left"
                          >
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                              ROLE_COLORS[role.name?.toUpperCase()] || 'bg-gray-100 text-gray-700 border-gray-200'
                            }`}>
                              {role.name}
                            </span>
                            <span className="flex items-center gap-1 text-gray-400 text-xs">
                              {perms.length} permiso{perms.length !== 1 ? 's' : ''}
                              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </span>
                          </button>

                          {isOpen && (
                            <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                              {perms.length === 0 ? (
                                <p className="text-gray-400 text-xs">Sin permisos asignados</p>
                              ) : (
                                <div className="flex flex-col gap-2">
                                  {perms.map(rp => (
                                    <div key={rp.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2">
                                      <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
                                          METHOD_COLORS[rp.permission?.method?.toUpperCase()] || 'bg-gray-100 text-gray-600 border-gray-200'
                                        }`}>
                                          {rp.permission?.method}
                                        </span>
                                        <span className="font-mono text-xs text-gray-600">{rp.permission?.url}</span>
                                        {rp.permission?.description && (
                                          <span className="text-xs text-gray-400">— {rp.permission.description}</span>
                                        )}
                                      </div>
                                      <button
                                        onClick={() => handleRemoveRolePerm(rp)}
                                        title="Quitar permiso"
                                        className="p-1 rounded text-red-400 hover:bg-red-50 hover:text-red-600 transition"
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {roles.length === 0 && (
                      <p className="text-center text-gray-400 text-sm py-8">No hay roles registrados.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
