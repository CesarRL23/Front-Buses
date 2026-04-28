import axios from 'axios';

const BUSINESS_API_BASE = import.meta.env.VITE_BUSINESS_API_URL || 'http://localhost:3000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const businessApi = axios.create({
  baseURL: BUSINESS_API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to automatically attach token
businessApi.interceptors.request.use((config) => {
  const headers = getAuthHeaders();
  if (headers.Authorization) {
    config.headers.Authorization = headers.Authorization;
  }
  return config;
}, (error) => Promise.reject(error));

export const businessService = {
  // ══════════════════════════════
  //  PERSONS
  // ══════════════════════════════
  getPersons: async () => {
    const response = await businessApi.get('/person');
    return response.data;
  },

  getPersonById: async (id: number) => {
    const response = await businessApi.get(`/person/${id}`);
    return response.data;
  },

  createPerson: async (data: any) => {
    const response = await businessApi.post('/person', data);
    return response.data;
  },

  updatePerson: async (id: number, data: any) => {
    const response = await businessApi.patch(`/person/${id}`, data);
    return response.data;
  },

  deletePerson: async (id: number) => {
    await businessApi.delete(`/person/${id}`);
  },

  // ══════════════════════════════
  //  CITIZENS
  // ══════════════════════════════
  getCitizens: async () => {
    const response = await businessApi.get('/citizen');
    return response.data;
  },

  createCitizen: async (data: any) => {
    const response = await businessApi.post('/citizen', data);
    return response.data;
  },

  // ══════════════════════════════
  //  DRIVERS
  // ══════════════════════════════
  getDrivers: async () => {
    const response = await businessApi.get('/driver');
    return response.data;
  },

  createDriver: async (data: any) => {
    const response = await businessApi.post('/driver', data);
    return response.data;
  },

  // ══════════════════════════════
  //  COMPANIES
  // ══════════════════════════════
  getCompanies: async () => {
    const response = await businessApi.get('/company');
    return response.data;
  },

  createCompany: async (data: any) => {
    const response = await businessApi.post('/company', data);
    return response.data;
  },

  updateCompany: async (id: number, data: any) => {
    const response = await businessApi.patch(`/company/${id}`, data);
    return response.data;
  },

  deleteCompany: async (id: number) => {
    await businessApi.delete(`/company/${id}`);
  },
  
  // Add more methods as needed for buses, routes, etc.
};
