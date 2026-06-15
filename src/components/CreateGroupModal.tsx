import React, { useEffect, useState } from 'react';
import { Search, Users, X, Check, Globe, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { businessService } from '../services/businessService';
import { useNotification } from '../context/NotificationContext';

interface PersonResult {
  id: number;
  nombre: string;
  userId: string;
}

const EMOJI_OPTIONS = ['🚌', '🚍', '📍', '👥', '💬', '🚨', '✅', '⭐'];
const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-pink-500', 'bg-emerald-500',
  'bg-amber-500', 'bg-violet-500', 'bg-blue-500', 'bg-rose-500',
];

function colorFor(idStr: string) {
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (group: any) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ open, onClose, onCreated }) => {
  const { user } = useAuth();
  const { addNotification } = useNotification();

  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formIsPublic, setFormIsPublic] = useState(true);
  const [formImage, setFormImage] = useState('💬');

  const [personSearch, setPersonSearch] = useState('');
  const [personResults, setPersonResults] = useState<PersonResult[]>([]);
  const [searchingPersons, setSearchingPersons] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<PersonResult[]>([]);
  const [creating, setCreating] = useState(false);

  // Person search (debounced)
  useEffect(() => {
    if (!personSearch.trim() || personSearch.length < 2) {
      setPersonResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingPersons(true);
      try {
        const res = await businessService.searchPersons(personSearch);
        const filtered = res.filter(
          (p: PersonResult) =>
            p.userId !== user?.id &&
            !selectedMembers.some((m) => m.userId === p.userId),
        );
        setPersonResults(filtered);
      } catch {
        setPersonResults([]);
      } finally {
        setSearchingPersons(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [personSearch, selectedMembers, user]);

  const resetForm = () => {
    setFormName('');
    setFormDesc('');
    setFormIsPublic(true);
    setFormImage('💬');
    setPersonSearch('');
    setPersonResults([]);
    setSelectedMembers([]);
  };

  const handleAddMember = (person: PersonResult) => {
    setSelectedMembers((prev) => [...prev, person]);
    setPersonSearch('');
    setPersonResults([]);
  };

  const handleRemoveMember = (userId: string) => {
    setSelectedMembers((prev) => prev.filter((m) => m.userId !== userId));
  };

  const handleCreateGroup = async () => {
    if (!formName.trim() || selectedMembers.length < 2 || !user?.id) return;

    setCreating(true);
    try {
      const payload = {
        name: formName.trim(),
        description: formDesc.trim() || undefined,
        isPublic: formIsPublic,
        imageUrl: formImage,
        creatorUserId: String(user.id),
        memberUserIds: selectedMembers.map((m) => m.userId),
      };

      const group = await businessService.createGroup(payload);

      addNotification({
        id: `group-created-${Date.now()}`,
        title: 'Grupo Creado',
        message: `El grupo "${payload.name}" ha sido creado con éxito.`,
        routeName: 'Grupos',
        placa: '---',
        etaMinutes: 0,
      });

      resetForm();
      onCreated(group);
    } catch (err: any) {
      console.error('Error creating group:', err);
      alert(err.response?.data?.message || 'Error al crear el grupo');
    } finally {
      setCreating(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            Crear Nuevo Grupo
          </h2>
          <button
            onClick={() => { resetForm(); onClose(); }}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* Image & Basic Info */}
          <div className="flex gap-4 items-start">
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-gray-200">
                {formImage}
              </div>
              <div className="flex flex-wrap w-24 gap-1 justify-center">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setFormImage(emoji)}
                    className={`text-sm p-1 rounded-lg hover:bg-gray-100 transition ${formImage === emoji ? 'bg-blue-50 border border-blue-200 scale-110' : ''}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">Nombre del Grupo *</label>
                <input
                  type="text"
                  placeholder="Ej. Viajeros Ruta 15"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">Descripción</label>
                <textarea
                  rows={2}
                  placeholder="¿Cuál es el propósito del grupo?"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition resize-none"
                />
              </div>
            </div>
          </div>

          {/* Privacy Toggle */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 block">Privacidad del Grupo</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormIsPublic(true)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  formIsPublic
                    ? 'bg-white border-green-500 shadow-sm ring-1 ring-green-500'
                    : 'border-gray-200 hover:bg-white'
                }`}
              >
                <div className={`p-2 rounded-lg ${formIsPublic ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <p className={`font-bold text-sm ${formIsPublic ? 'text-gray-900' : 'text-gray-600'}`}>Público</p>
                  <p className="text-[10px] text-gray-500">Cualquiera puede unirse</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFormIsPublic(false)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  !formIsPublic
                    ? 'bg-white border-amber-500 shadow-sm ring-1 ring-amber-500'
                    : 'border-gray-200 hover:bg-white'
                }`}
              >
                <div className={`p-2 rounded-lg ${!formIsPublic ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <p className={`font-bold text-sm ${!formIsPublic ? 'text-gray-900' : 'text-gray-600'}`}>Privado</p>
                  <p className="text-[10px] text-gray-500">Solo por invitación</p>
                </div>
              </button>
            </div>
          </div>

          {/* Members Selection */}
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">
              Agregar Miembros * <span className="text-gray-400 normal-case font-normal">(Mín. 2 requeridos)</span>
            </label>

            {/* Selected Chips */}
            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedMembers.map((member) => (
                  <div key={member.userId} className="flex items-center gap-2 bg-blue-50 border border-blue-100 pl-2 pr-1 py-1 rounded-full text-xs font-semibold text-blue-700">
                    {member.nombre}
                    <button
                      onClick={() => handleRemoveMember(member.userId)}
                      className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar persona por nombre..."
                value={personSearch}
                onChange={(e) => setPersonSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition"
              />

              {/* Results Dropdown */}
              {personSearch.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden z-20 max-h-48 overflow-y-auto">
                  {searchingPersons ? (
                    <div className="p-4 text-center text-xs text-gray-500">Buscando...</div>
                  ) : personResults.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-500">No se encontraron personas</div>
                  ) : (
                    personResults.map((p) => (
                      <button
                        key={p.userId}
                        type="button"
                        onClick={() => handleAddMember(p)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition text-left border-b border-gray-50 last:border-0"
                      >
                        <div className={`w-8 h-8 ${colorFor(p.userId)} rounded-full flex items-center justify-center text-white text-xs font-black`}>
                          {p.nombre
                            .split(' ')
                            .slice(0, 2)
                            .map((w) => w[0])
                            .join('')
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{p.nombre}</p>
                          <p className="text-[10px] text-gray-500">ID: {p.userId.slice(-6)}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-500">
            Seleccionados: <span className={selectedMembers.length >= 2 ? 'text-green-600' : 'text-amber-600'}>{selectedMembers.length}/2 mín.</span>
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { resetForm(); onClose(); }}
              className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition text-sm"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreateGroup}
              disabled={!formName.trim() || selectedMembers.length < 2 || creating}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 text-sm flex items-center gap-2"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {creating ? 'Creando...' : 'Confirmar y Crear'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;
