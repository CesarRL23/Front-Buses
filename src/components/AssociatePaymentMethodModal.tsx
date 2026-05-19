import React, { useState } from 'react';
import { X, CreditCard, ShieldCheck, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';
import { businessService } from '../services/businessService';

interface AssociatePaymentMethodModalProps {
   isOpen: boolean;
   onClose: () => void;
   person: any;
   citizen: any;
   onSuccess: () => void;
}

export const AssociatePaymentMethodModal: React.FC<AssociatePaymentMethodModalProps> = ({
   isOpen,
   onClose,
   person,
   citizen,
   onSuccess
}) => {
   const [provider, setProvider] = useState<string>('SMART_CARD');
   const [accountNumber, setAccountNumber] = useState<string>('');
   const [saldo, setSaldo] = useState<number>(10000);
   const [loading, setLoading] = useState<boolean>(false);
   const [error, setError] = useState<string | null>(null);

   if (!isOpen) return null;

   // Generate a random card/account number based on provider
   const generateRandomNumber = () => {
      let num = '';
      if (provider === 'SMART_CARD') {
         num = '1000' + Math.floor(100000000000 + Math.random() * 900000000000);
      } else if (provider === 'VISA') {
         num = '4' + Math.floor(100000000000000 + Math.random() * 900000000000000);
      } else if (provider === 'MASTERCARD') {
         num = '5' + Math.floor(100000000000000 + Math.random() * 900000000000000);
      } else {
         num = '3' + Math.floor(100000000 + Math.random() * 900000000);
      }
      
      // Format card number with spaces for visa/mastercard/smartcard
      if (provider !== 'NEQUI' && provider !== 'DAVIPLATA') {
         const formatted = num.match(/.{1,4}/g)?.join(' ') || num;
         setAccountNumber(formatted);
      } else {
         setAccountNumber(num);
      }
   };

   // Get card style classes and gradients based on selected provider
   const getCardTheme = () => {
      switch (provider) {
         case 'SMART_CARD':
            return {
               gradient: 'from-blue-600 via-indigo-700 to-violet-800',
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
               gradient: 'from-gray-700 to-gray-900',
               label: 'Tarjeta Smart',
               sub: 'Transporte',
               logoColor: 'text-gray-300'
            };
      }
   };

   const theme = getCardTheme();

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!accountNumber.trim()) {
         setError('Por favor, ingresa o genera un número de cuenta/tarjeta');
         return;
      }

      setLoading(true);
      setError(null);

      try {
         let targetCitizenId = citizen?.id || 0;

         // 1. If citizen record doesn't exist (simulated id is 0), first create it in the database
         if (targetCitizenId === 0) {
            if (!person?.id) {
               throw new Error('No se encontró información de Persona válida para el usuario.');
            }
            const newCitizen = await businessService.createCitizen({ personId: person.id });
            targetCitizenId = newCitizen.id;
         }

         // 2. Create the Payment Method
         const cleanAccountNumber = accountNumber.replace(/\s+/g, '');
         const paymentMethod = await businessService.createPaymentMethod({
            type: (provider === 'NEQUI' || provider === 'DAVIPLATA') ? 'APP' : 'CARD',
            provider: provider,
            accountNumber: cleanAccountNumber,
            isActive: true,
            saldo: Number(saldo)
         });

         // 3. Associate the payment method to the citizen
         await businessService.associatePaymentMethodToCitizen({
            citizenId: Number(targetCitizenId),
            paymentMethodId: Number(paymentMethod.id)
         });

         onSuccess();
         onClose();
      } catch (err: any) {
         console.error('Error in payment method association:', err);
         setError(err?.response?.data?.message || err?.message || 'Error al vincular el método de pago');
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
         <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white flex justify-between items-center">
               <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl">
                     <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                     <h2 className="text-xl font-bold">Vincular Método de Pago</h2>
                     <p className="text-blue-100 text-xs">Asocia una tarjeta o cuenta a tu cuenta de ciudadano</p>
                  </div>
               </div>
               <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors">
                  <X className="w-6 h-6" />
               </button>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6 overflow-y-auto max-h-[75vh]">
               
               {/* ─── LIVE CARD PREVIEW ─── */}
               <div className={`relative w-full aspect-[1.58/1] rounded-3xl bg-gradient-to-br ${theme.gradient} text-white shadow-2xl p-6 flex flex-col justify-between overflow-hidden border border-white/10 transition-all duration-500 transform hover:scale-[1.01]`}>
                  {/* Subtle card grid effect */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute -bottom-20 -right-20 bg-white/5 w-64 h-64 rounded-full blur-3xl pointer-events-none" />

                  {/* Top Row: Provider Label & Chip */}
                  <div className="flex justify-between items-start relative z-10">
                     <div>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-white/60 mb-0.5">{theme.sub}</p>
                        <h4 className="text-lg font-black tracking-tight">{theme.label}</h4>
                     </div>
                     <div className="flex items-center gap-2">
                        {/* Sim Card Metallic Chip */}
                        <div className="w-9 h-7 rounded-md bg-gradient-to-br from-amber-200 via-yellow-100 to-amber-300 border border-amber-400 flex flex-col justify-between p-1 opacity-90 shadow-md">
                           <div className="h-[2px] w-full bg-amber-600/30" />
                           <div className="h-[2px] w-full bg-amber-600/30" />
                           <div className="h-[2px] w-full bg-amber-600/30" />
                        </div>
                     </div>
                  </div>

                  {/* Card Number Row */}
                  <div className="relative z-10 my-4 text-center">
                     <p className="text-xl md:text-2xl font-mono tracking-widest text-slate-100 font-bold bg-black/10 rounded-lg py-1">
                        {accountNumber || '•••• •••• •••• ••••'}
                     </p>
                  </div>

                  {/* Bottom Row: Holder Name & Balance */}
                  <div className="flex justify-between items-end relative z-10">
                     <div>
                        <p className="text-[9px] uppercase font-bold tracking-wider text-white/50 mb-0.5">Titular</p>
                        <p className="font-semibold text-sm max-w-[200px] truncate">{person?.nombre || 'Usuario SmartBus'}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-[9px] uppercase font-bold tracking-wider text-white/50 mb-0.5">Saldo Inicial</p>
                        <p className="font-black text-lg text-emerald-300">${saldo.toLocaleString()} COP</p>
                     </div>
                  </div>
               </div>

               {/* Form */}
               <form onSubmit={handleSubmit} className="space-y-5">
                  
                  {/* Provider Selector */}
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">Selecciona el Proveedor</label>
                     <div className="grid grid-cols-3 gap-2">
                        {[
                           { id: 'SMART_CARD', name: 'Smart Card', type: 'Bus' },
                           { id: 'VISA', name: 'Visa', type: 'Crédito' },
                           { id: 'MASTERCARD', name: 'Mastercard', type: 'Crédito' },
                           { id: 'NEQUI', name: 'Nequi', type: 'Digital' },
                           { id: 'DAVIPLATA', name: 'Daviplata', type: 'Digital' }
                        ].map((prov) => (
                           <button
                              key={prov.id}
                              type="button"
                              onClick={() => {
                                 setProvider(prov.id);
                                 setAccountNumber(''); // Reset on change to regenerate properly
                              }}
                              className={`p-3 rounded-xl border-2 text-center transition-all ${
                                 provider === prov.id
                                 ? 'border-blue-600 bg-blue-50/50 text-blue-700 font-bold shadow-sm'
                                 : 'border-gray-200 text-gray-600 hover:border-gray-300'
                              }`}
                           >
                              <p className="text-xs">{prov.name}</p>
                              <p className="text-[9px] text-gray-400 font-medium">{prov.type}</p>
                           </button>
                        ))}
                     </div>
                  </div>

                  {/* Account Number Input & Generator */}
                  <div className="space-y-2">
                     <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">
                           {provider === 'NEQUI' || provider === 'DAVIPLATA' ? 'Número de Celular / Cuenta' : 'Número de Tarjeta'}
                        </label>
                        <button
                           type="button"
                           onClick={generateRandomNumber}
                           className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 hover:underline"
                        >
                           <Sparkles className="w-3.5 h-3.5" /> Generar aleatorio
                        </button>
                     </div>
                     <div className="relative">
                        <input
                           type="text"
                           required
                           value={accountNumber}
                           onChange={(e) => setAccountNumber(e.target.value)}
                           placeholder={
                              provider === 'NEQUI' || provider === 'DAVIPLATA'
                              ? 'Ej. 300 123 4567'
                              : 'Ej. 4000 1234 5678 9010'
                           }
                           className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none font-medium text-gray-800 transition-all shadow-inner"
                        />
                     </div>
                  </div>

                  {/* Initial Balance Input */}
                  <div className="space-y-2">
                     <div className="flex justify-between">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">Saldo de Carga Inicial</label>
                        <span className="text-xs font-bold text-emerald-600">${saldo.toLocaleString()} COP</span>
                     </div>
                     <input
                        type="range"
                        min="0"
                        max="100000"
                        step="5000"
                        value={saldo}
                        onChange={(e) => setSaldo(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
                     />
                     <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                        <span>$0</span>
                        <span>$50,000</span>
                        <span>$100,000</span>
                     </div>
                  </div>

                  {error && (
                     <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex gap-3 text-red-600 text-sm">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p className="font-semibold">{error}</p>
                     </div>
                  )}

                  {/* Submit Button */}
                  <button
                     type="submit"
                     disabled={loading}
                     className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-100 hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-xs"
                  >
                     {loading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                     ) : (
                        <>Vincular Tarjeta</>
                     )}
                  </button>
               </form>
            </div>

            {/* Footer info */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
               <ShieldCheck className="w-4 h-4 text-green-500" />
               Vínculo Seguro y Encriptado
            </div>
         </div>
      </div>
   );
};
