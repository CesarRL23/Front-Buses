import React, { useState, useEffect } from 'react';
import { X, MapPin, Clock, Bus, User, Calendar, DollarSign, Activity, CheckCircle, Navigation } from 'lucide-react';
import { businessService } from '../services/businessService';

interface TripDetailsModalProps {
  ticketId: number;
  onClose: () => void;
}

const RouteMap: React.FC<{ nodos: any[], validaciones: any }> = ({ nodos, validaciones }) => {
  const mapRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || nodos.length === 0) return;

    const loadLeaflet = async () => {
      // Inject Leaflet CSS
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Inject Leaflet JS
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

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: true });
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(map);

      const coords: [number, number][] = [];
      
      const abordajeId = validaciones?.abordaje?.nodo?.id;
      const descensoId = validaciones?.descenso?.nodo?.id;

      nodos.forEach((nodoWrapper, idx) => {
        const stop = nodoWrapper.nodo || nodoWrapper.stop || nodoWrapper.whereabout;
        if (!stop || !stop.latitud || !stop.longitud) return;

        const lat = Number(stop.latitud);
        const lng = Number(stop.longitud);
        coords.push([lat, lng]);

        const isAbordaje = stop.id === abordajeId;
        const isDescenso = stop.id === descensoId;
        const isFirst = idx === 0;
        const isLast = idx === nodos.length - 1;

        let color = '#3B82F6'; // Default blue
        let radius = 8;
        let label = `Parada ${nodoWrapper.orden || idx + 1}`;

        if (isAbordaje) {
          color = '#10B981'; // Green
          radius = 12;
          label = '🟢 Abordaje';
        } else if (isDescenso) {
          color = '#EF4444'; // Red
          radius = 12;
          label = '🔴 Descenso';
        } else if (isFirst) {
          label = 'Inicio de Ruta';
        } else if (isLast) {
          label = 'Fin de Ruta';
        }

        const circle = L.circleMarker([lat, lng], {
          radius, fillColor: color, color: '#fff',
          weight: 3, opacity: 1, fillOpacity: 0.9
        }).addTo(map);

        circle.bindPopup(`
          <div style="font-family:system-ui;min-width:160px">
            <div style="font-weight:700;font-size:13px;margin-bottom:4px">${label}</div>
            <div style="font-size:12px;color:#6B7280">${stop.nombre}</div>
            ${isAbordaje && validaciones?.abordaje?.timestamp ? `<div style="font-size:11px;color:#10B981;margin-top:2px">Hora: ${new Date(validaciones.abordaje.timestamp).toLocaleTimeString()}</div>` : ''}
            ${isDescenso && validaciones?.descenso?.timestamp ? `<div style="font-size:11px;color:#EF4444;margin-top:2px">Hora: ${new Date(validaciones.descenso.timestamp).toLocaleTimeString()}</div>` : ''}
          </div>
        `);
      });

      if (coords.length > 1) {
        L.polyline(coords, {
          color: '#3B82F6', weight: 4, opacity: 0.7,
          dashArray: '10, 8', lineCap: 'round'
        }).addTo(map);
      }

      if (coords.length > 0) {
        const bounds = L.latLngBounds(coords);
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [nodos, validaciones]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />;
};

export const TripDetailsModal: React.FC<TripDetailsModalProps> = ({ ticketId, onClose }) => {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const data = await businessService.getTripDetails(ticketId);
        setDetails(data);
      } catch (error) {
        console.error("Error fetching trip details", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [ticketId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600 font-medium">Cargando detalles del viaje...</p>
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center">
          <p className="text-red-500 font-bold mb-4">No se pudo cargar la información del viaje.</p>
          <button onClick={onClose} className="w-full bg-gray-100 py-3 rounded-xl font-bold">Cerrar</button>
        </div>
      </div>
    );
  }

  const { ticketInfo, bus, conductor, ruta, validaciones, tiempoTotalMinutos } = details;
  const nodos = ruta?.nodos || [];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-end">
      {/* Drawer from right */}
      <div className="w-full max-w-2xl bg-white h-full overflow-y-auto shadow-2xl flex flex-col animate-[slideIn_0.3s_ease-out]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white shrink-0 relative">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Navigation className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black">{ruta?.nombre || 'Ruta Desconocida'}</h2>
              <p className="text-blue-100 text-sm font-medium">{ticketInfo?.codigo}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-6 bg-black/20 rounded-2xl p-4">
            <div>
              <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">Estado</p>
              <p className="font-bold flex items-center gap-1">
                {ticketInfo?.estado === 'COMPLETADO' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Activity className="w-4 h-4 text-yellow-400" />}
                {ticketInfo?.estado}
              </p>
            </div>
            <div>
              <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">Tarifa</p>
              <p className="font-bold">${ticketInfo?.precio?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">Tiempo</p>
              <p className="font-bold">{tiempoTotalMinutos ? `${tiempoTotalMinutos} min` : 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8 flex-1">
          
          {/* Map Section */}
          <section>
            <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" /> Recorrido del Viaje
            </h3>
            <div className="h-[350px] w-full bg-gray-100 rounded-[2rem] border border-gray-200 overflow-hidden relative">
              <RouteMap nodos={nodos} validaciones={validaciones} />
            </div>
          </section>

          {/* Validations Timeline */}
          <section className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
             <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" /> Validaciones
            </h3>
            <div className="space-y-6">
              
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold z-10 shrink-0">A</div>
                  <div className="w-0.5 h-12 bg-gray-200 -mt-2 -mb-2"></div>
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm font-bold text-gray-900 uppercase tracking-wide">Abordaje</p>
                  <p className="text-gray-600 text-sm mt-1">{validaciones?.abordaje?.nodo?.stop?.nombre || validaciones?.abordaje?.nodo?.nombre || 'Paradero de origen'}</p>
                  <p className="text-green-600 font-medium text-xs mt-1">
                    {validaciones?.abordaje?.timestamp ? new Date(validaciones.abordaje.timestamp).toLocaleString() : 'Pendiente'}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold z-10 shrink-0">D</div>
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm font-bold text-gray-900 uppercase tracking-wide">Descenso</p>
                  <p className="text-gray-600 text-sm mt-1">{validaciones?.descenso?.nodo?.stop?.nombre || validaciones?.descenso?.nodo?.nombre || 'Paradero de destino'}</p>
                  <p className="text-red-600 font-medium text-xs mt-1">
                    {validaciones?.descenso?.timestamp ? new Date(validaciones.descenso.timestamp).toLocaleString() : 'Pendiente'}
                  </p>
                </div>
              </div>

            </div>
          </section>

          {/* Info Bus & Driver */}
          <section className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm flex items-start gap-4">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600 shrink-0">
                <Bus className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Vehículo</p>
                <p className="font-bold text-gray-900">{bus?.placa || 'N/A'}</p>
                <p className="text-xs text-gray-500 mt-1">Capacidad: {bus?.capacidad || 0} pax</p>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm flex items-start gap-4">
              <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 shrink-0">
                <User className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Conductor</p>
                <p className="font-bold text-gray-900 line-clamp-1">{conductor?.name || conductor?.nombre || 'No asignado'}</p>
                {conductor?.documentNumber && <p className="text-xs text-gray-500 mt-1">ID: {conductor.documentNumber}</p>}
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};
