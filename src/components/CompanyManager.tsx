import React, { useState, useEffect } from 'react';
import { usePermission } from '../hooks/usePermission';
import { businessService } from '../services/businessService';
import { Plus, Building2, List, Trash2, Edit } from 'lucide-react';

export const CompanyManager: React.FC = () => {
  const { hasPermission } = usePermission();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const canCreate = hasPermission('/company', 'POST');
  const canView = hasPermission('/company', 'GET');
  const canDelete = hasPermission('/company', 'DELETE');

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    email: '',
    nit: ''
  });

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
      console.error("Error loading companies", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await businessService.createCompany(formData);
      setFormData({ name: '', address: '', email: '', nit: '' });
      loadCompanies();
      alert("Empresa creada");
    } catch (error) {
      alert("Error al crear empresa");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Eliminar empresa?")) return;
    try {
      await businessService.deleteCompany(id);
      loadCompanies();
    } catch (error) {
      alert("Error al eliminar");
    }
  };

  if (!canCreate && !canView) return null;

  return (
    <div className="space-y-6">
      {/* FORMULARIO DE CREACIÓN (Solo si tiene permiso) */}
      {canCreate && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-600" />
            Crear Nueva Empresa
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nombre de la Empresa"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="border border-gray-300 rounded-lg p-2 text-sm"
              required
            />
            <input
              type="text"
              placeholder="NIT"
              value={formData.nit}
              onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
              className="border border-gray-300 rounded-lg p-2 text-sm"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="border border-gray-300 rounded-lg p-2 text-sm"
              required
            />
            <input
              type="text"
              placeholder="Dirección"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="border border-gray-300 rounded-lg p-2 text-sm"
              required
            />
            <button
              type="submit"
              className="md:col-span-2 bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Registrar Empresa
            </button>
          </form>
        </div>
      )}

      {/* LISTADO DE EMPRESAS (Solo si tiene permiso) */}
      {canView && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-purple-600" />
            Empresas Registradas
          </h2>
          {loading ? (
            <p>Cargando...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">NIT</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {companies.map((company) => (
                    <tr key={company.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-medium">{company.name}</td>
                      <td className="px-4 py-3">{company.nit}</td>
                      <td className="px-4 py-3">{company.email}</td>
                      <td className="px-4 py-3 flex gap-2">
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(company.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {companies.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
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
