import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navbar } from '../components/Navbar';
import { StatsCard } from '../components/DashboardComponents';
import { businessService } from '../services/businessService';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Bus,
  CheckCircle,
  MapPin,
  RefreshCw,
  Users,
  X,
} from 'lucide-react';

// ─── helpers ──────────────────────────────────────────────────────────────────
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const normalizeList = (payload: unknown): any[] => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    for (const key of ['data', 'items', 'results']) {
      if (Array.isArray((payload as any)[key])) return (payload as any)[key];
    }
    const nested = Object.values(payload as Record<string, unknown>).filter(Array.isArray);
    if (nested.length > 0) return nested[0] as any[];
  }
  return [];
};

const getRouteId = (p: any): number =>
  Number(p?.route?.id || p?.routeId || p?.rutaId || 0);

const getRouteName = (p: any): string =>
  p?.route?.nombre || p?.ruta?.nombre || p?.routeName || 'Ruta';

const getBusId = (p: any, idx: number): number =>
  Number(p?.bus?.id || p?.id || idx + 1);

const getIncidentBusIds = (incident: any): string[] => {
  const ids: string[] = [];
  if (Array.isArray(incident.incidenteBuses)) {
    incident.incidenteBuses.forEach((ib: any) => {
      const id = ib?.bus?.id || ib?.busId;
      if (id) ids.push(String(id));
    });
  }
  const shiftBusId = incident?.shift?.programming?.bus?.id || incident?.shift?.bus?.id;
  if (shiftBusId) ids.push(String(shiftBusId));
  return ids;
};

const TIPO_LABELS: Record<string, string> = {
  mecanico: 'Mecánico', accidente: 'Accidente',
  retraso: 'Retraso', pasajeros: 'Pasajeros', otro: 'Otro',
};

const gravedadColor = (g: string) => {
  if (g === 'critico') return 'bg-red-100 text-red-700';
  if (g === 'alto') return 'bg-orange-100 text-orange-700';
  if (g === 'medio') return 'bg-amber-100 text-amber-700';
  return 'bg-slate-100 text-slate-600';
};

// ─── component ────────────────────────────────────────────────────────────────
export const SupervisorOperacionesDashboard: React.FC = () => {
  const [programmings, setProgrammings] = useState<any[]>([]);
  const [routeStopsMap, setRouteStopsMap] = useState<Record<number, any[]>>({});
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [countdown, setCountdown] = useState(30);
  const [tick, setTick] = useState(0);
  const [selectedBus, setSelectedBus] = useState<any | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const busMarkersRef = useRef<Record<string, any>>({});
  const mapReadyRef = useRef(false);

  // ── data loading ────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setError('');
    try {
      const [rawProgs, rawIncs] = await Promise.all([
        businessService.getSchedules(),
        businessService.getIncidents(),
      ]);
      const progs = normalizeList(rawProgs);
      const incs = normalizeList(rawIncs);

      setProgrammings(progs);
      setIncidents(incs);
      setLastUpdate(new Date());

      // fetch nodos for each unique route
      const routeIds = [...new Set(progs.map(getRouteId).filter(Boolean))] as number[];
      const stopsMap: Record<number, any[]> = {};
      await Promise.all(
        routeIds.map(async (rid) => {
          try {
            const resp = await businessService.getRouteNodos(rid);
            stopsMap[rid] = (resp?.nodos || [])
              .filter((n: any) => {
                const s = n.stop || n.whereabout || n.whereabouts;
                return s && Number(s.latitud) && Number(s.longitud);
              })
              .map((n: any, i: number) => ({
                id: Number(n.id || i + 1),
                nombre: n.stop?.nombre || n.whereabout?.nombre || n.whereabouts?.nombre || `Paradero ${i + 1}`,
                latitud: Number(n.stop?.latitud || n.whereabout?.latitud || n.whereabouts?.latitud),
                longitud: Number(n.stop?.longitud || n.whereabout?.longitud || n.whereabouts?.longitud),
                orden: Number(n.orden || i + 1),
                tiempoEstimadoDesdeAnterior: Number(n.tiempoEstimadoDesdeAnterior || 0),
              }))
              .sort((a: any, b: any) => a.orden - b.orden);
          } catch {
            stopsMap[rid] = [];
          }
        })
      );
      setRouteStopsMap(stopsMap);
    } catch {
      setError('Error al cargar datos. Reintentando en el próximo ciclo...');
    } finally {
      setLoading(false);
    }
  }, []);

  // initial load + 30s auto-refresh
  useEffect(() => {
    loadData();
    const t = setInterval(loadData, 30000);
    return () => clearInterval(t);
  }, [loadData]);

  // countdown visual (resets on each load)
  useEffect(() => {
    setCountdown(30);
    const t = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [lastUpdate]);

  // simulation tick every 10s
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 10000);
    return () => clearInterval(t);
  }, []);

  // ── derived data ────────────────────────────────────────────────────────────
  const activeIncidents = useMemo(
    () => incidents.filter((i) => i.estado !== 'resuelto'),
    [incidents]
  );

  const busIncidentMap = useMemo(() => {
    const m: Record<string, boolean> = {};
    activeIncidents.forEach((inc) =>
      getIncidentBusIds(inc).forEach((id) => { m[id] = true; })
    );
    return m;
  }, [activeIncidents]);

  const busIncidentListMap = useMemo(() => {
    const m: Record<string, any[]> = {};
    activeIncidents.forEach((inc) =>
      getIncidentBusIds(inc).forEach((id) => {
        if (!m[id]) m[id] = [];
        m[id].push(inc);
      })
    );
    return m;
  }, [activeIncidents]);

  // bus positions (same interpolation algorithm as RealTimeBusTracker)
  const busData = useMemo(() => {
    return programmings.flatMap((prog, idx) => {
      if (!prog.bus) return [];
      const rid = getRouteId(prog);
      const stops = routeStopsMap[rid];
      if (!stops || stops.length === 0) return [];

      const totalSec =
        stops.reduce((sum: number, s: any, i: number) =>
          i === 0 ? sum : sum + (s.tiempoEstimadoDesdeAnterior || 0) * 60, 0) || 1;

      const busId = getBusId(prog, idx);
      const offset = ((busId * 11) + (idx * 7)) % totalSec;
      const routeTimeSec = ((tick * 10) + offset) % totalSec;

      let accumulated = 0;
      let segIdx = 0;
      let progress = 0;
      for (let i = 0; i < stops.length - 1; i++) {
        const segDur = (stops[i + 1].tiempoEstimadoDesdeAnterior || 0) * 60;
        if (routeTimeSec <= accumulated + segDur || i === stops.length - 2) {
          segIdx = i;
          progress = segDur === 0 ? 0 : (routeTimeSec - accumulated) / segDur;
          break;
        }
        accumulated += segDur;
      }

      const cur = stops[segIdx];
      const nxt = stops[segIdx + 1] || stops[segIdx];
      const lat = cur.latitud + (nxt.latitud - cur.latitud) * clamp(progress, 0, 1);
      const lng = cur.longitud + (nxt.longitud - cur.longitud) * clamp(progress, 0, 1);

      const capacity = prog.bus?.capacidad || 40;
      const activeTickets = (prog.tickets || []).filter((t: any) => t.estado === 'ACTIVO').length;
      const id = String(busId);

      return [{
        id,
        placa: String(prog.bus?.placa || `BUS-${busId}`),
        routeId: rid,
        routeName: getRouteName(prog),
        currentLat: lat,
        currentLng: lng,
        nearestStop: cur,
        hasIncident: Boolean(busIncidentMap[id]),
        capacity,
        activeTickets,
        atMaxCapacity: activeTickets >= capacity,
      }];
    });
  }, [programmings, routeStopsMap, tick, busIncidentMap]);

  const totalPassengers = useMemo(
    () => busData.reduce((s, b) => s + b.activeTickets, 0),
    [busData]
  );
  const maxCapacityBuses = useMemo(
    () => busData.filter((b) => b.atMaxCapacity),
    [busData]
  );

  // ── Leaflet map init ────────────────────────────────────────────────────────
  // Se ejecuta cuando loading pasa a false (el div del mapa ya está en el DOM)
  useEffect(() => {
    if (loading) return;

    let map: L.Map | null = null;

    const initMap = () => {
      const container = mapContainerRef.current;
      if (!container) return;

      if (mapReadyRef.current) {
        // Ya inicializado, solo recalcula tamaño
        mapInstanceRef.current?.invalidateSize();
        return;
      }

      if ((container as any)._leaflet_id) {
        (container as any)._leaflet_id = null;
      }

      map = L.map(container, { zoomControl: true, scrollWheelZoom: true });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      map.setView([5.0703, -75.5138], 13);
      mapInstanceRef.current = map;
      mapReadyRef.current = true;
      map.invalidateSize();
    };

    const t = setTimeout(initMap, 100);

    return () => {
      clearTimeout(t);
      if (map) {
        map.remove();
        mapInstanceRef.current = null;
        mapReadyRef.current = false;
      }
    };
  }, [loading]);

  // ── update bus markers ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    Object.values(busMarkersRef.current).forEach((m: any) => m.remove());
    busMarkersRef.current = {};

    if (busData.length === 0) return;

    const bounds: [number, number][] = [];

    busData.forEach((bus) => {
      if (!bus.currentLat || !bus.currentLng) return;

      const color = bus.hasIncident ? '#dc2626' : '#16a34a';
      const border = bus.hasIncident ? '#991b1b' : '#15803d';

      const icon = L.divIcon({
        className: 'custom-fleet-bus',
        html: `<div style="background:${color};color:#fff;border-radius:999px;padding:5px 9px;font-size:10px;font-weight:900;box-shadow:0 4px 12px rgba(0,0,0,0.3);border:2px solid ${border};white-space:nowrap;cursor:pointer;">${bus.placa}</div>`,
        iconSize: [48, 24],
        iconAnchor: [24, 12],
      });

      const marker = L.marker([bus.currentLat, bus.currentLng], { icon }).addTo(mapInstanceRef.current);

      marker.bindPopup(`<div style="font-family:system-ui;min-width:190px;">
        <div style="font-size:13px;font-weight:800;color:#111827">${bus.placa}</div>
        <div style="font-size:11px;color:#64748b;margin-top:4px">Ruta: ${bus.routeName}</div>
        <div style="font-size:11px;color:#64748b;margin-top:2px">Paradero: ${bus.nearestStop?.nombre || '—'}</div>
        <div style="font-size:11px;color:#64748b;margin-top:2px">Pasajeros: ${bus.activeTickets}/${bus.capacity}</div>
        <div style="font-size:11px;font-weight:800;margin-top:6px;color:${color}">
          ${bus.hasIncident ? '⚠ Incidente activo' : '✓ Estado normal'}
        </div>
      </div>`);

      marker.on('click', () => setSelectedBus(bus));
      busMarkersRef.current[bus.id] = marker;
      bounds.push([bus.currentLat, bus.currentLng]);
    });

    if (bounds.length > 0) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [32, 32], maxZoom: 14 });
    }
  }, [busData]);

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-teal-100 rounded-xl p-2.5">
                <Activity className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-teal-600">Panel de Control</p>
                <h1 className="text-2xl font-black text-slate-900">Supervisor de Operaciones</h1>
              </div>
            </div>
            <p className="text-slate-500 text-sm">
              Monitoreo en tiempo real de la flota · Última actualización: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-teal-50 text-teal-700 px-4 py-2 rounded-full border border-teal-200 text-sm font-bold">
              <RefreshCw className={`h-4 w-4 ${countdown <= 5 ? 'animate-spin' : ''}`} />
              Actualiza en {countdown}s
            </div>
            <button
              onClick={loadData}
              className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-slate-800 transition"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500">
            <RefreshCw className="h-6 w-6 animate-spin mr-3" />
            Cargando datos de flota...
          </div>
        ) : (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="Buses Activos"
                value={busData.length}
                subtitle="En operación ahora"
                icon={Bus}
                bgColor="bg-teal-50"
                textColor="text-teal-600"
                iconBgColor="bg-teal-100"
              />
              <StatsCard
                title="Pasajeros en Tránsito"
                value={totalPassengers}
                subtitle="Total en este momento"
                icon={Users}
                bgColor="bg-blue-50"
                textColor="text-blue-600"
                iconBgColor="bg-blue-100"
              />
              <StatsCard
                title="Incidentes Activos"
                value={activeIncidents.length}
                subtitle="Sin resolver"
                icon={AlertTriangle}
                bgColor={activeIncidents.length > 0 ? 'bg-red-50' : 'bg-green-50'}
                textColor={activeIncidents.length > 0 ? 'text-red-600' : 'text-green-600'}
                iconBgColor={activeIncidents.length > 0 ? 'bg-red-100' : 'bg-green-100'}
              />
              <StatsCard
                title="Buses con Capacidad Máxima"
                value={maxCapacityBuses.length}
                subtitle="Buses llenos"
                icon={AlertCircle}
                bgColor={maxCapacityBuses.length > 0 ? 'bg-amber-50' : 'bg-slate-50'}
                textColor={maxCapacityBuses.length > 0 ? 'text-amber-600' : 'text-slate-500'}
                iconBgColor={maxCapacityBuses.length > 0 ? 'bg-amber-100' : 'bg-slate-100'}
              />
            </div>

            {/* Map + side panels */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Fleet map */}
              <div className="lg:col-span-8">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <div>
                      <p className="font-bold text-slate-900">Mapa de Flota en Tiempo Real</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Todos los buses activos · Haz clic en un bus para ver su detalle
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                        Normal
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full">
                        <span className="w-2 h-2 bg-red-500 rounded-full" />
                        Incidente
                      </span>
                    </div>
                  </div>
                  <div ref={mapContainerRef} className="w-full" style={{ height: '480px' }} />
                </div>
              </div>

              {/* Right column */}
              <div className="lg:col-span-4 space-y-4">

                {/* Active incidents list */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <p className="font-bold text-slate-900">Incidentes Activos</p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      activeIncidents.length > 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {activeIncidents.length}
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                    {activeIncidents.length === 0 ? (
                      <div className="flex flex-col items-center py-8 text-slate-400">
                        <CheckCircle className="h-8 w-8 mb-2 text-emerald-400" />
                        <p className="text-sm font-semibold">Sin incidentes activos</p>
                      </div>
                    ) : (
                      activeIncidents.slice(0, 20).map((inc) => (
                        <div key={inc.id} className="px-5 py-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold text-slate-900">
                                  {TIPO_LABELS[inc.tipo] || inc.tipo}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${gravedadColor(inc.gravedad)}`}>
                                  {inc.gravedad}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-1 truncate">
                                {inc.descripcion || 'Sin descripción'}
                              </p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${
                              inc.estado === 'en_revision'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {inc.estado === 'en_revision' ? 'En revisión' : 'Pendiente'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Max capacity alerts */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <p className="font-bold text-slate-900">Alertas de Capacidad</p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      maxCapacityBuses.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {maxCapacityBuses.length}
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-52 overflow-y-auto">
                    {maxCapacityBuses.length === 0 ? (
                      <div className="flex flex-col items-center py-8 text-slate-400">
                        <CheckCircle className="h-8 w-8 mb-2 text-emerald-400" />
                        <p className="text-sm font-semibold">Ningún bus en capacidad máxima</p>
                      </div>
                    ) : (
                      maxCapacityBuses.map((bus) => (
                        <div
                          key={bus.id}
                          className="px-5 py-3 cursor-pointer hover:bg-amber-50 transition"
                          onClick={() => setSelectedBus(bus)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Bus className="h-4 w-4 text-amber-500" />
                              <span className="text-sm font-bold text-slate-900">{bus.placa}</span>
                            </div>
                            <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                              {bus.activeTickets}/{bus.capacity}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{bus.routeName}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* All buses compact list */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <p className="font-bold text-slate-900">Todos los Buses</p>
                    <p className="text-xs text-slate-500 mt-0.5">{busData.length} activos · clic para detalles</p>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                    {busData.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-sm">
                        No hay buses activos en este momento
                      </div>
                    ) : (
                      busData.map((bus) => (
                        <div
                          key={bus.id}
                          className="px-5 py-3 cursor-pointer hover:bg-slate-50 transition flex items-center justify-between gap-3"
                          onClick={() => setSelectedBus(bus)}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                              bus.hasIncident ? 'bg-red-500' : 'bg-emerald-500'
                            }`} />
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900">{bus.placa}</p>
                              <p className="text-xs text-slate-500 truncate">{bus.routeName}</p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs font-semibold text-slate-600">
                              {bus.activeTickets}/{bus.capacity}
                            </p>
                            <p className="text-[10px] text-slate-400">pasajeros</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Bus detail modal */}
      {selectedBus && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedBus(null); }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 sticky top-0 bg-white rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${selectedBus.hasIncident ? 'bg-red-100' : 'bg-emerald-100'}`}>
                  <Bus className={`h-5 w-5 ${selectedBus.hasIncident ? 'text-red-600' : 'text-emerald-600'}`} />
                </div>
                <div>
                  <p className="font-black text-slate-900 text-lg">{selectedBus.placa}</p>
                  <p className="text-xs text-slate-500">{selectedBus.routeName}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBus(null)}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">

              {/* Status banner */}
              <div className={`flex items-center gap-3 p-4 rounded-2xl ${
                selectedBus.hasIncident
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-emerald-50 border border-emerald-200'
              }`}>
                {selectedBus.hasIncident
                  ? <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  : <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                }
                <div>
                  <p className={`font-bold text-sm ${selectedBus.hasIncident ? 'text-red-700' : 'text-emerald-700'}`}>
                    {selectedBus.hasIncident ? 'Incidente activo' : 'Estado normal'}
                  </p>
                  <p className={`text-xs ${selectedBus.hasIncident ? 'text-red-600' : 'text-emerald-600'}`}>
                    {selectedBus.hasIncident
                      ? `${(busIncidentListMap[selectedBus.id] || []).length} incidente(s) abierto(s)`
                      : 'Sin incidentes reportados'
                    }
                  </p>
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">Paradero más cercano</p>
                  <p className="text-sm font-bold text-slate-900 flex items-start gap-1">
                    <MapPin className="h-3.5 w-3.5 mt-0.5 text-teal-500 flex-shrink-0" />
                    {selectedBus.nearestStop?.nombre || '—'}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-2">Pasajeros</p>
                  <p className="text-sm font-bold text-slate-900">
                    {selectedBus.activeTickets} / {selectedBus.capacity}
                  </p>
                  <div className="mt-2 w-full bg-slate-200 rounded-full h-1.5">
                    <div
                      className={`h-full rounded-full transition-all ${
                        selectedBus.atMaxCapacity
                          ? 'bg-red-500'
                          : selectedBus.activeTickets / selectedBus.capacity > 0.8
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{
                        width: `${Math.min(100, (selectedBus.activeTickets / selectedBus.capacity) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">Ruta</p>
                  <p className="text-sm font-bold text-slate-900">{selectedBus.routeName}</p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">Capacidad máxima</p>
                  <p className="text-sm font-bold text-slate-900">{selectedBus.capacity} pasajeros</p>
                </div>
              </div>

              {/* Incidents for this bus */}
              {(busIncidentListMap[selectedBus.id] || []).length > 0 && (
                <div>
                  <p className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    Incidentes de este bus
                  </p>
                  <div className="space-y-2">
                    {(busIncidentListMap[selectedBus.id] || []).map((inc: any) => (
                      <div key={inc.id} className="bg-red-50 border border-red-100 rounded-xl p-3">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-sm font-bold text-slate-900">
                            {TIPO_LABELS[inc.tipo] || inc.tipo}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${gravedadColor(inc.gravedad)}`}>
                            {inc.gravedad}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">{inc.descripcion || 'Sin descripción'}</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {new Date(inc.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
