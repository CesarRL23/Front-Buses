import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navbar } from '../components/Navbar';
import { adminService } from '../services/adminService';
import { businessService } from '../services/businessService';
import { WhereaboutManager } from '../components/WhereaboutManager';
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
  BarChart3,
  Activity,
  MapPin,
  Building,
} from 'lucide-react';
import { StatsCard, ActivityFeed, MetricBadge, QuickActionButton } from '../components/DashboardComponents';
import { CompanyManager } from '../components/CompanyManager';

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
  const [companies, setCompanies] = useState<{ id: number; name: string }[]>([]);
  const [persons, setPersons] = useState<any[]>([]);
  const [allUserRoles, setAllUserRoles] = useState<UserRoleRecord[]>([]);
  const [permissions, setPermissions]   = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermissionRecord[]>([]);

  // UI
  const [activeTab, setActiveTab]       = useState<'users' | 'roles' | 'permissions' | 'rolePerms' | 'whereabouts'>('users');
  const [activeTab, setActiveTab]       = useState<'users' | 'roles' | 'permissions' | 'rolePerms' | 'whereabouts' | 'empresas'>('users');
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
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
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

      // Load companies and persons from business API so we can map users -> persons
      const [companiesData, personsData] = await Promise.all([
        businessService.getCompanies().catch(() => []),
        businessService.getPersons().catch(() => []),
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
      setCompanies(companiesData || []);
      setPersons(personsData || []);
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
      // If role represents a company admin, also create company-admin relation
      const roleObj = roles.find(r => r.id === selectedRoleId);
      const needsCompany = roleObj?.name?.toUpperCase().includes('EMPRESA');

      if (needsCompany) {
        if (!selectedCompanyId) {
          throw new Error('Selecciona la empresa para asignar el administrador');
        }

        const person = persons.find((p) => String(p.userId) === String(selectedUserId));
        if (!person) {
          throw new Error('No existe una Person en ms-negocio-buses asociada a este usuario. Debe existir person.userId = user.id.');
        }

        await businessService.createCompanyAdmin({
          personId: Number(person.id),
          companyId: Number(selectedCompanyId),
        });
      }

      setSuccess('Rol asignado correctamente.');
      setSelectedUserId(''); setSelectedRoleId(''); setSelectedCompanyId('');
      await loadData();
    } catch (error: any) {
      const backendMessage = error?.response?.data?.message;
      const message = Array.isArray(backendMessage)
        ? backendMessage.join(', ')
        : backendMessage || error?.message || 'Error al asignar el rol. Verifica la existencia de la persona y la empresa.';
      setError(message);
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
  if (!loading && !isAdmin && !perms.canListUsers && !perms.canManageRoles && !perms.canManagePerms) {
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-gray-900 flex items-center gap-3 mb-2">
              <div className="bg-gradient-to-br from-red-500 to-red-600 p-3 rounded-2xl shadow-lg">
                <Shield className="h-8 w-8 text-white" />
              </div>
              Panel de Administración
            </h1>
            <p className="text-gray-600 text-lg">Gestión centralizada de usuarios, roles y permisos</p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold px-6 py-3 rounded-xl hover:shadow-lg transition disabled:opacity-50 shadow-md w-fit"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>

        {/* Stats Overview */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Usuarios Totales"
              value={users.length}
              icon={Users}
              bgColor="bg-blue-50"
              textColor="text-blue-600"
              iconBgColor="bg-blue-100"
              trend="up"
              trendValue="+12% este mes"
            />
            <StatsCard
              title="Roles Activos"
              value={roles.length}
              icon={Briefcase}
              bgColor="bg-purple-50"
              textColor="text-purple-600"
              iconBgColor="bg-purple-100"
            />
            <StatsCard
              title="Permisos del Sistema"
              value={permissions.length}
              icon={Key}
              bgColor="bg-green-50"
              textColor="text-green-600"
              iconBgColor="bg-green-100"
            />
            <StatsCard
              title="Asignaciones Activas"
              value={allUserRoles.length}
              icon={Activity}
              bgColor="bg-amber-50"
              textColor="text-amber-600"
              iconBgColor="bg-amber-100"
            />
          </div>
        )}

        <Feedback error={error} success={success} />

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 flex flex-wrap gap-2 w-fit">
          {([
            perms.canListUsers ? { key: 'users', label: 'Usuarios', icon: Users } : null,
            perms.canManageRoles ? { key: 'roles', label: 'Roles', icon: Briefcase } : null,
            perms.canManagePerms ? { key: 'permissions', label: 'Permisos', icon: Key } : null,
            perms.canManagePerms ? { key: 'rolePerms', label: 'Asignaciones', icon: Lock } : null,
            isAdmin || perms.canManagePerms ? { key: 'whereabouts', label: 'Paraderos', icon: MapPin } : null,
            isAdmin ? { key: 'empresas', label: 'Empresas', icon: Building } : null,
          ].filter(Boolean) as any[]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                activeTab === key
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full animate-spin" style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)' }}></div>
              <div className="absolute inset-2 bg-white rounded-full"></div>
            </div>
            <p className="mt-6 text-gray-500 font-semibold">Cargando datos...</p>
          </div>
        ) : (
          <>
            {/* ══════════════════════════════════════════
                TAB: USUARIOS
            ══════════════════════════════════════════ */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                {/* Assign role section */}
                {perms.canAssignRoles && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 shadow-sm p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-blue-600 p-2 rounded-lg">
                        <UserCheck className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Asignar Rol a Usuario</h2>
                        <p className="text-sm text-gray-600">Vincula roles de seguridad a usuarios</p>
                      </div>
                    </div>
                    <form onSubmit={handleAssignRole} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <select
                        id="select-user"
                        value={selectedUserId}
                        onChange={e => setSelectedUserId(e.target.value)}
                        className="sm:col-span-4 border border-blue-200 bg-white rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
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
                        className="sm:col-span-4 border border-blue-200 bg-white rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        required
                      >
                        <option value="">— Seleccionar rol —</option>
                        {roles.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                      {roles.find(r => r.id === selectedRoleId)?.name?.toUpperCase().includes('EMPRESA') && (
                        <select
                          id="select-company"
                          value={selectedCompanyId}
                          onChange={e => setSelectedCompanyId(e.target.value)}
                          className="sm:col-span-4 border border-blue-200 bg-white rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                          required
                        >
                          <option value="">— Seleccionar empresa —</option>
                          {companies.map(c => (
                            <option key={c.id} value={String(c.id)}>{c.name}</option>
                          ))}
                        </select>
                      )}
                      <button
                        type="submit"
                        disabled={assigning}
                        className="sm:col-span-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-lg text-white font-bold px-6 py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
                      >
                        <Plus className="h-5 w-5" />
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
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-8 border-b border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <Users className="h-6 w-6 text-green-600" />
                      </div>
                      Usuarios Registrados
                      <span className="ml-auto text-sm font-normal bg-green-100 text-green-700 px-4 py-1 rounded-full">{users.length} total</span>
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <th className="px-6 py-4 text-left text-gray-600 font-bold text-xs uppercase tracking-wider">Nombre</th>
                          <th className="px-6 py-4 text-left text-gray-600 font-bold text-xs uppercase tracking-wider">Email</th>
                          <th className="px-6 py-4 text-left text-gray-600 font-bold text-xs uppercase tracking-wider">Roles</th>
                          <th className="px-6 py-4 text-right text-gray-600 font-bold text-xs uppercase tracking-wider">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {users.map(u => {
                          const userRoles = getUserRoles(u.id);
                          const isExpanded = expandedUser === u.id;
                          return (
                            <React.Fragment key={u.id}>
                              <tr className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4 font-semibold text-gray-900">{u.name}</td>
                                <td className="px-6 py-4 text-gray-500">{u.email}</td>
                                <td className="px-6 py-4">
                                  <button
                                    onClick={() => setExpandedUser(isExpanded ? null : u.id)}
                                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm"
                                  >
                                    <MetricBadge label="Roles" value={userRoles.length} color="blue" size="sm" />
                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                  </button>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-3">
                                    {perms.canEditUsers && (
                                      <button
                                        onClick={() => startEditUser(u)}
                                        title="Editar usuario"
                                        className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                                      >
                                        <Pencil className="h-5 w-5" />
                                      </button>
                                    )}
                                    {perms.canDeleteUsers && (
                                      <button
                                        onClick={() => handleDeleteUser(u)}
                                        title="Eliminar usuario"
                                        className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition"
                                      >
                                        <Trash2 className="h-5 w-5" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr className="bg-gray-50 border-b border-gray-100">
                                  <td colSpan={4} className="px-6 py-4">
                                    {userRoles.length === 0 ? (
                                      <div className="flex items-center gap-2 text-gray-500">
                                        <AlertTriangle className="h-4 w-4" />
                                        <span className="font-medium">Sin roles asignados</span>
                                      </div>
                                    ) : (
                                      <div className="flex flex-wrap gap-3">
                                        {userRoles.map(ur => (
                                          <div
                                            key={ur.id}
                                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border ${
                                              ROLE_COLORS[ur.role?.name?.toUpperCase()] || 'bg-gray-100 text-gray-700 border-gray-200'
                                            }`}
                                          >
                                            {ur.role?.name}
                                            {perms.canAssignRoles && (
                                              <button
                                                onClick={() => handleRemoveUserRole(ur)}
                                                title="Quitar rol"
                                                className="hover:opacity-70 transition ml-2"
                                              >
                                                <X className="h-3 w-3" />
                                              </button>
                                            )}
                                          </div>
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
                            <td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-medium">
                              No hay usuarios registrados
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
                <div className={`rounded-2xl border p-8 ${editingRole ? 'bg-amber-50 border-amber-100' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100'} shadow-sm`}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`p-2 rounded-lg ${editingRole ? 'bg-amber-600' : 'bg-blue-600'}`}>
                      {editingRole ? <Pencil className="h-6 w-6 text-white" /> : <Plus className="h-6 w-6 text-white" />}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{editingRole ? 'Editar Rol' : 'Crear Nuevo Rol'}</h2>
                      <p className="text-sm text-gray-600">Define las características del rol de usuario</p>
                    </div>
                  </div>
                  <form onSubmit={handleSaveRole} className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    <input
                      type="text"
                      placeholder="Nombre del rol (ej: ADMIN)"
                      value={roleForm.name}
                      onChange={e => setRoleForm(f => ({ ...f, name: e.target.value.toUpperCase() }))}
                      required
                      className="sm:col-span-3 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                    <input
                      type="text"
                      placeholder="Descripción del rol"
                      value={roleForm.description}
                      onChange={e => setRoleForm(f => ({ ...f, description: e.target.value }))}
                      className="sm:col-span-6 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                    <div className="sm:col-span-3 flex gap-2">
                      <button
                        type="submit"
                        disabled={savingRole}
                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-lg text-white text-sm font-bold px-4 py-3 rounded-xl transition disabled:opacity-50 shadow-md"
                      >
                        <Save className="h-5 w-5" />
                        {savingRole ? 'Guardando...' : editingRole ? 'Actualizar' : 'Crear'}
                      </button>
                      {editingRole && (
                        <button
                          type="button"
                          onClick={() => { setEditingRole(null); setRoleForm({ name: '', description: '' }); }}
                          className="p-3 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Roles list */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-8 border-b border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <Briefcase className="h-6 w-6 text-purple-600" />
                      </div>
                      Roles del Sistema
                      <span className="ml-auto text-sm font-normal bg-purple-100 text-purple-700 px-4 py-1 rounded-full">{roles.length} roles</span>
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <th className="px-6 py-4 text-left text-gray-600 font-bold text-xs uppercase tracking-wider">Nombre</th>
                          <th className="px-6 py-4 text-left text-gray-600 font-bold text-xs uppercase tracking-wider">Descripción</th>
                          <th className="px-6 py-4 text-right text-gray-600 font-bold text-xs uppercase tracking-wider">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {roles.map(r => (
                          <tr key={r.id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4">
                              <MetricBadge label={r.name} value="" color={r.name?.toUpperCase() === 'ADMIN' ? 'red' : 'purple'} size="md" />
                            </td>
                            <td className="px-6 py-4 text-gray-600 font-medium">{r.description || 'Sin descripción'}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-3">
                                <button
                                  onClick={() => startEditRole(r)}
                                  title="Editar rol"
                                  className="p-2 rounded-lg text-amber-600 hover:bg-amber-50 transition"
                                >
                                  <Pencil className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRole(r)}
                                  title="Eliminar rol"
                                  className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {roles.length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-6 py-12 text-center text-gray-400 font-medium">
                              No hay roles registrados
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
                TAB: PERMISOS
            ══════════════════════════════════════════ */}
            {activeTab === 'permissions' && (
              <div className="space-y-6">
                {/* Create / Edit permission form */}
                <div className={`rounded-2xl border p-8 ${editingPerm ? 'bg-amber-50 border-amber-100' : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-100'} shadow-sm`}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`p-2 rounded-lg ${editingPerm ? 'bg-amber-600' : 'bg-green-600'}`}>
                      {editingPerm ? <Pencil className="h-6 w-6 text-white" /> : <Plus className="h-6 w-6 text-white" />}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{editingPerm ? 'Editar Permiso' : 'Crear Nuevo Permiso'}</h2>
                      <p className="text-sm text-gray-600">Define los permisos del sistema para APIs</p>
                    </div>
                  </div>
                  <form onSubmit={handleSavePerm} className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    <input
                      type="text"
                      placeholder="URL (ej: /api/users)"
                      value={permForm.url}
                      onChange={e => setPermForm(f => ({ ...f, url: e.target.value }))}
                      required
                      className="sm:col-span-3 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                    />
                    <select
                      value={permForm.method}
                      onChange={e => setPermForm(f => ({ ...f, method: e.target.value }))}
                      className="sm:col-span-2 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                    >
                      {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Descripción del permiso"
                      value={permForm.description}
                      onChange={e => setPermForm(f => ({ ...f, description: e.target.value }))}
                      required
                      className="sm:col-span-4 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                    />
                    <div className="sm:col-span-3 flex gap-2">
                      <button
                        type="submit"
                        disabled={savingPerm}
                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-lg text-white text-sm font-bold px-4 py-3 rounded-xl transition disabled:opacity-50 shadow-md"
                      >
                        <Save className="h-5 w-5" />
                        {savingPerm ? 'Guardando...' : editingPerm ? 'Actualizar' : 'Crear'}
                      </button>
                      {editingPerm && (
                        <button
                          type="button"
                          onClick={() => { setEditingPerm(null); setPermForm({ url: '', method: 'GET', description: '' }); }}
                          className="p-3 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Permissions list */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-8 border-b border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <Key className="h-6 w-6 text-green-600" />
                      </div>
                      Permisos del Sistema
                      <span className="ml-auto text-sm font-normal bg-green-100 text-green-700 px-4 py-1 rounded-full">{permissions.length} permisos</span>
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <th className="px-6 py-4 text-left text-gray-600 font-bold text-xs uppercase tracking-wider">Método</th>
                          <th className="px-6 py-4 text-left text-gray-600 font-bold text-xs uppercase tracking-wider">URL</th>
                          <th className="px-6 py-4 text-left text-gray-600 font-bold text-xs uppercase tracking-wider">Descripción</th>
                          <th className="px-6 py-4 text-right text-gray-600 font-bold text-xs uppercase tracking-wider">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {permissions.map(p => (
                          <tr key={p.id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4">
                              <MetricBadge label={p.method} value="" color={p.method === 'GET' ? 'green' : p.method === 'POST' ? 'blue' : p.method === 'DELETE' ? 'red' : 'amber'} size="sm" />
                            </td>
                            <td className="px-6 py-4 font-mono text-gray-700 font-semibold">{p.url}</td>
                            <td className="px-6 py-4 text-gray-600">{p.description}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-3">
                                <button
                                  onClick={() => startEditPerm(p)}
                                  title="Editar permiso"
                                  className="p-2 rounded-lg text-amber-600 hover:bg-amber-50 transition"
                                >
                                  <Pencil className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => handleDeletePerm(p)}
                                  title="Eliminar permiso"
                                  className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {permissions.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-medium">
                              No hay permisos registrados
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
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100 shadow-sm p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-purple-600 p-2 rounded-lg">
                      <Unlock className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Asignar Permiso a Rol</h2>
                      <p className="text-sm text-gray-600">Vincula permisos de API a roles de usuario</p>
                    </div>
                  </div>
                  <form onSubmit={handleAssignPermToRole} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <select
                      value={selectedRoleForPerm}
                      onChange={e => setSelectedRoleForPerm(e.target.value)}
                      className="sm:col-span-4 border border-purple-200 bg-white rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
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
                      className="sm:col-span-5 border border-purple-200 bg-white rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
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
                      className="sm:col-span-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg text-white text-sm font-bold px-6 py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
                    >
                      <Plus className="h-5 w-5" />
                      {assigningPerm ? 'Asignando...' : 'Asignar'}
                    </button>
                  </form>
                </div>

                {/* Roles with their permissions */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-8 border-b border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                      <div className="bg-red-100 p-2 rounded-lg">
                        <Shield className="h-6 w-6 text-red-600" />
                      </div>
                      Permisos por Rol
                      <span className="ml-auto text-sm font-normal bg-red-100 text-red-700 px-4 py-1 rounded-full">{roles.length} roles</span>
                    </h2>
                  </div>
                  <div className="p-6 space-y-4">
                    {roles.map(role => {
                      const perms = getRolePerms(role.id);
                      const isOpen = expandedRole === role.id;
                      return (
                        <div key={role.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition">
                          <button
                            onClick={() => setExpandedRole(isOpen ? null : role.id)}
                            className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition text-left"
                          >
                            <div className="flex items-center gap-3">
                              <MetricBadge label={role.name} value="" color={role.name?.toUpperCase() === 'ADMIN' ? 'red' : 'purple'} size="md" />
                              <span className="text-sm text-gray-600">{role.description}</span>
                            </div>
                            <span className="flex items-center gap-2 text-gray-400 text-sm font-semibold">
                              {perms.length} permiso{perms.length !== 1 ? 's' : ''}
                              {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            </span>
                          </button>

                          {isOpen && (
                            <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
                              {perms.length === 0 ? (
                                <p className="text-gray-400 text-sm font-medium">Sin permisos asignados</p>
                              ) : (
                                <div className="flex flex-col gap-2">
                                  {perms.map(rp => (
                                    <div key={rp.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3">
                                      <div className="flex items-center gap-3">
                                        <MetricBadge label={rp.permission?.method} value="" color={rp.permission?.method === 'GET' ? 'green' : rp.permission?.method === 'POST' ? 'blue' : 'red'} size="sm" />
                                        <span className="font-mono text-sm text-gray-700 font-semibold">{rp.permission?.url}</span>
                                        {rp.permission?.description && (
                                          <span className="text-sm text-gray-500">— {rp.permission.description}</span>
                                        )}
                                      </div>
                                      <button
                                        onClick={() => handleRemoveRolePerm(rp)}
                                        title="Quitar permiso"
                                        className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition"
                                      >
                                        <Trash2 className="h-4 w-4" />
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
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════
                TAB: PARADEROS
            ══════════════════════════════════════════ */}
            {activeTab === 'whereabouts' && (
              <div className="space-y-6">
                <WhereaboutManager />
              </div>
            )}

            {/* ══════════════════════════════════════════
                TAB: EMPRESAS
            ══════════════════════════════════════════ */}
            {activeTab === 'empresas' && (
              <div className="space-y-6">
                <CompanyManager />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
