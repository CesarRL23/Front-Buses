import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';
import { businessService } from '../services/businessService';
import { IncidentReportModal } from '../components/IncidentReportModal';
import { IncidentData } from '../types/incident.types';
import { 
  Bus, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  UserCheck, 
  CheckCircle,
  Navigation,
  Fuel,
  Play,
  CheckCircle2,
  X,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

interface Shift {
  id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
  bus?: { id: number; placa: string; marca?: string; modelo?: string; capacidad?: number };
}

export const ConductorDashboard: React.FC = () => {
  const { user } = useAuth();
  const isConductor = user?.roles?.some(r => r.toUpperCase() === 'CONDUCTOR') ?? false;

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal state
  const [showStartModal, setShowStartModal] = useState(false);
  const [busState, setBusState] = useState<'operativo' | 'observaciones'>('operativo');
  const [busNotes, setBusNotes] = useState('');

  // Incident Report Modal state
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [shiftIncidents, setShiftIncidents] = useState<IncidentData[]>([]);
  const [incidentsLoading, setIncidentsLoading] = useState(false);

  const loadShifts = async () => {
    try {
      setLoading(true);
      const data = await businessService.getShifts();
      // Assume backend returns all shifts, filter to today's shifts for this driver
      // For demo purposes, if driver logic is not fully implemented in backend yet, 
      // we'll just take any shift that is PROGRAMADO or EN CURSO to show the feature.
      setShifts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Error al cargar tus turnos');
    } finally {
      setLoading(false);
    }
  };

  const loadShiftIncidents = async (shiftId: number) => {
    try {
      setIncidentsLoading(true);
      const incidents = await businessService.getShiftIncidents(shiftId);
      setShiftIncidents(Array.isArray(incidents) ? incidents : []);
    } catch (err) {
      console.error('Error loading shift incidents:', err);
      setShiftIncidents([]);
    } finally {
      setIncidentsLoading(false);
    }
  };

  useEffect(() => {
    if (isConductor) {
      loadShifts();
    }
  }, [isConductor]);

  useEffect(() => {
    const activeShift = shifts.find(s => s.estado === 'EN CURSO');
    if (activeShift && activeShift.id) {
      loadShiftIncidents(activeShift.id);
    }
  }, [shifts]);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => { setSuccess(''); setError(''); }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  if (!isConductor) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[80vh] text-center px-4">
          <div className="bg-blue-100 rounded-full p-6 mb-6">
            <Bus className="h-16 w-16 text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600 max-w-md">
            Solo los usuarios con rol <span className="font-semibold text-blue-600">CONDUCTOR</span> pueden acceder a este panel.
          </p>
        </div>
      </div>
    );
  }

  // Find active or next shift
  const activeShift = shifts.find(s => s.estado === 'EN CURSO');
  const nextShift = shifts.find(s => s.estado === 'PROGRAMADO' || !s.estado);
  const currentShift = activeShift || nextShift;

  const handleStartShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShift) return;
    
    setActionLoading(true);
    try {
      await businessService.startShift(currentShift.id, {
        estado_bus: busState === 'operativo',
        observaciones_bus: busState === 'observaciones' ? busNotes : undefined
      });
      setSuccess('¡Turno iniciado con éxito! GPS Activado.');
      setShowStartModal(false);
      loadShifts(); // reload to get EN CURSO status
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al iniciar el turno');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />
      
      {/* Start Shift Modal */}
      {showStartModal && currentShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-gray-900">Iniciar Turno</h3>
              <button onClick={() => setShowStartModal(false)} aria-label="Cerrar modal de turno" title="Cerrar modal de turno" className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleStartShift} className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <p className="text-sm font-bold text-blue-800 mb-1">Vehículo Asignado</p>
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 p-2 rounded-xl text-white">
                    <Bus className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xl font-black text-gray-900">{currentShift.bus?.placa || 'N/A'}</p>
                    <p className="text-xs font-bold text-blue-600 uppercase">{currentShift.bus?.marca || 'Bus Standard'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-bold text-gray-700">Estado del Vehículo</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBusState('operativo')}
                    className={`p-3 rounded-xl border-2 font-bold transition-all ${
                      busState === 'operativo' 
                        ? 'border-green-500 bg-green-50 text-green-700' 
                        : 'border-gray-200 bg-white text-gray-500 hover:border-green-200'
                    }`}
                  >
                    Óptimo
                  </button>
                  <button
                    type="button"
                    onClick={() => setBusState('observaciones')}
                    className={`p-3 rounded-xl border-2 font-bold transition-all ${
                      busState === 'observaciones' 
                        ? 'border-orange-500 bg-orange-50 text-orange-700' 
                        : 'border-gray-200 bg-white text-gray-500 hover:border-orange-200'
                    }`}
                  >
                    Observaciones
                  </button>
                </div>
              </div>

              {busState === 'observaciones' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <label className="text-sm font-bold text-gray-700">Notas de las observaciones</label>
                  <textarea 
                    required
                    value={busNotes}
                    onChange={(e) => setBusNotes(e.target.value)}
                    className="w-full border-2 border-orange-200 rounded-xl p-3 text-sm focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all resize-none"
                    rows={3}
                    placeholder="Ej: Espejo derecho rayado, llanta de repuesto baja..."
                  />
                </div>
              )}

              <div className="pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-lg py-4 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Play className="h-6 w-6 fill-current" />}
                  Comenzar Turno
                </button>
                <p className="text-center text-xs text-gray-400 mt-3 font-medium">Al comenzar, el GPS del bus se activará automáticamente.</p>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* Incident Report Modal */}
              <IncidentReportModal
                isOpen={showIncidentModal}
                onClose={() => setShowIncidentModal(false)}
                shiftId={activeShift?.id || 0}
                onSuccess={() => {
                  if (activeShift?.id) {
                    loadShiftIncidents(activeShift.id);
                  }
                }}
              />

        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
              <UserCheck className="h-8 w-8 text-blue-600" />
              Panel del Conductor
            </h1>
            <p className="text-gray-500 mt-2">¡Hola, {user?.firstName}! Gestiona tu jornada hoy.</p>
          </div>
          
          {activeShift && (
            <div className="flex items-center gap-3 bg-green-50 border border-green-100 px-4 py-2 rounded-xl">
               <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
               <span className="text-sm font-bold text-green-700 uppercase">En turno activo - GPS Transmitiendo</span>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700 font-semibold">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-r-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <p className="text-green-700 font-semibold">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-6">
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-500 font-bold">Cargando tu horario...</p>
              </div>
            ) : !currentShift ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                <Clock className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Día Libre</h3>
                <p className="text-gray-500">No tienes turnos programados para hoy.</p>
              </div>
            ) : activeShift ? (
              /* Active Trip Card */
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl shadow-xl p-8 text-white relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-10">
                   <Navigation className="w-48 h-48" />
                 </div>
                 
                 <div className="relative z-10">
                   <div className="flex justify-between items-start mb-10">
                      <div>
                        <p className="text-blue-100 text-sm font-semibold uppercase tracking-wider mb-1">Viaje Actual</p>
                        <h2 className="text-4xl font-black">Ruta en Progreso</h2>
                      </div>
                      <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/30 flex items-center gap-2">
                         <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                         <p className="text-sm font-black uppercase tracking-widest text-white">EN CURSO</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="space-y-1">
                         <div className="flex items-center gap-2 text-blue-100">
                           <Bus className="w-4 h-4" />
                           <span className="text-xs uppercase font-bold">Vehículo</span>
                         </div>
                         <p className="text-xl font-bold">{activeShift.bus?.placa || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                         <div className="flex items-center gap-2 text-blue-100">
                           <Clock className="w-4 h-4" />
                           <span className="text-xs uppercase font-bold">Inicio</span>
                         </div>
                         <p className="text-xl font-bold">{activeShift.hora_inicio ? new Date(activeShift.hora_inicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                         <div className="flex items-center gap-2 text-blue-100">
                           <MapPin className="w-4 h-4" />
                           <span className="text-xs uppercase font-bold">GPS</span>
                         </div>
                         <p className="text-xl font-bold text-green-300">ACTIVO</p>
                      </div>
                   </div>

                   <div className="mt-10 flex flex-wrap gap-4">
                      <button className="bg-white text-blue-600 font-bold px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95">
                        Ver Mapa / Navegación
                      </button>
                      <button className="bg-blue-500/30 border border-white/30 text-white font-bold px-6 py-3 rounded-2xl hover:bg-blue-500/50 transition-all">
                        Finalizar Turno
                      </button>
                   </div>
                 </div>
              </div>
            ) : (
              /* Next Trip Card (Pending to start) */
              <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
                 <div className="flex justify-between items-start mb-8">
                    <div>
                      <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">Próximo Turno</p>
                      <h2 className="text-3xl font-black text-gray-900">Por Comenzar</h2>
                    </div>
                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest">
                      Programado
                    </span>
                 </div>

                 <div className="flex items-center gap-8 mb-8">
                   <div className="flex items-center gap-4">
                     <div className="bg-blue-50 p-4 rounded-2xl text-blue-600">
                       <Clock className="h-8 w-8" />
                     </div>
                     <div>
                       <p className="text-sm font-bold text-gray-500">Hora Programada</p>
                       <p className="text-2xl font-black text-gray-900">
                         {nextShift?.hora_inicio ? new Date(nextShift.hora_inicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '00:00'}
                       </p>
                     </div>
                   </div>
                   
                   <div className="w-px h-16 bg-gray-200 hidden md:block"></div>
                   
                   <div className="flex items-center gap-4">
                     <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600">
                       <Bus className="h-8 w-8" />
                     </div>
                     <div>
                       <p className="text-sm font-bold text-gray-500">Bus Asignado</p>
                       <p className="text-2xl font-black text-gray-900">{nextShift?.bus?.placa || 'N/A'}</p>
                     </div>
                   </div>
                 </div>

                 <button 
                   onClick={() => setShowStartModal(true)}
                   className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-black text-lg px-10 py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                 >
                   <Play className="h-6 w-6 fill-current" />
                   Preparar e Iniciar Turno
                 </button>
              </div>
            )}

            {/* Checklist and Maintenance Section */}
            {activeShift && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                     <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                       <AlertCircle className="h-5 w-5 text-orange-600" />
                       Reportar Novedad Rápida
                     </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Reporta cualquier incidente que ocurra durante tu turno para que quede documentado en el sistema.
                    </p>
                    <button 
                      onClick={() => setShowIncidentModal(true)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-2xl transition shadow-md flex items-center justify-center gap-2"
                    >
                      <AlertTriangle className="h-5 w-5" />
                      Reportar Incidente
                    </button>
                </div>
              </div>
            )}

            {/* Incidents List Section */}
            {activeShift && shiftIncidents.length > 0 && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Incidentes Reportados ({shiftIncidents.length})
                </h3>
                <div className="space-y-3">
                  {shiftIncidents.map((incident) => (
                    <div
                      key={incident.id}
                      className={`p-4 rounded-2xl border-l-4 ${
                        incident.gravedad === 'critico'
                          ? 'bg-red-50 border-red-500'
                          : incident.gravedad === 'alto'
                          ? 'bg-orange-50 border-orange-500'
                          : incident.gravedad === 'medio'
                          ? 'bg-yellow-50 border-yellow-500'
                          : 'bg-blue-50 border-blue-500'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-bold text-gray-900 capitalize">
                            {incident.tipo_otro && incident.tipo === 'otro'
                              ? incident.tipo_otro
                              : incident.tipo}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(incident.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                            incident.gravedad === 'critico'
                              ? 'bg-red-200 text-red-700'
                              : incident.gravedad === 'alto'
                              ? 'bg-orange-200 text-orange-700'
                              : incident.gravedad === 'medio'
                              ? 'bg-yellow-200 text-yellow-700'
                              : 'bg-blue-200 text-blue-700'
                          }`}
                        >
                          {incident.gravedad}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{incident.descripcion}</p>
                      {incident.incidenteBuses?.[0]?.fotos?.length > 0 && (
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                          📷 {incident.incidenteBuses[0].fotos.length} foto(s) adjunta(s)
                        </p>
                      )}
                    </div>
                  ))}
                 </div>
              </div>
            )}
          </div>

          {/* Schedule Sidebar */}
          <div className="lg:col-span-4 space-y-6">
             <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                   <Clock className="w-6 h-6 text-indigo-600" />
                   Resumen del Día
                </h3>
                {shifts.length > 0 ? (
                  <div className="space-y-4">
                     {shifts.map((slot) => (
                       <div key={slot.id} className={`p-4 rounded-2xl border ${slot.estado === 'EN CURSO' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100'}`}>
                          <div className="flex justify-between items-start">
                             <div>
                                <p className="text-xs font-bold text-gray-400 mb-1">Turno #{slot.id}</p>
                                <h4 className="text-sm font-bold text-gray-900">{slot.bus?.placa || 'Sin bus'}</h4>
                             </div>
                             <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${
                               slot.estado === 'COMPLETADO' ? 'bg-green-100 text-green-700' : 
                               slot.estado === 'EN CURSO' ? 'bg-blue-600 text-white' : 
                               'bg-gray-200 text-gray-500'
                             }`}>
                               {slot.estado || 'PROGRAMADO'}
                             </span>
                          </div>
                       </div>
                     ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 font-medium">No hay turnos registrados hoy.</p>
                )}
             </div>

             <div className="bg-gray-900 rounded-3xl p-8 text-white text-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-400" />
                <h3 className="text-2xl font-black mb-2">Asistencia</h3>
                <p className="text-gray-400 text-sm mb-6">¿Necesitas ayuda técnica o reportar una emergencia?</p>
                <div className="space-y-3">
                   <button className="w-full bg-red-600 font-black py-4 rounded-2xl hover:bg-red-700 transition shadow-lg flex items-center justify-center gap-2 uppercase tracking-tighter">
                     <ShieldCheck className="w-6 h-6" />
                     Botón de Emergencia
                   </button>
                   <button className="w-full bg-white/10 border border-white/20 font-bold py-3 rounded-2xl hover:bg-white/20 transition">
                     Contactar Base
                   </button>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
