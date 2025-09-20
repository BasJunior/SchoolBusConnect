import { useState, useEffect } from "react";
import { useAuth } from "@/App";
import { useToast } from "@/hooks/use-toast";
import { Bell, X, Check, AlertTriangle, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Simulate real-time notifications for demo
  useEffect(() => {
    if (!user) return;

    const simulateNotifications = () => {
      const demoNotifications: Notification[] = [];

      if (user.userType === 'passenger') {
        demoNotifications.push({
          id: 'booking-confirmed',
          type: 'success',
          title: 'Booking Confirmed',
          message: 'Your booking to Eastgate Mall has been confirmed. Departure at 06:45.',
          timestamp: new Date(Date.now() - 30000), // 30 seconds ago
          read: false,
          actionUrl: '/bookings',
          actionText: 'View Details'
        });
      } else if (user.userType === 'driver') {
        demoNotifications.push({
          id: 'new-booking',
          type: 'info',
          title: 'New Booking Request',
          message: 'You have a new booking request from John Doe for tomorrow.',
          timestamp: new Date(Date.now() - 60000), // 1 minute ago
          read: false,
          actionUrl: '/driver',
          actionText: 'Respond'
        });
      }

      setNotifications(demoNotifications);
      setUnreadCount(demoNotifications.filter(n => !n.read).length);
    };

    // Simulate notifications after a short delay
    const timer = setTimeout(simulateNotifications, 2000);
    return () => clearTimeout(timer);
  }, [user]);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const removeNotification = (notificationId: string) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Show toast for new notifications
    toast({
      title: notification.title,
      description: notification.message,
      action: notification.actionUrl && notification.actionText ? (
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.location.href = notification.actionUrl!}
        >
          {notification.actionText}
        </Button>
      ) : undefined,
    });
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    addNotification
  };
}

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useNotifications();

  if (!isOpen) return null;

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getBadgeVariant = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'error':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={onClose}>
      <div 
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-lg transform transition-transform duration-300 ease-in-out"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Notifications</h2>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                Mark all read
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No notifications yet</p>
              <p className="text-sm">We'll notify you about important updates</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`cursor-pointer transition-colors ${
                  !notification.read ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <Badge variant={getBadgeVariant(notification.type)} className="text-xs">
                            {notification.type}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-6 h-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                        {notification.actionUrl && notification.actionText && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = notification.actionUrl!;
                            }}
                          >
                            {notification.actionText}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export { useNotifications };
