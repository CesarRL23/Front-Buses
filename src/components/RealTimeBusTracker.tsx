import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Bus, Clock, MapPin, Navigation, RefreshCw } from 'lucide-react';
import { businessService } from '../services/businessService';

interface TrackerStop {
  id: number;
  nombre: string;
  latitud: number;
  longitud: number;
  direccion?: string;
  orden?: number;
  tiempoEstimadoDesdeAnterior?: number;
}

interface TrackerBus {
  id: number;
  placa: string;
  routeId: number;
  currentLat: number;
  currentLng: number;
  nearestStop: TrackerStop | null;
  etaMinutes: number;
  delayed: boolean;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const calculateDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const earthRadius = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
};

export const RealTimeBusTracker: React.FC<{
  routeId: number | string | null;
  activeProgrammings: any[];
}> = ({ routeId, activeProgrammings }) => {
  const [routeStops, setRouteStops] = useState<TrackerStop[]>([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState('');
  const [waitingStopId, setWaitingStopId] = useState<string>('');
  const [tick, setTick] = useState(0);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerLayerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const busMarkersRef = useRef<Record<string, any>>({});

  useEffect(() => {
    if (!routeId) return;

    let cancelled = false;
    const loadRoute = async () => {
      try {
        setRouteLoading(true);
        setRouteError('');
        const data = await businessService.getRouteNodos(Number(routeId));
        if (cancelled) return;

        const sortedStops = (data?.nodos || [])
          .filter((node: any) => {
            const stop = node.stop || node.whereabout || node.whereabouts;
            return stop && Number(stop.latitud) && Number(stop.longitud);
          })
          .map((node: any, index: number) => ({
            id: Number(node.id || node.stopId || node.whereaboutId || index + 1),
            nombre: node.stop?.nombre || node.whereabout?.nombre || node.whereabouts?.nombre || `Paradero ${index + 1}`,
            latitud: Number(node.stop?.latitud || node.whereabout?.latitud || node.whereabouts?.latitud),
            longitud: Number(node.stop?.longitud || node.whereabout?.longitud || node.whereabouts?.longitud),
            direccion: node.stop?.direccion || node.whereabout?.direccion || node.whereabouts?.direccion || '',
            orden: Number(node.orden || index + 1),
            tiempoEstimadoDesdeAnterior: Number(node.tiempoEstimadoDesdeAnterior || 0),
          }))
          .sort((a: TrackerStop, b: TrackerStop) => (a.orden || 0) - (b.orden || 0));

        setRouteStops(sortedStops);
        if (sortedStops.length > 0 && !sortedStops.some((stop: TrackerStop) => String(stop.id) === waitingStopId)) {
          setWaitingStopId(String(sortedStops[0].id));
        }
      } catch (error) {
        console.error('Error loading tracked route', error);
        if (!cancelled) {
          setRouteError('No se pudieron cargar los paraderos de la ruta.');
        }
      } finally {
        if (!cancelled) setRouteLoading(false);
      }
    };

    loadRoute();
    return () => {
      cancelled = true;
    };
  }, [routeId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((current) => current + 1);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const totalRouteSeconds = useMemo(() => {
    return routeStops.reduce((total, stop, index) => {
      if (index === 0) return total;
      return total + (stop.tiempoEstimadoDesdeAnterior || 0) * 60;
    }, 0);
  }, [routeStops]);

  const selectedWaitingStop = useMemo(() => {
    return routeStops.find((stop) => String(stop.id) === waitingStopId) || routeStops[0] || null;
  }, [routeStops, waitingStopId]);

  const busData = useMemo(() => {
    if (routeStops.length === 0 || !selectedWaitingStop) return [];

    const waitingIndex = routeStops.findIndex((stop) => stop.id === selectedWaitingStop.id);
    const buses: TrackerBus[] = [];

    activeProgrammings.forEach((programming, index) => {
      const bus = programming.bus;
      if (!bus) return;

      const busId = Number(bus.id || programming.id || index + 1);
      const positionOffsetSeconds = ((busId * 11) + (index * 7)) % Math.max(totalRouteSeconds, 1);
      const routeTimeSeconds = ((tick * 10) + positionOffsetSeconds) % Math.max(totalRouteSeconds, 1);

      let accumulatedSeconds = 0;
      let currentSegmentIndex = 0;
      let progressWithinSegment = 0;

      for (let i = 0; i < routeStops.length - 1; i += 1) {
        const segmentDuration = (routeStops[i + 1].tiempoEstimadoDesdeAnterior || 0) * 60;
        const nextAccumulated = accumulatedSeconds + segmentDuration;
        if (routeTimeSeconds <= nextAccumulated || i === routeStops.length - 2) {
          currentSegmentIndex = i;
          progressWithinSegment = segmentDuration === 0 ? 0 : (routeTimeSeconds - accumulatedSeconds) / segmentDuration;
          break;
        }
        accumulatedSeconds = nextAccumulated;
      }

      const currentNode = routeStops[currentSegmentIndex];
      const nextNode = routeStops[currentSegmentIndex + 1] || routeStops[currentSegmentIndex];

      const interpolatedLat = currentNode.latitud + (nextNode.latitud - currentNode.latitud) * clamp(progressWithinSegment, 0, 1);
      const interpolatedLng = currentNode.longitud + (nextNode.longitud - currentNode.longitud) * clamp(progressWithinSegment, 0, 1);

      const nearestStop = routeStops.reduce((closest, stop) => {
        const distance = calculateDistanceMeters(interpolatedLat, interpolatedLng, stop.latitud, stop.longitud);
        if (!closest || distance < closest.distance) {
          return { stop, distance };
        }
        return closest;
      }, null as { stop: TrackerStop; distance: number } | null)?.stop || null;

      const remainingToWaiting = routeStops.reduce((sum, _currentStop, index) => {
        if (index < currentSegmentIndex) return sum;
        if (index === currentSegmentIndex) {
          return sum + (1 - clamp(progressWithinSegment, 0, 1)) * ((routeStops[currentSegmentIndex + 1]?.tiempoEstimadoDesdeAnterior || 0) * 60);
        }
        if (index <= waitingIndex) {
          return sum + (routeStops[index]?.tiempoEstimadoDesdeAnterior || 0) * 60;
        }
        return sum;
      }, 0);

      const etaMinutes = Math.max(0, remainingToWaiting / 60);

      buses.push({
        id: busId,
        placa: String(bus.placa || `BUS-${busId}`),
        routeId: Number(programming.route?.id || routeId || 0),
        currentLat: interpolatedLat,
        currentLng: interpolatedLng,
        nearestStop,
        etaMinutes,
        delayed: etaMinutes > 10,
      });
    });

    return buses;
  }, [activeProgrammings, routeStops, routeId, selectedWaitingStop, tick, totalRouteSeconds]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

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
      if (!L || !mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, { zoomControl: true, scrollWheelZoom: true });
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
      }).addTo(map);

      markerLayerRef.current = L.layerGroup().addTo(map);
      polylineRef.current = L.polyline([], { color: '#2563eb', weight: 5, opacity: 0.8, dashArray: '8, 8' }).addTo(map);

      const bounds = routeStops.map((stop) => [stop.latitud, stop.longitud] as [number, number]);
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [32, 32] });
      }

      const routeLine = routeStops.map((stop) => [stop.latitud, stop.longitud] as [number, number]);
      polylineRef.current.setLatLngs(routeLine);

      routeStops.forEach((stop) => {
        const stopMarker = L.marker([stop.latitud, stop.longitud], {
          icon: L.divIcon({
            className: 'custom-stop-marker',
            html: `<div style="background:#0f172a;color:#fff;border-radius:999px;padding:4px 8px;font-size:10px;font-weight:800;box-shadow:0 4px 10px rgba(15,23,42,0.28);">${stop.orden || ''}</div>`,
            iconSize: [30, 30],
          }),
        }).addTo(markerLayerRef.current);

        stopMarker.bindPopup(`<div style="font-family:system-ui;min-width:170px">
          <div style="font-size:12px;font-weight:800;color:#0f172a">${stop.nombre}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:3px">${stop.direccion || 'Paradero del recorrido'}</div>
        </div>`);
      });
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [routeStops]);

  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapInstanceRef.current || !markerLayerRef.current) return;

    Object.values(busMarkersRef.current).forEach((marker) => marker.remove());
    busMarkersRef.current = {};

    busData.forEach((bus) => {
      const marker = L.marker([bus.currentLat, bus.currentLng], {
        icon: L.divIcon({
          className: 'custom-bus-marker',
          html: `<div style="background:#1d4ed8;color:#fff;border-radius:999px;padding:6px 10px;font-size:10px;font-weight:900;box-shadow:0 4px 10px rgba(29,78,216,0.28);border:2px solid #ffffff;">${bus.placa}</div>`,
          iconSize: [48, 48],
        }),
      }).addTo(markerLayerRef.current);

      marker.bindPopup(`<div style="font-family:system-ui;min-width:200px">
        <div style="font-size:13px;font-weight:800;color:#1e3a8a">${bus.placa}</div>
        <div style="font-size:11px;color:#64748b;margin-top:4px">Paradero más cercano: ${bus.nearestStop?.nombre || 'No disponible'}</div>
        <div style="font-size:11px;color:#64748b;margin-top:2px">ETA al paradero: ${bus.etaMinutes.toFixed(1)} min</div>
        <div style="font-size:11px;margin-top:4px;color:${bus.delayed ? '#dc2626' : '#059669'};font-weight:800">${bus.delayed ? 'Retraso detectado' : 'En ruta normal'}</div>
      </div>`);

      busMarkersRef.current[bus.placa] = marker;
    });

    if (mapInstanceRef.current && busData.length > 0) {
      const bounds = busData.map((bus) => [bus.currentLat, bus.currentLng] as [number, number]);
      if (bounds.length > 0) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [30, 30] });
      }
    }
  }, [busData]);

  const delayedBuses = busData.filter((bus) => bus.delayed);

  return (
    <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 rounded-xl p-3">
              <Navigation className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Seguimiento de bus en tiempo real</p>
              <h2 className="text-2xl font-black text-gray-900">Ubicación actual de buses</h2>
            </div>
          </div>
          <p className="text-gray-500 text-sm">Consulta buses activos de la ruta y estima cuándo llegan al paradero donde esperas.</p>
        </div>

        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full border border-blue-100 text-sm font-bold">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Actualiza cada 10 segundos
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
            <label className="text-sm font-bold text-gray-700 block mb-2">Ruta</label>
            <select
              value={String(routeId || '')}
              disabled
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-800 outline-none"
            >
              <option value="">Selecciona una ruta</option>
            </select>
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
            <label className="text-sm font-bold text-gray-700 block mb-2">Paradero de espera</label>
            <select
              value={waitingStopId}
              onChange={(e) => setWaitingStopId(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-800 outline-none"
            >
              {routeStops.map((stop) => (
                <option key={stop.id} value={String(stop.id)}>
                  {stop.nombre}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-2">El tiempo estimado se calcula respecto a este paradero.</p>
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-800">Buses activos</p>
                <p className="text-xs text-gray-500">{busData.length} buses visibles en el mapa</p>
              </div>
              <div className="bg-blue-600 rounded-full px-3 py-1 text-white text-xs font-bold">
                {busData.length}
              </div>
            </div>

            {routeLoading && (
              <div className="text-sm text-gray-500">Cargando paraderos…</div>
            )}

            {routeError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{routeError}</div>
            )}

            {busData.length === 0 && !routeLoading && (
              <div className="border border-dashed border-gray-200 rounded-xl p-4 text-sm text-gray-500">
                No hay buses activos asignados a esta ruta en este momento.
              </div>
            )}

            {busData.map((bus) => (
              <div key={bus.id} className={`rounded-2xl border p-4 ${bus.delayed ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-xl p-2 ${bus.delayed ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                      <Bus className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{bus.placa}</p>
                      <p className="text-xs text-gray-500">Placa del bus</p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${bus.delayed ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {bus.delayed ? 'Retraso' : 'Normal'}
                  </div>
                </div>

                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-start gap-2 text-gray-700">
                    <MapPin className="h-4 w-4 mt-0.5 text-blue-600" />
                    <span><span className="font-bold">Paradero más cercano:</span> {bus.nearestStop?.nombre || 'Sin datos'}</span>
                  </div>
                  <div className="flex items-start gap-2 text-gray-700">
                    <Clock className="h-4 w-4 mt-0.5 text-blue-600" />
                    <span><span className="font-bold">ETA al paradero:</span> {bus.etaMinutes.toFixed(1)} min</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {delayedBuses.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 mt-0.5" />
                <div>
                  <p className="font-bold">Alerta de retraso</p>
                  <p className="text-sm mt-1">{delayedBuses.length} bus(es) presentan retraso alto respecto al paradero de espera.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-8">
          <div className="border border-gray-100 rounded-3xl overflow-hidden bg-gray-50" style={{ minHeight: '420px' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
              <div>
                <p className="font-bold text-gray-900">Mapa en vivo</p>
                <p className="text-xs text-gray-500">Se actualiza automáticamente cada 10 segundos</p>
              </div>
              <div className="bg-emerald-50 text-emerald-700 rounded-full px-3 py-1 text-xs font-bold border border-emerald-100">
                {busData.length} buses en ruta
              </div>
            </div>
            <div ref={mapContainerRef} className="w-full" style={{ height: '420px' }} />
          </div>
        </div>
      </div>
    </section>
  );
};
