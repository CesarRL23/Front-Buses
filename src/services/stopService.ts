import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const NEGOCIO_BASE = API_BASE;

const api = axios.create({
  baseURL: NEGOCIO_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 12000,
});

const attachToken = (config: any) => {
  const token =
    localStorage.getItem("auth_token") || localStorage.getItem("temp_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

api.interceptors.request.use(attachToken, (error) => Promise.reject(error));

export interface Stop {
  id: string;
  nombre: string;
  latitud: number;
  longitud: number;
  direccion: string;
  activo: boolean;
}

export interface NodoRoute {
  id: string;
  orden: number;
  distanciaDesdeAnterior: number;
  tiempoEstimadoDesdeAnterior: number;
  route_id: string;
  stop_id: string;
  whereabouts?: Stop;
}

export interface RouteSummary {
  id: string;
  nombre: string;
  descripcion?: string;
  origen: string;
  destino: string;
  tarifa: number;
}

export interface StopWithRoutes extends Stop {
  distanceFromUser?: number; // en metros
  routes?: RouteSummary[];
}

/**
 * Calcula la distancia en metros entre dos coordenadas GPS usando Haversine
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371000; // Radio de la Tierra en metros
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const stopService = {
  /**
   * Obtiene todos los paraderos disponibles
   */
  getAllStops: async (): Promise<Stop[]> => {
    try {
      const response = await api.get("/whereabouts");
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Error fetching stops:", error);
      return [];
    }
  },

  /**
   * Obtiene un paradero específico
   */
  getStopById: async (stopId: string): Promise<Stop | null> => {
    try {
      const response = await api.get(`/whereabouts/${stopId}`);
      return response.data || null;
    } catch (error) {
      console.error(`Error fetching stop ${stopId}:`, error);
      return null;
    }
  },

  /**
   * Obtiene las N rutas más cercanas a una ubicación
   * @param userLat Latitud del usuario
   * @param userLon Longitud del usuario
   * @param limit Cantidad de paraderos a retornar (default 5)
   */
  getNearestStops: async (
    userLat: number,
    userLon: number,
    limit: number = 5,
  ): Promise<StopWithRoutes[]> => {
    try {
      const allStops = await stopService.getAllStops();

      // Calcular distancia y filtrar por activos
      const stopsWithDistance: StopWithRoutes[] = allStops
        .filter((stop) => stop.activo)
        .map((stop) => ({
          ...stop,
          distanceFromUser: calculateDistance(
            userLat,
            userLon,
            stop.latitud,
            stop.longitud,
          ),
          routes: [],
        }));

      // Ordenar por distancia y tomar los N más cercanos
      const nearest = stopsWithDistance
        .sort((a, b) => a.distanceFromUser! - b.distanceFromUser!)
        .slice(0, limit);

      // Obtener las rutas que pasan por cada paradero
      for (const stop of nearest) {
        try {
          const routes = await stopService.getRoutesByStop(stop.id);
          stop.routes = routes;
        } catch {
          stop.routes = [];
        }
      }

      return nearest;
    } catch (error) {
      console.error("Error getting nearest stops:", error);
      return [];
    }
  },

  /**
   * Obtiene todas las rutas que pasan por un paradero específico
   */
  getRoutesByStop: async (stopId: string): Promise<RouteSummary[]> => {
    try {
      // Obtener todos los nodos que referencian este paradero
      const response = await api.get("/nodo");
      const nodos: NodoRoute[] = Array.isArray(response.data)
        ? response.data
        : [];

      // Filtrar nodos que corresponden a este paradero
      const routeIds = nodos
        .filter((nodo) => nodo.stop_id === stopId)
        .map((nodo) => nodo.route_id);

      if (routeIds.length === 0) {
        return [];
      }

      // Obtener los detalles de cada ruta
      const routesResponse = await api.get("/route");
      const allRoutes: RouteSummary[] = Array.isArray(routesResponse.data)
        ? routesResponse.data
        : [];

      return allRoutes
        .filter((route) => routeIds.includes(route.id))
        .map((route) => ({
          id: route.id,
          nombre: route.nombre,
          descripcion: route.descripcion,
          origen: route.origen,
          destino: route.destino,
          tarifa: route.tarifa,
        }));
    } catch (error) {
      console.error(`Error getting routes for stop ${stopId}:`, error);
      return [];
    }
  },

  /**
   * Obtiene la ubicación actual del usuario usando Geolocation API
   */
  getCurrentLocation: (): Promise<{ lat: number; lon: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation no disponible en este navegador"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      );
    });
  },

  /**
   * Observa cambios en la ubicación del usuario
   */
  watchPosition: (
    onLocationChange: (location: { lat: number; lon: number }) => void,
    onError: (error: GeolocationPositionError) => void,
  ): number => {
    if (!navigator.geolocation) {
      onError({
        code: 0,
        message: "Geolocation no disponible",
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError);
      return -1;
    }

    return navigator.geolocation.watchPosition(
      (position) => {
        onLocationChange({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      onError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000, // actualizar cada segundo
      },
    );
  },

  /**
   * Detiene la observación de cambios en la ubicación
   */
  clearWatch: (watchId: number): void => {
    if (watchId >= 0) {
      navigator.geolocation.clearWatch(watchId);
    }
  },
};
