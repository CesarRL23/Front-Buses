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

export interface MonthlyData {
  month: string;
  total: number;
}

export interface PaymentMethodData {
  type: string;
  monthlyData: MonthlyData[];
  periodTotal: number;
}

export interface IncomeByPaymentResponse {
  period: number;
  months: string[];
  paymentMethods: PaymentMethodData[];
  grandTotal: number;
}

export const financialAdministratorService = {
  async getIncomeByPaymentMethod(period: 3 | 6 | 12): Promise<IncomeByPaymentResponse> {
    const { data } = await api.get<IncomeByPaymentResponse>(
      `/financial-administrator/income-by-payment-method`,
      { params: { period } },
    );
    return data;
  },
};
