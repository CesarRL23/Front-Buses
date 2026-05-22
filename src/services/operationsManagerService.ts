import axios from "axios";

const BUSINESS_API_BASE =
  import.meta.env.VITE_BUSINESS_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: BUSINESS_API_BASE,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface TrendMonth {
  mes: string;
  mecanico: number;
  accidente: number;
  retraso: number;
  pasajeros: number;
  otro: number;
}

export interface TrendTotals {
  mecanico: number;
  accidente: number;
  retraso: number;
  pasajeros: number;
  otro: number;
}

export interface IncidentTrendsResponse {
  period: number;
  months: string[];
  trends: TrendMonth[];
  totals: TrendTotals;
}

export interface CompanyOption {
  id: number;
  name: string;
}

export const operationsManagerService = {
  async getIncidentTrends(
    period: 3 | 6 | 12,
    companyId?: number,
  ): Promise<IncidentTrendsResponse> {
    const { data } = await api.get<IncidentTrendsResponse>(
      "/operations-manager/incident-trends",
      { params: { period, ...(companyId ? { companyId } : {}) } },
    );
    return data;
  },

  async getCompanies(): Promise<CompanyOption[]> {
    const { data } = await api.get<CompanyOption[]>("/operations-manager/companies");
    return data;
  },
};
