export enum IncidentType {
  MECANICO = 'mecanico',
  ACCIDENTE = 'accidente',
  RETRASO = 'retraso',
  OTRO = 'otro',
}

export enum IncidentSeverity {
  BAJO = 'bajo',
  MEDIO = 'medio',
  ALTO = 'alto',
  CRITICO = 'critico',
}

export interface IncidentReport {
  tipo: IncidentType;
  gravedad: IncidentSeverity;
  descripcion: string;
  tipo_otro?: string;
  fotoUrls?: string[];
  shiftId?: number;
}

export interface IncidentData {
  id: number;
  timestamp: Date;
  tipo: string;
  gravedad: string;
  descripcion: string;
  tipo_otro?: string;
  latitud?: number;
  longitud?: number;
  location?: {
    lat: number;
    lng: number;
  };
  incidenteBuses?: IncidentBusData[];
}

export interface IncidentBusData {
  id: number;
  bus: any;
  incidente: IncidentData;
  fotos: FotoData[];
  notas?: string;
}

export interface FotoData {
  id: number;
  url: string;
  incidenteBus?: IncidentBusData;
}

export interface IncidentResponse {
  id: number;
  timestamp: Date;
  tipo: string;
  gravedad: string;
  descripcion: string;
  location?: {
    lat: number;
    lng: number;
  };
  message: string;
}
