import React, { useCallback, useEffect, useState } from 'react';
import {
  Megaphone,
  Send,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Users,
  CalendarClock,
  Eye,
  CheckCheck,
} from 'lucide-react';
import { businessService } from '../services/businessService';

interface RouteOption {
  id: number;
  nombre: string;
}

interface AnnouncementRecord {
  id: number;
  title: string;
  message: string;
  scope: 'ALL' | 'ROUTE' | 'ZONE';
  scopeValue?: string;
  isUrgent: boolean;
  status: 'SCHEDULED' | 'SENT';
  scheduledFor?: string;
  sentAt?: string;
  recipientCount: number;
  createdAt: string;
}

interface AnnouncementStats {
  total: number;
  delivered: number;
  read: number;
  deliveredPct: number;
  readPct: number;
}

const SCOPE_LABELS: Record<string, string> = {
  ALL: 'Todos los usuarios',
  ROUTE: 'Por ruta',
  ZONE: 'Por zona',
};

const initialForm = {
  title: '',
  message: '',
  scope: 'ALL' as 'ALL' | 'ROUTE' | 'ZONE',
  scopeValue: '',
  isUrgent: false,
  scheduledFor: '',
};

export const AnnouncementManager: React.FC = () => {
  const [form, setForm] = useState(initialForm);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [zones, setZones] = useState<string[]>([]);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [countingRecipients, setCountingRecipients] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [statsByAnnouncement, setStatsByAnnouncement] = useState<Record<number, AnnouncementStats>>({});

  const loadOptions = useCallback(async () => {
    try {
      const [routesData, zonesData] = await Promise.all([
        businessService.getRoutes(),
        businessService.getAnnouncementZones(),
      ]);
      setRoutes(Array.isArray(routesData) ? routesData : []);
      setZones(Array.isArray(zonesData) ? zonesData : []);
    } catch {
      // listas opcionales, no bloquean el formulario
    }
  }, []);

  const loadAnnouncements = useCallback(async () => {
    setLoadingAnnouncements(true);
    try {
      const data = await businessService.getAnnouncements();
      const list: AnnouncementRecord[] = Array.isArray(data) ? data : [];
      setAnnouncements(list);

      const sent = list.filter((item) => item.status === 'SENT');
      const stats = await Promise.all(
        sent.map((item) => businessService.getAnnouncementStats(item.id).catch(() => null)),
      );
      const statsMap: Record<number, AnnouncementStats> = {};
      sent.forEach((item, index) => {
        if (stats[index]) statsMap[item.id] = stats[index];
      });
      setStatsByAnnouncement(statsMap);
    } catch {
      setError('No se pudieron cargar los avisos enviados.');
    } finally {
      setLoadingAnnouncements(false);
    }
  }, []);

  useEffect(() => {
    loadOptions();
    loadAnnouncements();
  }, [loadOptions, loadAnnouncements]);

  useEffect(() => {
    if (!success && !error) return;
    const timer = setTimeout(() => {
      setSuccess('');
      setError('');
    }, 4500);
    return () => clearTimeout(timer);
  }, [success, error]);

  useEffect(() => {
    if (form.scope === 'ALL') {
      setRecipientCount(null);
      businessService.getRecipientsCount('ALL').then(setRecipientCount).catch(() => setRecipientCount(null));
      return;
    }

    if (!form.scopeValue) {
      setRecipientCount(null);
      return;
    }

    setCountingRecipients(true);
    businessService
      .getRecipientsCount(form.scope, form.scopeValue)
      .then(setRecipientCount)
      .catch(() => setRecipientCount(null))
      .finally(() => setCountingRecipients(false));
  }, [form.scope, form.scopeValue]);

  const resetForm = () => setForm(initialForm);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if ((form.scope === 'ROUTE' || form.scope === 'ZONE') && !form.scopeValue) {
      setError('Selecciona una ruta o zona para este alcance.');
      return;
    }

    setSending(true);
    setError('');
    setSuccess('');

    try {
      await businessService.createAnnouncement({
        title: form.title.trim(),
        message: form.message.trim(),
        scope: form.scope,
        scopeValue: form.scope === 'ALL' ? undefined : form.scopeValue,
        isUrgent: form.isUrgent,
        scheduledFor: form.scheduledFor ? new Date(form.scheduledFor).toISOString() : undefined,
      });
      setSuccess(form.scheduledFor ? 'Aviso programado correctamente.' : 'Aviso enviado correctamente.');
      resetForm();
      await loadAnnouncements();
    } catch (err: any) {
      const backendMessage = err?.response?.data?.message;
      setError(
        Array.isArray(backendMessage)
          ? backendMessage.join(', ')
          : backendMessage || 'No se pudo enviar el aviso.',
      );
    } finally {
      setSending(false);
    }
  };

  const scopeValueLabel = (announcement: AnnouncementRecord) => {
    if (announcement.scope === 'ALL') return 'Todos los usuarios';
    if (announcement.scope === 'ROUTE') {
      const route = routes.find((r) => String(r.id) === String(announcement.scopeValue));
      return route ? `Ruta: ${route.nombre}` : `Ruta #${announcement.scopeValue}`;
    }
    return `Zona: ${announcement.scopeValue}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
          <Megaphone className="h-7 w-7 text-blue-600" />
          Avisos Masivos
        </h2>
        <p className="text-gray-500 mt-1">
          Envía comunicados a los usuarios del sistema sobre rutas, accidentes o novedades.
        </p>
      </div>

      {(error || success) && (
        <div className="space-y-3">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-3 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}
          {success && (
            <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 flex items-center gap-3 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">{success}</span>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl space-y-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Título</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-medium"
              placeholder="Ej: Cierre vial en la Ruta Norte"
              maxLength={150}
              required
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Mensaje</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-medium min-h-[100px]"
              placeholder="Describe el incidente o la novedad para los usuarios..."
              maxLength={1000}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Alcance</label>
            <select
              value={form.scope}
              onChange={(e) =>
                setForm({ ...form, scope: e.target.value as 'ALL' | 'ROUTE' | 'ZONE', scopeValue: '' })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-medium"
            >
              <option value="ALL">Todos los usuarios</option>
              <option value="ROUTE">Usuarios por ruta</option>
              <option value="ZONE">Usuarios por zona</option>
            </select>
          </div>

          {form.scope === 'ROUTE' && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Ruta</label>
              <select
                value={form.scopeValue}
                onChange={(e) => setForm({ ...form, scopeValue: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-medium"
                required
              >
                <option value="">Selecciona una ruta...</option>
                {routes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          {form.scope === 'ZONE' && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Zona (ciudad)</label>
              <select
                value={form.scopeValue}
                onChange={(e) => setForm({ ...form, scopeValue: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-medium"
                required
              >
                <option value="">Selecciona una zona...</option>
                {zones.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Programar envío (opcional)</label>
            <input
              type="datetime-local"
              value={form.scheduledFor}
              onChange={(e) => setForm({ ...form, scheduledFor: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-medium"
            />
          </div>

          <div className="flex items-center">
            <label className="flex items-center gap-3 text-sm font-bold text-gray-700">
              <input
                type="checkbox"
                checked={form.isUrgent}
                onChange={(e) => setForm({ ...form, isUrgent: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              Marcar como urgente (notificación push inmediata)
            </label>
          </div>

          <div className="md:col-span-2 flex items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">
            <div className="flex items-center gap-3 text-blue-700">
              <Users className="h-5 w-5" />
              <span className="text-sm font-bold">
                {countingRecipients
                  ? 'Calculando destinatarios...'
                  : recipientCount !== null
                    ? `${recipientCount} destinatario${recipientCount === 1 ? '' : 's'}`
                    : 'Selecciona un alcance para ver los destinatarios'}
              </span>
            </div>
            <button
              type="submit"
              disabled={sending}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl shadow-md transition disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : form.scheduledFor ? (
                <Clock className="h-5 w-5" />
              ) : (
                <Send className="h-5 w-5" />
              )}
              {form.scheduledFor ? 'Programar aviso' : 'Enviar aviso'}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-black text-gray-900">Avisos enviados y programados</h3>

        {loadingAnnouncements ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-sm text-gray-500 shadow-sm">
            Aún no se han enviado avisos.
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => {
              const stats = statsByAnnouncement[announcement.id];
              return (
                <div key={announcement.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-gray-900">{announcement.title}</h4>
                        {announcement.isUrgent && (
                          <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                            Urgente
                          </span>
                        )}
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            announcement.status === 'SENT'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {announcement.status === 'SENT' ? 'Enviado' : 'Programado'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{announcement.message}</p>
                      <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-gray-400">
                        {SCOPE_LABELS[announcement.scope]}
                        {announcement.scope !== 'ALL' ? ` · ${scopeValueLabel(announcement)}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 border-t border-gray-100 pt-3">
                    {announcement.status === 'SCHEDULED' && announcement.scheduledFor && (
                      <span className="flex items-center gap-1.5">
                        <CalendarClock className="h-4 w-4" />
                        Programado: {new Date(announcement.scheduledFor).toLocaleString()}
                      </span>
                    )}
                    {announcement.status === 'SENT' && announcement.sentAt && (
                      <span className="flex items-center gap-1.5">
                        <Send className="h-4 w-4" />
                        Enviado: {new Date(announcement.sentAt).toLocaleString()}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      {announcement.recipientCount} destinatario{announcement.recipientCount === 1 ? '' : 's'}
                    </span>
                    {stats && (
                      <>
                        <span className="flex items-center gap-1.5">
                          <CheckCheck className="h-4 w-4" />
                          Entregado: {stats.delivered}/{stats.total} ({stats.deliveredPct}%)
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Eye className="h-4 w-4" />
                          Leído: {stats.read}/{stats.total} ({stats.readPct}%)
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
