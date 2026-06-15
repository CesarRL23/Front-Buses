import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Users,
  Globe,
  Lock,
  Shield,
  Loader2,
  Send,
  CheckSquare,
  Square,
  Megaphone,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';
import { businessService } from '../services/businessService';
import { useSocket } from '../context/useSocket';
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

export const ConductorGroupsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sendMessage } = useSocket();
  const { addNotification } = useNotification();

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [broadcastText, setBroadcastText] = useState('');
  const [sending, setSending] = useState(false);

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

  const toggleSelected = (groupId: number) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId],
    );
  };

  const handleSendBroadcast = () => {
    if (!broadcastText.trim() || selectedGroupIds.length === 0) return;

    setSending(true);
    selectedGroupIds.forEach((groupId) => {
      sendMessage(`group-${groupId}`, broadcastText.trim(), 'driver');
    });

    addNotification({
      id: `broadcast-${Date.now()}`,
      title: 'Mensaje Enviado',
      message: `Tu mensaje fue enviado a ${selectedGroupIds.length} grupo(s).`,
      routeName: 'Grupos',
      placa: '---',
      etaMinutes: 0,
    });

    setBroadcastText('');
    setSelectedGroupIds([]);
    setSending(false);
  };

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()),
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
                onClick={() => navigate('/conductor')}
                className="p-2 rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
                title="Volver"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Mis Grupos</h1>
            </div>
            <p className="text-gray-500 text-sm ml-12">
              Selecciona uno o varios grupos para enviarles un aviso como conductor.
            </p>
          </div>
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
            <h3 className="text-xl font-black text-gray-900 mb-2">No perteneces a ningún grupo</h3>
            <p className="text-gray-500 max-w-sm">
              Cuando seas agregado a un grupo de pasajeros, podrás enviarles mensajes desde aquí.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-32">
            {filteredGroups.map((group) => {
              const isSelected = selectedGroupIds.includes(group.id);
              return (
                <div
                  key={group.id}
                  className={`bg-white rounded-2xl p-6 border shadow-sm hover:shadow-md transition-all group cursor-pointer ${
                    isSelected ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-100'
                  }`}
                  onClick={() => navigate(`/conductor/mensajes?groupId=${group.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 ${group.imageUrl?.length === 1 || group.imageUrl?.length === 2 ? 'bg-gray-100' : colorFor(String(group.id))} rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-gray-100 flex-shrink-0 text-white font-black`}>
                      {group.imageUrl?.length === 1 || group.imageUrl?.length === 2 ? group.imageUrl : initials(group.name)}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button
                        type="button"
                        title={isSelected ? 'Quitar de destinatarios' : 'Agregar a destinatarios'}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelected(group.id);
                        }}
                        className={`p-1.5 rounded-lg transition ${isSelected ? 'text-blue-600 bg-blue-50' : 'text-gray-300 hover:text-gray-400'}`}
                      >
                        {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                      </button>
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
              );
            })}
          </div>
        )}
      </main>

      {/* Broadcast composer */}
      {selectedGroupIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-2xl z-40">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 flex items-end gap-3">
            <div className="flex-shrink-0 flex items-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-xl">
              <Megaphone className="w-4 h-4" />
              {selectedGroupIds.length} grupo{selectedGroupIds.length > 1 ? 's' : ''} seleccionado{selectedGroupIds.length > 1 ? 's' : ''}
            </div>
            <textarea
              rows={1}
              value={broadcastText}
              onChange={(e) => setBroadcastText(e.target.value)}
              placeholder="Escribe el mensaje que recibirán todos los miembros de los grupos seleccionados..."
              maxLength={500}
              className="flex-1 resize-none bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition max-h-32"
            />
            <button
              type="button"
              onClick={handleSendBroadcast}
              disabled={!broadcastText.trim() || sending}
              className="p-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl shadow-sm transition-all active:scale-95 flex-shrink-0"
              title="Enviar a los grupos seleccionados"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConductorGroupsPage;
