import React, { useState } from 'react';
import {
  AlertCircle,
  X,
  Upload,
  Loader2,
  CheckCircle2,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';
import { reportService } from '../services/reportService';
import {
  IncidentType,
  IncidentSeverity,
  IncidentReport,
} from '../types/incident.types';

interface IncidentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  shiftId: number;
  latitude?: number;
  longitude?: number;
  onSuccess?: () => void;
}

export const IncidentReportModal: React.FC<IncidentReportModalProps> = ({
  isOpen,
  onClose,
  shiftId,
  latitude,
  longitude,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    tipo: '' as IncidentType | '',
    gravedad: '' as IncidentSeverity | '',
    descripcion: '',
    tipo_otro: '',
    fotoUrls: [] as string[],
  });

  const [photoInput, setPhotoInput] = useState('');

  const handleTipoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, tipo: e.target.value as IncidentType });
  };

  const handleGravedadChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      ...formData,
      gravedad: e.target.value as IncidentSeverity,
    });
  };

  const handleDescripcionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({ ...formData, descripcion: e.target.value });
  };

  const handleTipoOtroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, tipo_otro: e.target.value });
  };

  const handleAddPhoto = () => {
    if (!photoInput.trim()) {
      setError('Ingresa una URL válida de foto');
      return;
    }

    if (formData.fotoUrls.length >= 5) {
      setError('Máximo 5 fotos permitidas');
      return;
    }

    setFormData({
      ...formData,
      fotoUrls: [...formData.fotoUrls, photoInput],
    });
    setPhotoInput('');
    setError('');
  };

  const handleRemovePhoto = (index: number) => {
    setFormData({
      ...formData,
      fotoUrls: formData.fotoUrls.filter((_, i) => i !== index),
    });
  };

  const validate = (): boolean => {
    if (!formData.tipo) {
      setError('Selecciona un tipo de incidente');
      return false;
    }

    if (formData.tipo === IncidentType.OTRO && !formData.tipo_otro.trim()) {
      setError('Especifica el tipo de incidente personalizado');
      return false;
    }

    if (!formData.gravedad) {
      setError('Selecciona un nivel de gravedad');
      return false;
    }

    if (!formData.descripcion.trim()) {
      setError('Describe el incidente');
      return false;
    }

    if (formData.descripcion.length < 10) {
      setError('La descripción debe tener al menos 10 caracteres');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const getCurrentCoords = (): Promise<{ latitude?: number; longitude?: number }> => {
        if (latitude !== undefined && longitude !== undefined) {
          return Promise.resolve({ latitude, longitude });
        }

        if (!navigator.geolocation) {
          return Promise.resolve({});
        }

        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
            },
            () => resolve({}),
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            },
          );
        });
      };

      const coords = await getCurrentCoords();

      const reportData: IncidentReport = {
        tipo: formData.tipo as IncidentType,
        gravedad: formData.gravedad as IncidentSeverity,
        descripcion: formData.descripcion,
        tipo_otro:
          formData.tipo === IncidentType.OTRO
            ? formData.tipo_otro
            : undefined,
        fotoUrls:
          formData.fotoUrls.length > 0 ? formData.fotoUrls : undefined,
        shiftId,
      };

      await reportService.reportIncident(
        reportData,
        coords.latitude,
        coords.longitude,
      );

      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
        resetForm();
        onClose();
        onSuccess?.();
      }, 2000);
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Error al reportar el incidente';
      setError(errorMsg);
      console.error('Error reporting incident:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      tipo: '' as IncidentType | '',
      gravedad: '' as IncidentSeverity | '',
      descripcion: '',
      tipo_otro: '',
      fotoUrls: [],
    });
    setPhotoInput('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-gray-900">
              Reportar Incidente
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Documenta el incidente ocurrido durante tu turno
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            aria-label="Cerrar modal"
            title="Cerrar modal"
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="m-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
            <p className="text-green-700 font-semibold">
              ¡Incidente reportado exitosamente!
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="m-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 font-semibold">{error}</p>
          </div>
        )}

        {/* Form */}
        {!success && (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Tipo de Incidente */}
            <div>
              <label htmlFor="incident-type" className="block text-sm font-bold text-gray-700 mb-2">
                Tipo de Incidente <span className="text-red-500">*</span>
              </label>
              <select
                id="incident-type"
                value={formData.tipo}
                onChange={handleTipoChange}
                disabled={loading}
                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-50"
              >
                <option value="">Selecciona un tipo</option>
                <option value={IncidentType.MECANICO}>🔧 Problema Mecánico</option>
                <option value={IncidentType.ACCIDENTE}>
                  ⚠️ Accidente de Tránsito
                </option>
                <option value={IncidentType.RETRASO}>
                  🕐 Retraso en Ruta
                </option>
                <option value={IncidentType.OTRO}>📝 Otro</option>
              </select>
            </div>

            {/* Tipo Otro */}
            {formData.tipo === IncidentType.OTRO && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <label htmlFor="incident-custom-type" className="block text-sm font-bold text-gray-700 mb-2">
                  Especifica el Tipo <span className="text-red-500">*</span>
                </label>
                <input
                  id="incident-custom-type"
                  type="text"
                  value={formData.tipo_otro}
                  onChange={handleTipoOtroChange}
                  disabled={loading}
                  placeholder="Ej: Congestión vial, Problema con pasajero..."
                  className="w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-50"
                />
              </div>
            )}

            {/* Gravedad */}
            <div>
              <label htmlFor="incident-severity" className="block text-sm font-bold text-gray-700 mb-2">
                Nivel de Gravedad <span className="text-red-500">*</span>
              </label>
              <select
                id="incident-severity"
                value={formData.gravedad}
                onChange={handleGravedadChange}
                disabled={loading}
                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-50"
              >
                <option value="">Selecciona la gravedad</option>
                <option value={IncidentSeverity.BAJO}>
                  🟢 Bajo - Menor inconveniente
                </option>
                <option value={IncidentSeverity.MEDIO}>
                  🟡 Medio - Moderado
                </option>
                <option value={IncidentSeverity.ALTO}>
                  🔴 Alto - Grave
                </option>
                <option value={IncidentSeverity.CRITICO}>
                  ⛔ Crítico - Emergencia
                </option>
              </select>
            </div>

            {/* Descripción */}
            <div>
              <label htmlFor="incident-description" className="block text-sm font-bold text-gray-700 mb-2">
                Descripción Detallada <span className="text-red-500">*</span>
              </label>
              <textarea
                id="incident-description"
                value={formData.descripcion}
                onChange={handleDescripcionChange}
                disabled={loading}
                placeholder="Describe qué ocurrió, dónde, cuándo y cualquier detalle relevante..."
                rows={4}
                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none disabled:bg-gray-50"
              />
              <p className="text-xs text-gray-400 mt-1">
                {formData.descripcion.length}/500 caracteres
              </p>
            </div>

            {/* Fotos */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Evidencia Fotográfica{' '}
                <span className="text-gray-500 font-normal">(máx 5 fotos)</span>
              </label>

              {/* Photo Input */}
              <div className="flex gap-2 mb-4">
                <input
                  type="url"
                  value={photoInput}
                  onChange={(e) => setPhotoInput(e.target.value)}
                  disabled={loading || formData.fotoUrls.length >= 5}
                  placeholder="Pega la URL de una foto..."
                  className="flex-1 border-2 border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-50"
                />
                <button
                  type="button"
                  onClick={handleAddPhoto}
                  disabled={loading || formData.fotoUrls.length >= 5 || !photoInput.trim()}
                  aria-label="Agregar foto"
                  title="Agregar foto"
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold px-6 py-3 rounded-xl transition-all active:scale-95"
                >
                  <Upload className="h-5 w-5" />
                </button>
              </div>

              {/* Photo List */}
              {formData.fotoUrls.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                  {formData.fotoUrls.map((url, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <ImageIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-600 truncate">
                          {url.substring(0, 50)}...
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(index)}
                        disabled={loading}
                        aria-label={`Eliminar foto ${index + 1}`}
                        title={`Eliminar foto ${index + 1}`}
                        className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition disabled:opacity-50"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-400 mt-2">
                {formData.fotoUrls.length}/5 fotos añadidas
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-gray-100 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Reportando...
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5" />
                    Enviar Reporte
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
