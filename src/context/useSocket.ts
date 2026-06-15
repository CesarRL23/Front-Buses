import { useContext } from 'react';
import { SocketContext } from './SocketContext';

export type { MessagePayload, ReadReceiptPayload, GroupMessageReadPayload, MessageDeletedPayload } from './SocketContext';

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket debe usarse dentro de SocketProvider');
  return ctx;
};
