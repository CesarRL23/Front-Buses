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
  Share2
} from 'lucide-react';
import { RoutesExplorer } from '../components/RoutesExplorer';

export const CiudadanoDashboard: React.FC = () => {
  const { user } = useAuth();
  const [showRoutes, setShowRoutes] = useState(false);
  
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {showRoutes ? (
          <RoutesExplorer onClose={() => setShowRoutes(false)} />
        ) : (
        <>
        {/* Header with Search and Quick Info */}
        <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
           <div className="space-y-2">
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                Hola, {user?.firstName} 👋
              </h1>
              <p className="text-gray-500 text-lg">¿A dónde vamos hoy con el sistema de transporte inteligente?</p>
           </div>
           
           <div className="w-full md:w-auto flex flex-col sm:flex-row gap-4">
              <div className="flex-1 min-w-[320px] relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                 <input 
                   type="text" 
                   placeholder="Busca una ruta, parada o destino..." 
                   className="w-full pl-12 pr-4 py-4 rounded-3xl bg-white border border-gray-200 shadow-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all placeholder:text-gray-400 font-medium"
                 />
              </div>
              <button className="bg-blue-600 text-white font-bold px-8 py-4 rounded-3xl shadow-lg hover:bg-blue-700 hover:shadow-blue-200 hover:scale-105 transition-all flex items-center justify-center gap-2">
                 <Navigation className="w-5 h-5" />
                 Planear Viaje
              </button>
               <button onClick={() => setShowRoutes(true)} className="bg-white text-blue-600 border-2 border-blue-600 font-bold px-8 py-4 rounded-3xl shadow-sm hover:bg-blue-50 hover:scale-105 transition-all flex items-center justify-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Explorar Rutas
               </button>
           </div>
        </section>

        {/* Featured Section (Cards) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           {/* Card Balance */}
           <div className="lg:col-span-4 bg-gradient-to-tr from-indigo-900 via-blue-900 to-blue-800 rounded-[2.5rem] shadow-2xl p-10 text-white relative overflow-hidden group">
              <div className="absolute -bottom-10 -right-10 bg-white/5 w-64 h-64 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
              <div className="relative z-10 flex flex-col h-full justify-between">
                 <div className="flex justify-between items-start">
                    <div>
                       <p className="text-blue-100 text-xs font-black uppercase tracking-widest mb-1 opacity-70">Mi Tarjeta Digital</p>
                       <h3 className="text-xl font-bold flex items-center gap-2">
                         Smart Bus Card <CreditCard className="w-5 h-5 opacity-50" />
                       </h3>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20">
                       <TrendingUp className="w-6 h-6 text-green-400" />
                    </div>
                 </div>
                 
                 <div className="mt-16">
                    <p className="text-blue-100 text-sm font-medium mb-1">Saldo Disponible</p>
                    <h2 className="text-5xl font-black">{balance}</h2>
                 </div>
                 
                 <div className="mt-12 flex gap-4">
                    <button className="flex-1 bg-white text-blue-900 font-bold py-4 rounded-2xl hover:bg-blue-50 transition-all active:scale-95 shadow-lg">Recargar ahora</button>
                    <button className="bg-black/20 border border-white/10 p-4 rounded-2xl hover:bg-black/30 transition-all group">
                       <History className="w-6 h-6 text-white group-hover:rotate-[-45deg] transition-transform" />
                    </button>
                 </div>
              </div>
           </div>

           {/* Favorites Section */}
           <div className="lg:col-span-5 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-10 flex flex-col space-y-8">
              <div className="flex justify-between items-end">
                 <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                   <Heart className="w-8 h-8 text-pink-500 fill-pink-500/10" />
                   Favoritos
                 </h2>
                 <button className="text-blue-600 font-bold text-sm hover:underline">Gestionar</button>
              </div>
              
              <div className="space-y-4 flex-1">
                 {favorites.map((fav) => (
                   <div key={fav.id} className="group p-5 rounded-3xl bg-gray-50 border border-transparent hover:bg-white hover:border-gray-100 hover:shadow-xl transition-all duration-300 flex items-center justify-between">
                      <div className="flex items-center gap-5">
                         <div className={`${fav.color} p-4 rounded-2xl text-white shadow-lg`}>
                            <Bus className="w-6 h-6" />
                         </div>
                         <div>
                            <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{fav.name}</h4>
                            <p className="text-sm font-medium text-gray-400">{fav.route}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-xs font-black uppercase text-gray-400 tracking-widest mb-1">Llega en</p>
                         <p className="text-lg font-black text-blue-600">{fav.next}</p>
                      </div>
                   </div>
                 ))}
                 
                 <button className="w-full py-4 border-2 border-dashed border-gray-200 rounded-3xl text-gray-400 font-bold hover:border-blue-400 hover:text-blue-500 transition-all flex items-center justify-center gap-2">
                    <Star className="w-5 h-5" /> Agregar Destino Frecuente
                 </button>
              </div>
           </div>

           {/* Nearby Stop Infobox */}
           <div className="lg:col-span-3">
              <div className="bg-orange-50 border border-orange-100 rounded-[2.5rem] p-8 h-full flex flex-col">
                 <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                       <span className="bg-orange-200 text-orange-900 text-[10px] font-black px-2 py-1 rounded-lg uppercase">Parada Cercana</span>
                       <Clock className="w-4 h-4 text-orange-400" />
                    </div>
                    <h2 className="text-2xl font-black text-orange-900">{nearbyStop.name}</h2>
                    <p className="text-orange-700 font-bold mt-1 inline-flex items-center gap-1">
                       <MapPin className="w-4 h-4" /> A solo {nearbyStop.distance}
                    </p>
                 </div>
                 
                 <div className="flex-1 space-y-5">
                    {nearbyStop.busesIncomming.map((bus, idx) => (
                      <div key={idx} className="bg-white/60 backdrop-blur p-4 rounded-2xl border border-orange-200/50 flex justify-between items-center">
                         <div>
                            <p className="text-xs font-bold text-orange-950 uppercase opacity-50 mb-1">{bus.route}</p>
                            <p className="font-black text-orange-900">{bus.id}</p>
                         </div>
                         <div className="px-3 py-1 bg-orange-500 text-white rounded-xl text-sm font-black">
                            {bus.time}
                         </div>
                      </div>
                    ))}
                 </div>
                 
                 <button onClick={() => setShowRoutes(true)} className="mt-8 w-full bg-orange-900 text-white font-bold py-4 rounded-2xl hover:bg-orange-950 transition-all shadow-lg flex items-center justify-center gap-2">
                    <Filter className="w-5 h-5" />
                    Explorar rutas
                 </button>
              </div>
           </div>
        </section>

        {/* Bottom Banner/Tips Section */}
        <section className="bg-gray-900 rounded-[3rem] p-12 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10">
           <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
              <div className="grid grid-cols-12 h-full">
                 {[...Array(48)].map((_, i) => <div key={i} className="border-r border-b border-white" />)}
              </div>
           </div>
           
           <div className="relative z-10 max-w-xl space-y-6">
              <div className="flex gap-4">
                 <span className="bg-blue-600 p-2 rounded-lg text-white font-black text-xs uppercase tracking-tighter">Tip del día</span>
                 <div className="flex text-yellow-400 gap-0.5">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                 </div>
              </div>
              <h2 className="text-4xl font-extrabold tracking-tight">Viaja inteligente con notificaciones personalizadas</h2>
              <p className="text-gray-400 text-lg leading-relaxed font-medium">Activa las alertas para tus rutas favoritas y recibe avisos sobre posibles retrasos o desvíos antes de salir de casa.</p>
              
              <div className="flex flex-wrap gap-4 pt-2">
                 <button className="bg-white text-black font-black px-10 py-4 rounded-2xl hover:bg-gray-200 transition-all flex items-center gap-2 group">
                    <Bell className="w-5 h-5 text-blue-600 group-hover:animate-bounce" /> Activar Alertas
                 </button>
                 <button className="bg-white/10 hover:bg-white/20 text-white font-bold px-10 py-4 rounded-2xl border border-white/10 transition-all flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" /> Soporte Chat
                 </button>
              </div>
           </div>
           
           <div className="relative z-10 flex-shrink-0">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-64 h-64 rounded-[3rem] shadow-2xl flex items-center justify-center p-2 rotate-3 hover:rotate-0 transition-transform duration-500">
                 <div className="bg-white/10 w-full h-full rounded-[2.5rem] border border-white/30 flex flex-col items-center justify-center p-8 text-center space-y-4">
                    <Share2 className="w-12 h-12 text-white" />
                    <p className="text-sm font-black uppercase tracking-widest opacity-70">Invitar amigos</p>
                    <p className="font-bold text-lg leading-tight">Obtén 2 viajes gratis por cada referido</p>
                 </div>
              </div>
           </div>
        </section>
        </>
        )}
      </main>
      
      {/* Footer Minimalist */}
      <footer className="border-t border-gray-100 bg-white py-12 mt-auto">
         <div className="max-w-7xl mx-auto px-8 flex justify-between items-begin">
            <p className="text-sm text-gray-400 font-medium">© 2024 Intelligent Smart Bus System. All rights reserved.</p>
            <div className="flex gap-8">
               <a href="#" className="text-sm text-gray-400 hover:text-blue-600 font-bold transition-colors">Privacidad</a>
               <a href="#" className="text-sm text-gray-400 hover:text-blue-600 font-bold transition-colors">Términos</a>
               <a href="#" className="text-sm text-gray-400 hover:text-blue-600 font-bold transition-colors">Ayuda</a>
            </div>
         </div>
      </footer>
    </div>
  );
};
