import axios from 'axios';
import {
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  User,
} from '../types/auth.types';
import { decodeJwt, isTokenExpired } from '../utils/fakeJwt';
import { auth, googleProvider } from '../firebase/config';
import { signInWithPopup } from 'firebase/auth';

// The backend serves public security endpoints at /api/public/security
// but all other controllers (users, roles, user-role, etc.) at the root without /api prefix.
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api';
const ROOT_BASE = API_BASE.replace(/\/api$/, ''); // http://localhost:8081

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 12000,
});

// Separate instance for non-/api/ endpoints (users, roles, user-role, etc.)
const rootApi = axios.create({
  baseURL: ROOT_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 12000,
});

const attachToken = (config: any) => {
  const token = localStorage.getItem('auth_token') || localStorage.getItem('temp_token');
  if (token && !isTokenExpired(token)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

api.interceptors.request.use(attachToken, error => Promise.reject(error));
rootApi.interceptors.request.use(attachToken, error => Promise.reject(error));

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const toFrontendUser = (data: any, roles: string[] = []): User => {
  const name = data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim();
  const names = name.split(' ').filter(Boolean);

  return {
    id: data.id,
    email: data.email,
    firstName: data.firstName || names[0] || '',
    lastName: data.lastName || names.slice(1).join(' ') || '',
    roles: roles.length > 0 ? roles : (data.roles || []),
    profileImage: data.profileImage,
    phoneNumber: data.phoneNumber,
    twoFactorEnabled: data.twoFactorEnabled ?? false,
    name,
  };
};

/**
 * Fetches the roles assigned to a user by calling GET /user-role/user/{userId}.
 * Returns an array of role name strings (e.g. ['ADMIN', 'CIUDADANO']).
 */
export const fetchUserRoles = async (userId: string, token: string): Promise<string[]> => {
  try {
    const response = await axios.get(`${ROOT_BASE}/user-role`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 8000,
    });
    const allRoles: any[] = Array.isArray(response.data) ? response.data : [];
    const userRoles = allRoles.filter((ur: any) => ur.user?.id === userId);
    return userRoles
      .map((ur: any) => ur.role?.name || ur.role?.nombre || '')
      .filter(Boolean)
      .map((r: string) => r.toUpperCase());
  } catch {
    return [];
  }
};

/**
 * Fetches all available roles and returns the one whose name matches 'CIUDADANO' (case-insensitive).
 */
const findCiudadanoRole = async (): Promise<string | null> => {
  try {
    const response = await rootApi.get('/roles');
    const roles: any[] = Array.isArray(response.data) ? response.data : [];
    const ciudadano = roles.find(
      (r: any) => (r.name || r.nombre || '').toUpperCase() === 'CIUDADANO'
    );
    return ciudadano?.id || null;
  } catch {
    return null;
  }
};

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/public/security/login', {
      email: credentials.email,
      password: credentials.password,
    });

    if (response.data.message === '2FA required') {
      return {
        status: '2fa_required',
        email: response.data.email,
      };
    }

    if (!response.data || !response.data.token) {
      throw new Error('Credenciales inválidas');
    }

    const token = response.data.token;
    const payload = decodeJwt(token);
    const userId = payload?.id || payload?.sub || '';
    const roles = userId ? await fetchUserRoles(userId, token) : [];
    const user = toFrontendUser(payload || {}, roles);

    return {
      user,
      token,
      refreshToken: response.data.refreshToken,
    };
  },

  verify2fa: async (email: string, code: string): Promise<AuthResponse> => {
    const response = await api.post('/public/security/verify-2fa', {
      email,
      code,
    });

    if (!response.data || !response.data.token) {
      throw new Error('Código inválido');
    }

    const token = response.data.token;
    const payload = decodeJwt(token);
    const userId = payload?.id || payload?.sub || '';
    const roles = userId ? await fetchUserRoles(userId, token) : [];
    const user = toFrontendUser(payload || {}, roles);

    return {
      user,
      token,
      refreshToken: response.data.refreshToken,
    };
  },

  register: async (
    credentials: RegisterCredentials
  ): Promise<AuthResponse> => {
    const userCreate = {
      name: `${credentials.firstName} ${credentials.lastName}`.trim(),
      email: credentials.email,
      password: credentials.password,
    };

    // Step 1: Create the user (uses root URL, not /api – only /api/** passes through the security interceptor)
    const createResponse = await rootApi.post('/users', userCreate);
    const createdUser = createResponse.data;

    // Step 2: Login to get a token
    const loginResponse = await authService.login({
      email: credentials.email,
      password: credentials.password,
    });

    // If 2FA is required, we return the 2FA state and the admin can assign CIUDADANO later
    if (loginResponse.status === '2fa_required') {
      return loginResponse;
    }

    const token = loginResponse.token!;
    const userId = createdUser?.id || loginResponse.user?.id;

    // Step 3: Find the CIUDADANO role and assign it to the new user
    if (userId) {
      const ciudadanoRoleId = await findCiudadanoRole();
      if (ciudadanoRoleId) {
        try {
          await axios.post(
            `${ROOT_BASE}/user-role/user/${userId}/role/${ciudadanoRoleId}`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (e) {
          console.warn('No se pudo asignar el rol CIUDADANO automáticamente:', e);
        }
      }
    }

    // Step 4: Re-fetch roles and return enriched user
    const roles = userId ? await fetchUserRoles(userId, token) : [];
    const payload = decodeJwt(token);
    const user = toFrontendUser(payload || {}, roles);

    return {
      user,
      token,
      refreshToken: loginResponse.refreshToken,
    };
  },

  verifyTwoFactor: async (code: string): Promise<AuthResponse> => {
    const response = await api.post('/public/security/2fa/verify', { code });

    if (!response.data || !response.data.token) {
      throw new Error('Código inválido');
    }

    const token = response.data.token;
    const payload = decodeJwt(token);
    const userId = payload?.id || payload?.sub || '';
    const roles = userId ? await fetchUserRoles(userId, token) : [];
    const user = toFrontendUser(payload || {}, roles);

    return {
      user,
      token
    };
  },

  forgotPassword: async (email: string): Promise<void> => {
    await api.post('/public/security/forgot-password', { email });
  },

  updateProfile: async (userId: string, data: Partial<User>): Promise<User> => {
    const payload: any = {
      name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
      email: data.email,
      phoneNumber: data.phoneNumber,
      twoFactorEnabled: data.twoFactorEnabled,
      ...data,
    };

    const response = await rootApi.put(`/users/${userId}`, payload);
    return toFrontendUser(response.data);
  },

  getCurrentUser: async (token: string): Promise<User> => {
    if (isTokenExpired(token)) {
      throw new Error('Token expirado');
    }
    const payload = decodeJwt(token);
    const userId = payload?.id || payload?.sub || '';
    const roles = userId ? await fetchUserRoles(userId, token) : [];
    return toFrontendUser(payload || {}, roles);
  },

  startOAuth: (provider: string): void => {
    window.location.href = `${API_BASE}/public/security/oauth/${provider}/authorize`;
  },

  exchangeOAuthToken: async (token: string): Promise<AuthResponse> => {
    const payload = decodeJwt(token);
    const userId = payload?.id || payload?.sub || '';
    const roles = userId ? await fetchUserRoles(userId, token) : [];
    const user = toFrontendUser(payload || {}, roles);
    return {
      token,
      user,
      refreshToken: undefined,
    };
  },

  loginWithGoogle: async (): Promise<AuthResponse> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      if (!firebaseUser.email) {
        throw new Error('El correo electrónico de Google no está disponible.');
      }

      // Enviar la información al backend para obtener un token de nuestro sistema
      const response = await api.post('/public/security/login-social', {
        email: firebaseUser.email,
        name: firebaseUser.displayName || 'Usuario Google',
        password: '', // No password for social login
      });

      if (!response.data || !response.data.token) {
        throw new Error('Error al sincronizar con el backend');
      }

      const token = response.data.token;
      const payload = decodeJwt(token);
      const userId = payload?.id || payload?.sub || '';
      
      // Intentar obtener los roles. Si es nuevo, tal vez necesitemos asignarle uno por defecto?
      let roles = userId ? await fetchUserRoles(userId, token) : [];
      
      // Si no tiene roles, le asignamos CIUDADANO por defecto en el sistema
      if (roles.length === 0 && userId) {
        const ciudadanoRoleId = await findCiudadanoRole();
        if (ciudadanoRoleId) {
          try {
            await axios.post(
              `${ROOT_BASE}/user-role/user/${userId}/role/${ciudadanoRoleId}`,
              {},
              { headers: { Authorization: `Bearer ${token}` } }
            );
            roles = ['CIUDADANO'];
          } catch (e) {
            console.warn('No se pudo asignar el rol CIUDADANO automáticamente:', e);
          }
        }
      }

      const user = toFrontendUser(payload || {}, roles);

      return {
        user,
        token,
      };
    } catch (error: any) {
      console.error("Error en login con Google:", error);
      throw error;
    }
  },
};
