import React, { useEffect, useState } from 'react';
import { CloudRain, Sun, Bell, BellOff, Clock, MapPin, Loader2, CheckCircle } from 'lucide-react';
import { businessService } from '../services/businessService';

interface Props {
  user: { id: string; email: string; firstName?: string; lastName?: string; name?: string };
}

const CITIES = ['Manizales'];

export const WeatherAlertSettings: React.FC<Props> = ({ user }) => {
  const [alert, setAlert]         = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);

  const [enabled, setEnabled]     = useState(false);
  const [travelTime, setTravelTime] = useState('07:00');
  const [city, setCity]           = useState('Manizales');

  useEffect(() => {
    if (!user?.id) return;
    businessService.getWeatherAlert(user.id)
      .then((data) => {
        if (data) {
          setAlert(data);
          setEnabled(data.enabled);
          setTravelTime(data.travelTime || '07:00');
          setCity(data.city || 'Bogotá');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const name = user.name || `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email;

      if (alert?.id) {
        const updated = await businessService.updateWeatherAlert(alert.id, { enabled, travelTime, city });
        setAlert(updated);
      } else {
        const created = await businessService.saveWeatherAlert({
          citizenUserId: user.id,
          email: user.email,
          name,
          enabled,
          travelTime,
          city,
        });
        setAlert(created);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error('Error guardando alerta de clima:', e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Cargando preferencias...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
            <CloudRain className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-base">Alertas de Clima</h3>
            <p className="text-sm text-gray-500">Recibe el pronóstico cada mañana antes de salir</p>
          </div>
        </div>

      </div>

      {/* Preview cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100 rounded-xl p-4">
          <div className="text-2xl mb-1">🌧️</div>
          <p className="text-xs font-semibold text-sky-700 mb-1">Si llueve (&gt;50%)</p>
          <p className="text-xs text-sky-600 leading-relaxed">
            "Hoy lloverá (80%). Temperatura: 16°C. Sal 15 min antes. ¡Lleva paraguas!"
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-xl p-4">
          <div className="text-2xl mb-1">☀️</div>
          <p className="text-xs font-semibold text-green-700 mb-1">Si hay buen clima</p>
          <p className="text-xs text-green-600 leading-relaxed">
            "Clima favorable hoy. Temperatura: 22°C. ¡Buen viaje!"
          </p>
        </div>
      </div>

      {/* Settings */}
      <div className={`space-y-4 transition-opacity duration-200 ${enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>

        {/* Travel time */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Clock className="w-4 h-4 text-sky-500" />
            Hora habitual de viaje
          </label>
          <input
            type="time"
            value={travelTime}
            onChange={(e) => setTravelTime(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-gray-50"
          />
          <p className="text-xs text-gray-400 mt-1">
            Recibirás la alerta máximo 2 horas antes de esta hora
          </p>
        </div>

        {/* City */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <MapPin className="w-4 h-4 text-sky-500" />
            Ciudad
          </label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-gray-50"
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Alert info */}
        <div className="bg-sky-50 rounded-xl p-4 flex items-start gap-3">
          {enabled ? (
            <Bell className="w-4 h-4 text-sky-500 mt-0.5 flex-shrink-0" />
          ) : (
            <BellOff className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          )}
          <p className="text-xs text-sky-700 leading-relaxed">
            <strong>n8n</strong> enviará el pronóstico diariamente a las <strong>6:00 AM</strong>.
            Solo recibirás alerta si la probabilidad de lluvia supera el <strong>50%</strong>.
          </p>
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-5 w-full flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
      >
        {saving ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
        ) : saved ? (
          <><CheckCircle className="w-4 h-4" /> ¡Guardado!</>
        ) : (
          <><Sun className="w-4 h-4" /> Guardar preferencias</>
        )}
      </button>
    </div>
  );
};
