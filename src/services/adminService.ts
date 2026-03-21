import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api';
// All non-security endpoints are at the root (not under /api/)
const ROOT_BASE = API_BASE.replace(/\/api$/, ''); // http://localhost:8081

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const adminService = {
  /** Get all users — served at /users (root, no /api prefix) */
  getUsers: async (): Promise<any[]> => {
    const res = await axios.get(`${ROOT_BASE}/users`, { headers: getAuthHeaders() });
    return Array.isArray(res.data) ? res.data : [];
  },

  /** Get all roles — served at /roles */
  getRoles: async (): Promise<any[]> => {
    const res = await axios.get(`${ROOT_BASE}/roles`, { headers: getAuthHeaders() });
    return Array.isArray(res.data) ? res.data : [];
  },

  /** Get all role-permission mappings — served at /role-permission */
  getAllRolePermissions: async (): Promise<any[]> => {
    const res = await axios.get(`${ROOT_BASE}/role-permission`, { headers: getAuthHeaders() });
    return Array.isArray(res.data) ? res.data : [];
  },

  /** Get roles assigned to a specific user — served at /user-role/user/{userId} */
  getUserRoles: async (userId: string): Promise<any[]> => {
    const res = await axios.get(`${ROOT_BASE}/user-role/user/${userId}`, { headers: getAuthHeaders() });
    return Array.isArray(res.data) ? res.data : [];
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

  /** Get all user-role mappings — GET /user-role */
  getAllUserRoles: async (): Promise<any[]> => {
    const res = await axios.get(`${ROOT_BASE}/user-role`, { headers: getAuthHeaders() });
    return Array.isArray(res.data) ? res.data : [];
  },
};
