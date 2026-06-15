import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, Loader2 } from 'lucide-react';
import { businessService } from '../services/businessService';
import { PqrsStatus } from '../components/PqrsStatus';

export const PqrsPublicPage: React.FC = () => {
  const { radicado } = useParams<{ radicado: string }>();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-3">
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-black text-gray-900 text-sm">TransMilenio Buses</p>
          <p className="text-xs text-gray-400">Consulta de PQRS</p>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-xl">
          <h1 className="text-2xl font-black text-gray-900 mb-2">Estado de tu PQRS</h1>
          <p className="text-gray-500 text-sm mb-8">
            Consulta el estado actual de tu petición, queja, reclamo o sugerencia.
          </p>
          <PqrsStatus initialRadicado={radicado} />
        </div>
      </main>
    </div>
  );
};
