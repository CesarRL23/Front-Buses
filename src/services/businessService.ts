import axios from "axios";

const BUSINESS_API_BASE =
  import.meta.env.VITE_BUSINESS_API_URL || "http://localhost:3000";

const getAuthHeaders = () => {
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const businessApi = axios.create({
  baseURL: BUSINESS_API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

const normalizeRouteNodosResponse = (payload: any) => {
  if (Array.isArray(payload)) {
    return { route: null, nodos: payload };
  }

  const route = payload?.route ?? payload?.data?.route ?? null;
  const directNodos = Array.isArray(payload?.nodos) ? payload.nodos : null;
  const routeNodos = Array.isArray(route?.nodos) ? route.nodos : null;
  const alternateNodos = Array.isArray(payload?.routeNodos)
    ? payload.routeNodos
    : null;
  const nodos = directNodos || routeNodos || alternateNodos || [];

  return {
    ...payload,
    route,
    nodos,
  };
};

// Add interceptor to automatically attach token
businessApi.interceptors.request.use(
  (config) => {
    const headers = getAuthHeaders();
    if (headers.Authorization) {
      config.headers.Authorization = headers.Authorization;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export const businessService = {
  // ══════════════════════════════
  //  PERSONS
  // ══════════════════════════════
  getPersons: async (token?: string) => {
    const response = await businessApi.get("/person", {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return response.data;
  },

  getPersonById: async (id: number) => {
    const response = await businessApi.get(`/person/${id}`);
    return response.data;
  },

  createPerson: async (data: any, token?: string) => {
    const response = await businessApi.post("/person", data, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return response.data;
  },

  syncPerson: async (data: any, token?: string) => {
    const response = await businessApi.post("/person/sync", data, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return response.data;
  },

  findPersonByUserId: async (userId: string, token?: string) => {
    const persons = await businessService.getPersons(token);
    return Array.isArray(persons)
      ? persons.find((person: any) => String(person.userId) === String(userId))
      : null;
  },

  ensurePersonForUser: async (
    user: {
      id: string;
      name?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      roles?: string[];
    },
    token?: string,
  ) => {
    if (!user?.id) return null;
    const nombre =
      user.name ||
      `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
      user.email ||
      `Usuario ${user.id}`;
    return await businessService.syncPerson(
      { nombre, userId: String(user.id), roles: user.roles || [] },
      token,
    );
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
    const response = await businessApi.get("/citizen");
    return response.data;
  },

  createCitizen: async (data: any) => {
    const response = await businessApi.post("/citizen", data);
    return response.data;
  },

  getCitizenByPersonId: async (personId: number) => {
    const response = await businessApi.get(`/citizen/person/${personId}`);
    return response.data;
  },

  rechargePaymentMethod: async (paymentMethodId: number, amount: number) => {
    const response = await businessApi.post(`/payment-method/${paymentMethodId}/recharge`, { amount });
    return response.data;
  },

  // ══════════════════════════════
  //  DRIVERS
  // ══════════════════════════════
  getDrivers: async () => {
    const response = await businessApi.get("/driver");
    return response.data;
  },

  createDriver: async (data: any) => {
    const response = await businessApi.post("/driver", data);
    return response.data;
  },

  // ══════════════════════════════
  //  COMPANIES
  // ══════════════════════════════
  getCompanies: async () => {
    const response = await businessApi.get("/company");
    return response.data;
  },

  createCompany: async (data: any) => {
    const response = await businessApi.post("/company", data);
    return response.data;
  },

  updateCompany: async (id: number, data: any) => {
    const response = await businessApi.patch(`/company/${id}`, data);
    return response.data;
  },

  deleteCompany: async (id: number) => {
    await businessApi.delete(`/company/${id}`);
  },

  // ══════════════════════════════
  //  WHEREABOUTS / PARADEROS
  // ══════════════════════════════
  getWhereabouts: async () => {
    const response = await businessApi.get("/whereabouts");
    return response.data;
  },

  createWhereabout: async (data: any) => {
    const response = await businessApi.post("/whereabouts", data);
    return response.data;
  },

  updateWhereabout: async (id: number, data: any) => {
    const response = await businessApi.patch(`/whereabouts/${id}`, data);
    return response.data;
  },

  deleteWhereabout: async (id: number) => {
    await businessApi.delete(`/whereabouts/${id}`);
  },

  getRoutes: async (companyId?: number) => {
    const url = companyId ? `/route?companyId=${companyId}` : "/route";
    const response = await businessApi.get(url);
    return response.data;
  },

  getRouteById: async (id: number) => {
    const response = await businessApi.get(`/route/${id}`);
    return response.data;
  },

  getRouteNodos: async (routeId: number) => {
    const response = await businessApi.get(`/route/${routeId}/nodos`);
    return normalizeRouteNodosResponse(response.data);
  },

  createRoute: async (data: any) => {
    const response = await businessApi.post("/route", data);
    return response.data;
  },

  updateRoute: async (id: number, data: any) => {
    const response = await businessApi.patch(`/route/${id}`, data);
    return response.data;
  },

  deleteRoute: async (id: number) => {
    await businessApi.delete(`/route/${id}`);
  },

  // ══════════════════════════════
  //  NODOS
  // ══════════════════════════════
  getNodos: async () => {
    const response = await businessApi.get("/nodo");
    return response.data;
  },

  createNodo: async (data: any) => {
    const response = await businessApi.post("/nodo", data);
    return response.data;
  },

  updateNodo: async (id: number, data: any) => {
    const response = await businessApi.patch(`/nodo/${id}`, data);
    return response.data;
  },

  deleteNodo: async (id: number) => {
    await businessApi.delete(`/nodo/${id}`);
  },

  // ═════════════════════════════=
  //  COMPANY-ADMIN (assign admin user to a company)
  // ═════════════════════════════=
  getCompanyAdmins: async () => {
    const response = await businessApi.get("/company-admin");
    return response.data;
  },

  createCompanyAdmin: async (data: { personId: number; companyId: number }) => {
    const response = await businessApi.post("/company-admin", data);
    return response.data;
  },

  deleteCompanyAdmin: async (id: number) => {
    await businessApi.delete(`/company-admin/${id}`);
  },

  // ══════════════════════════════
  //  BUSES
  // ══════════════════════════════
  getBuses: async (companyId?: number) => {
    const url = companyId ? `/bus?companyId=${companyId}` : "/bus";
    const response = await businessApi.get(url);
    return response.data;
  },

  createBus: async (data: any) => {
    const response = await businessApi.post("/bus", data);
    return response.data;
  },

  updateBus: async (id: number, data: any) => {
    const response = await businessApi.patch(`/bus/${id}`, data);
    return response.data;
  },

  deleteBus: async (id: number) => {
    await businessApi.delete(`/bus/${id}`);
  },

  // ══════════════════════════════
  //  SCHEDULES / PROGRAMMING
  // ══════════════════════════════
  getSchedules: async (companyId?: number) => {
    const url = companyId ? `/programming?companyId=${companyId}` : "/programming";
    const response = await businessApi.get(url);
    return response.data;
  },

  createSchedule: async (data: any) => {
    const response = await businessApi.post("/programming", data);
    return response.data;
  },

  updateSchedule: async (id: number, data: any) => {
    const response = await businessApi.patch(`/programming/${id}`, data);
    return response.data;
  },

  deleteSchedule: async (id: number) => {
    await businessApi.delete(`/programming/${id}`);
  },

  // ══════════════════════════════
  //  SHIFTS
  // ══════════════════════════════
  getShifts: async () => {
    const response = await businessApi.get("/shift");
    return response.data;
  },

  startShift: async (id: number, data: { estado_bus: boolean; observaciones_bus?: string }) => {
    const response = await businessApi.patch(`/shift/${id}/start`, data);
    return response.data;
  },

  getTripDetails: async (ticketId: number) => {
    const response = await businessApi.get(`/ticket/${ticketId}/trip-details`);
    return response.data;
  },

  // ══════════════════════════════
  //  INCIDENTES
  // ══════════════════════════════
  getIncidents: async () => {
    const response = await businessApi.get('/incidente');
    return response.data;
  },

  getShiftIncidents: async (shiftId: number) => {
    const response = await businessApi.get(`/incidente/shift/${shiftId}`);
    return response.data;
  },

  getDriverIncidentHistory: async (driverId: number, limit: number = 10) => {
    const response = await businessApi.get(
      `/incidente/driver/${driverId}/history?limit=${limit}`,
    );
    return response.data;
  },

  /** HU-ENTR-2-008: Get all incidents for a bus with optional filters + statistics */
  getBusIncidents: async (busId: number, tipo?: string, estado?: string) => {
    const params = new URLSearchParams();
    if (tipo) params.append('tipo', tipo);
    if (estado) params.append('estado', estado);
    const qs = params.toString();
    const response = await businessApi.get(
      `/incidente/bus/${busId}${qs ? `?${qs}` : ''}`,
    );
    return response.data as {
      incidentes: any[];
      estadisticas: {
        total: number;
        porTipo: Record<string, number>;
        porEstado: Record<string, number>;
        tasaResolucion: number;
      };
    };
  },

  /** HU-ENTR-2-008: Change the status of an incident */
  changeIncidenteEstado: async (incidenteId: number, estado: string) => {
    const response = await businessApi.patch(`/incidente/${incidenteId}/estado`, { estado });
    return response.data;
  },

  /** HU-ENTR-2-008: Add a follow-up comment to an incident */
  addIncidenteComentario: async (incidenteId: number, autor: string, texto: string) => {
    const response = await businessApi.post(`/incidente/${incidenteId}/comentario`, { autor, texto });
    return response.data;
  },

  /** HU-ENTR-2-016: Get time evolution of incidents by type over the last year */
  getIncidentTrends: async (companyId?: number) => {
    const qs = companyId ? `?companyId=${companyId}` : '';
    const response = await businessApi.get(`/incidente/trends${qs}`);
    return response.data as Array<{
      mes: string;
      mecanico: number;
      accidente: number;
      retraso: number;
      pasajeros: number;
      otro: number;
    }>;
  },
};

