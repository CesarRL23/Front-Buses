import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';
import {
   Bus,
   MapPin,
   History,
   CreditCard,
   Heart,
   Star,
   Navigation,
   Search,
   Filter,
   Clock,
   Bell,
   TrendingUp,
   MessageCircle,
   Share2,
   AlertCircle,
   CheckCircle,
   Zap,
   ArrowRight,
   Loader2,
   Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RoutesExplorer } from '../components/RoutesExplorer';
import { NearestStops } from '../components/NearestStops';
import { RealTimeBusTracker } from '../components/RealTimeBusTracker';
import { StatsCard, MetricBadge, ActivityFeed, QuickActionButton, EmptyState } from '../components/DashboardComponents';
import { TripDetailsModal } from '../components/TripDetailsModal';
import { RechargeModal } from '../components/RechargeModal';
import { AssociatePaymentMethodModal } from '../components/AssociatePaymentMethodModal';
import { businessService } from '../services/businessService';
import { useEffect } from 'react';

const normalizeList = (payload: unknown): any[] => {
   if (Array.isArray(payload)) return payload;
   if (payload && typeof payload === 'object') {
      if (Array.isArray((payload as any).data)) return (payload as any).data;
      if (Array.isArray((payload as any).items)) return (payload as any).items;
      if (Array.isArray((payload as any).results)) return (payload as any).results;
      const nestedArrays = Object.values(payload as Record<string, unknown>).filter(Array.isArray);
      if (nestedArrays.length > 0) return nestedArrays[0] as any[];
   }
   return [];
};

const getRouteId = (programming: any): number | string | null => {
   const directRouteId = programming?.routeId ?? programming?.route_id ?? programming?.rutaId ?? programming?.ruta_id;
   const nestedRouteId = programming?.route?.id ?? programming?.ruta?.id ?? programming?.route?.routeId ?? programming?.ruta?.routeId;
   return directRouteId ?? nestedRouteId ?? null;
};

const getRouteName = (programming: any): string => {
   return programming?.route?.nombre || programming?.ruta?.nombre || programming?.routeName || programming?.rutaNombre || 'Ruta General';
};

export const CiudadanoDashboard: React.FC = () => {
   const { user } = useAuth();
   const navigate = useNavigate();
   const [showRoutes, setShowRoutes] = useState(false);
   const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
   const [isRechargeOpen, setIsRechargeOpen] = useState(false);
   const [isAssociateOpen, setIsAssociateOpen] = useState(false);
   const [personData, setPersonData] = useState<any>(null);
   const [citizenData, setCitizenData] = useState<any>(null);
   const [loading, setLoading] = useState(true);
   const [recentTrips, setRecentTrips] = useState<any[]>([]);

   // Estados del Simulador de Abordaje (HU-ENTR-2-003)
   const [programmings, setProgrammings] = useState<any[]>([]);
   const [nodes, setNodes] = useState<any[]>([]);
   const [routes, setRoutes] = useState<any[]>([]);
   const [shifts, setShifts] = useState<any[]>([]);
   const [selectedTrackerRouteId, setSelectedTrackerRouteId] = useState<string>('');
   const [selectedProg, setSelectedProg] = useState<string>('');
   const [selectedNode, setSelectedNode] = useState<string>('');
   const [descentNode, setDescentNode] = useState<string>('');
   const [boardingLoading, setBoardingLoading] = useState(false);
   const [boardingError, setBoardingError] = useState('');
   const [boardingSuccess, setBoardingSuccess] = useState<any>(null);
   const [activeTrip, setActiveTrip] = useState<any>(null);

   const isCiudadano = user?.roles?.some(r => r.toUpperCase() === 'CIUDADANO') ?? false;

   // Cargar datos del simulador (programaciones y nodos)
   useEffect(() => {
      if (isCiudadano) {
         const loadSimulationData = async () => {
            try {
               const [rawProgs, rawNodes, rawRoutes, rawShifts] = await Promise.all([
                  businessService.getSchedules(),
                  businessService.getNodos(),
                  businessService.getRoutes(),
                  businessService.getShifts(),
               ]);
               const normalizedProgrammings = normalizeList(rawProgs);
               const normalizedNodes = normalizeList(rawNodes);
               const normalizedRoutes = normalizeList(rawRoutes);
               setProgrammings(normalizedProgrammings);
               setNodes(normalizedNodes);
               setRoutes(normalizedRoutes);
               const normalizedShifts = normalizeList(rawShifts);
               setShifts(normalizedShifts);
            } catch (err) {
               console.error("Error loading simulation data:", err);
            }
         };
         loadSimulationData();
      }
   }, [isCiudadano]);

   const trackerRouteOptions = React.useMemo(() => {
      const routeList = routes.length > 0
         ? routes
         : Array.from(new Map(
               programmings
                  .map((programming) => {
                     const routeId = getRouteId(programming);
                     if (!routeId) return null;
                     return {
                        id: routeId,
                        nombre: getRouteName(programming),
                     };
                  })
                  .filter(Boolean)
                  .map((route) => [String(route?.id), route])
            ).values());

      return routeList;
   }, [routes, programmings]);

   useEffect(() => {
      if (trackerRouteOptions.length > 0) {
         const currentExists = trackerRouteOptions.some((route) => String(route.id) === selectedTrackerRouteId);
         if (!selectedTrackerRouteId || !currentExists) {
            setSelectedTrackerRouteId(String(trackerRouteOptions[0].id));
         }
      } else if (selectedTrackerRouteId) {
         setSelectedTrackerRouteId('');
      }
   }, [trackerRouteOptions, selectedTrackerRouteId]);

   // Cargar viaje activo guardado en localStorage
   useEffect(() => {
      if (user?.id) {
         const savedTrip = localStorage.getItem(`active_trip_${user.id}`);
         if (savedTrip) {
            try {
               setActiveTrip(JSON.parse(savedTrip));
            } catch (e) {
               console.error("Error parsing active trip:", e);
            }
         }
      }
   }, [user]);

   // Manejador de Abordaje (board)
   const handleBoarding = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedProg || !selectedNode) return;
      if (!citizenData) return;

      const citizenPaymentMethodId = citizenData.paymentMethods?.[0]?.id || 1;
      
      setBoardingLoading(true);
      setBoardingError('');
      setBoardingSuccess(null);

      try {
         const res = await businessService.board({
            programmingId: Number(selectedProg),
            citizenPaymentMethodId: Number(citizenPaymentMethodId),
            nodoId: Number(selectedNode)
         });

         setBoardingSuccess(res);
         
         const activeTripInfo = {
            ticketId: res.ticket.id,
            codigo: res.ticket.codigo,
            programming: programmings.find(p => p.id === Number(selectedProg)),
            boardingNode: nodes.find(n => n.id === Number(selectedNode)),
            timestamp: new Date().toISOString()
         };
         
         setActiveTrip(activeTripInfo);
         if (user?.id) {
            localStorage.setItem(`active_trip_${user.id}`, JSON.stringify(activeTripInfo));
            if (citizenData.id === 0) {
               localStorage.setItem(`sim_balance_${user.id}`, res.saldoRestante.toString());
            }
         }

         // Actualizar saldo de forma local e inmediata
         setCitizenData({
            ...citizenData,
            paymentMethods: citizenData.paymentMethods.map((pm: any, idx: number) => 
               idx === 0 ? { ...pm, paymentMethod: { ...pm.paymentMethod, saldo: res.saldoRestante } } : pm
            )
         });

      } catch (err: any) {
         setBoardingError(err?.response?.data?.message || 'Error al validar abordaje');
      } finally {
         setBoardingLoading(false);
      }
   };

   // Manejador de Descenso (alight)
   const handleAlight = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!activeTrip || !descentNode) return;

      setBoardingLoading(true);
      setBoardingError('');

      try {
         await businessService.alight({
            ticketId: activeTrip.ticketId,
            nodoId: Number(descentNode)
         });

         setActiveTrip(null);
         if (user?.id) {
            localStorage.removeItem(`active_trip_${user.id}`);
         }
         
         setBoardingSuccess({
            message: 'Viaje completado - Gracias por usar nuestro servicio'
         });

         // Recargar datos actualizados
         if (user?.id) {
            const person = await businessService.findPersonByUserId(user.id);
            if (person) {
               try {
                  const citizen = await businessService.getCitizenByPersonId(person.id);
                  setCitizenData(citizen);
               } catch (e) {
                  // Mantener datos simulados
               }
            }
         }

      } catch (err: any) {
         setBoardingError(err?.response?.data?.message || 'Error al registrar descenso');
      } finally {
         setBoardingLoading(false);
      }
   };

   const fetchCitizen = async () => {
      if (user?.id && isCiudadano) {
         try {
            const person = await businessService.findPersonByUserId(user.id);
            if (person) {
               setPersonData(person);
               try {
                  const citizen = await businessService.getCitizenByPersonId(person.id);
                  setCitizenData(citizen);

                  // Cargar viajes reales del ciudadano desde el backend
                  try {
                     const tickets = await businessService.getTickets();
                     if (Array.isArray(tickets)) {
                        const citizenPmIds = citizen.paymentMethods?.map((pm: any) => pm.id) || [];
                        const citizenTickets = tickets.filter((t: any) => 
                           t.citizenPaymentMethodId && citizenPmIds.includes(t.citizenPaymentMethodId)
                        );

                        const formattedTrips = citizenTickets.map((t: any) => {
                           const routeName = t.programming?.route?.nombre || 'Ruta sin nombre';
                           const busPlate = t.programming?.bus?.placa || 'Bus';
                           const date = t.FechaUso ? new Date(t.FechaUso) : new Date(t.fechaCompra);
                           
                           return {
                              id: String(t.id),
                              title: `${routeName}`,
                              description: `Viaje ${t.estado === 'ACTIVO' ? 'en progreso' : 'completado'} • Bus Placa ${busPlate}`,
                              timestamp: date.toLocaleString('es-CO', {
                                 day: '2-digit',
                                 month: '2-digit',
                                 year: 'numeric',
                                 hour: '2-digit',
                                 minute: '2-digit',
                                 hour12: true
                              }),
                              icon: CheckCircle,
                              color: t.estado === 'ACTIVO' ? 'blue' : 'green',
                              actionLabel: 'Ver Detalle',
                              onAction: () => setSelectedTripId(t.id)
                           };
                        });

                        formattedTrips.sort((a: any, b: any) => Number(b.id) - Number(a.id));
                        setRecentTrips(formattedTrips);
                     }
                  } catch (err) {
                     console.error("Error loading real tickets:", err);
                  }
               } catch (e) {
                  // Si no existe el ciudadano, lo dejamos inicializado con sus datos de persona pero sin tarjeta
                  setCitizenData({
                     id: 0,
                     person: person,
                     paymentMethods: []
                  });
                  setRecentTrips([]);
               }
            }
         } catch (error) {
            console.error("Error fetching citizen data:", error);
         } finally {
            setLoading(false);
         }
      }
   };

   useEffect(() => {
      fetchCitizen();

      // Verificar si venimos de una recarga exitosa de ePayco (URL callback con referencia)
      const params = new URLSearchParams(window.location.search);
      const refPayco = params.get('ref_payco');
      if (refPayco) {
         if (isCiudadano && user?.id) {
            const processRecharge = async () => {
               try {
                  const person = await businessService.findPersonByUserId(user.id);
                  if (person) {
                     try {
                        const citizen = await businessService.getCitizenByPersonId(person.id);
                        const paymentMethodId = citizen?.paymentMethods?.[0]?.paymentMethod?.id;
                        if (paymentMethodId && citizen.id !== 0) {
                           // Validar y registrar de forma REAL la transacción con el backend y ePayco
                           await businessService.confirmRecharge(refPayco);
                        } else {
                           // Fallback a saldo simulado si el ciudadano real no tiene método de pago asociado
                           const pendingAmount = localStorage.getItem('pending_recharge_amount');
                           if (pendingAmount) {
                              const currentSimBalance = Number(localStorage.getItem(`sim_balance_${user.id}`) || "0");
                              const newSimBalance = currentSimBalance + Number(pendingAmount);
                              localStorage.setItem(`sim_balance_${user.id}`, newSimBalance.toString());
                           }
                        }
                     } catch (e) {
                        // Fallback a saldo simulado si el ciudadano no existe en la base de datos de negocio
                        const pendingAmount = localStorage.getItem('pending_recharge_amount');
                        if (pendingAmount) {
                           const currentSimBalance = Number(localStorage.getItem(`sim_balance_${user.id}`) || "0");
                           const newSimBalance = currentSimBalance + Number(pendingAmount);
                           localStorage.setItem(`sim_balance_${user.id}`, newSimBalance.toString());
                        }
                     }
                  }
               } catch (err) {
                  console.error("Error processing real ePayco recharge:", err);
               } finally {
                  localStorage.removeItem('pending_recharge_amount');
                  // Limpiar la URL para evitar recargas dobles al refrescar
                  window.history.replaceState({}, document.title, window.location.pathname);
                  // Recargar los datos reales para actualizar la tarjeta digital al instante
                  fetchCitizen();
               }
            };
            processRecharge();
         } else {
            fetchCitizen();
         }
      } else if (params.get('success')) {
         fetchCitizen();
      }
   }, [user, isCiudadano]);

   const hasPaymentMethod = citizenData && citizenData.id !== 0 && citizenData.paymentMethods && citizenData.paymentMethods.length > 0;
   const activePaymentMethod = hasPaymentMethod ? citizenData.paymentMethods[0] : null;
   const trackedProgrammings = React.useMemo(() => {
      // Solo programaciones activas y cuyo bus tenga un turno EN CURSO
      const activeBusIds = new Set(shifts.filter((s: any) => String(s.estado).toUpperCase() === 'EN CURSO').map((s: any) => Number(s.bus?.id)));
      return programmings.filter((programming) => {
         const routeId = getRouteId(programming);
         const busId = programming?.bus?.id || programming?.busId || programming?.bus_id;
         return programming.activo !== false && String(routeId || '') === String(selectedTrackerRouteId) && activeBusIds.has(Number(busId));
      });
   }, [programmings, shifts, selectedTrackerRouteId]);

   const balance = activePaymentMethod?.paymentMethod?.saldo !== undefined
      ? `$ ${Number(activePaymentMethod.paymentMethod.saldo).toLocaleString()} COP`
      : loading 
         ? 'Cargando...' 
         : '$ 0 COP';

   const getCardTheme = (prov?: string) => {
      switch (prov) {
         case 'SMART_CARD':
            return {
               gradient: 'from-blue-900 via-indigo-800 to-purple-900',
               label: 'Smart Bus Card',
               sub: 'Tarjeta de Transporte',
               logoColor: 'text-blue-300'
            };
         case 'VISA':
            return {
               gradient: 'from-slate-900 via-blue-950 to-blue-900',
               label: 'Visa Platinum',
               sub: 'Método de Pago Asociado',
               logoColor: 'text-yellow-400'
            };
         case 'MASTERCARD':
            return {
               gradient: 'from-neutral-900 via-orange-950 to-red-950',
               label: 'Mastercard Gold',
               sub: 'Método de Pago Asociado',
               logoColor: 'text-orange-500'
            };
         case 'NEQUI':
            return {
               gradient: 'from-[#8233ff] via-[#4d0df2] to-[#2000b0]',
               label: 'Nequi',
               sub: 'Monedero Digital',
               logoColor: 'text-pink-400'
            };
         case 'DAVIPLATA':
            return {
               gradient: 'from-red-600 via-red-700 to-rose-900',
               label: 'Daviplata',
               sub: 'Monedero Digital',
               logoColor: 'text-white'
            };
         default:
            return {
               gradient: 'from-blue-900 via-indigo-800 to-purple-900',
               label: 'Smart Bus Card',
               sub: 'Tarjeta de Transporte',
               logoColor: 'text-blue-300'
            };
      }
   };
   const favorites = [
      { id: 1, name: 'Casa - Trabajo', route: 'Ruta 02', next: '10 min', color: 'bg-blue-500' },
      { id: 2, name: 'Gimnasio', route: 'Ruta 15', next: '15 min', color: 'bg-green-500' },
      { id: 3, name: 'Universidad Norte', route: 'Ruta 08', next: '22 min', color: 'bg-purple-500' },
   ];

   const nearbyStop = {
      name: 'Cll 72 - Kra 46',
      distance: '200m',
      busesIncomming: [
         { id: 'B-045', route: 'Ruta 02', time: '5 min' },
         { id: 'B-082', route: 'Ruta 15', time: '12 min' }
      ]
   };

   if (!isCiudadano) {
      return (
         <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="flex flex-col items-center justify-center h-[80vh] text-center px-4">
               <div className="bg-blue-100 rounded-full p-6 mb-6">
                  <Bus className="h-16 w-16 text-blue-600" />
               </div>
               <h1 className="text-3xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
               <p className="text-gray-600 max-w-md">
                  Solo los usuarios con rol <span className="font-semibold text-blue-600">CIUDADANO</span> pueden acceder a este panel.
               </p>
            </div>
         </div>
      );
   }

   return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
         <Navbar />

         <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-12">
            {showRoutes ? (
               <RoutesExplorer onClose={() => setShowRoutes(false)} />
            ) : (
               <>
                  {/* Header with Greeting & Quick Actions */}
                  <section className="relative overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 opacity-10 rounded-3xl"></div>
                     <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl border border-blue-100">
                        <div>
                           <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                              ¡Hola, {user?.firstName}! 👋
                           </h1>
                           <p className="text-gray-600 text-lg mt-2">Tu transporte inteligente al alcance de tu mano</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                           <QuickActionButton icon={Navigation} label="Planear Viaje" variant="primary" />
                           <QuickActionButton icon={MapPin} label="Explorar Rutas" variant="secondary" onClick={() => setShowRoutes(true)} />
                        </div>
                     </div>
                  </section>

                  {/* Search & Filter Section */}
                  <section className="flex flex-col sm:flex-row gap-4">
                     <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                           type="text"
                           placeholder="Busca una ruta, parada o destino..."
                           className="w-full pl-12 pr-4 py-4 rounded-xl bg-white border border-gray-200 shadow-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all placeholder:text-gray-400 font-medium"
                        />
                     </div>
                     <button className="flex items-center justify-center gap-2 px-6 py-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition font-semibold text-gray-700 shadow-sm">
                        <Filter className="w-5 h-5" />
                        Filtros
                     </button>
                  </section>

                  {/* Seguimiento de buses en tiempo real */}
                  <section className="space-y-4">
                     <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                           <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Seguimiento de ruta</p>
                           <h2 className="text-2xl font-black text-gray-900">Localiza buses en tiempo real</h2>
                           <p className="text-gray-500 text-sm mt-1">Selecciona la ruta y revisa la ubicación de los buses activos, el paradero más cercano y el tiempo estimado de llegada.</p>
                        </div>
                        <div className="w-full lg:w-80">
                           <label className="text-sm font-bold text-gray-700 block mb-2">Ruta a seguir</label>
                           <select
                              value={selectedTrackerRouteId}
                              onChange={(e) => setSelectedTrackerRouteId(e.target.value)}
                              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-800 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all"
                           >
                              <option value="">Selecciona una ruta</option>
                              {trackerRouteOptions.map((route) => (
                                 <option key={String(route.id)} value={String(route.id)}>{route.nombre}</option>
                              ))}
                           </select>
                        </div>
                     </div>

                     {selectedTrackerRouteId ? (
                        <RealTimeBusTracker
                           routeId={selectedTrackerRouteId}
                           activeProgrammings={trackedProgrammings}
                        />
                     ) : (
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
                           Selecciona una ruta para ver el seguimiento en tiempo real de sus buses activos.
                        </div>
                     )}
                  </section>

                  {/* Featured Sections */}
                  <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                     {/* Digital Card - Balance */}
                      {/* Digital Card - Balance */}
                      {hasPaymentMethod ? (
                         (() => {
                            const theme = getCardTheme(activePaymentMethod?.paymentMethod?.provider);
                            const rawAcc = activePaymentMethod?.paymentMethod?.accountNumber || '';
                            const formattedAcc = rawAcc.match(/.{1,4}/g)?.join(' ') || rawAcc;
                            return (
                               <div className={`lg:col-span-4 bg-gradient-to-br ${theme.gradient} rounded-3xl shadow-2xl p-10 text-white relative overflow-hidden flex flex-col justify-between group border border-white/5`}>
                                  <div className="absolute -bottom-20 -right-20 bg-white/5 w-64 h-64 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000 animate-pulse pointer-events-none" />
                                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400" />

                                  <div className="relative z-10 flex flex-col h-full justify-between">
                                     <div className="flex justify-between items-start">
                                        <div>
                                           <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1 opacity-70">{theme.sub}</p>
                                           <h3 className="text-2xl font-black tracking-tight">
                                              {theme.label}
                                           </h3>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 group-hover:scale-110 transition-transform">
                                           <CreditCard className="w-6 h-6 text-blue-300" />
                                        </div>
                                     </div>

                                     <div className="mt-8">
                                        <p className="text-blue-100/70 text-xs font-mono mb-2 tracking-widest bg-black/10 w-fit px-2 py-0.5 rounded">
                                           Nº {formattedAcc}
                                        </p>
                                        <p className="text-blue-100 text-sm font-semibold mb-1">Saldo Disponible</p>
                                        <h2 className="text-5xl font-black tracking-tight">{balance}</h2>
                                     </div>

                                     <div className="mt-8 flex gap-3">
                                        <button 
                                           onClick={() => setIsRechargeOpen(true)}
                                           className="flex-1 bg-white text-blue-900 font-bold py-3.5 rounded-xl hover:bg-blue-50 transition-all active:scale-95 shadow-lg hover:shadow-xl text-xs uppercase tracking-wider"
                                        >
                                           Recargar
                                        </button>
                                        <button 
                                           onClick={() => setIsAssociateOpen(true)}
                                           className="bg-white/10 border border-white/20 px-4 rounded-xl hover:bg-white/20 transition-all flex items-center justify-center gap-1.5 text-xs font-bold text-white group/btn"
                                           title="Vincular otro método"
                                        >
                                           <Sparkles className="w-4 h-4 text-yellow-300" /> Vincular
                                        </button>
                                     </div>
                                  </div>
                               </div>
                            );
                         })()
                      ) : (
                         /* Unassociated Card Box */
                         <div className="lg:col-span-4 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 rounded-3xl shadow-2xl p-10 text-white relative overflow-hidden flex flex-col justify-between group border border-indigo-500/20">
                            <div className="absolute -bottom-20 -right-20 bg-indigo-500/10 w-64 h-64 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000 pointer-events-none" />
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

                            <div className="relative z-10 flex flex-col h-full justify-between">
                               <div className="flex justify-between items-start">
                                  <div>
                                     <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1 opacity-70">Tarjeta Digital</p>
                                     <h3 className="text-2xl font-black flex items-center gap-2">
                                        Sin Tarjeta 💳
                                     </h3>
                                  </div>
                                  <div className="bg-white/5 backdrop-blur-md p-3 rounded-xl border border-white/10">
                                     <CreditCard className="w-6 h-6 text-indigo-300/50" />
                                  </div>
                               </div>

                               <div className="mt-8">
                                  <p className="text-xs font-bold text-indigo-300 uppercase tracking-wide mb-1">Estado de Cuenta</p>
                                  <h2 className="text-xl font-black mb-3 text-slate-200">No tienes una tarjeta o cuenta vinculada</h2>
                                  <p className="text-slate-400 text-xs leading-relaxed">
                                     Para recargar saldo real, simular viajes y generar boletos en tiempo real, vincula tu tarjeta de transporte o billetera digital.
                                  </p>
                               </div>

                               <div className="mt-8">
                                  <button 
                                     onClick={() => setIsAssociateOpen(true)}
                                     className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-4 rounded-xl shadow-lg shadow-indigo-950/20 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-xs"
                                  >
                                     <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                                     Vincular Tarjeta
                                  </button>
                               </div>
                            </div>
                         </div>
                      )}

                     {/* Favorites Section */}
                     <div className="lg:col-span-4 bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col space-y-6">
                        <div className="flex justify-between items-end">
                           <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                              <Heart className="w-7 h-7 text-pink-500 fill-pink-500" />
                              Favoritos
                           </h2>
                           <button className="text-blue-600 hover:text-blue-700 font-bold text-sm hover:underline">Gestionar</button>
                        </div>

                        <div className="space-y-3 flex-1">
                           {favorites.map((fav) => (
                              <div key={fav.id} className="group p-4 rounded-2xl bg-gray-50 border border-transparent hover:bg-white hover:border-gray-100 hover:shadow-md transition-all duration-300 cursor-pointer">
                                 <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                       <div className={`${fav.color} p-3 rounded-lg text-white shadow-md`}>
                                          <Bus className="w-5 h-5" />
                                       </div>
                                       <div>
                                          <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors text-sm">{fav.name}</h4>
                                          <p className="text-xs font-medium text-gray-500">{fav.route}</p>
                                       </div>
                                    </div>
                                    <div className="text-right">
                                       <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-1">Llega en</p>
                                       <p className="text-lg font-black text-blue-600">{fav.next}</p>
                                    </div>
                                 </div>
                              </div>
                           ))}

                           <button className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-all flex items-center justify-center gap-2 font-bold text-sm">
                              <Star className="w-4 h-4" /> Agregar Destino
                           </button>
                        </div>
                     </div>

                     {/* Mensajes / Chat Access */}
                     <div className="lg:col-span-4 bg-gradient-to-br from-indigo-600 via-blue-700 to-blue-800 rounded-3xl p-8 h-full flex flex-col justify-between text-white relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/10 rounded-full blur-2xl pointer-events-none" />

                        <div className="relative z-10">
                           <div className="bg-white/15 backdrop-blur-md w-fit p-3 rounded-xl mb-5 border border-white/20">
                              <MessageCircle className="h-6 w-6 text-white" />
                           </div>
                           <h3 className="text-2xl font-black mb-2">Mensajes</h3>
                           <p className="text-blue-100/80 text-sm leading-relaxed mb-6">
                              Chatea con otros usuarios y participa en grupos de tu comunidad de transporte.
                           </p>

                           <div className="space-y-2 mb-6">
                              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                                 <div className="w-8 h-8 bg-indigo-400 rounded-full flex items-center justify-center text-xs font-black">JD</div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold truncate">Juan Díaz</p>
                                    <p className="text-xs text-blue-200 truncate">¿A qué hora pasa la ruta 02?</p>
                                 </div>
                                 <span className="bg-blue-400 text-white text-xs font-black rounded-full w-5 h-5 flex items-center justify-center">2</span>
                              </div>
                              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                                 <div className="w-8 h-8 bg-purple-400 rounded-full flex items-center justify-center text-xs font-black">🚌</div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold truncate">Grupo Ruta 15</p>
                                    <p className="text-xs text-blue-200 truncate">Bus demorado 10 min en Cll 80</p>
                                 </div>
                                 <span className="bg-pink-400 text-white text-xs font-black rounded-full w-5 h-5 flex items-center justify-center">5</span>
                              </div>
                           </div>
                        </div>

                        <button
                           type="button"
                           onClick={() => navigate('/mensajes')}
                           className="relative z-10 w-full bg-white text-blue-700 font-black py-3.5 rounded-xl hover:bg-blue-50 transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 text-sm"
                        >
                           <MessageCircle className="w-4 h-4" />
                           Abrir Mensajes
                        </button>
                     </div>
                  </section>

                  {/* Boarding & Ticket Generation Simulator (HU-ENTR-2-003) */}
                  <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
                     
                     <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-gray-100 pb-4">
                        <div>
                           <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                              <Navigation className="h-7 w-7 text-blue-600 animate-pulse" />
                              Simulador de Viaje y Boletería (HU-ENTR-2-003)
                           </h2>
                           <p className="text-gray-500 text-sm mt-1">Valida tu método de pago para abordar el bus y generar tu boleto en tiempo real.</p>
                        </div>
                        {activeTrip && (
                           <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full text-xs font-bold text-blue-700 uppercase tracking-wide">
                              <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                              Viaje Activo
                           </div>
                        )}
                     </div>

                     {boardingError && (
                        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                           <AlertCircle className="h-5 w-5 text-red-500" />
                           <p className="text-red-700 font-semibold">{boardingError}</p>
                        </div>
                     )}

                     {boardingSuccess && !activeTrip && (
                        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-r-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                           <CheckCircle className="h-5 w-5 text-green-500" />
                           <div>
                              <p className="text-green-800 font-bold">{boardingSuccess.message}</p>
                              {boardingSuccess.saldoRestante !== undefined && (
                                 <p className="text-green-700 text-sm font-medium">Saldo restante: ${Number(boardingSuccess.saldoRestante).toLocaleString()} COP</p>
                              )}
                           </div>
                        </div>
                     )}

                     {!activeTrip ? (
                        hasPaymentMethod ? (
                           /* Boarding Form */
                           <form onSubmit={handleBoarding} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end animate-in fade-in duration-300">
                              <div className="md:col-span-5 space-y-2">
                                 <label className="text-sm font-bold text-gray-700 block">1. Selecciona el Bus en Progreso</label>
                                 <select 
                                    required
                                    value={selectedProg}
                                    onChange={(e) => setSelectedProg(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium text-gray-800 shadow-inner"
                                 >
                                    <option value="">-- Seleccionar Bus y Ruta --</option>
                                    {programmings.map((p) => (
                                       <option key={p.id} value={p.id}>
                                          {p.bus?.placa || 'N/A'} - {p.route?.nombre || 'Ruta General'} (Programación #{p.id})
                                       </option>
                                    ))}
                                 </select>
                              </div>

                              <div className="md:col-span-5 space-y-2">
                                 <label className="text-sm font-bold text-gray-700 block">2. Paradero de Abordaje</label>
                                 <select 
                                    required
                                    value={selectedNode}
                                    onChange={(e) => setSelectedNode(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium text-gray-800 shadow-inner"
                                 >
                                    <option value="">-- Seleccionar Parada --</option>
                                    {nodes.map((n) => (
                                       <option key={n.id} value={n.id}>
                                          {n.stop?.nombre || `Parada #${n.id}`} ({n.stop?.direccion || 'Sin dirección'})
                                       </option>
                                    ))}
                                 </select>
                              </div>

                              <div className="md:col-span-2">
                                 <button
                                    type="submit"
                                    disabled={boardingLoading}
                                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-200 hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-xs"
                                 >
                                    {boardingLoading ? (
                                       <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                       <Zap className="h-4 w-4 fill-current text-yellow-300" />
                                    )}
                                    Abordar Bus
                                 </button>
                              </div>
                           </form>
                        ) : (
                           /* Boarding Disabled Callout */
                           <div className="flex flex-col items-center justify-center py-8 px-4 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 animate-in fade-in duration-300 w-full">
                              <div className="bg-amber-100 rounded-full p-4 mb-4 text-amber-600 shadow-inner">
                                 <AlertCircle className="w-8 h-8" />
                              </div>
                              <h3 className="text-lg font-bold text-gray-900 mb-1">Simulación de Abordaje Desactivada</h3>
                              <p className="text-gray-500 text-sm max-w-md mb-6 leading-relaxed">
                                 No tienes ningún método de pago o tarjeta de transporte vinculada a tu cuenta. Vincula una tarjeta en el panel de arriba para poder generar boletos y abordar buses.
                              </p>
                              <button
                                 onClick={() => setIsAssociateOpen(true)}
                                 className="bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 text-xs uppercase tracking-wider flex items-center gap-2"
                              >
                                 <Sparkles className="w-4 h-4 text-yellow-300" /> Vincular Tarjeta Ahora
                              </button>
                           </div>
                        )
                     ) : (
                        /* Alighting Form (Active Trip Progress) */
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-md border border-slate-700 animate-in fade-in zoom-in-95">
                           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                              
                              <div className="lg:col-span-6 space-y-4">
                                 <div className="flex items-center gap-3">
                                    <div className="bg-blue-600 p-3 rounded-xl">
                                       <Bus className="h-6 w-6 text-white animate-bounce" />
                                    </div>
                                    <div>
                                       <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Viaje en progreso</p>
                                       <h3 className="text-xl font-black text-white">Boleto #{activeTrip.codigo}</h3>
                                    </div>
                                 </div>
                                 
                                 <div className="grid grid-cols-2 gap-4 text-sm pt-2">
                                    <div>
                                       <p className="text-slate-400 text-xs font-semibold">Bus Asignado</p>
                                       <p className="font-bold text-slate-200">{activeTrip.programming?.bus?.placa || 'N/A'}</p>
                                    </div>
                                    <div>
                                       <p className="text-slate-400 text-xs font-semibold">Ruta</p>
                                       <p className="font-bold text-slate-200">{activeTrip.programming?.route?.nombre || 'Ruta Activa'}</p>
                                    </div>
                                    <div>
                                       <p className="text-slate-400 text-xs font-semibold">Abordado en</p>
                                       <p className="font-bold text-slate-200">{activeTrip.boardingNode?.stop?.nombre || 'Paradero inicial'}</p>
                                    </div>
                                    <div>
                                       <p className="text-slate-400 text-xs font-semibold">Hora de Abordaje</p>
                                       <p className="font-bold text-slate-200">{new Date(activeTrip.timestamp).toLocaleTimeString()}</p>
                                    </div>
                                 </div>
                              </div>

                              <div className="lg:col-span-1 hidden lg:flex justify-center">
                                 <ArrowRight className="h-8 w-8 text-slate-600 animate-pulse" />
                              </div>

                              <form onSubmit={handleAlight} className="lg:col-span-5 space-y-4">
                                 <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-300 block">Registrar Descenso (Alight)</label>
                                    <select 
                                       required
                                       value={descentNode}
                                       onChange={(e) => setDescentNode(e.target.value)}
                                       className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3.5 text-sm focus:ring-4 focus:ring-blue-900/30 focus:border-blue-500 outline-none transition-all font-medium text-slate-200"
                                    >
                                       <option value="">-- Seleccionar Paradero de Descenso --</option>
                                       {nodes.map((n) => (
                                          <option key={n.id} value={n.id}>
                                             {n.stop?.nombre || `Parada #${n.id}`} ({n.stop?.direccion || 'Sin dirección'})
                                          </option>
                                       ))}
                                    </select>
                                 </div>
                                 
                                 <button
                                    type="submit"
                                    disabled={boardingLoading}
                                    className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-black py-4 rounded-xl shadow-lg shadow-green-950 hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-xs"
                                 >
                                    {boardingLoading ? (
                                       <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                       <CheckCircle className="h-4 w-4" />
                                    )}
                                    Bajar del Bus
                                 </button>
                              </form>
                           </div>
                        </div>
                     )}
                  </section>

                  {/* Promotions & Tips Section */}
                  <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {/* Daily Tip Card */}
                     <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-lg overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                        <div className="relative z-10">
                           <div className="flex items-center gap-2 mb-4">
                              <Zap className="w-5 h-5 text-yellow-300" />
                              <span className="text-xs font-black uppercase tracking-wider text-blue-100">Consejo del Día</span>
                           </div>
                           <h3 className="text-2xl font-black mb-3">Activa notificaciones en tus rutas favoritas</h3>
                           <p className="text-blue-100 text-sm leading-relaxed mb-6">
                              Recibe alertas instantáneas sobre retrasos, desvíos o cambios en el horario de tus rutas frecuentes.
                           </p>
                           <button className="bg-white text-blue-600 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition-all flex items-center gap-2 text-sm">
                              <Bell className="w-4 h-4" />
                              Activar Notificaciones
                           </button>
                        </div>
                     </div>

                     {/* Referral Card */}
                     <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-lg overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                        <div className="relative z-10">
                           <div className="flex items-center gap-2 mb-4">
                              <Heart className="w-5 h-5 text-pink-200" />
                              <span className="text-xs font-black uppercase tracking-wider text-pink-100">Referidos</span>
                           </div>
                           <h3 className="text-2xl font-black mb-3">Invita amigos y gana créditos</h3>
                           <p className="text-pink-100 text-sm leading-relaxed mb-6">
                              Obtén 2 viajes gratis por cada amigo que se registre usando tu código de referencia.
                           </p>
                           <button className="bg-white text-purple-600 font-bold px-6 py-3 rounded-xl hover:bg-pink-50 transition-all flex items-center gap-2 text-sm">
                              <Share2 className="w-4 h-4" />
                              Compartir Código
                           </button>
                        </div>
                     </div>
                  </section>

                  {/* Nearest Stops Section - HU-ENTR-2-002 */}
                  <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                     <NearestStops
                        maxStops={5}
                        onStopSelect={(stop) => {
                           console.log('Stop selected:', stop);
                           // Aquí puedes implementar acciones cuando se selecciona un paradero
                           // Por ejemplo, mostrar rutas disponibles, reservar asiento, etc.
                        }}
                     />
                  </section>

                  {/* Recent Trips Section */}
                  <section>
                     <div className="mb-6">
                        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                           <History className="h-6 w-6 text-gray-600" />
                           Viajes Recientes
                        </h2>
                     </div>
                     <ActivityFeed
                        title=""
                        activities={recentTrips}
                        emptyMessage="No tienes viajes registrados recientemente"
                     />

                     {/* Modal de Detalles del Viaje */}
                     {selectedTripId && (
                        <TripDetailsModal
                           ticketId={selectedTripId}
                           onClose={() => setSelectedTripId(null)}
                        />
                     )}

                     {/* Modal de Recarga */}
                     {citizenData && (
                        <RechargeModal
                           isOpen={isRechargeOpen}
                           onClose={() => setIsRechargeOpen(false)}
                           citizen={citizenData}
                           onSuccess={(newBalance) => {
                              if (citizenData.id === 0 && user?.id) {
                                 localStorage.setItem(`sim_balance_${user.id}`, newBalance.toString());
                              }
                              setCitizenData({
                                 ...citizenData,
                                 paymentMethods: citizenData.paymentMethods.map((pm: any, idx: number) => 
                                    idx === 0 ? { ...pm, paymentMethod: { ...pm.paymentMethod, saldo: newBalance } } : pm
                                 )
                              });
                           }}
                        />
                     )}

                     {/* Modal de Vinculación de Método de Pago */}
                     <AssociatePaymentMethodModal
                        isOpen={isAssociateOpen}
                        onClose={() => setIsAssociateOpen(false)}
                        person={personData}
                        citizen={citizenData}
                        onSuccess={() => {
                           fetchCitizen();
                        }}
                     />
                  </section>
               </>
            )}
         </main>
      </div>
   );
};
