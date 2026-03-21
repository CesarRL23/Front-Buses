import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { AuthContextType } from '../types/auth.types';

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }

  return context;
};
