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
} from 'lucide-react';
import { RoutesExplorer } from '../components/RoutesExplorer';
import { StatsCard, MetricBadge, ActivityFeed, QuickActionButton, EmptyState } from '../components/DashboardComponents';

export const CiudadanoDashboard: React.FC = () => {
  const { user } = useAuth();
  const [showRoutes, setShowRoutes] = useState(false);
   const isCiudadano = user?.roles?.some(r => r.toUpperCase() === 'CIUDADANO') ?? false;
  
   const balance = '32.400 COP';
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

        {/* Featured Sections */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
           {/* Digital Card - Balance */}
           <div className="lg:col-span-4 bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-900 rounded-3xl shadow-2xl p-10 text-white relative overflow-hidden group">
              <div className="absolute -bottom-20 -right-20 bg-white/5 w-64 h-64 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-purple-400" />
              
              <div className="relative z-10 flex flex-col h-full justify-between">
                 <div className="flex justify-between items-start">
                    <div>
                       <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-2 opacity-70">Tarjeta Digital</p>
                       <h3 className="text-2xl font-black flex items-center gap-2">
                         Smart Bus Card 💳
                       </h3>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 group-hover:scale-110 transition-transform">
                       <CreditCard className="w-6 h-6 text-blue-300" />
                    </div>
                 </div>
                 
                 <div className="mt-12">
                    <p className="text-blue-100 text-sm font-semibold mb-2">Saldo Disponible</p>
                    <h2 className="text-5xl font-black mb-4">{balance}</h2>
                    <p className="text-blue-200 text-xs">Úsalo en cualquier parada de la ciudad</p>
                 </div>
                 
                 <div className="mt-12 flex gap-3">
                    <button className="flex-1 bg-white text-blue-900 font-bold py-3 rounded-xl hover:bg-blue-50 transition-all active:scale-95 shadow-lg hover:shadow-xl text-sm uppercase tracking-wide">Recargar</button>
                    <button className="bg-white/20 border border-white/30 p-3 rounded-xl hover:bg-white/30 transition-all group/btn">
                       <History className="w-6 h-6 text-white group-hover/btn:rotate-[-45deg] transition-transform" />
                    </button>
                 </div>
              </div>
           </div>

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

           {/* Nearby Stop Info */}
           <div className="lg:col-span-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-3xl p-8 h-full flex flex-col justify-between">
              <div>
                 <div className="bg-amber-100 w-fit p-3 rounded-xl mb-4">
                    <MapPin className="h-6 w-6 text-amber-700" />
                 </div>
                 <h3 className="text-2xl font-black text-gray-900 mb-2">Parada Cercana</h3>
                 <p className="text-amber-700 font-bold text-lg mb-4">{nearbyStop.name}</p>
                 <div className="flex items-center gap-2 text-amber-600 font-semibold">
                    <MapPin className="h-4 w-4" />
                    A {nearbyStop.distance} de ti
                 </div>
              </div>
              
              <div className="mt-6 space-y-3">
                 <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Buses Próximos</p>
                 {nearbyStop.busesIncomming.map((bus, idx) => (
                   <div key={idx} className="flex items-center justify-between bg-white p-4 rounded-xl border border-amber-100 hover:shadow-md transition">
                      <div>
                         <p className="font-bold text-gray-900">{bus.id}</p>
                         <p className="text-xs text-gray-500">{bus.route}</p>
                      </div>
                      <div className="flex items-center gap-2">
                         <Clock className="w-4 h-4 text-amber-600" />
                         <span className="font-bold text-amber-700">{bus.time}</span>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
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
              activities={[
                {
                  id: '1',
                  title: 'Centro - Uninorte',
                  description: 'Viaje completado • Bus #045',
                  timestamp: 'Hoy, 14:30',
                  icon: CheckCircle,
                  color: 'green',
                  actionLabel: 'Repetir ruta',
                },
                {
                  id: '2',
                  title: 'Kra 5 - Zona Rosa',
                  description: 'Viaje completado • Bus #028',
                  timestamp: 'Ayer, 09:15',
                  icon: CheckCircle,
                  color: 'green',
                },
                {
                  id: '3',
                  title: 'Terminal - Casa',
                  description: 'Viaje completado • Bus #056',
                  timestamp: 'Hace 2 días',
                  icon: CheckCircle,
                  color: 'green',
                },
              ]}
              emptyMessage="No hay viajes recientes"
           />
        </section>
        </>
        )}
      </main>
    </div>
  );
};
