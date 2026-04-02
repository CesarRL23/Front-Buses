import React from 'react';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';
import { 
  Bus, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  UserCheck, 
  CheckCircle,
  Navigation,
  Fuel,
} from 'lucide-react';

export const ConductorDashboard: React.FC = () => {
  const { user } = useAuth();
  const isConductor = user?.roles?.some(r => r.toUpperCase() === 'CONDUCTOR') ?? false;

  const currentTrip = {
    id: 'T-1024',
    route: 'Centro - Uninorte',
    bus: 'BUS-045',
    passengers: 28,
    fuel: '65%',
    nextStop: 'Calle 72 con Olaya Herrera',
    eta: '6 mins',
    status: 'En camino'
  };

  const schedule = [
    { id: 1, time: '06:00 AM', route: 'Sur - Buenavista', status: 'Completado' },
    { id: 2, time: '08:30 AM', route: 'Centro - Uninorte', status: 'Completado' },
    { id: 3, time: '11:00 AM', route: 'Centro - Uninorte', status: 'Actual' },
    { id: 4, time: '02:00 PM', route: 'Norte - Terminal', status: 'Pendiente' },
  ];

  if (!isConductor) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[80vh] text-center px-4">
          <div className="bg-blue-100 rounded-full p-6 mb-6">
            <Bus className="h-16 w-16 text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600 max-w-md">
            Solo los usuarios con rol <span className="font-semibold text-blue-600">CONDUCTOR</span> pueden acceder a este panel.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
              <UserCheck className="h-8 w-8 text-blue-600" />
              Panel del Conductor
            </h1>
            <p className="text-gray-500 mt-2">¡Hola, {user?.firstName}! Gestiona tu jornada hoy.</p>
          </div>
          <div className="flex items-center gap-3 bg-green-50 border border-green-100 px-4 py-2 rounded-xl">
             <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
             <span className="text-sm font-bold text-green-700 uppercase">En turno activo</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content - Trip Details */}
          <div className="lg:col-span-8 space-y-6">
            {/* Current Trip Card */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl shadow-xl p-8 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10">
                 <Navigation className="w-48 h-48" />
               </div>
               
               <div className="relative z-10">
                 <div className="flex justify-between items-start mb-10">
                    <div>
                      <p className="text-blue-100 text-sm font-semibold uppercase tracking-wider mb-1">Viaje Actual</p>
                      <h2 className="text-4xl font-black">{currentTrip.route}</h2>
                    </div>
                    <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/30">
                       <p className="text-xs font-bold uppercase tracking-widest text-blue-100">Estado</p>
                       <p className="text-lg font-bold">{currentTrip.status}</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="space-y-1">
                       <div className="flex items-center gap-2 text-blue-100">
                         <Bus className="w-4 h-4" />
                         <span className="text-xs uppercase font-bold">Vehículo</span>
                       </div>
                       <p className="text-xl font-bold">{currentTrip.bus}</p>
                    </div>
                    <div className="space-y-1">
                       <div className="flex items-center gap-2 text-blue-100">
                         <Fuel className="w-4 h-4" />
                         <span className="text-xs uppercase font-bold">Combustible</span>
                       </div>
                       <p className="text-xl font-bold">{currentTrip.fuel}</p>
                    </div>
                    <div className="space-y-1">
                       <div className="flex items-center gap-2 text-blue-100">
                         <MapPin className="w-4 h-4" />
                         <span className="text-xs uppercase font-bold">Próxima Parada</span>
                       </div>
                       <p className="text-xl font-bold">{currentTrip.nextStop}</p>
                    </div>
                    <div className="space-y-1">
                       <div className="flex items-center gap-2 text-blue-100">
                         <Clock className="w-4 h-4" />
                         <span className="text-xs uppercase font-bold">Llegada Est.</span>
                       </div>
                       <p className="text-xl font-bold">{currentTrip.eta}</p>
                    </div>
                 </div>

                 <div className="mt-10 flex flex-wrap gap-4">
                    <button className="bg-white text-blue-600 font-bold px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95">
                      Iniciar Navegación
                    </button>
                    <button className="bg-blue-500/30 border border-white/30 text-white font-bold px-6 py-3 rounded-2xl hover:bg-blue-500/50 transition-all">
                      Detalles de Ruta
                    </button>
                 </div>
               </div>
            </div>

            {/* Checklist and Maintenance Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                   <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                     <CheckCircle className="h-5 w-5 text-green-600" />
                     Checklist de Seguridad
                   </h3>
                   <div className="space-y-4">
                      {['Frenos revisados', 'Limpieza interna', 'Luces funcionales', 'Botiquín a bordo'].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100">
                           <span className="text-sm font-medium text-gray-700">{item}</span>
                           <input type="checkbox" defaultChecked className="w-5 h-5 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500 transition-all" />
                        </div>
                      ))}
                   </div>
               </div>
               <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                   <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                     <AlertCircle className="h-5 w-5 text-orange-600" />
                     Reportar Novedat
                   </h3>
                   <textarea 
                     className="border border-gray-300 rounded-2xl w-full h-32 p-4 text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" 
                     placeholder="Describe algún problema mecánico o incidente..." 
                   />
                   <button className="w-full mt-4 bg-gray-900 text-white font-bold py-3 rounded-2xl hover:bg-gray-800 transition shadow-md">
                     Enviar Reporte
                   </button>
               </div>
            </div>
          </div>

          {/* Schedule Sidebar */}
          <div className="lg:col-span-4 space-y-6">
             <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                   <Clock className="w-6 h-6 text-indigo-600" />
                   Mi Horario
                </h3>
                <div className="space-y-4">
                   {schedule.map((slot) => (
                     <div key={slot.id} className={`p-4 rounded-2xl border ${slot.status === 'Actual' ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-100'}`}>
                        <div className="flex justify-between items-start">
                           <div>
                              <p className="text-xs font-bold text-gray-400 mb-1">{slot.time}</p>
                              <h4 className="text-sm font-bold text-gray-900">{slot.route}</h4>
                           </div>
                           <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${
                             slot.status === 'Completado' ? 'bg-green-100 text-green-700' : 
                             slot.status === 'Actual' ? 'bg-indigo-600 text-white' : 
                             'bg-gray-200 text-gray-500'
                           }`}>
                             {slot.status}
                           </span>
                        </div>
                     </div>
                   ))}
                </div>
                <button className="w-full mt-6 bg-gray-50 border border-gray-200 text-gray-600 font-bold py-3 rounded-2xl hover:bg-gray-100 transition">
                  Ver Calendario Completo
                </button>
             </div>

             <div className="bg-gray-900 rounded-3xl p-8 text-white text-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-400" />
                <h3 className="text-2xl font-black mb-2">Asistencia</h3>
                <p className="text-gray-400 text-sm mb-6">¿Necesitas ayuda técnica o reportar una emergencia?</p>
                <div className="space-y-3">
                   <button className="w-full bg-red-600 font-black py-4 rounded-2xl hover:bg-red-700 transition shadow-lg flex items-center justify-center gap-2 uppercase tracking-tighter">
                     <ShieldCheck className="w-6 h-6" />
                     Botón de Emergencia
                   </button>
                   <button className="w-full bg-white/10 border border-white/20 font-bold py-3 rounded-2xl hover:bg-white/20 transition">
                     Contactar Base
                   </button>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
