import React, { useState } from 'react';
import {
  Send, Loader2, CheckCircle, AlertCircle, ImagePlus, X, FileText,
} from 'lucide-react';
import { businessService } from '../services/businessService';

interface Props {
  user?: { id: string; email: string; firstName?: string; lastName?: string } | null;
}

const TYPES = [
  { value: 'PETICION',   label: '📝 Petición',   desc: 'Solicitud de información o servicio' },
  { value: 'QUEJA',      label: '😟 Queja',      desc: 'Inconformidad con el servicio' },
  { value: 'RECLAMO',    label: '⚖️ Reclamo',    desc: 'Exigencia de un derecho' },
  { value: 'SUGERENCIA', label: '💡 Sugerencia', desc: 'Idea para mejorar el servicio' },
];

const CATEGORIES = [
  { value: 'CONDUCTOR', label: '👤 Conductor' },
  { value: 'BUS',       label: '🚌 Bus / Vehículo' },
  { value: 'RUTA',      label: '🗺️ Ruta' },
  { value: 'TARJETA',   label: '💳 Tarjeta de pago' },
  { value: 'OTRO',      label: '📎 Otro' },
];

export const PqrsForm: React.FC<Props> = ({ user }) => {
  const [type, setType]             = useState('');
  const [category, setCategory]     = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail]           = useState(user?.email || '');
  const [photos, setPhotos]         = useState<string[]>([]);
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState<{ radicado: string } | null>(null);
  const [error, setError]           = useState('');

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 3) {
      setError('Máximo 3 fotos permitidas');
      return;
    }
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotos((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || !category || !description || !email) {
      setError('Por favor completa todos los campos obligatorios');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const name = user
        ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email
        : email;
      const created = await businessService.createPqrs({
        type,
        category,
        description,
        email,
        citizenUserId: user?.id,
        citizenName: name,
        photos: photos.length > 0 ? photos : undefined,
      });
      setResult(created);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al enviar el PQRS. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="text-center py-8 px-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">¡PQRS enviado exitosamente!</h3>
        <p className="text-gray-500 text-sm mb-6">
          Revisa tu correo — te enviamos la confirmación con el número de radicado.
        </p>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-6">
          <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-2">Número de Radicado</p>
          <p className="text-3xl font-black font-mono text-blue-800">{result.radicado}</p>
          <p className="text-xs text-blue-400 mt-2">Guarda este número para consultar el estado</p>
        </div>
        <button
          onClick={() => { setResult(null); setType(''); setCategory(''); setDescription(''); setPhotos([]); }}
          className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
        >
          Enviar otro PQRS
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Tipo */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Tipo <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={`text-left p-3 rounded-xl border-2 transition-all ${
                type === t.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <p className="font-semibold text-sm text-gray-800">{t.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Categoría */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Categoría <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                category === c.value
                  ? 'border-blue-500 bg-blue-500 text-white'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Descripción <span className="text-red-500">*</span>
          <span className={`ml-2 font-normal ${description.length > 450 ? 'text-red-500' : 'text-gray-400'}`}>
            ({description.length}/500)
          </span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, 500))}
          rows={4}
          placeholder="Describe detalladamente tu petición, queja, reclamo o sugerencia..."
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none bg-gray-50"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Email de contacto <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50"
        />
      </div>

      {/* Fotos */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Fotos adjuntas <span className="text-gray-400 font-normal">(máx. 3, opcional)</span>
        </label>
        <div className="flex flex-wrap gap-2 items-center">
          {photos.map((p, i) => (
            <div key={i} className="relative w-16 h-16">
              <img src={p} alt={`foto ${i+1}`} className="w-full h-full object-cover rounded-lg border border-gray-200" />
              <button
                type="button"
                onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {photos.length < 3 && (
            <label className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-colors">
              <ImagePlus className="w-5 h-5 text-gray-400" />
              <span className="text-xs text-gray-400 mt-0.5">Foto</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhoto} />
            </label>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 rounded-xl transition-colors text-sm"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
        ) : (
          <><Send className="w-4 h-4" /> Enviar PQRS</>
        )}
      </button>
    </form>
  );
};
