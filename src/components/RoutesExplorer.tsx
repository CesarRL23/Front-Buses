import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, MapPin, Clock, DollarSign, ArrowLeft, Navigation,
  Route as RouteIcon, ChevronRight, Loader2, AlertCircle, X
} from 'lucide-react';
import { businessService } from '../services/businessService';

interface Whereabout {
  id: number;
  nombre: string;
  latitud: number;
  longitud: number;
  direccion: string;
  activo: boolean;
}

interface NodoData {
  id: number;
  orden: number;
  distanciaDesdeAnterior: number;
  tiempoEstimadoDesdeAnterior: number;
  stop: Whereabout;
}

interface RouteData {
  id: number;
  nombre: string;
  descripcion?: string;
  origen: string;
  destino: string;
  distancia: number;
  duracion_estimada: number;
  tarifa: number;
  nodos?: NodoData[];
}

// ─── Leaflet Map Sub-component (loaded via CDN) ───
const RouteMap: React.FC<{ nodos: NodoData[] }> = ({ nodos }) => {
  const mapRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || nodos.length === 0) return;

    const loadLeaflet = async () => {
      // Inject Leaflet CSS if not present
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Inject Leaflet JS if not present
      if (!(window as any).L) {
        await new Promise<void>((resolve) => {
          if (document.getElementById('leaflet-js')) {
            const check = setInterval(() => {
              if ((window as any).L) { clearInterval(check); resolve(); }
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
      if (!L || !mapRef.current) return;

      // Cleanup previous map
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const validNodos = nodos.filter(n => n.stop?.latitud && n.stop?.longitud);
      if (validNodos.length === 0) return;

      const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: true });
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(map);

      const coords: [number, number][] = [];
      const colors = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#EF4444'];

      validNodos.forEach((nodo, idx) => {
        const lat = Number(nodo.stop.latitud);
        const lng = Number(nodo.stop.longitud);
        coords.push([lat, lng]);

        const isFirst = idx === 0;
        const isLast = idx === validNodos.length - 1;
        const color = isFirst ? '#10B981' : isLast ? '#EF4444' : colors[idx % colors.length];
        const radius = isFirst || isLast ? 12 : 8;

        const circle = L.circleMarker([lat, lng], {
          radius, fillColor: color, color: '#fff',
          weight: 3, opacity: 1, fillOpacity: 0.9
        }).addTo(map);

        const label = isFirst ? '🟢 Inicio' : isLast ? '🔴 Final' : `Parada ${nodo.orden}`;
        circle.bindPopup(`
          <div style="font-family:system-ui;min-width:160px">
            <div style="font-weight:700;font-size:13px;margin-bottom:4px">${label}</div>
            <div style="font-size:12px;color:#6B7280">${nodo.stop.nombre}</div>
            <div style="font-size:11px;color:#9CA3AF;margin-top:2px">${nodo.stop.direccion || ''}</div>
          </div>
        `);
      });

      if (coords.length > 1) {
        L.polyline(coords, {
          color: '#3B82F6', weight: 4, opacity: 0.7,
          dashArray: '10, 8', lineCap: 'round'
        }).addTo(map);
      }

      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [40, 40] });
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [nodos]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: '1.5rem', zIndex: 1 }} />;
};

// ─── Main Component ───
export const RoutesExplorer: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteData | null>(null);
  const [selectedNodos, setSelectedNodos] = useState<NodoData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState('');

  const fetchRoutes = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await businessService.getRoutes();
      setRoutes(data);
    } catch (err: any) {
      setError('No se pudieron cargar las rutas. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRoutes(); }, [fetchRoutes]);

  const handleSelectRoute = async (route: RouteData) => {
    try {
      setLoadingDetail(true);
      const data = await businessService.getRouteNodos(route.id);
      setSelectedRoute(data.route);
      setSelectedNodos(data.nodos || []);
    } catch {
      setSelectedRoute(route);
      setSelectedNodos(route.nodos?.sort((a, b) => (a.orden || 0) - (b.orden || 0)) || []);
    } finally {
      setLoadingDetail(false);
    }
  };

  const filteredRoutes = routes.filter(r =>
    (r.nombre || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDuration = (min: number) => {
    if (!min) return 'N/A';
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}h ${m}min` : `${m} min`;
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val || 0);

  // ─── Detail View ───
  if (selectedRoute) {
    return (
      <div className="space-y-6" id="route-detail-view">
        <button onClick={() => { setSelectedRoute(null); setSelectedNodos([]); }}
          className="flex items-center gap-2 text-blue-600 font-bold hover:text-blue-800 transition-colors group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Volver a rutas
        </button>

        {/* Route Header Card */}
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-[2rem] p-8 text-white relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/5 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="space-y-2">
                <span className="bg-white/20 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-lg backdrop-blur-md">
                  Ruta Disponible
                </span>
                <h2 className="text-3xl font-black">{selectedRoute.nombre}</h2>
                {selectedRoute.descripcion && (
                  <p className="text-blue-100 text-sm max-w-xl">{selectedRoute.descripcion}</p>
                )}
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <Navigation className="w-5 h-5 text-blue-200 mb-2" />
                <p className="text-xs text-blue-200 font-medium">Origen</p>
                <p className="font-bold text-sm">{selectedRoute.origen}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <MapPin className="w-5 h-5 text-blue-200 mb-2" />
                <p className="text-xs text-blue-200 font-medium">Destino</p>
                <p className="font-bold text-sm">{selectedRoute.destino}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <Clock className="w-5 h-5 text-blue-200 mb-2" />
                <p className="text-xs text-blue-200 font-medium">Duración</p>
                <p className="font-bold text-sm">{formatDuration(selectedRoute.duracion_estimada)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <DollarSign className="w-5 h-5 text-green-300 mb-2" />
                <p className="text-xs text-blue-200 font-medium">Tarifa</p>
                <p className="font-bold text-sm text-green-300">{formatCurrency(selectedRoute.tarifa)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Map + Stops */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Map */}
          <div className="lg:col-span-7 bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden" style={{ minHeight: 420 }}>
            {selectedNodos.length > 0 && selectedNodos.some(n => n.stop?.latitud) ? (
              <RouteMap nodos={selectedNodos} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 flex-col gap-3 p-10">
                <MapPin className="w-12 h-12 opacity-30" />
                <p className="font-medium">No hay paraderos con ubicación registrada para esta ruta</p>
              </div>
            )}
          </div>

          {/* Stops List */}
          <div className="lg:col-span-5 bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 max-h-[520px] overflow-y-auto">
            <h3 className="text-lg font-black text-gray-900 mb-5 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" /> Paraderos ({selectedNodos.length})
            </h3>

            {selectedNodos.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No hay paraderos asignados a esta ruta.</p>
            ) : (
              <div className="space-y-1">
                {selectedNodos.map((nodo, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === selectedNodos.length - 1;
                  return (
                    <div key={nodo.id} className="flex gap-4 items-stretch">
                      {/* Timeline line */}
                      <div className="flex flex-col items-center w-6 flex-shrink-0">
                        <div className={`w-4 h-4 rounded-full border-[3px] flex-shrink-0 ${
                          isFirst ? 'bg-green-500 border-green-200' :
                          isLast ? 'bg-red-500 border-red-200' :
                          'bg-blue-500 border-blue-200'
                        }`} />
                        {!isLast && <div className="w-0.5 flex-1 bg-gray-200 min-h-[32px]" />}
                      </div>

                      {/* Stop info */}
                      <div className="pb-5 flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">
                          {nodo.stop?.nombre || `Paradero ${nodo.orden}`}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {nodo.stop?.direccion || 'Sin dirección'}
                        </p>
                        {!isFirst && nodo.tiempoEstimadoDesdeAnterior > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold mt-1 bg-blue-50 px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" /> +{nodo.tiempoEstimadoDesdeAnterior} min
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── List View ───
  return (
    <div className="space-y-6" id="routes-list-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={onClose}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <RouteIcon className="w-7 h-7 text-blue-600" /> Rutas Disponibles
            </h2>
            <p className="text-gray-500 text-sm mt-0.5">{routes.length} rutas en el sistema</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          id="route-search-input"
          type="text"
          placeholder="Filtrar por nombre de ruta..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-gray-200 shadow-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all placeholder:text-gray-400 font-medium"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-3 text-gray-500 font-medium">Cargando rutas...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-center gap-4">
          <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-red-800 font-bold">Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <button onClick={fetchRoutes} className="ml-auto text-red-600 font-bold text-sm hover:underline">Reintentar</button>
        </div>
      )}

      {/* Route Cards */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredRoutes.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <RouteIcon className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 font-bold text-lg">
                {searchTerm ? 'No se encontraron rutas con ese nombre' : 'No hay rutas disponibles'}
              </p>
            </div>
          ) : (
            filteredRoutes.map((route) => (
              <button
                key={route.id}
                id={`route-card-${route.id}`}
                onClick={() => handleSelectRoute(route)}
                disabled={loadingDetail}
                className="group bg-white rounded-[1.8rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 p-6 text-left flex flex-col"
              >
                {/* Card top */}
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-blue-50 group-hover:bg-blue-100 p-3 rounded-xl transition-colors">
                    <RouteIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                </div>

                {/* Route name */}
                <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-blue-600 transition-colors">
                  {route.nombre}
                </h3>
                {route.descripcion && (
                  <p className="text-gray-400 text-xs mb-4 line-clamp-2">{route.descripcion}</p>
                )}

                {/* Origin / Destination */}
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                  <span className="truncate">{route.origen}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                  <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                  <span className="truncate">{route.destino}</span>
                </div>

                {/* Stats footer */}
                <div className="mt-auto pt-4 border-t border-gray-50 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Distancia</p>
                    <p className="text-sm font-black text-gray-700">{route.distancia || 0} km</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Duración</p>
                    <p className="text-sm font-black text-gray-700">{formatDuration(route.duracion_estimada)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tarifa</p>
                    <p className="text-sm font-black text-green-600">{formatCurrency(route.tarifa)}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
