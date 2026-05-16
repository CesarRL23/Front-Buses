import axios from 'axios';
import {
  IncidentReport,
  IncidentData,
  IncidentResponse,
} from '../types/incident.types';

const BUSINESS_API_BASE =
  import.meta.env.VITE_BUSINESS_API_URL || 'http://localhost:3000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const reportApi = axios.create({
  baseURL: BUSINESS_API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

reportApi.interceptors.request.use(
  (config) => {
    const headers = getAuthHeaders();
    if (headers.Authorization) {
      config.headers.Authorization = headers.Authorization;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export const reportService = {
  /**
   * Reportar un incidente durante operación
   * @param incidenteData - Datos del incidente (tipo, gravedad, descripción, fotos)
   * @param latitude - Latitud GPS actual
   * @param longitude - Longitud GPS actual
   * @returns Respuesta con ID del incidente creado
   */
  reportIncident: async (
    incidenteData: IncidentReport,
    latitude?: number,
    longitude?: number,
  ): Promise<IncidentResponse> => {
    const params = new URLSearchParams();
    if (latitude) params.append('latitude', latitude.toString());
    if (longitude) params.append('longitude', longitude.toString());

    const response = await reportApi.post(
      `/incidente?${params.toString()}`,
      incidenteData,
    );
    return response.data;
  },

  /**
   * Obtener todos los incidentes de un turno específico
   * @param shiftId - ID del turno
   * @returns Array de incidentes del turno
   */
  getShiftIncidents: async (shiftId: number): Promise<IncidentData[]> => {
    const response = await reportApi.get(`/incidente/shift/${shiftId}`);
    return response.data;
  },

  /**
   * Obtener histórico de incidentes de un conductor
   * @param driverId - ID del conductor
   * @param limit - Límite de registros (default 10)
   * @returns Array de incidentes históricos
   */
  getDriverIncidentHistory: async (
    driverId: number,
    limit: number = 10,
  ): Promise<IncidentData[]> => {
    const response = await reportApi.get(
      `/incidente/driver/${driverId}/history?limit=${limit}`,
    );
    return response.data;
  },

  /**
   * Cargar múltiples fotos a un incidente existente
   * @param incidenteBusId - ID del IncidenteBus
   * @param fotoUrls - Array de URLs de fotos (máximo 5)
   * @returns Respuesta con fotos cargadas
   */
  uploadPhotos: async (
    incidenteBusId: number,
    fotoUrls: string[],
  ): Promise<any> => {
    if (fotoUrls.length > 5) {
      throw new Error('Máximo 5 fotos permitidas');
    }

    const response = await reportApi.post(
      `/incidente-bus/${incidenteBusId}/upload-fotos`,
      {
        fotoUrls,
      },
    );
    return response.data;
  },

  /**
   * Obtener detalles de un incidente específico
   * @param incidenteId - ID del incidente
   * @returns Datos completos del incidente
   */
  getIncidentDetails: async (incidenteId: number): Promise<IncidentData> => {
    const response = await reportApi.get(`/incidente/${incidenteId}`);
    return response.data;
  },
};
