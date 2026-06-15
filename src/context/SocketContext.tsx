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
import { businessService } from '../services/businessService';

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
  messageType?: 'CHAT' | 'ANNOUNCEMENT';
  announcementId?: number;
  isUrgent?: boolean;
}

export interface ReadReceiptPayload {
  messageId: number;
  fechaLectura: string;
}

export interface AnnouncementPayload {
  id: number;
  title: string;
  message: string;
  isUrgent: boolean;
  createdAt: string;
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
  const { addNotification, setOnMarkAnnouncementRead } = useNotification();
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

    socket.on('announcement', (payload: AnnouncementPayload) => {
      addNotification({
        id: `announcement-${payload.id}`,
        title: payload.title,
        message: payload.message,
        kind: 'announcement',
        isUrgent: payload.isUrgent,
        announcementId: payload.id,
      });
    });

    socket.on('urgent_announcement', (payload: AnnouncementPayload) => {
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification(payload.title, { body: payload.message });
      }
    });

    // Sincroniza avisos pendientes recibidos mientras el usuario estaba desconectado
    businessService.getMyAnnouncements().then((announcements: any[]) => {
      announcements.forEach((announcement) => {
        if (announcement.read) return;
        addNotification({
          id: `announcement-${announcement.id}`,
          title: announcement.title,
          message: announcement.message,
          kind: 'announcement',
          isUrgent: announcement.isUrgent,
          announcementId: announcement.id,
        });
      });
    }).catch(() => {});

    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [isAuthenticated, token]);

  useEffect(() => {
    setOnMarkAnnouncementRead((announcementId: number) => {
      businessService.markAnnouncementRead(announcementId).catch(() => {});
    });
  }, [setOnMarkAnnouncementRead]);

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

