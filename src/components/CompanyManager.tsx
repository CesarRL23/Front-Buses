import React, { useEffect, useState } from 'react';
import { usePermission } from '../hooks/usePermission';
import { businessService } from '../services/businessService';
import { Building2, Plus, Route, Trash2 } from 'lucide-react';

export const CompanyManager: React.FC = () => {
  const { hasPermission } = usePermission();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    email: '',
    nit: '',
  });

  const canCreate = hasPermission('/company', 'POST');
  const canView = hasPermission('/company', 'GET');
  const canDelete = hasPermission('/company', 'DELETE');
  const fieldClass = 'w-full rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100';

  useEffect(() => {
    if (canView) {
      loadCompanies();
    }
  }, [canView]);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const data = await businessService.getCompanies();
      setCompanies(data);
    } catch (error) {
      console.error('Error loading companies', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await businessService.createCompany(formData);
      setFormData({ name: '', address: '', email: '', nit: '' });
      await loadCompanies();
      alert('Empresa creada');
    } catch (error) {
      alert('Error al crear empresa');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Eliminar empresa?')) return;
    try {
      await businessService.deleteCompany(id);
      await loadCompanies();
    } catch (error) {
      alert('Error al eliminar');
    }
  };

  if (!canCreate && !canView) return null;

  return (
    <div className="space-y-6">
      {canCreate && (
        <div className="surface-card p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="soft-label">Gestión operativa</p>
              <h2 className="mt-2 flex items-center gap-2 text-xl font-bold text-slate-900">
                <Plus className="h-5 w-5 text-sky-600" />
                Crear nueva empresa
              </h2>
              <p className="mt-1 text-sm text-slate-500">Registra operadores y mantiene la red de rutas organizada.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              type="text"
              placeholder="Nombre de la empresa"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={fieldClass}
              required
            />
            <input
              type="text"
              placeholder="NIT"
              value={formData.nit}
              onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
              className={fieldClass}
              required
            />
            <input
              type="email"
              placeholder="Email corporativo"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={fieldClass}
              required
            />
            <input
              type="text"
              placeholder="Dirección"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className={fieldClass}
              required
            />
            <button
              type="submit"
              className="md:col-span-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:shadow-md"
            >
              <Route className="h-4 w-4" />
              Registrar empresa
            </button>
          </form>
        </div>
      )}

      {canView && (
        <div className="surface-card p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="soft-label">Catálogo de operadores</p>
              <h2 className="mt-2 flex items-center gap-2 text-xl font-bold text-slate-900">
                <Building2 className="h-5 w-5 text-sky-600" />
                Empresas registradas
              </h2>
              <p className="mt-1 text-sm text-slate-500">Visibilidad rápida sobre las empresas que administran la flota.</p>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-slate-500">
              Cargando empresas...
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">NIT</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {companies.map((company) => (
                    <tr key={company.id} className="transition hover:bg-slate-50/70">
                      <td className="px-4 py-4 font-semibold text-slate-900">{company.name}</td>
                      <td className="px-4 py-4 text-slate-600">{company.nit}</td>
                      <td className="px-4 py-4 text-slate-600">{company.email}</td>
                      <td className="px-4 py-4">
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(company.id)}
                            className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {companies.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-slate-400">
                        No hay empresas registradas
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};