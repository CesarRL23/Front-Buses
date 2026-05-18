import React, { useState, useEffect } from 'react';
import { X, CreditCard, ShieldCheck, AlertCircle, TrendingUp, CheckCircle2 } from 'lucide-react';
import { businessService } from '../services/businessService';

interface RechargeModalProps {
   isOpen: boolean;
   onClose: () => void;
   onSuccess: (newBalance: number) => void;
   citizen: any;
}

declare global {
   interface Window {
      ePayco: any;
   }
}

export const RechargeModal: React.FC<RechargeModalProps> = ({ isOpen, onClose, onSuccess, citizen }) => {
   const [amount, setAmount] = useState<number>(10000);
   const [isCustom, setIsCustom] = useState(false);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const predefinedAmounts = [10000, 20000, 50000, 100000];
   const currentBalance = citizen?.paymentMethods?.[0]?.paymentMethod?.saldo || 0;
   const newBalance = Number(currentBalance) + Number(amount);
   const commission = amount * 0.029 + 900; // ePayco standard commission (example)

   useEffect(() => {
      const existingScript = document.getElementById('epayco-script');
      if (!existingScript) {
         const script = document.createElement('script');
         script.id = 'epayco-script';
         script.src = 'https://checkout.epayco.co/checkout.js';
         script.async = true;
         document.body.appendChild(script);
      }
   }, []);

   const handleRecharge = async () => {
      if (amount < 5000 || amount > 500000) {
         setError('El monto debe estar entre $5,000 y $500,000');
         return;
      }

      if (!window.ePayco) {
         setError('La pasarela de pago no se ha cargado correctamente. Por favor, recarga la página.');
         return;
      }

      setLoading(true);
      setError(null);

      try {
         const publicKey = import.meta.env.VITE_EPAYCO_PUBLIC_KEY;
         const merchantId = import.meta.env.VITE_EPAYCO_MERCHANT_ID;

         const handler = window.ePayco.checkout.configure({
            key: publicKey,
            test: true
         });

         const paymentData = {
            // Parametros obligatorios
            name: "Recarga Tarjeta Transporte",
            description: `Recarga tarjeta transporte #${citizen.id}`,
            invoice: `REC-${Date.now()}`,
            currency: "COP",
            amount: amount,
            tax_base: 0,
            tax: 0,
            country: "CO",
            lang: "es",

            // Parametros opcionales
            external: "true", 
            extra1: String(citizen.paymentMethods?.[0]?.paymentMethod?.id || "0"),
            extra2: String(citizen.id || "0"),
            confirmation: "http://localhost:3000/payment-method/confirmation",
            response: "http://localhost:5173/dashboard",
            
            // Atributos del cliente
            name_billing: citizen.person?.nombre || "Usuario",
            address_billing: citizen.address?.calle || "Calle 123",
            type_doc_billing: "CC",
            mobile_phone_billing: "3000000000",
            number_doc_billing: "123456789",

            // Merchant Info
            p_cust_id_cliente: merchantId,
         };

         console.log("Opening ePayco with data:", paymentData);
         
         // Para la simulación: Guardamos el monto que se va a recargar
         // Así, cuando ePayco nos redirija de vuelta, el Dashboard sabrá cuánto sumar.
         localStorage.setItem('pending_recharge_amount', amount.toString());
         
         handler.open(paymentData);
         
         setLoading(false);
      } catch (err) {
         setError('Error al iniciar la pasarela de pagos');
         setLoading(false);
      }
   };

   const handleDirectSimulatedRecharge = async () => {
      if (amount < 5000 || amount > 500000) {
         setError('El monto debe estar entre $5,000 y $500,000');
         return;
      }

      setLoading(true);
      setError(null);

      try {
         const paymentMethodId = citizen.paymentMethods?.[0]?.paymentMethod?.id;
         
         if (citizen.id !== 0 && paymentMethodId) {
            // Recargar saldo en el backend real de forma persistente
            const res = await businessService.recharge(Number(paymentMethodId), Number(amount));
            onSuccess(Number(res.saldo));
         } else {
            // Recargar de forma simulada
            onSuccess(newBalance);
         }
         onClose();
      } catch (err: any) {
         setError('Error al procesar la recarga simulada');
      } finally {
         setLoading(false);
      }
   };

   if (!isOpen) return null;

   return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
         <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white flex justify-between items-center">
               <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl">
                     <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                     <h2 className="text-xl font-bold">Recargar Saldo</h2>
                     <p className="text-blue-100 text-xs">Pasarela de pagos segura ePayco</p>
                  </div>
               </div>
               <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors">
                  <X className="w-6 h-6" />
               </button>
            </div>

            {/* Content */}
            <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
               {/* Balance Info */}
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                     <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">Saldo Actual</p>
                     <p className="text-2xl font-black text-blue-900">${Number(currentBalance).toLocaleString()}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                     <p className="text-green-600 text-xs font-bold uppercase tracking-wider mb-1">Nuevo Saldo</p>
                     <p className="text-2xl font-black text-green-900">${Number(newBalance).toLocaleString()}</p>
                  </div>
               </div>

               {/* Amount Selection */}
               <div className="space-y-4">
                  <label className="text-sm font-bold text-gray-700 block">Selecciona un monto</label>
                  <div className="grid grid-cols-2 gap-3">
                     {predefinedAmounts.map((val) => (
                        <button
                           key={val}
                           onClick={() => { setAmount(val); setIsCustom(false); }}
                           className={`py-4 rounded-2xl font-black transition-all ${
                              !isCustom && amount === val 
                              ? 'bg-blue-600 text-white shadow-lg scale-[1.02] border-2 border-blue-700' 
                              : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-2 border-transparent'
                           }`}
                        >
                           ${val.toLocaleString()}
                        </button>
                     ))}
                  </div>
                  
                  <div className="relative mt-4">
                     <button 
                        onClick={() => setIsCustom(true)}
                        className={`w-full py-4 rounded-2xl font-bold text-sm transition-all border-2 ${
                           isCustom ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-dashed border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-500'
                        }`}
                     >
                        {isCustom ? 'Monto Personalizado' : '+ Ingresar otro monto'}
                     </button>
                     
                     {isCustom && (
                        <div className="mt-4 animate-in slide-in-from-top-4 duration-300">
                           <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                              <input 
                                 type="number"
                                 value={amount}
                                 onChange={(e) => setAmount(Number(e.target.value))}
                                 className="w-full pl-8 pr-4 py-4 bg-gray-50 border-2 border-blue-200 rounded-2xl focus:border-blue-500 focus:ring-0 outline-none font-black text-xl text-blue-900"
                                 placeholder="5,000 - 500,000"
                                 min="5000"
                                 max="500000"
                              />
                           </div>
                           <p className="text-[10px] text-gray-400 mt-2 ml-2">Min: $5,000 / Max: $500,000</p>
                        </div>
                     )}
                  </div>
               </div>

               {/* Fee Info */}
               <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                     Se aplicará una comisión por servicio de <span className="font-bold">${Math.round(commission).toLocaleString()} COP</span> gestionada por ePayco.
                  </p>
               </div>

               {error && (
                  <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex gap-3 text-red-600">
                     <AlertCircle className="w-5 h-5 shrink-0" />
                     <p className="text-sm font-medium">{error}</p>
                  </div>
               )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-100">
               <button
                  onClick={handleRecharge}
                  disabled={loading || amount < 5000}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group"
               >
                  {loading ? (
                     <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                     <>
                        Continuar al Pago
                        <TrendingUp className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                     </>
                  )}
               </button>
               <button
                  onClick={handleDirectSimulatedRecharge}
                  disabled={loading || amount < 5000}
                  className="w-full mt-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-black py-4 rounded-2xl shadow-xl shadow-green-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm uppercase tracking-wide"
               >
                  {loading ? (
                     <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                     <>
                        Simular Recarga Instantánea
                     </>
                  )}
               </button>
               <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  Pago 100% Seguro con cifrado SSL
               </div>
            </div>
         </div>
      </div>
   );
};
