import React, {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from './NotificationContext';

export interface MessagePayload {
  id: number;
  contenido: string;
  emisor: string;
  receptor: string;
  fechaDeEnvio: string;
  leido: boolean;
  fechaLectura?: string;
  latitud?: number;
  longitud?: number;
}

export interface ReadReceiptPayload {
  messageId: number;
  fechaLectura: string;
}

interface SocketContextType {
  connected: boolean;
  incomingMessages: MessagePayload[];
  sentConfirmations: MessagePayload[];
  readReceipts: ReadReceiptPayload[];
  unreadCount: number;
  lastMessageError: string | null;
  sendMessage: (
    receptor: string,
    contenido: string,
    ubicacion?: { latitud: number; longitud: number },
  ) => void;
  markRead: (messageId: number) => void;
  clearUnread: () => void;
  clearMessageError: () => void;
}

export const SocketContext = createContext<SocketContextType | undefined>(undefined);

const NEST_URL = 'http://localhost:3000';

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, token } = useAuth();
  const { addNotification } = useNotification();
  const socketRef = useRef<Socket | null>(null);

  const [connected, setConnected] = useState(false);
  const [incomingMessages, setIncomingMessages] = useState<MessagePayload[]>([]);
  const [sentConfirmations, setSentConfirmations] = useState<MessagePayload[]>([]);
  const [readReceipts, setReadReceipts] = useState<ReadReceiptPayload[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastMessageError, setLastMessageError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    const socket = io(`${NEST_URL}/messages`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));

    socket.on('new_message', (msg: MessagePayload) => {
      setIncomingMessages((prev) => [msg, ...prev]);
      setUnreadCount((n) => n + 1);
    });

    socket.on('message_sent', (msg: MessagePayload) => {
      setSentConfirmations((prev) => [msg, ...prev]);
    });

    socket.on('message_read', (receipt: ReadReceiptPayload) => {
      setReadReceipts((prev) => [receipt, ...prev]);
    });

    socket.on('read_receipt', (receipt: ReadReceiptPayload) => {
      setReadReceipts((prev) => [receipt, ...prev]);
    });

    socket.on('message_error', (payload: { error: string; detail?: string }) => {
      const msg = payload.detail ? `${payload.error}: ${payload.detail}` : payload.error;
      setLastMessageError(msg);
    });

    socket.on('group_added', (payload: { groupId: number; groupName: string; addedBy: string }) => {
      addNotification({
        id: `group-${payload.groupId}-${Date.now()}`,
        title: 'Nuevo Grupo',
        message: `Te han añadido al grupo "${payload.groupName}"`,
        routeName: 'Grupos',
        placa: '---',
        etaMinutes: 0,
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [isAuthenticated, token]);

  const sendMessage = useCallback(
    (receptor: string, contenido: string, ubicacion?: { latitud: number; longitud: number }) => {
      socketRef.current?.emit('send_message', { receptor, contenido, ...ubicacion });
    },
    [],
  );

  const markRead = useCallback((messageId: number) => {
    socketRef.current?.emit('mark_read', { messageId });
  }, []);

  const clearUnread = useCallback(() => setUnreadCount(0), []);
  const clearMessageError = useCallback(() => setLastMessageError(null), []);

  return (
    <SocketContext.Provider
      value={{
        connected,
        incomingMessages,
        sentConfirmations,
        readReceipts,
        unreadCount,
        lastMessageError,
        sendMessage,
        markRead,
        clearUnread,
        clearMessageError,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

