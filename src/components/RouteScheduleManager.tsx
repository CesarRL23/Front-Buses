import React, { useState, useEffect, useCallback } from 'react';
import { businessService } from '../services/businessService';
import { Calendar, Clock, Bus, Route as RouteIcon, Plus, Save, X, Trash2, Pencil, RefreshCw, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

interface Route {
  id: number;
  nombre: string;
}

interface BusRecord {
  id: number;
  placa: string;
}

interface Driver {
  id: number;
  // Based on your entities, driver might just have an id, or link to a person
  // For the UI, we'll try to show id or a name if available
  person?: { nombre: string };
}

interface Schedule {
  id: number;
  routeId: number;
  busId: number;
  fecha: string;
  horaSalida: string;
  margenTolerancia: number;
  esRecurrente: boolean;
  tipoRecurrencia: string;
  estado: string;
  route?: Route;
  bus?: BusRecord;
  driver?: Driver;
}

interface Props {
  companyId: number;
}

export const RouteScheduleManager: React.FC<Props> = ({ companyId }) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [buses, setBuses] = useState<BusRecord[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    routeId: '',
    busId: '',
    driverId: '',
    fecha: '',
    horaSalida: '',
    margenTolerancia: 5,
    esRecurrente: false,
    tipoRecurrencia: 'DIARIA',
    estado: 'PROGRAMADO'
  });
 
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [schedulesData, routesData, busesData, driversData, shiftsData] = await Promise.all([
        businessService.getSchedules(companyId).catch(() => []),
        businessService.getRoutes(companyId).catch(() => []),
        businessService.getBuses(companyId).catch(() => []),
        businessService.getDrivers().catch(() => []),
        businessService.getShifts().catch(() => [])
      ]);
      setSchedules(Array.isArray(schedulesData) ? schedulesData : []);
      setRoutes(Array.isArray(routesData) ? routesData : []);
      setBuses(Array.isArray(busesData) ? busesData : []);
      setDrivers(Array.isArray(driversData) ? driversData : []);
      setShifts(Array.isArray(shiftsData) ? shiftsData : []);
    } catch (err) {
      setError('Error al cargar la información de programaciones');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Feedback auto-clear
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => { setSuccess(''); setError(''); }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      routeId: '',
      busId: '',
      driverId: '',
      fecha: '',
      horaSalida: '',
      margenTolerancia: 5,
      esRecurrente: false,
      tipoRecurrencia: 'DIARIA',
      estado: 'PROGRAMADO'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = { 
        ...formData, 
        companyId,
        routeId: Number(formData.routeId),
        busId: Number(formData.busId),
        driverId: Number(formData.driverId),
        margenTolerancia: Number(formData.margenTolerancia)
      };

      if (editingId) {
        await businessService.updateSchedule(editingId, payload);
        setSuccess('Programación actualizada correctamente');
      } else {
        await businessService.createSchedule(payload);
        setSuccess('Programación creada correctamente');
      }
      resetForm();
      loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al guardar la programación. Verifica disponibilidad del bus.');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteSchedule = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar esta programación?')) return;
    setActionLoading(true);
    try {
      await businessService.deleteSchedule(id);
      setSuccess('Programación eliminada');
      loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al eliminar la programación');
    } finally {
      setActionLoading(false);
    }
  };

  const startEdit = (schedule: Schedule) => {
    setEditingId(schedule.id);
    setFormData({
      routeId: String(schedule.routeId),
      busId: String(schedule.busId),
      driverId: String(schedule.driver?.id || ''),
      fecha: schedule.fecha.split('T')[0], // assuming ISO format
      horaSalida: schedule.horaSalida,
      margenTolerancia: schedule.margenTolerancia || 5,
      esRecurrente: schedule.esRecurrente || false,
      tipoRecurrencia: schedule.tipoRecurrencia || 'DIARIA',
      estado: schedule.estado || 'PROGRAMADO'
    });
    setShowForm(true);
  };

  if (loading && !showForm) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="h-10 w-10 text-emerald-600 animate-spin" />
        <p className="text-gray-500 font-bold">Cargando programaciones...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-gray-900">Programación de Rutas</h2>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-95"
        >
          <Plus className="h-5 w-5" />
          Nueva Programación
        </button>
      </div>

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

      {showForm && (
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl space-y-6 animate-in zoom-in-95">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-gray-900">
              {editingId ? 'Editar Programación' : 'Crear Nueva Programación'}
            </h3>
            <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Ruta</label>
              <div className="relative">
                <RouteIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={formData.routeId}
                  onChange={(e) => setFormData({ ...formData, routeId: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all outline-none font-medium appearance-none"
                  required
                >
                  <option value="">Seleccione una ruta...</option>
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>{r.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Bus</label>
              <div className="relative">
                <Bus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={formData.busId}
                  onChange={(e) => setFormData({ ...formData, busId: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all outline-none font-medium appearance-none"
                  required
                >
                  <option value="">Seleccione un bus...</option>
                  {buses.map(b => (
                    <option key={b.id} value={b.id}>{b.placa}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Conductor</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-4 h-4 text-gray-400 bg-gray-200 rounded-full text-[10px] font-bold">C</div>
                <select
                  value={formData.driverId}
                  onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all outline-none font-medium appearance-none"
                  required
                >
                  <option value="">Seleccione un conductor...</option>
                  {drivers
                    .filter(d => {
                      // Only show driver if they have at least one shift with status 'COMPLETADO'
                      const hasCompletedShift = shifts.some(s => s.driver?.id === d.id && s.estado === 'COMPLETADO');
                      const isCurrentSelection = String(d.id) === formData.driverId;
                      return hasCompletedShift || isCurrentSelection;
                    })
                    .map(d => (
                      <option key={d.id} value={d.id}>{d.person?.nombre || `Conductor ${d.id}`}</option>
                    ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Fecha de Salida</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all outline-none font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Hora de Salida</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="time"
                  value={formData.horaSalida}
                  onChange={(e) => setFormData({ ...formData, horaSalida: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all outline-none font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Tolerancia (minutos)</label>
              <input
                type="number"
                min="0"
                value={formData.margenTolerancia}
                onChange={(e) => setFormData({ ...formData, margenTolerancia: Number(e.target.value) })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all outline-none font-medium"
                required
              />
            </div>

            <div className="space-y-2 flex flex-col justify-end pb-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.esRecurrente}
                    onChange={(e) => setFormData({ ...formData, esRecurrente: e.target.checked })}
                    className="peer sr-only"
                  />
                  <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-4 peer-focus:ring-emerald-100"></div>
                </div>
                <span className="text-sm font-bold text-gray-700">Programación Recurrente</span>
              </label>
            </div>

            {formData.esRecurrente && (
              <div className="space-y-2 md:col-span-2 lg:col-span-3">
                <label className="text-sm font-bold text-gray-700 ml-1">Tipo de Recurrencia</label>
                <div className="flex gap-4">
                  {['LUNES_A_VIERNES', 'FINES_DE_SEMANA', 'DIARIA'].map(tipo => (
                    <label key={tipo} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="tipoRecurrencia"
                        value={tipo}
                        checked={formData.tipoRecurrencia === tipo}
                        onChange={(e) => setFormData({ ...formData, tipoRecurrencia: e.target.value })}
                        className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {tipo === 'LUNES_A_VIERNES' ? 'Lunes a Viernes' : tipo === 'FINES_DE_SEMANA' ? 'Fines de Semana' : 'Diaria'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-8 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-10 py-3 rounded-xl shadow-lg transition-all disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                {editingId ? 'Actualizar Programación' : 'Guardar Programación'}
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
                <th className="px-8 py-5">Ruta</th>
                <th className="px-8 py-5">Bus & Conductor</th>
                <th className="px-8 py-5">Horario</th>
                <th className="px-8 py-5">Recurrencia</th>
                <th className="px-8 py-5">Estado</th>
                <th className="px-8 py-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {schedules.map(schedule => {
                const routeName = routes.find(r => r.id === schedule.routeId)?.nombre || schedule.route?.nombre || `Ruta ${schedule.routeId}`;
                const busPlaca = buses.find(b => b.id === schedule.busId)?.placa || schedule.bus?.placa || `Bus ${schedule.busId}`;
                const driverName = schedule.driver?.person?.nombre || `Conductor ${schedule.driver?.id || ''}`;
                
                return (
                  <tr key={schedule.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="px-8 py-5 font-bold text-gray-900">{routeName}</td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-1">
                        <span className="bg-gray-100 px-3 py-1 rounded-lg font-black text-gray-700 border border-gray-200 w-fit text-xs">
                          {busPlaca}
                        </span>
                        <span className="text-xs font-bold text-gray-500">{driverName}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-700">{schedule.fecha}</span>
                        <span className="text-emerald-600 font-black">{schedule.horaSalida}</span>
                        <span className="text-[10px] text-gray-400 font-bold">±{schedule.margenTolerancia} min</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      {schedule.esRecurrente ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg w-fit">
                          <RefreshCw className="h-3 w-3" />
                          <span className="text-[10px] font-black uppercase">
                            {schedule.tipoRecurrencia.replace(/_/g, ' ')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 font-medium text-xs">Única vez</span>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      <span className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-xl text-[11px] font-black tracking-tight">
                        {schedule.estado}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => startEdit(schedule)} className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 transition"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => deleteSchedule(schedule.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {schedules.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-16 text-center text-gray-400 font-bold">
                    No hay programaciones registradas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
