import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { businessService } from '../services/businessService';
import { Dashboard } from '../pages/Dashboard';

export const DashboardRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    const roles = (user?.roles || []).map((r: string) => r.toUpperCase());
    // If user exists, ensure they have edad set in business person record
    (async () => {
      try {
        if (user && user.id) {
          const p = await businessService.findPersonByUserId(user.id);
          if (p && (p.edad === null || p.edad === undefined)) {
            navigate('/complete-birthdate', { replace: true });
            return;
          }
        }
      } catch (e) {
        // ignore errors in this non-critical check
      }
    })();
    if (roles.includes('CIUDADANO')) {
      navigate('/ciudadano', { replace: true });
    } else if (roles.includes('GERENTE_OPERACIONES') || roles.includes('GERENTE')) {
      navigate('/gerente', { replace: true });
    } else if (
      roles.includes('ANALISTA_DE_MARKETING') ||
      roles.includes('ANALISTA DE MARKETING') ||
      roles.includes('MARKETING_ANALYST')
    ) {
      navigate('/marketing-analyst', { replace: true });
    } else if (
      roles.includes('FINANCIAL_ADMINISTRATOR') ||
      roles.includes('ADMINISTRADOR_FINANCIERO') ||
      roles.includes('ADMINISTRADOR FINANCIERO') ||
      roles.includes('FINANCIALADMINISTRATOR')
    ) {
      navigate('/financial-administrator', { replace: true });
    } else {
      // stay on the central dashboard
      // no navigation here; Dashboard component will render below
    }
  }, [user, isLoading, navigate]);

  if (isLoading) return null;

  const roles = (user?.roles || []).map((r: string) => r.toUpperCase());
  if (
    roles.includes('CIUDADANO') ||
    roles.includes('GERENTE_OPERACIONES') ||
    roles.includes('GERENTE') ||
    roles.includes('ANALISTA_DE_MARKETING') ||
    roles.includes('ANALISTA DE MARKETING') ||
    roles.includes('MARKETING_ANALYST') ||
    roles.includes('FINANCIAL_ADMINISTRATOR') ||
    roles.includes('ADMINISTRADOR_FINANCIERO') ||
    roles.includes('ADMINISTRADOR FINANCIERO') ||
    roles.includes('FINANCIALADMINISTRATOR')
  )
    return null; // already redirected

  return <Dashboard />;
};

export default DashboardRedirect;
