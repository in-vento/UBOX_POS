'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, X, Trash2, ExternalLink } from 'lucide-react';
import { useNotifications } from '@/contexts/notification-context';
import { cn } from '@/lib/utils';

export function NotificationDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications, removeNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const handleNotificationClick = (id: string, actionUrl?: string) => {
    markAsRead(id);
    if (actionUrl) {
      window.location.href = actionUrl;
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleClearAll = () => {
    clearNotifications();
    setIsOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <div className="w-2 h-2 bg-green-500 rounded-full" />;
      case 'warning':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full" />;
      case 'error':
        return <div className="w-2 h-2 bg-red-500 rounded-full" />;
      default:
        return <div className="w-2 h-2 bg-blue-500 rounded-full" />;
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)} h`;
    return `Hace ${Math.floor(diffInMinutes / 1440)} días`;
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notificaciones</span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 max-h-96">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificaciones</span>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="h-auto p-1 text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                Marcar todo como leído
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-auto p-1 text-xs text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Limpiar
              </Button>
            )}
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No tienes notificaciones</p>
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  'p-3 cursor-pointer flex flex-col items-start gap-2',
                  !notification.read && 'bg-blue-50/50'
                )}
                onClick={() => handleNotificationClick(notification.id, notification.actionUrl)}
              >
                <div className="flex items-start gap-2 w-full">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm truncate">{notification.title}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(notification.timestamp)}
                      </span>
                      {notification.actionUrl && (
                        <span className="text-xs text-blue-600 flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" />
                          {notification.actionLabel || 'Ver'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
        
        {notifications.length > 0 && (
          <DropdownMenuSeparator />
        )}
        
        <DropdownMenuItem asChild>
          <Button
            variant="ghost"
            className="w-full justify-center text-sm"
            asChild
          >
            <a href="/devices">Ver todos los dispositivos</a>
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}