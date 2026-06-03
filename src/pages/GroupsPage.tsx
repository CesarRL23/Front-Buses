import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Users,
  Plus,
  X,
  Check,
  Globe,
  Lock,
  Shield,
  Loader2,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';
import { businessService } from '../services/businessService';
import { useNotification } from '../context/NotificationContext';

interface Group {
  id: number;
  name: string;
  description: string | null;
  isPublic: boolean;
  imageUrl: string | null;
  personGroups?: any[];
  myRole?: string;
}

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

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function colorFor(idStr: string) {
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export const GroupsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formIsPublic, setFormIsPublic] = useState(true);
  const [formImage, setFormImage] = useState('💬'); // Default emoji
  
  // Member Search State
  const [personSearch, setPersonSearch] = useState('');
  const [personResults, setPersonResults] = useState<PersonResult[]>([]);
  const [searchingPersons, setSearchingPersons] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<PersonResult[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadGroups();
    }
  }, [user]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const data = await businessService.getGroupsByUserId(String(user?.id));
      setGroups(data);
    } catch (err) {
      console.error('Error loading groups:', err);
    } finally {
      setLoading(false);
    }
  };

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
        // Exclude current user and already selected members
        const filtered = res.filter(
          (p: PersonResult) => 
            p.userId !== user?.id && 
            !selectedMembers.some(m => m.userId === p.userId)
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

  const handleAddMember = (person: PersonResult) => {
    setSelectedMembers(prev => [...prev, person]);
    setPersonSearch('');
    setPersonResults([]);
  };

  const handleRemoveMember = (userId: string) => {
    setSelectedMembers(prev => prev.filter(m => m.userId !== userId));
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
        memberUserIds: selectedMembers.map(m => m.userId),
      };

      await businessService.createGroup(payload);
      
      addNotification({
        id: `group-created-${Date.now()}`,
        title: 'Grupo Creado',
        message: `El grupo "${payload.name}" ha sido creado con éxito.`,
        routeName: 'Grupos',
        placa: '---',
        etaMinutes: 0,
      });

      setShowModal(false);
      setFormName('');
      setFormDesc('');
      setFormIsPublic(true);
      setFormImage('💬');
      setSelectedMembers([]);
      loadGroups();
    } catch (err: any) {
      console.error('Error creating group:', err);
      alert(err.response?.data?.message || 'Error al crear el grupo');
    } finally {
      setCreating(false);
    }
  };

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button
                type="button"
                onClick={() => navigate('/ciudadano')}
                className="p-2 rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
                title="Volver"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Mis Grupos</h1>
            </div>
            <p className="text-gray-500 text-sm ml-12">
              Comunícate y organízate con otros ciudadanos de tu comunidad.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Crear Grupo
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar grupo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition shadow-sm font-medium"
          />
        </div>

        {/* Group List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-blue-600">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p className="font-semibold text-gray-500">Cargando grupos...</p>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <Users className="w-10 h-10 text-blue-300" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Aún no estás en ningún grupo</h3>
            <p className="text-gray-500 max-w-sm mb-6">
              Crea tu propio grupo de comunicación para interactuar con otros ciudadanos sobre rutas e incidencias.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold rounded-xl transition-colors"
            >
              Comenzar ahora
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map(group => (
              <div 
                key={group.id} 
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group cursor-pointer"
                onClick={() => navigate(`/mensajes?groupId=${group.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 ${group.imageUrl?.length === 1 || group.imageUrl?.length === 2 ? 'bg-gray-100' : colorFor(String(group.id))} rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-gray-100 flex-shrink-0 text-white font-black`}>
                    {group.imageUrl?.length === 1 || group.imageUrl?.length === 2 ? group.imageUrl : initials(group.name)}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {group.isPublic ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                        <Globe className="w-3 h-3" /> Público
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                        <Lock className="w-3 h-3" /> Privado
                      </span>
                    )}
                    {group.myRole === 'admin' && (
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                        <Shield className="w-3 h-3" /> Admin
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="font-black text-gray-900 text-lg mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">{group.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px] mb-4">
                  {group.description || 'Sin descripción'}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold">
                    <Users className="w-4 h-4" />
                    <span>{group.personGroups?.length || 0} miembros</span>
                  </div>
                  <span className="text-blue-600 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                    Abrir <ArrowLeft className="w-4 h-4 rotate-180" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Creation Modal */}
      {showModal && (
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
                onClick={() => setShowModal(false)}
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
                    {EMOJI_OPTIONS.map(emoji => (
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
                    {selectedMembers.map(member => (
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
                        personResults.map(p => (
                          <button
                            key={p.userId}
                            type="button"
                            onClick={() => handleAddMember(p)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition text-left border-b border-gray-50 last:border-0"
                          >
                            <div className={`w-8 h-8 ${colorFor(p.userId)} rounded-full flex items-center justify-center text-white text-xs font-black`}>
                              {initials(p.nombre)}
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
                  onClick={() => setShowModal(false)}
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
      )}
    </div>
  );
};

export default GroupsPage;
