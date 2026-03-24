import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api';
// All non-security endpoints are at the root (not under /api/)
const ROOT_BASE = API_BASE.replace(/\/api$/, ''); // http://localhost:8081

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const adminService = {
  // ══════════════════════════════
  //  USERS
  // ══════════════════════════════

  /** Get all users — GET /users */
  getUsers: async (): Promise<any[]> => {
    const res = await axios.get(`${ROOT_BASE}/users`, { headers: getAuthHeaders() });
    return Array.isArray(res.data) ? res.data : [];
  },

  /** Get user by id — GET /users/{id} */
  getUserById: async (id: string): Promise<any> => {
    const res = await axios.get(`${ROOT_BASE}/users/${id}`, { headers: getAuthHeaders() });
    return res.data;
  },

  /** Update user — PUT /users/{id} */
  updateUser: async (id: string, data: { name: string; email: string }): Promise<any> => {
    const res = await axios.put(`${ROOT_BASE}/users/${id}`, data, { headers: getAuthHeaders() });
    return res.data;
  },

  /** Delete user — DELETE /users/{id} */
  deleteUser: async (id: string): Promise<void> => {
    await axios.delete(`${ROOT_BASE}/users/${id}`, { headers: getAuthHeaders() });
  },

  // ══════════════════════════════
  //  ROLES
  // ══════════════════════════════

  /** Get all roles — GET /roles */
  getRoles: async (): Promise<any[]> => {
    const res = await axios.get(`${ROOT_BASE}/roles`, { headers: getAuthHeaders() });
    return Array.isArray(res.data) ? res.data : [];
  },

  // ══════════════════════════════
  //  USER ROLES
  // ══════════════════════════════

  /** Get all user-role mappings — GET /user-role */
  getAllUserRoles: async (): Promise<any[]> => {
    const res = await axios.get(`${ROOT_BASE}/user-role`, { headers: getAuthHeaders() });
    return Array.isArray(res.data) ? res.data : [];
  },

  /** Get roles assigned to a specific user — fall back to global query avoiding 500 error */
  getUserRoles: async (userId: string): Promise<any[]> => {
    const res = await axios.get(`${ROOT_BASE}/user-role`, { headers: getAuthHeaders() });
    const allRoles = Array.isArray(res.data) ? res.data : [];
    return allRoles.filter((ur: any) => ur.user?.id === userId);
  },

  /** Assign a role to a user — POST /user-role/user/{userId}/role/{roleId} */
  assignRole: async (userId: string, roleId: string): Promise<void> => {
    await axios.post(
      `${ROOT_BASE}/user-role/user/${userId}/role/${roleId}`,
      {},
      { headers: getAuthHeaders() }
    );
  },

  /** Remove a user-role mapping — DELETE /user-role/{userRoleId} */
  removeUserRole: async (userRoleId: string): Promise<void> => {
    await axios.delete(`${ROOT_BASE}/user-role/${userRoleId}`, { headers: getAuthHeaders() });
  },

  // ══════════════════════════════
  //  PERMISSIONS
  // ══════════════════════════════

  /** Get all permissions — GET /permissions */
  getPermissions: async (): Promise<any[]> => {
    const res = await axios.get(`${ROOT_BASE}/permissions`, { headers: getAuthHeaders() });
    return Array.isArray(res.data) ? res.data : [];
  },

  /** Create permission — POST /permissions */
  createPermission: async (data: { url: string; method: string; description: string }): Promise<any> => {
    const res = await axios.post(`${ROOT_BASE}/permissions`, data, { headers: getAuthHeaders() });
    return res.data;
  },

  /** Update permission — PUT /permissions/{id} */
  updatePermission: async (id: string, data: { url: string; method: string; description: string }): Promise<any> => {
    const res = await axios.put(`${ROOT_BASE}/permissions/${id}`, data, { headers: getAuthHeaders() });
    return res.data;
  },

  /** Delete permission — DELETE /permissions/{id} */
  deletePermission: async (id: string): Promise<void> => {
    await axios.delete(`${ROOT_BASE}/permissions/${id}`, { headers: getAuthHeaders() });
  },

  // ══════════════════════════════
  //  ROLE PERMISSIONS
  // ══════════════════════════════

  /** Get all role-permission mappings — GET /role-permission */
  getAllRolePermissions: async (): Promise<any[]> => {
    const res = await axios.get(`${ROOT_BASE}/role-permission`, { headers: getAuthHeaders() });
    return Array.isArray(res.data) ? res.data : [];
  },

  /** Assign permission to role — POST /role-permission/role/{roleId}/permission/{permissionId} */
  addPermissionToRole: async (roleId: string, permissionId: string): Promise<any> => {
    const res = await axios.post(
      `${ROOT_BASE}/role-permission/role/${roleId}/permission/${permissionId}`,
      {},
      { headers: getAuthHeaders() }
    );
    return res.data;
  },

  /** Remove role-permission mapping — DELETE /role-permission/{id} */
  removeRolePermission: async (rolePermissionId: string): Promise<void> => {
    await axios.delete(`${ROOT_BASE}/role-permission/${rolePermissionId}`, { headers: getAuthHeaders() });
  },
};
