/**
 * AppointmentScheduler — HU-ENTR-3-012
 * Permite al ciudadano agendar / ver / cancelar citas de atención al cliente.
 * Integrado directamente con Google Calendar vía ms-negocio-Buses.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  CalendarCheck,
  CreditCard,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import { businessService } from '../services/businessService';

// ─── Types ──────────────────────────────────────────────────────────────────

type AttentionType = 'PRESENCIAL' | 'VIRTUAL';
type ConsultationType =
  | 'PROBLEMA_TARJETA'
  | 'RECLAMO'
  | 'REEMBOLSO'
  | 'OTRO';

interface TimeSlot {
  time: string;
  dateTimeStart: string;
  dateTimeEnd: string;
}

interface AvailabilityResponse {
  grouped: Record<string, TimeSlot[]>;
}

interface AppointmentRecord {
  id: number;
  fecha: string;
  hora: string;
  tipoAtencion: AttentionType;
  tipoConsulta: ConsultationType;
  motivo: string;
  estado: string;
  meetLink?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ATTENTION_OPTIONS: { value: AttentionType; label: string; icon: React.ReactNode; desc: string }[] = [
  {
    value: 'PRESENCIAL',
    label: 'Presencial',
    icon: <MapPin className="w-5 h-5" />,
    desc: 'Visítanos en nuestra oficina: Calle 65 # 26-10',
  },
  {
    value: 'VIRTUAL',
    label: 'Virtual',
    icon: <Video className="w-5 h-5" />,
    desc: 'Videollamada de Google Meet — desde tu casa',
  },
];

const CONSULTATION_OPTIONS: { value: ConsultationType; label: string; icon: React.ReactNode }[] = [
  { value: 'PROBLEMA_TARJETA', label: 'Problema con tarjeta', icon: <CreditCard className="w-4 h-4" /> },
  { value: 'RECLAMO', label: 'Reclamo', icon: <AlertCircle className="w-4 h-4" /> },
  { value: 'REEMBOLSO', label: 'Reembolso', icon: <RotateCcw className="w-4 h-4" /> },
  { value: 'OTRO', label: 'Otro', icon: <HelpCircle className="w-4 h-4" /> },
];

const STATUS_LABELS: Record<string, string> = {
  CONFIRMADA: 'Confirmada',
  CANCELADA: 'Cancelada',
  PENDIENTE: 'Pendiente',
  COMPLETADA: 'Completada',
};

const STATUS_COLORS: Record<string, string> = {
  CONFIRMADA: 'bg-green-100 text-green-800 border-green-200',
  CANCELADA: 'bg-red-100 text-red-700 border-red-200',
  PENDIENTE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  COMPLETADA: 'bg-blue-100 text-blue-700 border-blue-200',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateShort(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('es-CO', { weekday: 'short', month: 'short', day: 'numeric' });
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface AppointmentSchedulerProps {
  user: any;        // Firebase user / auth user object
  personData: any;  // { nombre, apellido, email, userId }
  citizenData: any; // { id, ... }
}

type Step = 'TYPE' | 'CALENDAR' | 'CONFIRM' | 'SUCCESS';

export const AppointmentScheduler: React.FC<AppointmentSchedulerProps> = ({
  user,
  personData,
  citizenData,
}) => {
  // ── UI state
  const [step, setStep] = useState<Step>('TYPE');
  const [view, setView] = useState<'new' | 'list'>('new');

  // ── Form state
  const [attentionType, setAttentionType] = useState<AttentionType>('PRESENCIAL');
  const [consultationType, setConsultationType] = useState<ConsultationType>('PROBLEMA_TARJETA');
  const [motivo, setMotivo] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [calendarPage, setCalendarPage] = useState(0); // page of 5 days

  // ── Data state
  const [availability, setAvailability] = useState<Record<string, TimeSlot[]>>({});
  const [myAppointments, setMyAppointments] = useState<AppointmentRecord[]>([]);
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState<AppointmentRecord | null>(null);

  // ── Fetch availability
  const fetchAvailability = useCallback(async () => {
    setLoadingAvail(true);
    setError('');
    try {
      const data: AvailabilityResponse = await businessService.getAppointmentAvailability();
      setAvailability(data.grouped || {});
    } catch {
      setError('No se pudo cargar la disponibilidad. Intenta de nuevo.');
    } finally {
      setLoadingAvail(false);
    }
  }, []);

  // ── Fetch my appointments
  const fetchMyAppointments = useCallback(async () => {
    const uid = user?.uid || personData?.userId;
    if (!uid) return;
    setLoadingList(true);
    try {
      const data = await businessService.getMyAppointments(uid);
      setMyAppointments(Array.isArray(data) ? data : []);
    } catch {
      // silently ignore
    } finally {
      setLoadingList(false);
    }
  }, [user, personData]);

  useEffect(() => {
    fetchAvailability();
    fetchMyAppointments();
  }, [fetchAvailability, fetchMyAppointments]);

  // ── Sorted available dates
  const availableDates = Object.keys(availability).sort();
  const pagedDates = availableDates.slice(calendarPage * 5, calendarPage * 5 + 5);
  const totalPages = Math.ceil(availableDates.length / 5);

  // ── Submit appointment
  const handleConfirm = async () => {
    if (!selectedSlot || !selectedDate) return;
    setLoadingSubmit(true);
    setError('');
    try {
      const email =
        personData?.email ||
        user?.email ||
        '';
      const name =
        personData
          ? `${personData.nombre || ''} ${personData.apellido || ''}`.trim()
          : (user?.displayName || 'Usuario');

      const created = await businessService.createAppointment({
        citizenId: citizenData?.id,
        citizenUserId: user?.uid || personData?.userId,
        citizenEmail: email,
        citizenName: name,
        fecha: selectedDate,
        hora: selectedSlot.time,
        tipoAtencion: attentionType,
        tipoConsulta: consultationType,
        motivo,
      });

      setSuccessData(created);
      setStep('SUCCESS');
      fetchMyAppointments();
      fetchAvailability();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'No se pudo agendar la cita. Intenta con otro horario.',
      );
    } finally {
      setLoadingSubmit(false);
    }
  };

  // ── Cancel appointment
  const handleCancel = async (id: number) => {
    try {
      await businessService.cancelAppointment(id);
      fetchMyAppointments();
    } catch {
      // silently ignore
    }
  };

  // ── Reset flow
  const resetFlow = () => {
    setStep('TYPE');
    setSelectedDate(null);
    setSelectedSlot(null);
    setMotivo('');
    setSuccessData(null);
    setError('');
    setCalendarPage(0);
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50 rounded-full blur-3xl opacity-60 pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <CalendarCheck className="h-7 w-7 text-indigo-600" />
            Agendar Cita — Atención al Cliente
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Reserva un bloque de 30 minutos con un asesor. Presencial u online.
          </p>
        </div>

        <div className="flex rounded-xl overflow-hidden border border-gray-200">
          <button
            onClick={() => setView('new')}
            className={`px-4 py-2 text-sm font-bold transition-all ${
              view === 'new'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Nueva cita
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 text-sm font-bold transition-all ${
              view === 'list'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Mis citas {myAppointments.filter(a => a.estado === 'CONFIRMADA').length > 0 && (
              <span className="ml-1 bg-indigo-100 text-indigo-700 rounded-full px-1.5 py-0.5 text-xs">
                {myAppointments.filter(a => a.estado === 'CONFIRMADA').length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ══════════════════ VIEW: LIST ══════════════════ */}
      {view === 'list' && (
        <div>
          {loadingList ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
          ) : myAppointments.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-200" />
              <p className="font-semibold">No tienes citas registradas</p>
              <button
                onClick={() => setView('new')}
                className="mt-4 text-indigo-600 font-bold text-sm hover:underline"
              >
                Agendar ahora
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-sm transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-indigo-100 text-indigo-700 rounded-xl p-3">
                      {appt.tipoAtencion === 'VIRTUAL' ? (
                        <Video className="w-5 h-5" />
                      ) : (
                        <MapPin className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">
                        {formatDate(appt.fecha)} · {appt.hora}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {appt.tipoAtencion} ·{' '}
                        {CONSULTATION_OPTIONS.find(c => c.value === appt.tipoConsulta)?.label}
                      </p>
                      {appt.meetLink && appt.estado === 'CONFIRMADA' && (
                        <a
                          href={appt.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-600 font-bold hover:underline mt-1 inline-flex items-center gap-1"
                        >
                          <Video className="w-3 h-3" /> Unirse a Meet
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        STATUS_COLORS[appt.estado] || 'bg-gray-100 text-gray-600 border-gray-200'
                      }`}
                    >
                      {STATUS_LABELS[appt.estado] || appt.estado}
                    </span>
                    {appt.estado === 'CONFIRMADA' && (
                      <button
                        onClick={() => handleCancel(appt.id)}
                        className="text-xs text-red-500 font-bold hover:text-red-700 hover:underline transition-colors"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════ VIEW: NEW ══════════════════ */}
      {view === 'new' && (
        <div>
          {/* Error banner */}
          {error && (
            <div className="mb-5 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-red-700 text-sm font-semibold">{error}</p>
            </div>
          )}

          {/* ── STEP: TYPE ── */}
          {step === 'TYPE' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Tipo de atención */}
              <div>
                <p className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                  1. Tipo de atención
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ATTENTION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setAttentionType(opt.value)}
                      className={`flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                        attentionType === opt.value
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div
                        className={`p-2 rounded-xl mt-0.5 ${
                          attentionType === opt.value
                            ? 'bg-indigo-500 text-white'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {opt.icon}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{opt.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tipo de consulta */}
              <div>
                <p className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                  2. Tipo de consulta
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CONSULTATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setConsultationType(opt.value)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 text-sm font-bold transition-all ${
                        consultationType === opt.value
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {opt.icon}
                      <span className="text-xs text-center leading-tight">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setStep('CALENDAR')}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-200"
              >
                <Calendar className="w-5 h-5" />
                Ver disponibilidad
              </button>
            </div>
          )}

          {/* ── STEP: CALENDAR ── */}
          {step === 'CALENDAR' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <button
                onClick={() => setStep('TYPE')}
                className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm font-bold mb-2"
              >
                <ChevronLeft className="w-4 h-4" /> Volver
              </button>

              {loadingAvail ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  <p className="text-gray-500 text-sm">Consultando disponibilidad en Google Calendar…</p>
                </div>
              ) : availableDates.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 mx-auto text-gray-200 mb-3" />
                  <p className="text-gray-500 font-semibold">No hay slots disponibles en este momento.</p>
                  <button
                    onClick={fetchAvailability}
                    className="mt-3 text-indigo-600 font-bold text-sm hover:underline"
                  >
                    Reintentar
                  </button>
                </div>
              ) : (
                <>
                  {/* Date picker (horizontal pager) */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                        3. Selecciona fecha
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setCalendarPage((p) => Math.max(0, p - 1))}
                          disabled={calendarPage === 0}
                          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-all"
                        >
                          <ChevronLeft className="w-4 h-4 text-gray-600" />
                        </button>
                        <span className="text-xs text-gray-500 font-semibold px-1">
                          {calendarPage + 1}/{totalPages}
                        </span>
                        <button
                          onClick={() => setCalendarPage((p) => Math.min(totalPages - 1, p + 1))}
                          disabled={calendarPage >= totalPages - 1}
                          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-all"
                        >
                          <ChevronRight className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                      {pagedDates.map((date) => (
                        <button
                          key={date}
                          onClick={() => {
                            setSelectedDate(date);
                            setSelectedSlot(null);
                          }}
                          className={`flex flex-col items-center p-2.5 rounded-2xl border-2 transition-all text-center ${
                            selectedDate === date
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                              : 'border-gray-200 hover:border-indigo-300 text-gray-600'
                          }`}
                        >
                          <span className="text-xs font-bold uppercase leading-tight">
                            {formatDateShort(date).split(' ')[0]}
                          </span>
                          <span className="text-lg font-black leading-tight">
                            {date.split('-')[2]}
                          </span>
                          <span className="text-xs text-gray-400 leading-tight">
                            {formatDateShort(date).split(' ').slice(1).join(' ')}
                          </span>
                          <span className={`mt-1 text-xs font-bold ${
                            selectedDate === date ? 'text-indigo-500' : 'text-gray-400'
                          }`}>
                            {(availability[date] || []).length} slots
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time slot grid */}
                  {selectedDate && (
                    <div className="animate-in fade-in duration-200">
                      <p className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
                        4. Selecciona hora — {formatDate(selectedDate)}
                      </p>
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                        {(availability[selectedDate] || []).map((slot) => (
                          <button
                            key={slot.time}
                            onClick={() => setSelectedSlot(slot)}
                            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                              selectedSlot?.time === slot.time
                                ? 'border-indigo-500 bg-indigo-500 text-white shadow-md'
                                : 'border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Next button */}
                  <button
                    onClick={() => setStep('CONFIRM')}
                    disabled={!selectedDate || !selectedSlot}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-200 disabled:shadow-none disabled:cursor-not-allowed"
                  >
                    Continuar
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── STEP: CONFIRM ── */}
          {step === 'CONFIRM' && selectedDate && selectedSlot && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <button
                onClick={() => setStep('CALENDAR')}
                className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm font-bold"
              >
                <ChevronLeft className="w-4 h-4" /> Volver
              </button>

              {/* Resumen de la cita */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
                <p className="text-xs font-bold text-indigo-500 uppercase tracking-wide mb-3">
                  Resumen de tu cita
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Fecha</p>
                    <p className="font-bold text-gray-900">{formatDate(selectedDate)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Hora</p>
                    <p className="font-bold text-gray-900">{selectedSlot.time} (30 min)</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Modalidad</p>
                    <p className="font-bold text-gray-900 flex items-center gap-1">
                      {attentionType === 'VIRTUAL' ? (
                        <><Video className="w-4 h-4 text-indigo-500" /> Virtual (Meet)</>
                      ) : (
                        <><MapPin className="w-4 h-4 text-indigo-500" /> Presencial</>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Consulta</p>
                    <p className="font-bold text-gray-900">
                      {CONSULTATION_OPTIONS.find(c => c.value === consultationType)?.label}
                    </p>
                  </div>
                  {attentionType === 'PRESENCIAL' && (
                    <div className="col-span-2">
                      <p className="text-gray-500 text-xs">Dirección</p>
                      <p className="font-bold text-gray-900">Calle 65 # 26-10</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Motivo */}
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-2">
                  5. Motivo de la consulta
                  <span className="ml-2 text-gray-400 font-normal">(máx. 300 caracteres)</span>
                </label>
                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value.slice(0, 300))}
                  rows={3}
                  placeholder="Describe brevemente el motivo de tu consulta…"
                  className="w-full border-2 border-gray-200 focus:border-indigo-400 rounded-xl p-3 text-sm resize-none outline-none transition-colors"
                />
                <p className="text-xs text-right text-gray-400 mt-1">{motivo.length}/300</p>
              </div>

              <button
                onClick={handleConfirm}
                disabled={motivo.trim().length < 10 || loadingSubmit}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-green-200 disabled:shadow-none disabled:cursor-not-allowed"
              >
                {loadingSubmit ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Agendando…</>
                ) : (
                  <><CheckCircle className="w-5 h-5" /> Confirmar cita</>
                )}
              </button>
              <p className="text-xs text-center text-gray-400">
                Recibirás un correo de confirmación con los detalles de tu cita.
              </p>
            </div>
          )}

          {/* ── STEP: SUCCESS ── */}
          {step === 'SUCCESS' && successData && (
            <div className="text-center py-6 animate-in fade-in zoom-in-95 duration-300 space-y-5">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mx-auto">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900">¡Cita agendada! 🎉</h3>
                <p className="text-gray-500 mt-1">
                  Te enviamos un correo a <strong>{successData.citizenEmail ?? 'tu email'}</strong> con los detalles.
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 text-left max-w-sm mx-auto">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fecha</span>
                    <span className="font-bold">{successData.fecha}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Hora</span>
                    <span className="font-bold">{successData.hora}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Modalidad</span>
                    <span className="font-bold">{successData.tipoAtencion}</span>
                  </div>
                  {successData.meetLink && (
                    <div className="pt-2 border-t border-gray-200">
                      <a
                        href={successData.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-2.5 rounded-xl hover:bg-indigo-700 transition-all text-sm"
                      >
                        <Video className="w-4 h-4" /> Unirse a la videollamada
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={resetFlow}
                  className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all text-sm"
                >
                  Agendar otra cita
                </button>
                <button
                  onClick={() => { setView('list'); resetFlow(); }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all text-sm"
                >
                  Ver mis citas
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
