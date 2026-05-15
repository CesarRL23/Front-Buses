import React, { useEffect, useState } from 'react';
import { MapPin, Navigation, AlertCircle, Loader, X } from 'lucide-react';
import { stopService, StopWithRoutes, calculateDistance } from '../services/stopService';

interface NearestStopsProps {
  onStopSelect?: (stop: StopWithRoutes) => void;
  maxStops?: number;
}

export const NearestStops: React.FC<NearestStopsProps> = ({ onStopSelect, maxStops = 5 }) => {
  const [nearestStops, setNearestStops] = useState<StopWithRoutes[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [watchId, setWatchId] = useState<number>(-1);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);

  const fetchNearestStops = async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    try {
      const stops = await stopService.getNearestStops(lat, lon, maxStops);
      setNearestStops(stops);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Error al obtener paraderos cercanos';
      setError(errorMsg);
      console.error('Error fetching nearest stops:', err);
    } finally {
      setLoading(false);
    }
  };

  const requestLocationAccess = () => {
    setLoading(true);
    setError(null);
    setPermissionDenied(false);

    stopService
      .getCurrentLocation()
      .then((location) => {
        setUserLocation(location);
        fetchNearestStops(location.lat, location.lon);

        // Iniciar observación de cambios de ubicación
        const id = stopService.watchPosition(
          (newLocation) => {
            // Solo actualizar si se movió significativamente (>100 metros)
            const distance = calculateDistance(
              location.lat,
              location.lon,
              newLocation.lat,
              newLocation.lon,
            );
            if (distance > 100) {
              setUserLocation(newLocation);
              fetchNearestStops(newLocation.lat, newLocation.lon);
            }
          },
          (error) => {
            console.error('Error tracking location:', error);
            if (error.code === 1) {
              setPermissionDenied(true);
              setError('Permiso de ubicación denegado');
            }
          },
        );
        setWatchId(id);
      })
      .catch((error) => {
        if (error.code === 1) {
          setPermissionDenied(true);
          setError('Por favor, activa los permisos de ubicación');
        } else {
          setError(error.message || 'No se pudo obtener tu ubicación');
        }
        console.error('Error getting location:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const stopTracking = () => {
    if (watchId >= 0) {
      stopService.clearWatch(watchId);
      setWatchId(-1);
    }
  };

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <MapPin className="h-6 w-6 text-blue-600" />
          Paraderos Cercanos
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Encuentra las paradas más cercanas a tu ubicación
        </p>
      </div>

      {/* Location Access Button or Status */}
      {!userLocation ? (
        <div className="mb-6 flex flex-col gap-3">
          <button
            onClick={requestLocationAccess}
            disabled={loading}
            className={`flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium transition ${
              loading
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <>
                <Loader className="h-5 w-5 animate-spin" />
                Buscando tu ubicación...
              </>
            ) : (
              <>
                <Navigation className="h-5 w-5" />
                Usar Mi Ubicación
              </>
            )}
          </button>

          {permissionDenied && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
              <p className="text-sm text-amber-800">
                <strong>Permisos requeridos:</strong> Necesitamos acceso a tu ubicación para
                encontrar paraderos cercanos. Por favor, habilita los permisos en la configuración
                de tu navegador.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-6 flex items-center justify-between rounded-lg bg-blue-50 border border-blue-200 p-4">
          <div>
            <p className="text-sm font-medium text-blue-900">
              📍 Tu ubicación: {userLocation.lat.toFixed(4)}, {userLocation.lon.toFixed(4)}
            </p>
            <p className="text-xs text-blue-700 mt-1">Actualizando automáticamente al moverte</p>
          </div>
          <button
            onClick={stopTracking}
            className="text-blue-600 hover:text-blue-800 transition"
            title="Dejar de rastrear ubicación"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Nearest Stops List */}
      {nearestStops.length > 0 ? (
        <div className="space-y-4">
          {nearestStops.map((stop, index) => (
            <div
              key={stop.id}
              className="rounded-lg border border-slate-200 bg-white p-5 hover:shadow-md transition cursor-pointer"
              onClick={() => onStopSelect?.(stop)}
            >
              {/* Stop Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">
                      {index + 1}
                    </span>
                    <h3 className="text-lg font-semibold text-slate-900">{stop.nombre}</h3>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{stop.direccion}</p>
                </div>

                {/* Distance Badge */}
                {stop.distanceFromUser !== undefined && (
                  <div className="ml-4 flex flex-col items-end">
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
                      <Navigation className="h-4 w-4" />
                      {formatDistance(stop.distanceFromUser)}
                    </span>
                  </div>
                )}
              </div>

              {/* Routes that pass through this stop */}
              {stop.routes && stop.routes.length > 0 ? (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-700 mb-2">
                    {stop.routes.length} RUTA{stop.routes.length !== 1 ? 'S' : ''} PASAN POR AQUÍ
                  </p>
                  <div className="space-y-2">
                    {stop.routes.map((route) => (
                      <div
                        key={route.id}
                        className="rounded-lg bg-slate-50 p-3 text-sm border border-slate-100"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">{route.nombre}</p>
                            <p className="text-xs text-slate-600">
                              {route.origen} → {route.destino}
                            </p>
                            <p className={`text-[11px] font-semibold mt-1 ${route.active ? 'text-emerald-700' : 'text-amber-700'}`}>
                              {route.active ? 'Ruta activa' : 'Ruta con paradero asociado, pero sin programación activa'}
                            </p>
                            {route.descripcion && (
                              <p className="text-xs text-slate-500 mt-1">{route.descripcion}</p>
                            )}
                          </div>
                          <span className="ml-2 flex-shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {(() => {
                              const n = Number(route.tarifa);
                              if (!Number.isFinite(n)) return 'N/A';
                              return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);
                            })()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500 italic">
                    No hay rutas activas en este paradero
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : !loading && userLocation ? (
        <div className="text-center py-12 text-slate-500">
          <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No se encontraron paraderos cercanos en tu área</p>
        </div>
      ) : null}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <Loader className="h-12 w-12 mx-auto animate-spin text-blue-600 mb-3" />
          <p className="text-slate-600">Buscando paraderos cercanos...</p>
        </div>
      )}
    </div>
  );
};

export default NearestStops;
