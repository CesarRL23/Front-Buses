import React, { useState, useEffect, useCallback } from 'react';
import { businessService } from '../services/businessService';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  MessageSquarePlus,
  RefreshCw,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  BarChart3,
  X,
  Send,
  Loader2,
  AlertCircle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Foto {
  id: number;
  url: string;
}

interface IncidenteBusEntry {
  id: number;
  bus?: { id: number; placa: string };
  fotos?: Foto[];
  notas?: string;
}

interface Comentario {
  autor: string;
  texto: string;
  timestamp: string;
}

interface Incidente {
  id: number;
  timestamp: string;
  tipo: string;
  gravedad: string;
  descripcion: string;
  estado: string;
  comentarios?: string | null;
  tipo_otro?: string;
  shift?: {
    id: number;
    driver?: {
      id: number;
      person?: { id: number; nombre: string };
    };
  };
  incidenteBuses?: IncidenteBusEntry[];
}

interface Estadisticas {
  total: number;
  porTipo: Record<string, number>;
  porEstado: Record<string, number>;
  tasaResolucion: number;
}

interface Props {
  busId: number;
  busPlaca: string;
  currentUserName?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TIPO_LABELS: Record<string, string> = {
  mecanico: 'Mecánico',
  accidente: 'Accidente',
  retraso: 'Retraso',
  otro: 'Otro',
};

const ESTADO_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pendiente: {
    label: 'Pendiente',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: <Clock className="h-3 w-3" />,
  },
  en_revision: {
    label: 'En revisión',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <RefreshCw className="h-3 w-3" />,
  },
  resuelto: {
    label: 'Resuelto',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
};

const GRAVEDAD_CONFIG: Record<string, { label: string; dot: string }> = {
  bajo: { label: 'Bajo', dot: 'bg-green-500' },
  medio: { label: 'Medio', dot: 'bg-yellow-500' },
  alto: { label: 'Alto', dot: 'bg-orange-500' },
  critico: { label: 'Crítico', dot: 'bg-red-600' },
};

function formatDate(ts: string) {
  return new Date(ts).toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────
const StatCard: React.FC<{
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}> = ({ label, value, sub, color }) => (
  <div className={`rounded-2xl border p-4 flex flex-col gap-1 ${color}`}>
    <span className="text-xs font-bold uppercase tracking-wide opacity-70">{label}</span>
    <span className="text-3xl font-black">{value}</span>
    {sub && <span className="text-xs font-medium opacity-60">{sub}</span>}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export const BusIncidentesPanel: React.FC<Props> = ({
  busId,
  busPlaca,
  currentUserName = 'Admin',
}) => {
  const [incidentes, setIncidentes] = useState<Incidente[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [filterTipo, setFilterTipo] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  // Expanded cards
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Comment state per incident
  const [commentText, setCommentText] = useState('');
  const [commentingId, setCommentingId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    if (!busId) return;
    setLoading(true);
    setError('');
    try {
      const data = await businessService.getBusIncidents(
        busId,
        filterTipo || undefined,
        filterEstado || undefined,
      );
      setIncidentes(data.incidentes);
      setEstadisticas(data.estadisticas);
    } catch {
      setError('Error al cargar incidentes del bus');
    } finally {
      setLoading(false);
    }
  }, [busId, filterTipo, filterEstado]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-clear feedback
  useEffect(() => {
    if (success || error) {
      const t = setTimeout(() => { setSuccess(''); setError(''); }, 4000);
      return () => clearTimeout(t);
    }
  }, [success, error]);

  const handleEstadoChange = async (incidenteId: number, nuevoEstado: string) => {
    setActionLoading(incidenteId);
    try {
      await businessService.changeIncidenteEstado(incidenteId, nuevoEstado);
      setSuccess('Estado actualizado');
      await loadData();
    } catch {
      setError('Error al cambiar estado');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddComment = async (incidenteId: number) => {
    if (!commentText.trim()) return;
    setActionLoading(incidenteId);
    try {
      await businessService.addIncidenteComentario(incidenteId, currentUserName, commentText.trim());
      setSuccess('Comentario agregado');
      setCommentText('');
      setCommentingId(null);
      await loadData();
    } catch {
      setError('Error al agregar comentario');
    } finally {
      setActionLoading(null);
    }
  };

  const getComentarios = (inc: Incidente): Comentario[] => {
    if (!inc.comentarios) return [];
    try {
      return JSON.parse(inc.comentarios);
    } catch {
      return [];
    }
  };

  const fotos = (inc: Incidente): Foto[] =>
    inc.incidenteBuses?.flatMap((ib) => ib.fotos || []) ?? [];

  const driverName = (inc: Incidente) =>
    inc.shift?.driver?.person?.nombre ?? 'Sin conductor';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-orange-500" />
            Incidentes — Bus {busPlaca}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Historial completo de incidentes registrados para este bus
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-orange-300 font-bold text-gray-600 hover:text-orange-600 shadow-sm transition"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Feedback */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 font-semibold">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-xl flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
          <p className="text-green-700 font-semibold">{success}</p>
        </div>
      )}

      {/* Statistics */}
      {estadisticas && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-5 w-5 text-orange-500" />
            <h3 className="font-black text-gray-900">Estadísticas Generales</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total incidentes"
              value={estadisticas.total}
              color="border-gray-200 bg-gray-50 text-gray-900"
            />
            <StatCard
              label="Tasa de resolución"
              value={`${estadisticas.tasaResolucion}%`}
              sub={`${estadisticas.porEstado['resuelto'] ?? 0} resueltos`}
              color="border-green-200 bg-green-50 text-green-900"
            />
            <StatCard
              label="Pendientes"
              value={estadisticas.porEstado['pendiente'] ?? 0}
              color="border-amber-200 bg-amber-50 text-amber-900"
            />
            <StatCard
              label="En revisión"
              value={estadisticas.porEstado['en_revision'] ?? 0}
              color="border-blue-200 bg-blue-50 text-blue-900"
            />
          </div>

          {/* Por tipo */}
          {Object.keys(estadisticas.porTipo).length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Por tipo</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(estadisticas.porTipo).map(([tipo, count]) => (
                  <span
                    key={tipo}
                    className="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-800 text-sm font-bold px-3 py-1.5 rounded-full"
                  >
                    {TIPO_LABELS[tipo] ?? tipo}
                    <span className="bg-orange-200 text-orange-900 rounded-full px-1.5 py-0.5 text-xs">
                      {count}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-bold text-gray-600">Filtros:</span>

          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none bg-white"
            id="filter-tipo"
          >
            <option value="">Todos los tipos</option>
            <option value="mecanico">Mecánico</option>
            <option value="accidente">Accidente</option>
            <option value="retraso">Retraso</option>
            <option value="otro">Otro</option>
          </select>

          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none bg-white"
            id="filter-estado"
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="en_revision">En revisión</option>
            <option value="resuelto">Resuelto</option>
          </select>

          {(filterTipo || filterEstado) && (
            <button
              onClick={() => { setFilterTipo(''); setFilterEstado(''); }}
              className="flex items-center gap-1 text-sm font-bold text-gray-400 hover:text-red-500 transition"
            >
              <X className="h-4 w-4" />
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Incidents List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />
          <p className="text-gray-500 font-bold">Cargando incidentes...</p>
        </div>
      ) : incidentes.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-gray-200 py-16 flex flex-col items-center gap-3">
          <CheckCircle2 className="h-12 w-12 text-green-400" />
          <p className="text-gray-500 font-bold text-lg">Sin incidentes registrados</p>
          <p className="text-gray-400 text-sm">
            {filterTipo || filterEstado
              ? 'No hay incidentes con los filtros aplicados'
              : 'Este bus no tiene incidentes reportados'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {incidentes.map((inc) => {
            const estadoCfg = ESTADO_CONFIG[inc.estado] ?? ESTADO_CONFIG['pendiente'];
            const gravedadCfg = GRAVEDAD_CONFIG[inc.gravedad] ?? { label: inc.gravedad, dot: 'bg-gray-400' };
            const comentariosList = getComentarios(inc);
            const fotosList = fotos(inc);
            const isExpanded = expandedId === inc.id;
            const isActioning = actionLoading === inc.id;

            return (
              <div
                key={inc.id}
                className={`bg-white rounded-3xl border shadow-sm transition-all duration-300 overflow-hidden ${
                  isExpanded ? 'border-orange-200 shadow-md' : 'border-gray-100 hover:border-orange-100 hover:shadow'
                }`}
              >
                {/* Card Header */}
                <div
                  className="p-6 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : inc.id!)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {/* Severity dot */}
                      <div className={`mt-1.5 h-3 w-3 flex-shrink-0 rounded-full ${gravedadCfg.dot}`} />

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-black text-gray-900">
                            {TIPO_LABELS[inc.tipo] ?? inc.tipo}
                            {inc.tipo_otro ? ` — ${inc.tipo_otro}` : ''}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold ${estadoCfg.color}`}>
                            {estadoCfg.icon}
                            {estadoCfg.label}
                          </span>
                          <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                            {gravedadCfg.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{inc.descripcion}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-400 font-medium">
                          <span>📅 {formatDate(inc.timestamp)}</span>
                          <span>🚗 {driverName(inc)}</span>
                          {fotosList.length > 0 && (
                            <span>📷 {fotosList.length} foto{fotosList.length > 1 ? 's' : ''}</span>
                          )}
                          {comentariosList.length > 0 && (
                            <span>💬 {comentariosList.length} comentario{comentariosList.length > 1 ? 's' : ''}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : inc.id!); }}
                        className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition"
                      >
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-6 space-y-6 bg-gray-50/50">

                    {/* Change Status */}
                    <div className="space-y-2">
                      <p className="text-xs font-black text-gray-500 uppercase tracking-wide">Cambiar estado</p>
                      <div className="flex flex-wrap gap-2">
                        {(['pendiente', 'en_revision', 'resuelto'] as const).map((e) => {
                          const cfg = ESTADO_CONFIG[e];
                          const isCurrent = inc.estado === e;
                          return (
                            <button
                              key={e}
                              id={`estado-${inc.id}-${e}`}
                              disabled={isCurrent || isActioning}
                              onClick={() => handleEstadoChange(inc.id!, e)}
                              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-bold transition ${
                                isCurrent
                                  ? `${cfg.color} cursor-default`
                                  : 'bg-white border-gray-200 text-gray-500 hover:border-orange-300 hover:text-orange-600'
                              } disabled:opacity-60`}
                            >
                              {isActioning ? <Loader2 className="h-3 w-3 animate-spin" /> : cfg.icon}
                              {cfg.label}
                              {isCurrent && <span className="ml-1 text-[10px] font-black opacity-60">ACTUAL</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Photos */}
                    {fotosList.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-black text-gray-500 uppercase tracking-wide flex items-center gap-1">
                          <ImageIcon className="h-4 w-4" />
                          Fotografías ({fotosList.length})
                        </p>
                        <div className="flex flex-wrap gap-3">
                          {fotosList.map((foto) => (
                            <a
                              key={foto.id}
                              href={foto.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group relative h-24 w-24 rounded-2xl overflow-hidden border-2 border-gray-200 hover:border-orange-400 transition shadow-sm"
                            >
                              <img
                                src={foto.url}
                                alt="Foto incidente"
                                className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    'https://via.placeholder.com/96x96?text=IMG';
                                }}
                              />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Comments */}
                    <div className="space-y-3">
                      <p className="text-xs font-black text-gray-500 uppercase tracking-wide flex items-center gap-1">
                        <MessageSquarePlus className="h-4 w-4" />
                        Comentarios de seguimiento ({comentariosList.length})
                      </p>

                      {comentariosList.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">Sin comentarios aún</p>
                      ) : (
                        <div className="space-y-3">
                          {comentariosList.map((c, idx) => (
                            <div key={idx} className="bg-white rounded-2xl border border-gray-200 p-4">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-sm font-black text-gray-900">{c.autor}</span>
                                <span className="text-xs text-gray-400">{formatDate(c.timestamp)}</span>
                              </div>
                              <p className="text-sm text-gray-600 leading-relaxed">{c.texto}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add comment form */}
                      {commentingId === inc.id ? (
                        <div className="bg-white rounded-2xl border border-orange-200 p-4 space-y-3">
                          <textarea
                            id={`comment-input-${inc.id}`}
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Escribe tu comentario de seguimiento..."
                            rows={3}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 resize-none"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => { setCommentingId(null); setCommentText(''); }}
                              className="px-4 py-2 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => handleAddComment(inc.id!)}
                              disabled={!commentText.trim() || isActioning}
                              id={`comment-submit-${inc.id}`}
                              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold shadow-sm transition disabled:opacity-50"
                            >
                              {isActioning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                              Enviar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setCommentingId(inc.id!); setCommentText(''); }}
                          id={`add-comment-btn-${inc.id}`}
                          className="flex items-center gap-2 text-sm font-bold text-orange-600 hover:text-orange-700 transition"
                        >
                          <MessageSquarePlus className="h-4 w-4" />
                          Agregar comentario
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BusIncidentesPanel;
