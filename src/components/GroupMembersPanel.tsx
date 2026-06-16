import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Search,
  Shield,
  UserMinus,
  UserCheck,
  Ban,
  Pencil,
  Check,
  ChevronRight,
  Users,
  Activity,
  UserPlus,
  LogOut,
} from 'lucide-react';
import { businessService, GroupMemberDto, GroupMembershipLogEntry } from '../services/businessService';
import { useSocket } from '../context/useSocket';

interface PersonSearchResult {
  id: number;
  userId: string;
  nombre: string;
}

interface ConfirmDialogState {
  title: string;
  message: string;
  subMessage?: string;
  confirmLabel: string;
  danger: boolean;
  onConfirm: () => void;
}

interface GroupMembersPanelProps {
  groupId: number;
  groupName: string;
  currentUserId: string;
  currentUserRole?: string;
  onClose: () => void;
  onGroupRenamed: (newName: string) => void;
  onRemovedFromGroup: () => void;
}

const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-pink-500', 'bg-emerald-500',
  'bg-amber-500', 'bg-violet-500', 'bg-blue-500', 'bg-rose-500',
];

function colorFor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora mismo';
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

const ACTION_LABELS: Record<string, string> = {
  added: 'añadió a',
  removed: 'eliminó a',
  promoted: 'promovió a',
  banned: 'bloqueó a',
  left: 'abandonó el grupo',
};

export const GroupMembersPanel: React.FC<GroupMembersPanelProps> = ({
  groupId,
  groupName,
  currentUserId,
  currentUserRole,
  onClose,
  onGroupRenamed,
  onRemovedFromGroup,
}) => {
  const { memberRemovedEvents, memberPromotedEvents, groupNameChangedEvents, memberLeftEvents } = useSocket();

  const [members, setMembers] = useState<GroupMemberDto[]>([]);
  const [log, setLog] = useState<GroupMembershipLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'members' | 'log'>('members');
  const [renameMode, setRenameMode] = useState(false);
  const [newGroupName, setNewGroupName] = useState(groupName);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  // Add member state
  const [addMode, setAddMode] = useState(false);
  const [addSearch, setAddSearch] = useState('');
  const [addResults, setAddResults] = useState<PersonSearchResult[]>([]);
  const [addSearchLoading, setAddSearchLoading] = useState(false);
  const [addLoading, setAddLoading] = useState<string | null>(null);
  const addDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAdmin = currentUserRole === 'admin';

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [membersData, logData] = await Promise.all([
          businessService.getGroupMembers(groupId),
          businessService.getGroupMembershipLog(groupId),
        ]);
        setMembers(membersData);
        setLog(logData);
      } catch {
        setError('Error al cargar los miembros');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [groupId]);

  // React to member removed events
  useEffect(() => {
    if (!memberRemovedEvents.length) return;
    const ev = memberRemovedEvents[0];
    if (ev.groupId !== groupId) return;

    if (ev.removedUserId === currentUserId) {
      onClose();
      onRemovedFromGroup();
      return;
    }
    setMembers((prev) => prev.filter((m) => m.userId !== ev.removedUserId));
    setLog((prev) => [
      {
        id: Date.now(),
        groupId,
        action: 'removed',
        actorUserId: '',
        actorName: ev.removedByName,
        targetUserId: ev.removedUserId,
        targetName: prev.find((m) => m.userId === ev.removedUserId)?.nombre ?? 'Usuario',
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  }, [memberRemovedEvents]);

  // React to member left events (voluntary departure)
  useEffect(() => {
    if (!memberLeftEvents.length) return;
    const ev = memberLeftEvents[0];
    if (ev.groupId !== groupId) return;

    if (ev.leftUserId === currentUserId) return;
    setMembers((prev) => prev.filter((m) => m.userId !== ev.leftUserId));
    setLog((prev) => [
      {
        id: Date.now(),
        groupId,
        action: 'left',
        actorUserId: ev.leftUserId,
        actorName: ev.leftUserName,
        targetUserId: ev.leftUserId,
        targetName: ev.leftUserName,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  }, [memberLeftEvents]);

  // React to member promoted events
  useEffect(() => {
    if (!memberPromotedEvents.length) return;
    const ev = memberPromotedEvents[0];
    if (ev.groupId !== groupId) return;
    setMembers((prev) =>
      prev.map((m) => (m.userId === ev.promotedUserId ? { ...m, role: 'admin' } : m)),
    );
    setLog((prev) => [
      {
        id: Date.now(),
        groupId,
        action: 'promoted',
        actorUserId: '',
        actorName: ev.promotedByName,
        targetUserId: ev.promotedUserId,
        targetName: ev.promotedName,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  }, [memberPromotedEvents]);

  // React to group name changed events
  useEffect(() => {
    if (!groupNameChangedEvents.length) return;
    const ev = groupNameChangedEvents[0];
    if (ev.groupId !== groupId) return;
    setNewGroupName(ev.newName);
    onGroupRenamed(ev.newName);
  }, [groupNameChangedEvents]);

  const filteredMembers = members.filter((m) =>
    m.nombre.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleRemove = (targetUserId: string, targetName: string) => {
    setConfirmDialog({
      title: 'Eliminar del grupo',
      message: `¿Quieres eliminar a ${targetName} del grupo?`,
      subMessage: 'El usuario dejará de recibir mensajes del grupo.',
      confirmLabel: 'Eliminar',
      danger: true,
      onConfirm: async () => {
        setActionLoading(targetUserId);
        setError(null);
        try {
          await businessService.removeGroupMember(groupId, targetUserId);
          setMembers((prev) => prev.filter((m) => m.userId !== targetUserId));
        } catch (e: any) {
          setError(e.response?.data?.message ?? 'Error al eliminar miembro');
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handlePromote = async (targetUserId: string) => {
    setActionLoading(targetUserId);
    setError(null);
    try {
      await businessService.promoteGroupMember(groupId, targetUserId);
      setMembers((prev) =>
        prev.map((m) => (m.userId === targetUserId ? { ...m, role: 'admin' } : m)),
      );
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Error al promover');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBan = (targetUserId: string, targetName: string) => {
    setConfirmDialog({
      title: `Bloquear a ${targetName}`,
      message: 'Será removido del grupo y no podrá volver a ser añadido.',
      confirmLabel: 'Bloquear',
      danger: true,
      onConfirm: async () => {
        setActionLoading(targetUserId);
        setError(null);
        try {
          await businessService.banGroupMember(groupId, targetUserId);
          setMembers((prev) => prev.filter((m) => m.userId !== targetUserId));
        } catch (e: any) {
          setError(e.response?.data?.message ?? 'Error al bloquear');
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handleLeaveGroup = () => {
    const otherAdmins = members.filter((m) => m.role === 'admin' && m.userId !== currentUserId);
    const isSoleMember = members.length === 1;

    if (isAdmin && !isSoleMember && otherAdmins.length === 0) {
      setConfirmDialog({
        title: 'No puedes abandonar el grupo',
        message: 'Eres el único administrador. Debes promover a otro miembro como administrador antes de abandonar.',
        confirmLabel: 'Entendido',
        danger: false,
        onConfirm: () => {},
      });
      return;
    }

    setConfirmDialog({
      title: isSoleMember ? 'Abandonar y eliminar grupo' : 'Abandonar grupo',
      message: isSoleMember
        ? 'Eres el único miembro. El grupo y todos sus mensajes serán eliminados permanentemente.'
        : `¿Seguro que quieres abandonar "${groupName}"?`,
      subMessage: isSoleMember
        ? 'Esta acción no se puede deshacer.'
        : 'Dejarás de recibir mensajes del grupo. Podrás volver a unirte si es público.',
      confirmLabel: isSoleMember ? 'Eliminar y salir' : 'Abandonar',
      danger: true,
      onConfirm: async () => {
        setActionLoading('leaving');
        setError(null);
        try {
          await businessService.leaveGroup(groupId);
          onClose();
          onRemovedFromGroup();
        } catch (e: any) {
          setError(e.response?.data?.message ?? 'Error al abandonar el grupo');
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  // Debounce search for add-member mode
  useEffect(() => {
    if (addDebounceRef.current) clearTimeout(addDebounceRef.current);
    if (addSearch.length < 2) {
      setAddResults([]);
      setAddSearchLoading(false);
      return;
    }
    setAddSearchLoading(true);
    addDebounceRef.current = setTimeout(async () => {
      try {
        const results: PersonSearchResult[] = await businessService.searchPersons(addSearch);
        const memberIds = new Set(members.map((m) => m.userId));
        setAddResults(results.filter((p) => !memberIds.has(p.userId)));
      } catch {
        setAddResults([]);
      } finally {
        setAddSearchLoading(false);
      }
    }, 300);
    return () => {
      if (addDebounceRef.current) clearTimeout(addDebounceRef.current);
    };
  }, [addSearch, members]);

  const handleAddMember = async (person: PersonSearchResult) => {
    setAddLoading(person.userId);
    setError(null);
    try {
      const newMember = await businessService.addGroupMember(groupId, person.userId);
      setMembers((prev) => [...prev, newMember]);
      setLog((prev) => [
        {
          id: Date.now(),
          groupId,
          action: 'added',
          actorUserId: currentUserId,
          actorName: 'Tú',
          targetUserId: person.userId,
          targetName: person.nombre,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setAddSearch('');
      setAddResults([]);
      setAddMode(false);
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Error al añadir miembro');
    } finally {
      setAddLoading(null);
    }
  };

  const handleRename = async () => {
    const trimmed = newGroupName.trim();
    if (!trimmed || trimmed === groupName) {
      setRenameMode(false);
      return;
    }
    setError(null);
    try {
      await businessService.renameGroup(groupId, trimmed);
      onGroupRenamed(trimmed);
      setRenameMode(false);
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Error al renombrar el grupo');
    }
  };

  return (
    <div className="absolute inset-0 bg-white z-20 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {renameMode ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                autoFocus
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename();
                  if (e.key === 'Escape') { setRenameMode(false); setNewGroupName(groupName); }
                }}
                className="flex-1 text-base font-bold border-b-2 border-blue-500 outline-none bg-transparent"
              />
              <button
                onClick={handleRename}
                className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <p className="font-bold text-gray-900 truncate">{newGroupName}</p>
              {isAdmin && (
                <button
                  onClick={() => setRenameMode(true)}
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition flex-shrink-0"
                  title="Renombrar grupo"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-500 flex-shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-4 mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar miembro..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
          />
        </div>
      </div>

      {/* Add member (admin only) */}
      {isAdmin && (
        <div className="px-4 py-2.5 border-b border-gray-100">
          {!addMode ? (
            <button
              onClick={() => setAddMode(true)}
              className="flex items-center gap-1.5 text-sm text-blue-600 font-semibold hover:text-blue-700 transition"
            >
              <UserPlus className="w-4 h-4" />
              Añadir miembro
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    autoFocus
                    value={addSearch}
                    onChange={(e) => setAddSearch(e.target.value)}
                    placeholder="Buscar persona..."
                    className="w-full pl-8 pr-4 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                  />
                </div>
                <button
                  onClick={() => { setAddMode(false); setAddSearch(''); setAddResults([]); }}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {addSearchLoading && (
                <p className="text-xs text-gray-400 px-1">Buscando...</p>
              )}

              {!addSearchLoading && addResults.length > 0 && (
                <ul className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm max-h-44 overflow-y-auto">
                  {addResults.map((person) => (
                    <li key={person.userId}>
                      <button
                        onClick={() => handleAddMember(person)}
                        disabled={addLoading === person.userId}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 transition text-left disabled:opacity-60"
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${colorFor(person.userId)}`}
                        >
                          {initials(person.nombre)}
                        </div>
                        <p className="flex-1 text-sm font-medium text-gray-900 truncate">{person.nombre}</p>
                        {addLoading === person.userId ? (
                          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                        ) : (
                          <UserPlus className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {!addSearchLoading && addSearch.length >= 2 && addResults.length === 0 && (
                <p className="text-xs text-gray-400 px-1">Sin resultados</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-100 px-4">
        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-1.5 px-3 py-3 text-sm font-semibold border-b-2 transition mr-2 ${
            activeTab === 'members'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-4 h-4" />
          Miembros {members.length > 0 && `(${members.length})`}
        </button>
        <button
          onClick={() => setActiveTab('log')}
          className={`flex items-center gap-1.5 px-3 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'log'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Activity className="w-4 h-4" />
          Actividad
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500 text-sm">
            Cargando miembros…
          </div>
        ) : activeTab === 'members' ? (
          <ul className="divide-y divide-gray-50">
            {filteredMembers.length === 0 ? (
              <li className="py-12 text-center text-gray-400 text-sm">
                {searchQuery ? 'Sin resultados' : 'No hay miembros'}
              </li>
            ) : (
              filteredMembers.map((member) => {
                const isCurrentUser = member.userId === currentUserId;
                const isMemberAdmin = member.role === 'admin';
                const isBeingActedOn = actionLoading === member.userId;
                const canActOn = isAdmin && !isCurrentUser && !isMemberAdmin;

                return (
                  <li key={member.userId} className="px-4 py-3 hover:bg-gray-50 transition">
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${colorFor(member.userId)}`}
                      >
                        {initials(member.nombre)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {member.nombre}
                            {isCurrentUser && (
                              <span className="text-gray-400 font-normal"> (tú)</span>
                            )}
                          </p>
                          {isMemberAdmin && (
                            <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full flex-shrink-0">
                              <Shield className="w-2.5 h-2.5" />
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Desde {formatDate(member.joinedAt)}
                        </p>

                        {/* Admin action buttons */}
                        {canActOn && (
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => handlePromote(member.userId)}
                              disabled={isBeingActedOn}
                              className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-lg transition disabled:opacity-50"
                            >
                              <UserCheck className="w-3 h-3" />
                              Promover
                            </button>
                            <button
                              onClick={() => handleRemove(member.userId, member.nombre)}
                              disabled={isBeingActedOn}
                              className="flex items-center gap-1 text-[11px] font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition disabled:opacity-50"
                            >
                              <UserMinus className="w-3 h-3" />
                              Eliminar
                            </button>
                            <button
                              onClick={() => handleBan(member.userId, member.nombre)}
                              disabled={isBeingActedOn}
                              className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-2 py-1 rounded-lg transition disabled:opacity-50"
                            >
                              <Ban className="w-3 h-3" />
                              Bloquear
                            </button>
                          </div>
                        )}
                      </div>

                      {isBeingActedOn && (
                        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        ) : (
          // Activity log tab
          <ul className="divide-y divide-gray-50">
            {log.length === 0 ? (
              <li className="py-12 text-center text-gray-400 text-sm">Sin actividad registrada</li>
            ) : (
              log.map((entry) => (
                <li key={entry.id} className="px-4 py-3 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {entry.action === 'added' && <ChevronRight className="w-3.5 h-3.5 text-green-500" />}
                    {entry.action === 'removed' && <UserMinus className="w-3.5 h-3.5 text-red-500" />}
                    {entry.action === 'promoted' && <Shield className="w-3.5 h-3.5 text-amber-500" />}
                    {entry.action === 'banned' && <Ban className="w-3.5 h-3.5 text-gray-500" />}
                    {entry.action === 'left' && <LogOut className="w-3.5 h-3.5 text-orange-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">
                      {entry.action === 'left' ? (
                        <>
                          <span className="font-semibold">{entry.actorName}</span>{' '}
                          {ACTION_LABELS[entry.action]}
                        </>
                      ) : (
                        <>
                          <span className="font-semibold">{entry.actorName}</span>{' '}
                          {ACTION_LABELS[entry.action]}{' '}
                          <span className="font-semibold">{entry.targetName}</span>
                        </>
                      )}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{timeAgo(entry.createdAt)}</p>
                  </div>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {/* Leave group button — visible to all members */}
      <div className="px-4 py-3 border-t border-gray-100">
        <button
          onClick={handleLeaveGroup}
          disabled={actionLoading === 'leaving'}
          className="flex items-center gap-2 w-full justify-center text-sm font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl transition disabled:opacity-50"
        >
          {actionLoading === 'leaving' ? (
            <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
          Abandonar grupo
        </button>
      </div>

      {/* Custom confirm dialog */}
      {confirmDialog && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-black/25 backdrop-blur-[2px]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex flex-col gap-1.5">
              <h3 className="text-base font-bold text-gray-900">{confirmDialog.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{confirmDialog.message}</p>
              {confirmDialog.subMessage && (
                <p className="text-xs text-gray-400">{confirmDialog.subMessage}</p>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm transition active:scale-95 ${
                  confirmDialog.danger
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupMembersPanel;
