import axios from "axios";
import { businessService } from "./businessService";

const BUSINESS_API_BASE =
  import.meta.env.VITE_BUSINESS_API_URL || "http://localhost:3000";

const getAuthHeaders = () => {
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const analysisApi = axios.create({
  baseURL: BUSINESS_API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

analysisApi.interceptors.request.use(
  (config) => {
    const headers = getAuthHeaders();
    if (headers.Authorization) {
      config.headers.Authorization = headers.Authorization;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Define age ranges
export enum AgeRange {
  MINORS = "0-17",
  YOUNG = "18-25",
  YOUNG_ADULTS = "26-40",
  ADULTS = "41-60",
  SENIORS = "60+",
}

// Typing
export interface AgeRangeLabel {
  range: AgeRange;
  label: string;
  minAge: number;
  maxAge: number | null;
}

export interface PassengerByAgeRange {
  range: AgeRange;
  label: string;
  count: number;
  percentage: number;
  passengers: any[];
  variation?: number; // variation vs previous month
}

export interface AnalysisData {
  totalPassengers: number;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  byAgeRange: PassengerByAgeRange[];
  byRoute?: Map<number, PassengerByAgeRange[]>;
}

// Age classification
export const AGE_RANGES: AgeRangeLabel[] = [
  { range: AgeRange.MINORS, label: "Menores (0-17)", minAge: 0, maxAge: 17 },
  { range: AgeRange.YOUNG, label: "Jóvenes (18-25)", minAge: 18, maxAge: 25 },
  { range: AgeRange.YOUNG_ADULTS, label: "Adultos jóvenes (26-40)", minAge: 26, maxAge: 40 },
  { range: AgeRange.ADULTS, label: "Adultos (41-60)", minAge: 41, maxAge: 60 },
  { range: AgeRange.SENIORS, label: "Adultos mayores (60+)", minAge: 60, maxAge: null },
];

export const getAgeRange = (age: number): AgeRange => {
  if (age < 18) return AgeRange.MINORS;
  if (age < 26) return AgeRange.YOUNG;
  if (age < 41) return AgeRange.YOUNG_ADULTS;
  if (age < 61) return AgeRange.ADULTS;
  return AgeRange.SENIORS;
};

export const getAgeRangeLabel = (age: number): string => {
  const range = getAgeRange(age);
  const rangeObj = AGE_RANGES.find((r) => r.range === range);
  return rangeObj?.label || "Desconocido";
};

export const marketingAnalysisService = {
  // Get all citizens with complete data including person and age
  getCitizensWithAge: async () => {
    try {
      // Usamos el endpoint /person existente y mapeamos a la estructura que espera el análisis
      const persons = await businessService.getPersons();

      const enriched = Array.isArray(persons)
        ? persons.map((p: any) => {
            const edad = p.edad ?? p.age ?? 0;
            return {
              id: p.id,
              person: p,
              age: edad,
              ageRange: getAgeRange(edad),
            };
          })
        : [];

      return enriched;
    } catch (error) {
      console.error("Error fetching citizens via persons endpoint:", error);
      throw error;
    }
  },

  // Get passengers by age range
  getPassengersByAgeRange: async (
    startDate?: string,
    endDate?: string,
    routeId?: number,
  ): Promise<AnalysisData> => {
    try {
      const citizens = await marketingAnalysisService.getCitizensWithAge();

      // Filter by date if provided (this would normally be done server-side)
      // For now, we'll use all passengers
      let filtered = citizens;

      // Filter by route if provided
      if (routeId) {
        // TODO: Filter by route once we have route information
        // For now, returning all
      }

      // Initialize age range buckets
      const byAgeRange: Record<AgeRange, PassengerByAgeRange> = {
        [AgeRange.MINORS]: {
          range: AgeRange.MINORS,
          label: "Menores (0-17)",
          count: 0,
          percentage: 0,
          passengers: [],
        },
        [AgeRange.YOUNG]: {
          range: AgeRange.YOUNG,
          label: "Jóvenes (18-25)",
          count: 0,
          percentage: 0,
          passengers: [],
        },
        [AgeRange.YOUNG_ADULTS]: {
          range: AgeRange.YOUNG_ADULTS,
          label: "Adultos jóvenes (26-40)",
          count: 0,
          percentage: 0,
          passengers: [],
        },
        [AgeRange.ADULTS]: {
          range: AgeRange.ADULTS,
          label: "Adultos (41-60)",
          count: 0,
          percentage: 0,
          passengers: [],
        },
        [AgeRange.SENIORS]: {
          range: AgeRange.SENIORS,
          label: "Adultos mayores (60+)",
          count: 0,
          percentage: 0,
          passengers: [],
        },
      };

      // Distribute passengers by age range
      filtered.forEach((citizen: any) => {
        const ageRange = citizen.ageRange;
        byAgeRange[ageRange].count++;
        byAgeRange[ageRange].passengers.push(citizen);
      });

      // Calculate percentages
      const total = filtered.length || 1;
      Object.values(byAgeRange).forEach((range) => {
        range.percentage = Math.round((range.count / total) * 100);
      });

      return {
        totalPassengers: filtered.length,
        dateRange: {
          startDate: startDate || new Date().toISOString(),
          endDate: endDate || new Date().toISOString(),
        },
        byAgeRange: Object.values(byAgeRange),
      };
    } catch (error) {
      console.error("Error analyzing passengers by age range:", error);
      throw error;
    }
  },

  // Get all routes for filtering
  getRoutes: async () => {
    try {
      const response = await analysisApi.get("/route");
      return response.data;
    } catch (error) {
      console.error("Error fetching routes:", error);
      throw error;
    }
  },

  // Get tickets/boarding records for temporal analysis
  getTickets: async (startDate?: string, endDate?: string) => {
    try {
      const response = await analysisApi.get("/ticket", {
        params: { startDate, endDate },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching tickets:", error);
      throw error;
    }
  },
};
