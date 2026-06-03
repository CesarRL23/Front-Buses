import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  Search,
  Send,
  MapPin,
  Smile,
  MoreVertical,
  Phone,
  Video,
  User,
  Check,
  CheckCheck,
  Circle,
  Plus,
  X,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';
import { useSocket, MessagePayload } from '../context/useSocket';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  text: string;
  time: string;
  mine: boolean;
  read: boolean;
  readAt?: string;
  latitud?: number;
  longitud?: number;
}

interface Chat {
  id: string;
  type: 'individual';
  name: string;
  avatar: string;
  avatarColor: string;
  lastMessage: string;
  time: string;
  unread: number;
  messages: ChatMessage[];
}

interface PersonResult {
  id: number;
  nombre: string;
  userId: string;
}

const NEST_URL = 'http://localhost:3000';
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

function colorFor(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function payloadToMsg(msg: MessagePayload, myUserId: string): ChatMessage {
  return {
    id: String(msg.id),
    text: msg.contenido,
    time: fmtTime(msg.fechaDeEnvio),
    mine: msg.emisor === myUserId,
    read: msg.leido,
    readAt: msg.fechaLectura,
    latitud: msg.latitud,
    longitud: msg.longitud,
  };
}

function buildChats(sent: MessagePayload[], received: MessagePayload[], myUserId: string): Chat[] {
  const map = new Map<string, Chat>();

  const allMsgs = [...sent, ...received].sort(
    (a, b) => new Date(a.fechaDeEnvio).getTime() - new Date(b.fechaDeEnvio).getTime(),
  );

  for (const msg of allMsgs) {
    const otherId = msg.emisor === myUserId ? msg.receptor : msg.emisor;
    if (!otherId) continue;

    if (!map.has(otherId)) {
      map.set(otherId, {
        id: otherId,
        type: 'individual',
        name: otherId.slice(-6),
        avatar: '?',
        avatarColor: colorFor(otherId),
        lastMessage: '',
        time: '',
        unread: 0,
        messages: [],
      });
    }

    const chat = map.get(otherId)!;
    chat.messages.push(payloadToMsg(msg, myUserId));
    chat.lastMessage = msg.contenido;
    chat.time = fmtTime(msg.fechaDeEnvio);
    if (msg.emisor !== myUserId && !msg.leido) chat.unread++;
  }

  return Array.from(map.values());
}

// ── Sub-components ────────────────────────────────────────────────────────────

const Avatar: React.FC<{ chat: Chat; size?: 'sm' | 'md' | 'lg' }> = ({ chat, size = 'md' }) => {
  const sizes = { sm: 'w-9 h-9 text-xs', md: 'w-11 h-11 text-sm', lg: 'w-14 h-14 text-base' };
  return (
    <div className={`${sizes[size]} ${chat.avatarColor} rounded-full flex items-center justify-center font-black text-white flex-shrink-0`}>
      {chat.avatar}
    </div>
  );
};

const ChatListItem: React.FC<{ chat: Chat; active: boolean; onClick: () => void }> = ({ chat, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-left ${
      active ? 'bg-blue-50 border border-blue-100' : 'hover:bg-gray-50 border border-transparent'
    }`}
  >
    <Avatar chat={chat} />
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-baseline gap-1">
        <p className={`font-bold truncate text-sm ${active ? 'text-blue-700' : 'text-gray-900'}`}>{chat.name}</p>
        <span className="text-xs text-gray-400 flex-shrink-0">{chat.time}</span>
      </div>
      <div className="flex justify-between items-center gap-1 mt-0.5">
        <p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p>
        {chat.unread > 0 && (
          <span className="bg-blue-600 text-white text-xs font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 flex-shrink-0">
            {chat.unread}
          </span>
        )}
      </div>
    </div>
  </button>
);

// ── Main component ────────────────────────────────────────────────────────────

export const ConductorChatPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { incomingMessages, sentConfirmations, readReceipts, sendMessage, markRead, clearUnread, connected, lastMessageError, clearMessageError } = useSocket();

  const myUserId = user?.id ?? '';

  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pendingLocation, setPendingLocation] = useState<{ latitud: number; longitud: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const [showNewChat, setShowNewChat] = useState(false);
  const [personSearch, setPersonSearch] = useState('');
  const [personResults, setPersonResults] = useState<PersonResult[]>([]);
  const [searchingPersons, setSearchingPersons] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Load message history on mount ──
  useEffect(() => {
    if (!myUserId || !token) return;

    const load = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [sentRes, receivedRes] = await Promise.all([
          axios.get<MessagePayload[]>(`${NEST_URL}/message/sent`, { headers }),
          axios.get<MessagePayload[]>(`${NEST_URL}/message/received`, { headers }),
        ]);
        const built = buildChats(sentRes.data, receivedRes.data, myUserId);
        setChats(built);

        const resolved = await Promise.all(
          built.map(async (chat) => {
            try {
              const { data } = await axios.get<{ nombre: string }>(
                `${NEST_URL}/person/by-user-id/${chat.id}`,
                { headers },
              );
              if (data?.nombre) {
                return { ...chat, name: data.nombre, avatar: initials(data.nombre) };
              }
            } catch { /* sin registro Person, mantener nombre truncado */ }
            return chat;
          }),
        );
        setChats(resolved);
      } catch {
        // silencioso — el usuario simplemente verá la lista vacía
      }
    };

    load();
    clearUnread();
  }, [myUserId, token]);

  // ── Handle incoming real-time messages ──
  useEffect(() => {
    if (!incomingMessages.length || !myUserId) return;
    const msg = incomingMessages[0];
    const otherId = msg.emisor === myUserId ? msg.receptor : msg.emisor;
    if (!otherId) return;

    setChats((prev) => {
      const existing = prev.find((c) => c.id === otherId);
      const newMsg = payloadToMsg(msg, myUserId);

      if (existing) {
        return prev.map((c) =>
          c.id === otherId
            ? {
                ...c,
                messages: [...c.messages, newMsg],
                lastMessage: msg.contenido,
                time: fmtTime(msg.fechaDeEnvio),
                unread: c.id === selectedChatId ? 0 : c.unread + 1,
              }
            : c,
        );
      }

      return [
        {
          id: otherId,
          type: 'individual',
          name: otherId.slice(-6),
          avatar: '?',
          avatarColor: colorFor(otherId),
          lastMessage: msg.contenido,
          time: fmtTime(msg.fechaDeEnvio),
          unread: selectedChatId === otherId ? 0 : 1,
          messages: [newMsg],
        },
        ...prev,
      ];
    });

    if (selectedChatId === otherId) {
      markRead(msg.id);
    }
  }, [incomingMessages]);

  // ── Handle sent confirmations ──
  useEffect(() => {
    if (!sentConfirmations.length || !myUserId) return;
    const msg = sentConfirmations[0];
    const otherId = msg.receptor;
    if (!otherId) return;

    setChats((prev) =>
      prev.map((c) =>
        c.id === otherId
          ? {
              ...c,
              messages: c.messages.map((m) =>
                m.id === 'pending' ? payloadToMsg(msg, myUserId) : m,
              ),
              lastMessage: msg.contenido,
              time: fmtTime(msg.fechaDeEnvio),
            }
          : c,
      ),
    );
  }, [sentConfirmations]);

  // ── Handle read receipts ──
  useEffect(() => {
    if (!readReceipts.length) return;
    const receipt = readReceipts[0];

    setChats((prev) =>
      prev.map((c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.id === String(receipt.messageId)
            ? { ...m, read: true, readAt: receipt.fechaLectura }
            : m,
        ),
      })),
    );
  }, [readReceipts]);

  // ── Scroll to bottom ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedChatId, chats]);

  // ── Person search (debounced) ──
  useEffect(() => {
    if (!personSearch.trim() || personSearch.length < 2) {
      setPersonResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingPersons(true);
      try {
        const res = await axios.get<PersonResult[]>(
          `${NEST_URL}/person/search?q=${encodeURIComponent(personSearch)}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setPersonResults(res.data.filter((p) => p.userId !== myUserId));
      } catch {
        setPersonResults([]);
      } finally {
        setSearchingPersons(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [personSearch]);

  const filteredChats = chats.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const selectedChat = chats.find((c) => c.id === selectedChatId) ?? null;

  const handleSelectChat = (id: string) => {
    setSelectedChatId(id);
    setSidebarOpen(false);

    const chat = chats.find((c) => c.id === id);
    if (chat) {
      const unreadIds = chat.messages
        .filter((m) => !m.mine && !m.read)
        .map((m) => Number(m.id))
        .filter((n) => !isNaN(n));
      unreadIds.forEach((mid) => markRead(mid));
      setChats((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
    }
  };

  const handleStartChatWith = (person: PersonResult) => {
    setShowNewChat(false);
    setPersonSearch('');
    setPersonResults([]);

    const existing = chats.find((c) => c.id === person.userId);
    if (existing) {
      handleSelectChat(person.userId);
      return;
    }

    const newChat: Chat = {
      id: person.userId,
      type: 'individual',
      name: person.nombre,
      avatar: initials(person.nombre),
      avatarColor: colorFor(person.userId),
      lastMessage: '',
      time: '',
      unread: 0,
      messages: [],
    };
    setChats((prev) => [newChat, ...prev]);
    handleSelectChat(person.userId);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChatId) return;

    const optimistic: ChatMessage = {
      id: 'pending',
      text: newMessage.trim(),
      time: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false }),
      mine: true,
      read: false,
      latitud: pendingLocation?.latitud,
      longitud: pendingLocation?.longitud,
    };

    setChats((prev) =>
      prev.map((c) =>
        c.id === selectedChatId
          ? {
              ...c,
              messages: [...c.messages, optimistic],
              lastMessage: newMessage.trim(),
              time: optimistic.time,
            }
          : c,
      ),
    );

    sendMessage(selectedChatId, newMessage.trim(), pendingLocation ?? undefined);
    setNewMessage('');
    setPendingLocation(null);
  };

  const handleRequestLocation = () => {
    if (!navigator.geolocation) return;
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPendingLocation({ latitud: pos.coords.latitude, longitud: pos.coords.longitude });
        setLoadingLocation(false);
      },
      () => setLoadingLocation(false),
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex h-[calc(100vh-140px)] bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

          {/* ── Sidebar ──────────────────────────────────────────────── */}
          <aside
            className={`${
              sidebarOpen ? 'flex' : 'hidden md:flex'
            } flex-col w-full md:w-80 lg:w-96 border-r border-gray-100 flex-shrink-0`}
          >
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => navigate('/conductor')}
                  className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition text-sm font-semibold"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver
                </button>
                <div className="flex flex-col items-center">
                  <h1 className="text-xl font-black text-gray-900">Mensajes</h1>
                  {!connected && (
                    <span className="text-[10px] text-red-500 font-semibold">sin conexión</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewChat(true)}
                  title="Nuevo mensaje"
                  className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar conversación..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {filteredChats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="bg-gray-100 rounded-full p-4 mb-3">
                    <User className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-500">Sin conversaciones</p>
                  <p className="text-xs text-gray-400 mt-1">Toca + para iniciar una</p>
                </div>
              ) : (
                filteredChats.map((chat) => (
                  <ChatListItem
                    key={chat.id}
                    chat={chat}
                    active={selectedChatId === chat.id}
                    onClick={() => handleSelectChat(chat.id)}
                  />
                ))
              )}
            </div>
          </aside>

          {/* ── Chat area ────────────────────────────────────────────── */}
          {selectedChat ? (
            <div className={`${sidebarOpen ? 'hidden md:flex' : 'flex'} flex-1 flex-col min-w-0`}>

              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="md:hidden p-1.5 rounded-xl hover:bg-gray-100 transition"
                    onClick={() => setSidebarOpen(true)}
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <Avatar chat={selectedChat} size="md" />
                  <div>
                    <p className="font-black text-gray-900">{selectedChat.name}</p>
                    <p className="text-xs text-gray-500">Conversación privada</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button type="button" title="Llamar" className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-500 hover:text-blue-600">
                    <Phone className="w-5 h-5" />
                  </button>
                  <button type="button" title="Videollamar" className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-500 hover:text-blue-600">
                    <Video className="w-5 h-5" />
                  </button>
                  <button type="button" title="Más opciones" className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-500">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-gray-50/40">
                {selectedChat.messages.map((msg, idx) => (
                  <div key={msg.id === 'pending' ? `pending-${idx}` : msg.id} className={`flex ${msg.mine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[70%] px-4 py-2.5 rounded-2xl shadow-sm ${
                        msg.mine
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
                          msg.read
                            ? <CheckCheck className="w-3 h-3 text-blue-200" title={msg.readAt ? `Leído: ${new Date(msg.readAt).toLocaleString('es-CO')}` : 'Leído'} />
                            : <Check className="w-3 h-3" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form
                onSubmit={handleSendMessage}
                className="px-6 py-4 border-t border-gray-100 bg-white flex items-end gap-3"
              >
                <button
                  type="button"
                  title={pendingLocation ? 'Ubicación adjunta — clic para quitar' : 'Adjuntar ubicación actual'}
                  onClick={pendingLocation ? () => setPendingLocation(null) : handleRequestLocation}
                  className={`p-2.5 rounded-xl transition flex-shrink-0 ${
                    pendingLocation
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
                        handleSendMessage(e as unknown as React.FormEvent);
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
            </div>
          ) : (
            <div className="flex-1 hidden md:flex flex-col items-center justify-center text-center px-8">
              <div className="bg-blue-50 rounded-full p-6 mb-4">
                <Circle className="w-10 h-10 text-blue-300" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Selecciona una conversación</h3>
              <p className="text-sm text-gray-500 max-w-xs">
                Elige un chat de la lista o toca <strong>+</strong> para iniciar uno nuevo.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* ── New Chat Modal ────────────────────────────────────────────── */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-gray-900">Nuevo mensaje</h2>
              <button
                type="button"
                onClick={() => { setShowNewChat(false); setPersonSearch(''); setPersonResults([]); }}
                className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={personSearch}
                onChange={(e) => setPersonSearch(e.target.value)}
                autoFocus
                className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition"
              />
            </div>

            <div className="space-y-1 max-h-64 overflow-y-auto">
              {searchingPersons && (
                <p className="text-center text-sm text-gray-400 py-4">Buscando...</p>
              )}
              {!searchingPersons && personSearch.length >= 2 && personResults.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-4">No se encontraron personas</p>
              )}
              {personResults.map((p) => (
                <button
                  key={p.userId}
                  type="button"
                  onClick={() => handleStartChatWith(p)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-blue-50 transition text-left"
                >
                  <div className={`w-10 h-10 ${colorFor(p.userId)} rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0`}>
                    {initials(p.nombre)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{p.nombre}</p>
                    <p className="text-xs text-gray-400">ID: {p.userId.slice(-6)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {lastMessageError && (
        <div
          role="alert"
          onClick={clearMessageError}
          className="fixed bottom-4 right-4 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl shadow-lg text-sm flex items-center gap-2 z-50 cursor-pointer max-w-sm"
        >
          <span className="font-semibold">Error al enviar:</span>
          <span className="flex-1">{lastMessageError}</span>
          <span className="text-red-400 text-xs ml-1">✕</span>
        </div>
      )}
    </div>
  );
};

export default ConductorChatPage;
