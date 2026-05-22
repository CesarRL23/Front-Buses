import React, { useCallback, useEffect, useState } from 'react';
import { MapPin, Plus, Pencil, Trash2, Save, X, Loader2, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { businessService } from '../services/businessService';

interface Whereabout {
  id: number;
  nombre: string;
  latitud: number;
  longitud: number;
  direccion: string;
  activo: boolean;
}

const initialForm = {
  nombre: '',
  latitud: '',
  longitud: '',
  direccion: '',
  activo: true,
};

interface WhereaboutPickerMapProps {
  latitud: number | null;
  longitud: number | null;
  onPick: (latitud: number, longitud: number) => void;
}

const DEFAULT_CENTER: [number, number] = [5.0703, -75.5138];

const roundCoordinate = (value: number) => Number(value.toFixed(7));

const parseCoordinateInput = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

const isValidCoordinate = (lat: number | null, lng: number | null) => (
  lat !== null
  && lng !== null
  && Number.isFinite(lat)
  && Number.isFinite(lng)
  && lat >= -90
  && lat <= 90
  && lng >= -180
  && lng <= 180
);

const WhereaboutPickerMap: React.FC<WhereaboutPickerMapProps> = ({ latitud, longitud, onPick }) => {
  const mapRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<any>(null);
  const markerRef = React.useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const loadLeaflet = async () => {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (!(window as any).L) {
        await new Promise<void>((resolve) => {
          if (document.getElementById('leaflet-js')) {
            const check = setInterval(() => {
              if ((window as any).L) {
                clearInterval(check);
                resolve();
              }
            }, 100);
            return;
          }

          const script = document.createElement('script');
          script.id = 'leaflet-js';
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = () => resolve();
          document.head.appendChild(script);
        });
      }

      const L = (window as any).L;
      if (!L || !mapRef.current || mapInstanceRef.current) return;

      const hasValidCoords = isValidCoordinate(latitud, longitud);
      const mapCenter: [number, number] = hasValidCoords
        ? [Number(latitud), Number(longitud)]
        : DEFAULT_CENTER;

      const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: true });
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(map);

      map.setView(mapCenter, hasValidCoords ? 16 : 12);

      const setMarker = (lat: number, lng: number, moveMap: boolean) => {
        const position: [number, number] = [lat, lng];

        if (!markerRef.current) {
          markerRef.current = L.marker(position, { draggable: true }).addTo(map);
          markerRef.current.on('dragend', () => {
            const markerLatLng = markerRef.current?.getLatLng?.();
            if (!markerLatLng) return;
            onPick(roundCoordinate(markerLatLng.lat), roundCoordinate(markerLatLng.lng));
          });
        } else {
          markerRef.current.setLatLng(position);
        }

        if (moveMap) {
          map.setView(position, Math.max(map.getZoom(), 16));
        }
      };

      if (hasValidCoords) {
        setMarker(Number(latitud), Number(longitud), false);
      }

      map.on('click', (event: any) => {
        const lat = roundCoordinate(event.latlng.lat);
        const lng = roundCoordinate(event.latlng.lng);
        setMarker(lat, lng, true);
        onPick(lat, lng);
      });
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markerRef.current = null;
    };
  }, [latitud, longitud, onPick]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const marker = markerRef.current;
    const L = (window as any).L;
    if (!map || !L || !isValidCoordinate(latitud, longitud)) return;

    const position: [number, number] = [Number(latitud), Number(longitud)];

    if (!marker) {
      markerRef.current = L.marker(position, { draggable: true }).addTo(map);
      markerRef.current.on('dragend', () => {
        const markerLatLng = markerRef.current?.getLatLng?.();
        if (!markerLatLng) return;
        onPick(roundCoordinate(markerLatLng.lat), roundCoordinate(markerLatLng.lng));
      });
    } else {
      marker.setLatLng(position);
    }

    map.setView(position, Math.max(map.getZoom(), 16));
  }, [latitud, longitud, onPick]);

  return <div ref={mapRef} className="h-80 w-full rounded-2xl border border-emerald-200" style={{ zIndex: 1 }} />;
};

export const WhereaboutManager: React.FC = () => {
  const [whereabouts, setWhereabouts] = useState<Whereabout[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Whereabout | null>(null);
  const [form, setForm] = useState(initialForm);

  const mapLatitud = parseCoordinateInput(form.latitud);
  const mapLongitud = parseCoordinateInput(form.longitud);

  const handleMapPick = useCallback((latitud: number, longitud: number) => {
    setForm((current) => ({
      ...current,
      latitud: String(latitud),
      longitud: String(longitud),
    }));
  }, []);

  const loadWhereabouts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await businessService.getWhereabouts();
      setWhereabouts(Array.isArray(data) ? data : []);
    } catch {
      setError('No se pudieron cargar los paraderos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWhereabouts();
  }, [loadWhereabouts]);

  useEffect(() => {
    if (!success && !error) return;
    const timer = setTimeout(() => {
      setSuccess('');
      setError('');
    }, 4500);
    return () => clearTimeout(timer);
  }, [success, error]);

  const resetForm = () => {
    setForm(initialForm);
    setEditing(null);
    setShowForm(false);
  };

  const startEdit = (whereabout: Whereabout) => {
    setEditing(whereabout);
    setForm({
      nombre: whereabout.nombre || '',
      latitud: String(whereabout.latitud ?? ''),
      longitud: String(whereabout.longitud ?? ''),
      direccion: whereabout.direccion || '',
      activo: Boolean(whereabout.activo),
    });
    setShowForm(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const latitud = Number(form.latitud);
    const longitud = Number(form.longitud);

    if (!isValidCoordinate(latitud, longitud)) {
      setError('Selecciona una ubicación válida en el mapa o corrige latitud/longitud.');
      setSaving(false);
      return;
    }

    const payload = {
      nombre: form.nombre.trim(),
      latitud,
      longitud,
      direccion: form.direccion.trim(),
      activo: form.activo,
    };

    try {
      if (editing) {
        await businessService.updateWhereabout(editing.id, payload);
        setSuccess('Paradero actualizado correctamente.');
      } else {
        await businessService.createWhereabout(payload);
        setSuccess('Paradero creado correctamente.');
      }
      resetForm();
      await loadWhereabouts();
    } catch (err: any) {
      const backendMessage = err?.response?.data?.message;
      setError(
        Array.isArray(backendMessage)
          ? backendMessage.join(', ')
          : backendMessage || 'No se pudo guardar el paradero.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (whereabout: Whereabout) => {
    if (!window.confirm(`¿Eliminar el paradero "${whereabout.nombre}"?`)) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await businessService.deleteWhereabout(whereabout.id);
      setSuccess('Paradero eliminado correctamente.');
      await loadWhereabouts();
    } catch {
      setError('No se pudo eliminar el paradero.');
    } finally {
      setSaving(false);
    }
  };

  const filteredWhereabouts = whereabouts.filter((whereabout) => {
    const query = searchTerm.toLowerCase();
    return (
      whereabout.nombre?.toLowerCase().includes(query) ||
      whereabout.direccion?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <MapPin className="h-7 w-7 text-emerald-600" />
            Gestión de Paraderos
          </h2>
          <p className="text-gray-500 mt-1">Crea y administra los paraderos físicos del sistema</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-3 rounded-xl shadow-md transition"
        >
          <Plus className="h-5 w-5" />
          Nuevo Paradero
        </button>
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

      {showForm && (
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-black text-gray-900">
                {editing ? 'Editar Paradero' : 'Crear Nuevo Paradero'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">Captura el nombre y las coordenadas GPS del paradero.</p>
            </div>
            <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Nombre</label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all outline-none font-medium"
                placeholder="Ej: Cll 72 - Kra 46"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Latitud</label>
              <input
                type="number"
                step="any"
                value={form.latitud}
                onChange={(e) => setForm({ ...form, latitud: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all outline-none font-medium"
                placeholder="Ej: 10.9876543"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Longitud</label>
              <input
                type="number"
                step="any"
                value={form.longitud}
                onChange={(e) => setForm({ ...form, longitud: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all outline-none font-medium"
                placeholder="Ej: -74.7812345"
                required
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3 space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Ubicación en mapa</label>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3 space-y-2">
                <WhereaboutPickerMap
                  latitud={mapLatitud}
                  longitud={mapLongitud}
                  onPick={handleMapPick}
                />
                <p className="text-xs text-emerald-700 font-medium px-1">
                  Haz clic sobre el mapa o arrastra el marcador para establecer las coordenadas del paradero.
                </p>
              </div>
            </div>
            <div className="md:col-span-2 lg:col-span-3 space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Dirección</label>
              <input
                type="text"
                value={form.direccion}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all outline-none font-medium"
                placeholder="Ej: Calle 72 # 46-12"
                required
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3 flex items-center justify-between gap-4">
              <label className="flex items-center gap-3 text-sm font-bold text-gray-700">
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                Paradero activo
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-5 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                  {editing ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <Search className="h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre o dirección..."
          className="w-full bg-transparent outline-none text-sm font-medium text-gray-700 placeholder:text-gray-400"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 text-emerald-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredWhereabouts.map((whereabout) => (
            <div key={whereabout.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-gray-900">{whereabout.nombre}</h3>
                  <p className="text-sm text-gray-500 mt-1">{whereabout.direccion}</p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                    whereabout.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {whereabout.activo ? 'ACTIVO' : 'INACTIVO'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-gray-50 p-3">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">Latitud</p>
                  <p className="font-semibold text-gray-800 mt-1">{Number(whereabout.latitud).toFixed(7)}</p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-3">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">Longitud</p>
                  <p className="font-semibold text-gray-800 mt-1">{Number(whereabout.longitud).toFixed(7)}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => startEdit(whereabout)}
                  className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                  title="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(whereabout)}
                  className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition"
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {filteredWhereabouts.length === 0 && !loading && (
            <div className="col-span-full bg-white rounded-3xl border-2 border-dashed border-gray-200 py-20 text-center">
              <MapPin className="h-14 w-14 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400 font-bold text-lg">No hay paraderos registrados</p>
              <p className="text-gray-500 text-sm mt-1">Crea el primer paradero para empezar a vincular rutas.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
