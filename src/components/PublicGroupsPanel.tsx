import React, { useEffect, useState } from 'react';
import { X, Search, Users, LogIn, CheckCircle, Loader2 } from 'lucide-react';
import { businessService } from '../services/businessService';

interface PublicGroup {
  id: number;
  name: string;
  description?: string | null;
  isPublic: boolean;
  imageUrl?: string | null;
  memberCount: number;
}

interface Props {
  onClose: () => void;
  onJoined: (groupId: number) => void;
  myGroupIds: number[];
}

const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-pink-500', 'bg-emerald-500',
  'bg-amber-500', 'bg-violet-500', 'bg-blue-500', 'bg-rose-500',
];

function colorFor(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function GroupAvatar({ group }: { group: PublicGroup }) {
  const isEmoji =
    group.imageUrl && group.imageUrl.length <= 2;
  if (isEmoji) {
    return (
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 ${colorFor(group.id)}`}
      >
        {group.imageUrl}
      </div>
    );
  }
  return (
    <div
      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${colorFor(group.id)}`}
    >
      {initials(group.name)}
    </div>
  );
}

export function PublicGroupsPanel({ onClose, onJoined, myGroupIds }: Props) {
  const [groups, setGroups] = useState<PublicGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [joiningId, setJoiningId] = useState<number | null>(null);
  const [joinedIds, setJoinedIds] = useState<Set<number>>(new Set(myGroupIds));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    businessService.getPublicGroups()
      .then(setGroups)
      .catch(() => setError('No se pudieron cargar los grupos públicos'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = groups.filter((g) => {
    const q = search.toLowerCase();
    return (
      g.name.toLowerCase().includes(q) ||
      (g.description ?? '').toLowerCase().includes(q)
    );
  });

  const handleJoin = async (groupId: number) => {
    setJoiningId(groupId);
    setError(null);
    try {
      await businessService.joinPublicGroup(groupId);
      setJoinedIds((prev) => new Set([...prev, groupId]));
      onJoined(groupId);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ?? 'No se pudo unir al grupo. Intenta de nuevo.';
      setError(msg);
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-gray-900">Grupos Públicos</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition"
            />
          </div>
          {error && (
            <p className="mt-2 text-xs text-red-500 font-medium">{error}</p>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <p className="text-sm">Cargando grupos...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="bg-gray-100 rounded-full p-4 mb-3">
                <Users className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-500">
                {search ? 'Sin resultados' : 'No hay grupos públicos'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {search ? 'Prueba con otro término' : 'Aún no se ha creado ningún grupo público'}
              </p>
            </div>
          ) : (
            filtered.map((group) => {
              const isMember = joinedIds.has(group.id);
              const isJoining = joiningId === group.id;
              return (
                <div
                  key={group.id}
                  className="flex items-start gap-3 p-3 rounded-2xl hover:bg-gray-50 transition"
                >
                  <GroupAvatar group={group} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-gray-900 truncate">{group.name}</p>
                      {isMember ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold flex-shrink-0">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Ya miembro
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleJoin(group.id)}
                          disabled={isJoining}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-xs font-semibold rounded-xl transition flex-shrink-0"
                        >
                          {isJoining ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <LogIn className="w-3 h-3" />
                          )}
                          Unirse
                        </button>
                      )}
                    </div>
                    {group.description && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {group.description}
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-1.5 text-gray-400">
                      <Users className="w-3 h-3" />
                      <span className="text-xs">{group.memberCount} miembro{group.memberCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
