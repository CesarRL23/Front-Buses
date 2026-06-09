/**
 * CancelAppointment — página pública accesible desde el link del correo.
 * Ruta: /cancelar-cita/:id
 */
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, CalendarX } from 'lucide-react';
import { businessService } from '../services/businessService';

export const CancelAppointment: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleCancel = async () => {
    if (!id) return;
    setStatus('loading');
    try {
      await businessService.cancelAppointment(Number(id));
      setStatus('success');
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.message || 'No se pudo cancelar la cita. Puede que ya esté cancelada.',
      );
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        {/* Header */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-50 rounded-full mb-6">
          <CalendarX className="w-10 h-10 text-red-400" />
        </div>

        {status === 'idle' && (
          <>
            <h1 className="text-2xl font-black text-gray-900 mb-3">Cancelar cita</h1>
            <p className="text-gray-500 mb-8 text-sm leading-relaxed">
              ¿Estás seguro de que deseas cancelar esta cita? Esta acción eliminará el evento de tu
              calendario y el de tu asesor.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/ciudadano')}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-all text-sm"
              >
                No, conservar
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-all text-sm"
              >
                Sí, cancelar
              </button>
            </div>
          </>
        )}

        {status === 'loading' && (
          <>
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-500 font-semibold">Cancelando cita…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-50 rounded-full mb-4">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">Cita cancelada</h2>
            <p className="text-gray-500 text-sm mb-6">
              Tu cita fue cancelada exitosamente. Si deseas reagendar, puedes hacerlo desde la app.
            </p>
            <button
              onClick={() => navigate('/ciudadano')}
              className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all text-sm"
            >
              Volver al dashboard
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-50 rounded-full mb-4">
              <XCircle className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">No se pudo cancelar</h2>
            <p className="text-red-500 text-sm mb-6">{errorMsg}</p>
            <button
              onClick={() => navigate('/ciudadano')}
              className="w-full py-3 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-all text-sm"
            >
              Volver al dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
};
