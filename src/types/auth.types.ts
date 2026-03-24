export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name?: string;
  roles: string[];
  profileImage?: string;
  phoneNumber?: string;
  twoFactorEnabled: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user?: User;
  token?: string;
  refreshToken?: string;
  status?: string;
  temp_token?: string;
  email?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  updateProfile: (user: Partial<User>) => Promise<void>;
  verifyTwoFactor: (code: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  oauthLogin: (token: string) => Promise<void>;
  startOAuth: (provider: string) => void;
  loginWithGoogle: () => Promise<void>;
  loginWithMicrosoft: () => Promise<void>;
}
