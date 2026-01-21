'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Also show as toast for immediate visibility
    toast({
      title: notification.title,
      description: notification.message,
      variant: notification.type === 'error' ? 'destructive' : 'default',
    });
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Simulate real-time notifications for device approvals
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/devices');
        if (response.ok) {
          const result = await response.json();
          const pendingDevices = result.data?.filter((d: any) => d.status === 'pending') || [];
          
          // Check if there are new pending devices
          const existingPendingNotifications = notifications.filter(
            n => n.type === 'warning' && n.title.includes('Dispositivo Pendiente')
          );

          if (pendingDevices.length > existingPendingNotifications.length) {
            addNotification({
              type: 'warning',
              title: 'Dispositivo Pendiente de Aprobación',
              message: `${pendingDevices.length} dispositivo(s) esperan tu autorización para acceder al sistema.`,
              actionUrl: '/devices',
              actionLabel: 'Revisar Dispositivos',
            });
          }
        }
      } catch (error) {
        // Silent fail for polling
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [notifications, addNotification]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        removeNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}