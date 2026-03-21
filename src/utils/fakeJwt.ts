import { jwtDecode } from 'jwt-decode';

export const decodeJwt = (token: string): { exp?: number; [key: string]: any } | null => {
  try {
    return jwtDecode(token);
  } catch {
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeJwt(token);
  if (!decoded || !decoded.exp) return true;

  return decoded.exp * 1000 < Date.now();
};

export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
  strength: number;
} => {
  const errors: string[] = [];
  let strength = 0;

  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  } else {
    strength += 20;
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Debe contener al menos una letra mayúscula');
  } else {
    strength += 20;
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Debe contener al menos una letra minúscula');
  } else {
    strength += 20;
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Debe contener al menos un número');
  } else {
    strength += 20;
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Debe contener al menos un carácter especial');
  } else {
    strength += 20;
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
};
