import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Dashboard } from '../pages/Dashboard';

export const DashboardRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    const roles = (user?.roles || []).map((r: string) => r.toUpperCase());
    if (roles.includes('CIUDADANO')) {
      navigate('/ciudadano', { replace: true });
    } else {
      // stay on the central dashboard
      // no navigation here; Dashboard component will render below
    }
  }, [user, isLoading, navigate]);

  if (isLoading) return null;

  const roles = (user?.roles || []).map((r: string) => r.toUpperCase());
  if (roles.includes('CIUDADANO')) return null; // already redirected

  return <Dashboard />;
};

export default DashboardRedirect;
