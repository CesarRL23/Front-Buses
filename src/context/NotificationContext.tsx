import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type AppNotification = {
  id: string;
  title: string;
  message: string;
  routeName: string;
  placa: string;
  etaMinutes: number;
  actionLabel?: string;
  onAction?: () => void;
  timestamp: number;
  read: boolean;
};

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notification: Omit<AppNotification, 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const NotificationProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const addNotification = useCallback((notification: Omit<AppNotification, 'timestamp' | 'read'>) => {
    setNotifications((current) => {
      const exists = current.some((item) => item.id === notification.id);
      if (exists) {
        return current;
      }
      return [
        {
          ...notification,
          timestamp: Date.now(),
          read: false,
        },
        ...current,
      ];
    });
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((current) => current.map((item) => (item.id === id ? { ...item, read: true } : item)));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((current) => current.filter((item) => item.id !== id));
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  );

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, addNotification, markAsRead, markAllAsRead, removeNotification }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextValue => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};
