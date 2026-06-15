import React, { useState, useEffect } from 'react';
import { Search, Loader2, AlertCircle, CheckCircle, Clock, Wrench } from 'lucide-react';
import { businessService } from '../services/businessService';

const STATUS_INFO: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  PENDIENTE:   { label: 'Pendiente',   color: 'text-gray-600',  bg: 'bg-gray-100',   icon: <Clock className="w-4 h-4" /> },
  EN_REVISION: { label: 'En revisión', color: 'text-blue-700',  bg: 'bg-blue-100',   icon: <Search className="w-4 h-4" /> },
  EN_PROCESO:  { label: 'En proceso',  color: 'text-amber-700', bg: 'bg-amber-100',  icon: <Wrench className="w-4 h-4" /> },
  RESUELTO:    { label: 'Resuelto',    color: 'text-green-700', bg: 'bg-green-100',  icon: <CheckCircle className="w-4 h-4" /> },
};

const TYPE_LABEL: Record<string, string> = {
  PETICION: '📝 Petición', QUEJA: '😟 Queja', RECLAMO: '⚖️ Reclamo', SUGERENCIA: '💡 Sugerencia',
};

const STEPS = ['PENDIENTE', 'EN_REVISION', 'EN_PROCESO', 'RESUELTO'];

interface Props { initialRadicado?: string; }

export const PqrsStatus: React.FC<Props> = ({ initialRadicado }) => {
  const [radicado, setRadicado] = useState(initialRadicado || '');
  const [loading, setLoading]   = useState(false);
  const [pqrs, setPqrs]         = useState<any>(null);
  const [error, setError]       = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!radicado.trim()) return;
    setLoading(true);
    setError('');
    setPqrs(null);
    try {
      const data = await businessService.getPqrsByRadicado(radicado.trim().toUpperCase());
      setPqrs(data);
    } catch {
      setError('No se encontró ningún PQRS con ese número de radicado.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialRadicado) {
      setLoading(true);
      businessService.getPqrsByRadicado(initialRadicado.toUpperCase())
        .then(setPqrs)
        .catch(() => setError('No se encontró ningún PQRS con ese número de radicado.'))
        .finally(() => setLoading(false));
    }
  }, [initialRadicado]);

  const currentStep = pqrs ? STEPS.indexOf(pqrs.status) : -1;

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={radicado}
          onChange={(e) => setRadicado(e.target.value)}
          placeholder="Ej: PQRS-2026-000001"
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50 font-mono"
        />
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Consultar
        </button>
      </form>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {pqrs && (
        <div className="space-y-4">
          {/* Header del PQRS */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Radicado</p>
                <p className="text-xl font-black font-mono text-blue-800">{pqrs.radicado}</p>
              </div>
              {STATUS_INFO[pqrs.status] && (
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${STATUS_INFO[pqrs.status].bg} ${STATUS_INFO[pqrs.status].color}`}>
                  {STATUS_INFO[pqrs.status].icon}
                  {STATUS_INFO[pqrs.status].label}
                </span>
              )}
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Progreso</p>
            <div className="relative">
              <div className="absolute top-3.5 left-0 right-0 h-0.5 bg-gray-200" />
              <div
                className="absolute top-3.5 left-0 h-0.5 bg-blue-500 transition-all duration-500"
                style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
              />
              <div className="relative flex justify-between">
                {STEPS.map((step, i) => {
                  const done = i <= currentStep;
                  return (
                    <div key={step} className="flex flex-col items-center gap-1.5">
                      <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                        done ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'
                      }`}>
                        {done && <CheckCircle className="w-4 h-4 text-white" />}
                      </div>
                      <span className={`text-xs font-medium ${done ? 'text-blue-600' : 'text-gray-400'}`}>
                        {STATUS_INFO[step]?.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Detalle */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Detalle</p>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
              <div>
                <p className="text-xs text-gray-400">Tipo</p>
                <p className="font-semibold text-gray-800">{TYPE_LABEL[pqrs.type] || pqrs.type}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Categoría</p>
                <p className="font-semibold text-gray-800">{pqrs.category}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Fecha de envío</p>
                <p className="font-semibold text-gray-800">
                  {new Date(pqrs.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Plazo estimado</p>
                <p className="font-semibold text-gray-800">{pqrs.estimatedDays} días hábiles</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Descripción</p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed">{pqrs.description}</p>
            </div>
            {pqrs.status === 'RESUELTO' && pqrs.agentResponse && (
              <div>
                <p className="text-xs text-green-600 font-semibold mb-1">✅ Respuesta del agente</p>
                <p className="text-sm text-gray-700 bg-green-50 border border-green-100 rounded-lg p-3 leading-relaxed">
                  {pqrs.agentResponse}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
