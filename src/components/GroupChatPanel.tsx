import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Send,
  MapPin,
  Smile,
  Phone,
  Video,
  MoreVertical,
  Check,
  CheckCheck,
  Users,
  Trash2,
} from 'lucide-react';
import { GroupMessageReadPayload } from '../context/useSocket';
import { GroupMembersPanel } from './GroupMembersPanel';

export interface GroupChatMessage {
  id: string;
  text: string;
  time: string;
  mine: boolean;
  read: boolean;
  readAt?: string;
  latitud?: number;
  longitud?: number;
  senderId?: string;
  senderRole?: 'citizen' | 'driver';
}

export interface GroupDetails {
  id: number;
  name: string;
  description?: string | null;
  isPublic: boolean;
  imageUrl?: string | null;
  personGroups?: Array<{ person: { id: number; nombre: string; userId: string }; role?: string }>;
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

function roleLabel(role?: 'citizen' | 'driver') {
  return role === 'driver' ? 'CONDUCTOR' : 'CIUDADANO';
}

interface GroupChatPanelProps {
  groupChat: GroupDetails;
  groupMessages: GroupChatMessage[];
  groupLoading: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  newMessage: string;
  setNewMessage: (val: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  pendingLocation: { latitud: number; longitud: number } | null;
  setPendingLocation: (loc: { latitud: number; longitud: number } | null) => void;
  loadingLocation: boolean;
  onRequestLocation: () => void;
  onMarkRead: (messageId: number) => void;
  groupMessageReads: GroupMessageReadPayload[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
  currentUserId: string;
  onGroupUpdated?: (group: GroupDetails) => void;
  onRemovedFromGroup?: (groupId: number) => void;
  onDeleteMessage?: (messageId: number) => void;
}

export const GroupChatPanel: React.FC<GroupChatPanelProps> = ({
  groupChat,
  groupMessages,
  groupLoading,
  sidebarOpen,
  setSidebarOpen,
  newMessage,
  setNewMessage,
  onSendMessage,
  pendingLocation,
  setPendingLocation,
  loadingLocation,
  onRequestLocation,
  onMarkRead,
  groupMessageReads,
  messagesEndRef,
  currentUserId,
  onGroupUpdated,
  onRemovedFromGroup,
  onDeleteMessage,
}) => {
  const [membersOpen, setMembersOpen] = useState(false);

  const currentUserRole = groupChat.personGroups?.find(
    (pg) => pg.person.userId === currentUserId,
  )?.role;

  const isAdmin = currentUserRole === 'admin';

  // Marca como leídos los mensajes ajenos del grupo a medida que se muestran
  useEffect(() => {
    groupMessages.forEach((msg) => {
      if (!msg.mine && msg.id !== 'pending') {
        const id = Number(msg.id);
        if (!isNaN(id)) onMarkRead(id);
      }
    });
  }, [groupMessages]);

  const liveReadCount = (messageId: number) =>
    new Set(groupMessageReads.filter((r) => r.messageId === messageId).map((r) => r.userId)).size;

  const senderName = (msg: GroupChatMessage) => {
    if (msg.mine) return 'Tú';
    const member = groupChat.personGroups?.find((pg) => pg.person.userId === msg.senderId);
    return member?.person.nombre ?? 'Usuario';
  };

  return (
    <div className={`${sidebarOpen ? 'hidden md:flex' : 'flex'} flex-1 flex-col min-w-0 relative`}>
      {/* Group chat header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="md:hidden p-1.5 rounded-xl hover:bg-gray-100 transition"
            onClick={() => setSidebarOpen(true)}
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black text-white ${groupChat.imageUrl?.length === 1 || groupChat.imageUrl?.length === 2 ? 'bg-gray-400' : colorFor(String(groupChat.id))}`}>
            {groupChat.imageUrl?.length === 1 || groupChat.imageUrl?.length === 2 ? groupChat.imageUrl : initials(groupChat.name)}
          </div>
          <div>
            <p className="font-black text-gray-900">{groupChat.name}</p>
            <p className="text-xs text-gray-500">Chat del grupo</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button type="button" title="Llamar" className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-500 hover:text-blue-600">
            <Phone className="w-5 h-5" />
          </button>
          <button type="button" title="Videollamar" className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-500 hover:text-blue-600">
            <Video className="w-5 h-5" />
          </button>
          <button
            type="button"
            title="Ver participantes"
            className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-500 hover:text-blue-600"
            onClick={() => setMembersOpen(true)}
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-gray-50/40">
        {groupLoading ? (
          <div className="flex h-full items-center justify-center py-20 text-gray-500">
            Cargando conversación del grupo…
          </div>
        ) : groupMessages.length > 0 ? (
          groupMessages.map((msg, idx) => {
            const messageId = Number(msg.id);
            return (
              <div key={msg.id === 'pending' ? `pending-${idx}` : msg.id} className={`flex ${msg.mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex flex-col max-w-[85%] min-w-0 ${msg.mine ? 'items-end' : 'items-start'}`}>
                  <p className={`text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1 px-1 truncate w-full`}>
                    {senderName(msg)} - {roleLabel(msg.senderRole)}
                  </p>
                  <div className="relative group/msg w-full">
                    <div className={`px-4 py-2.5 rounded-2xl shadow-sm ${msg.mine
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-white text-gray-900 border border-gray-100 rounded-bl-sm'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      {(msg.latitud != null && msg.longitud != null) && (
                        <a
                          href={`https://maps.google.com/?q=${msg.latitud},${msg.longitud}`}
                          target="_blank"
                          rel="noreferrer"
                          className={`flex items-center gap-1 text-[10px] mt-1 underline ${msg.mine ? 'text-blue-200' : 'text-blue-500'}`}
                        >
                          <MapPin className="w-3 h-3" /> Ver ubicación
                        </a>
                      )}
                      <div className={`flex items-center justify-end gap-1 mt-1 ${msg.mine ? 'text-blue-200' : 'text-gray-400'}`}>
                        <span className="text-[10px]">{msg.time}</span>
                        {msg.mine && (
                          liveReadCount(messageId) > 0
                            ? <CheckCheck className="w-3 h-3" />
                            : <Check className="w-3 h-3" />
                        )}
                      </div>
                    </div>

                    {/* Admin delete button — visible on hover */}
                    {isAdmin && msg.id !== 'pending' && (
                      <button
                        onClick={() => onDeleteMessage?.(messageId)}
                        title="Eliminar mensaje"
                        className={`absolute top-0 hidden group-hover/msg:flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-500 hover:bg-red-200 transition z-10 -translate-y-1 ${msg.mine ? 'left-0 -translate-x-1' : 'right-0 translate-x-1'}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 py-16">
            <Users className="w-10 h-10 mb-4" />
            <p className="font-semibold">Bienvenido al chat de grupo</p>
            <p className="text-sm mt-2">Aquí puedes hablar con los integrantes de <strong>{groupChat.name}</strong>.</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={onSendMessage}
        className="px-6 py-4 border-t border-gray-100 bg-white flex items-end gap-3"
      >
        <button
          type="button"
          title={pendingLocation ? 'Ubicación adjunta — clic para quitar' : 'Adjuntar ubicación actual'}
          onClick={pendingLocation ? () => setPendingLocation(null) : onRequestLocation}
          className={`p-2.5 rounded-xl transition flex-shrink-0 ${pendingLocation
              ? 'bg-blue-100 text-blue-600'
              : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
            }`}
        >
          {loadingLocation ? (
            <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <MapPin className="w-5 h-5" />
          )}
        </button>

        <div className="flex-1 relative">
          <textarea
            rows={1}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSendMessage(e as unknown as React.FormEvent);
              }
            }}
            placeholder="Escribe un mensaje... (máx. 500 caracteres)"
            maxLength={500}
            className="w-full resize-none bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition pr-10 max-h-32"
          />
          <button type="button" title="Emoji" className="absolute right-3 bottom-3 text-gray-400 hover:text-blue-500 transition">
            <Smile className="w-4 h-4" />
          </button>
        </div>
        <button
          type="submit"
          title="Enviar mensaje"
          disabled={!newMessage.trim()}
          className="p-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl shadow-sm transition-all active:scale-95 flex-shrink-0"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

      {pendingLocation && (
        <div className="px-6 pb-2 bg-white flex items-center gap-2 text-xs text-blue-600">
          <MapPin className="w-3 h-3" />
          Ubicación adjunta ({pendingLocation.latitud.toFixed(4)}, {pendingLocation.longitud.toFixed(4)})
        </div>
      )}

      {/* Members panel overlay */}
      {membersOpen && (
        <GroupMembersPanel
          groupId={groupChat.id}
          groupName={groupChat.name}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          onClose={() => setMembersOpen(false)}
          onGroupRenamed={(name) => {
            onGroupUpdated?.({ ...groupChat, name });
          }}
          onRemovedFromGroup={() => {
            setMembersOpen(false);
            onRemovedFromGroup?.(groupChat.id);
          }}
        />
      )}
    </div>
  );
};

export default GroupChatPanel;
