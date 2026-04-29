import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navbar } from '../components/Navbar';
import { businessService } from '../services/businessService';
import {
  Bus,
  Route as RouteIcon,
  Plus,
  Trash2,
  Pencil,
  Save,
  X,
  Search,
  Building2,
  LayoutDashboard,
  MapPin,
  Clock,
  DollarSign,
  AlertCircle,
  Loader2,
  Navigation,
  CheckCircle2
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Route {
  id: number;
  nombre: string;
  descripcion?: string;
  origen: string;
  destino: string;
  distancia: number;
  duracion_estimada: number;
  tarifa: number;
  company?: { id: number; name: string };
}

interface BusRecord {
  id: number;
  placa: string;
  modelo: string;
  capacidad: number;
  marca: string;
  estado: string;
  company?: { id: number; name: string };
}

interface Company {
  id: number;
  name: string;
}

export const AdminEmpresaDashboard: React.FC = () => {
  const { user } = useAuth();
  
  // State
  const [activeTab, setActiveTab] = useState<'routes' | 'buses'>('routes');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  
  const [routes, setRoutes] = useState<Route[]>([]);
  const [buses, setBuses] = useState<BusRecord[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Forms
  const [showRouteForm, setShowRouteForm] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [routeForm, setRouteForm] = useState({
    nombre: '',
    descripcion: '',
    origen: '',
    destino: '',
    distancia: 0,
    duracion_estimada: 0,
    tarifa: 0
  });

  const [showBusForm, setShowBusForm] = useState(false);
  const [editingBus, setEditingBus] = useState<BusRecord | null>(null);
  const [busForm, setBusForm] = useState({
    placa: '',
    modelo: '',
    capacidad: 0,
    marca: '',
    estado: 'ACTIVO'
  });

  // ─── Load Data ─────────────────────────────────────────────────────────────
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const companiesData = await businessService.getCompanies();
      setCompanies(companiesData);
      if (companiesData.length > 0) {
        setSelectedCompanyId(companiesData[0].id);
      }
    } catch (err) {
      setError('Error al cargar empresas');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTabData = useCallback(async () => {
    if (!selectedCompanyId) return;
    setLoading(true);
    try {
      if (activeTab === 'routes') {
        const data = await businessService.getRoutes(selectedCompanyId);
        setRoutes(data);
      } else {
        const data = await businessService.getBuses(selectedCompanyId);
        setBuses(data);
      }
    } catch (err) {
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId, activeTab]);

  useEffect(() => { loadInitialData(); }, [loadInitialData]);
  useEffect(() => { loadTabData(); }, [loadTabData]);

  // Feedback auto-clear
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => { setSuccess(''); setError(''); }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // ─── Route Handlers ────────────────────────────────────────────────────────
  const handleRouteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyId) return;
    setActionLoading(true);
    try {
      const payload = { ...routeForm, companyId: selectedCompanyId };
      if (editingRoute) {
        await businessService.updateRoute(editingRoute.id, payload);
        setSuccess('Ruta actualizada correctamente');
      } else {
        await businessService.createRoute(payload);
        setSuccess('Ruta creada correctamente');
      }
      setShowRouteForm(false);
      setEditingRoute(null);
      setRouteForm({ nombre: '', descripcion: '', origen: '', destino: '', distancia: 0, duracion_estimada: 0, tarifa: 0 });
      loadTabData();
    } catch (err) {
      setError('Error al guardar la ruta');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteRoute = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar esta ruta?')) return;
    setActionLoading(true);
    try {
      await businessService.deleteRoute(id);
      setSuccess('Ruta eliminada');
      loadTabData();
    } catch (err) {
      setError('Error al eliminar la ruta');
    } finally {
      setActionLoading(false);
    }
  };

  const startEditRoute = (route: Route) => {
    setEditingRoute(route);
    setRouteForm({
      nombre: route.nombre,
      descripcion: route.descripcion || '',
      origen: route.origen,
      destino: route.destino,
      distancia: route.distancia,
      duracion_estimada: route.duracion_estimada,
      tarifa: route.tarifa
    });
    setShowRouteForm(true);
  };

  // ─── Bus Handlers ──────────────────────────────────────────────────────────
  const handleBusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyId) return;
    setActionLoading(true);
    try {
      const payload = { ...busForm, companyId: selectedCompanyId };
      if (editingBus) {
        await businessService.updateBus(editingBus.id, payload);
        setSuccess('Bus actualizado correctamente');
      } else {
        await businessService.createBus(payload);
        setSuccess('Bus registrado correctamente');
      }
      setShowBusForm(false);
      setEditingBus(null);
      setBusForm({ placa: '', modelo: '', capacidad: 0, marca: '', estado: 'ACTIVO' });
      loadTabData();
    } catch (err) {
      setError('Error al guardar el bus');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteBus = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este bus?')) return;
    setActionLoading(true);
    try {
      await businessService.deleteBus(id);
      setSuccess('Bus eliminado');
      loadTabData();
    } catch (err) {
      setError('Error al eliminar el bus');
    } finally {
      setActionLoading(false);
    }
  };

  const startEditBus = (bus: BusRecord) => {
    setEditingBus(bus);
    setBusForm({
      placa: bus.placa,
      modelo: bus.modelo,
      capacidad: bus.capacidad,
      marca: bus.marca,
      estado: bus.estado
    });
    setShowBusForm(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />
      
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <Building2 className="h-8 w-8 text-orange-600" />
              Panel Admin Empresa
            </h1>
            <p className="text-gray-500 font-medium">Gestión integral de transporte para su compañía</p>
          </div>

          {/* Company Selector */}
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-gray-200 shadow-sm">
            <div className="bg-orange-50 p-2 rounded-xl">
              <Building2 className="h-5 w-5 text-orange-600" />
            </div>
            <select
              value={selectedCompanyId || ''}
              onChange={(e) => setSelectedCompanyId(Number(e.target.value))}
              className="bg-transparent font-bold text-gray-700 focus:outline-none pr-8 py-1"
            >
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </header>

        {/* Feedback Messages */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700 font-semibold">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <p className="text-green-700 font-semibold">{success}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 p-1.5 bg-gray-200/50 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('routes')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'routes' 
                ? 'bg-white text-orange-600 shadow-sm' 
                : 'text-gray-500 hover:bg-white/50'
            }`}
          >
            <RouteIcon className="h-5 w-5" />
            Rutas
          </button>
          <button
            onClick={() => setActiveTab('buses')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'buses' 
                ? 'bg-white text-orange-600 shadow-sm' 
                : 'text-gray-500 hover:bg-white/50'
            }`}
          >
            <Bus className="h-5 w-5" />
            Buses
          </button>
        </div>

        {/* Loading State */}
        {loading && !showRouteForm && !showBusForm ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="h-10 w-10 text-orange-600 animate-spin" />
            <p className="text-gray-500 font-bold">Cargando datos de la empresa...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* ══════════════════════════════════════════
                ROUTES SECTION
            ══════════════════════════════════════════ */}
            {activeTab === 'routes' && (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-black text-gray-900">Gestión de Rutas</h2>
                  <button
                    onClick={() => setShowRouteForm(true)}
                    className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-orange-200 transition-all active:scale-95"
                  >
                    <Plus className="h-5 w-5" />
                    Nueva Ruta
                  </button>
                </div>

                {showRouteForm && (
                  <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl space-y-6 animate-in zoom-in-95">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-black text-gray-900">
                        {editingRoute ? 'Editar Ruta' : 'Crear Nueva Ruta'}
                      </h3>
                      <button onClick={() => { setShowRouteForm(false); setEditingRoute(null); }} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition">
                        <X className="h-6 w-6" />
                      </button>
                    </div>

                    <form onSubmit={handleRouteSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">Nombre de la Ruta</label>
                        <input
                          type="text"
                          value={routeForm.nombre}
                          onChange={(e) => setRouteForm({ ...routeForm, nombre: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-orange-100 focus:border-orange-500 transition-all outline-none font-medium"
                          placeholder="Ej: Ruta Norte 01"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">Origen</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            value={routeForm.origen}
                            onChange={(e) => setRouteForm({ ...routeForm, origen: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-orange-100 focus:border-orange-500 transition-all outline-none font-medium"
                            placeholder="Ej: Terminal Sur"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">Destino</label>
                        <div className="relative">
                          <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            value={routeForm.destino}
                            onChange={(e) => setRouteForm({ ...routeForm, destino: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-orange-100 focus:border-orange-500 transition-all outline-none font-medium"
                            placeholder="Ej: Calle 100"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">Distancia (km)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={routeForm.distancia}
                          onChange={(e) => setRouteForm({ ...routeForm, distancia: Number(e.target.value) })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-orange-100 focus:border-orange-500 transition-all outline-none font-medium"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">Duración Est. (min)</label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="number"
                            value={routeForm.duracion_estimada}
                            onChange={(e) => setRouteForm({ ...routeForm, duracion_estimada: Number(e.target.value) })}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-orange-100 focus:border-orange-500 transition-all outline-none font-medium"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">Tarifa (COP)</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="number"
                            value={routeForm.tarifa}
                            onChange={(e) => setRouteForm({ ...routeForm, tarifa: Number(e.target.value) })}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-orange-100 focus:border-orange-500 transition-all outline-none font-medium"
                            required
                          />
                        </div>
                      </div>
                      <div className="md:col-span-2 lg:col-span-3 space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">Descripción</label>
                        <textarea
                          value={routeForm.descripcion}
                          onChange={(e) => setRouteForm({ ...routeForm, descripcion: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-orange-100 focus:border-orange-500 transition-all outline-none font-medium resize-none"
                          rows={3}
                          placeholder="Breve descripción de la ruta y sus paradas principales..."
                        />
                      </div>

                      <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-3 pt-4">
                        <button
                          type="button"
                          onClick={() => { setShowRouteForm(false); setEditingRoute(null); }}
                          className="px-8 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={actionLoading}
                          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold px-10 py-3 rounded-xl shadow-lg transition-all disabled:opacity-50"
                        >
                          {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                          {editingRoute ? 'Actualizar Ruta' : 'Crear Ruta'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {routes.map(route => (
                    <div key={route.id} className="group bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all duration-300 p-6 flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <div className="bg-orange-50 p-3 rounded-2xl">
                          <RouteIcon className="h-6 w-6 text-orange-600" />
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEditRoute(route)} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition"><Pencil className="h-4 w-4" /></button>
                          <button onClick={() => deleteRoute(route.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                      <h3 className="text-xl font-black text-gray-900 group-hover:text-orange-600 transition-colors">{route.nombre}</h3>
                      <p className="text-gray-400 text-sm mt-1 mb-4 line-clamp-2">{route.descripcion || 'Sin descripción'}</p>
                      
                      <div className="space-y-2 mb-6">
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span className="truncate">{route.origen}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          <span className="truncate">{route.destino}</span>
                        </div>
                      </div>

                      <div className="mt-auto grid grid-cols-2 gap-3 pt-4 border-t border-gray-50">
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Duración</p>
                          <p className="text-sm font-black text-gray-800">{route.duracion_estimada} min</p>
                        </div>
                        <div className="bg-orange-50/50 rounded-xl p-3">
                          <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Tarifa</p>
                          <p className="text-sm font-black text-orange-600">${route.tarifa.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {routes.length === 0 && !showRouteForm && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-200">
                      <RouteIcon className="h-16 w-16 text-gray-200 mb-4" />
                      <p className="text-gray-400 font-bold text-xl">No hay rutas registradas para esta empresa</p>
                      <button onClick={() => setShowRouteForm(true)} className="mt-4 text-orange-600 font-black hover:underline underline-offset-4">Empezar a crear rutas</button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ══════════════════════════════════════════
                BUSES SECTION
            ══════════════════════════════════════════ */}
            {activeTab === 'buses' && (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-black text-gray-900">Gestión de Flota (Buses)</h2>
                  <button
                    onClick={() => setShowBusForm(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95"
                  >
                    <Plus className="h-5 w-5" />
                    Registrar Bus
                  </button>
                </div>

                {showBusForm && (
                  <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl space-y-6 animate-in zoom-in-95">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-black text-gray-900">
                        {editingBus ? 'Editar Datos del Bus' : 'Registrar Nuevo Bus'}
                      </h3>
                      <button onClick={() => { setShowBusForm(false); setEditingBus(null); }} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition">
                        <X className="h-6 w-6" />
                      </button>
                    </div>

                    <form onSubmit={handleBusSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">Placa</label>
                        <input
                          type="text"
                          value={busForm.placa}
                          onChange={(e) => setBusForm({ ...busForm, placa: e.target.value.toUpperCase() })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-medium uppercase"
                          placeholder="ABC-123"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">Marca</label>
                        <input
                          type="text"
                          value={busForm.marca}
                          onChange={(e) => setBusForm({ ...busForm, marca: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-medium"
                          placeholder="Ej: Mercedes-Benz"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">Modelo (Año)</label>
                        <input
                          type="text"
                          value={busForm.modelo}
                          onChange={(e) => setBusForm({ ...busForm, modelo: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-medium"
                          placeholder="Ej: 2024"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">Capacidad (Pasajeros)</label>
                        <input
                          type="number"
                          value={busForm.capacidad}
                          onChange={(e) => setBusForm({ ...busForm, capacidad: Number(e.target.value) })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-medium"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">Estado</label>
                        <select
                          value={busForm.estado}
                          onChange={(e) => setBusForm({ ...busForm, estado: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-medium"
                        >
                          <option value="ACTIVO">ACTIVO</option>
                          <option value="MANTENIMIENTO">MANTENIMIENTO</option>
                          <option value="INACTIVO">INACTIVO</option>
                        </select>
                      </div>

                      <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-3 pt-4">
                        <button
                          type="button"
                          onClick={() => { setShowBusForm(false); setEditingBus(null); }}
                          className="px-8 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={actionLoading}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-10 py-3 rounded-xl shadow-lg transition-all disabled:opacity-50"
                        >
                          {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                          {editingBus ? 'Actualizar Bus' : 'Registrar Bus'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-gray-400 font-black text-[11px] uppercase tracking-widest border-b border-gray-100">
                          <th className="px-8 py-5">Bus / Info</th>
                          <th className="px-8 py-5">Placa</th>
                          <th className="px-8 py-5">Capacidad</th>
                          <th className="px-8 py-5">Estado</th>
                          <th className="px-8 py-5 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {buses.map(bus => (
                          <tr key={bus.id} className="hover:bg-blue-50/30 transition-colors">
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-4">
                                <div className="bg-blue-100 p-3 rounded-2xl text-blue-600">
                                  <Bus className="h-6 w-6" />
                                </div>
                                <div>
                                  <p className="font-black text-gray-900">{bus.marca}</p>
                                  <p className="text-xs text-gray-400 font-bold">{bus.modelo}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <span className="bg-gray-100 px-3 py-1.5 rounded-lg font-black text-gray-700 border border-gray-200">
                                {bus.placa}
                              </span>
                            </td>
                            <td className="px-8 py-5">
                              <p className="font-bold text-gray-700">{bus.capacidad} pasajeros</p>
                            </td>
                            <td className="px-8 py-5">
                              <span className={`px-3 py-1.5 rounded-xl text-[11px] font-black tracking-tight ${
                                bus.estado === 'ACTIVO' ? 'bg-green-100 text-green-700' : 
                                bus.estado === 'MANTENIMIENTO' ? 'bg-amber-100 text-amber-700' : 
                                'bg-red-100 text-red-700'
                              }`}>
                                {bus.estado}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-right">
                              <div className="flex justify-end gap-2">
                                <button onClick={() => startEditBus(bus)} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition"><Pencil className="h-4 w-4" /></button>
                                <button onClick={() => deleteBus(bus.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition"><Trash2 className="h-4 w-4" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {buses.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-8 py-16 text-center text-gray-400 font-bold">
                              No hay buses registrados en la flota
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm font-medium">© 2024 Intelligent Smart Bus System - Company Admin Panel</p>
        </div>
      </footer>
    </div>
  );
};
