import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, UserPlus, Users, Flag } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { mockNotifications, formatTimeAgo, Notification } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(mockNotifications);

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'like':
        return <Flag className="h-4 w-4 text-primary" />;
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'follow':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'convoy_invite':
        return <Users className="h-4 w-4 text-orange-500" />;
      case 'trip_complete':
        return <Flag className="h-4 w-4 text-primary" />;
      default:
        return null;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-background safe-top">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => navigate(-1)}
            className="text-foreground"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold text-foreground flex-1">
            Notifications
          </h1>
          {unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
      </header>

      {/* Notifications List */}
      <div className="divide-y divide-border">
        {notifications.map(notification => (
          <button
            key={notification.id}
            onClick={() => {
              markAsRead(notification.id);
              // Navigate based on notification type
              if (notification.type === 'follow') {
                navigate(`/user/${notification.user.id}`);
              }
            }}
            className={cn(
              "w-full flex items-start gap-3 p-4 hover:bg-secondary/50 transition-colors text-left",
              !notification.isRead && "bg-primary/5"
            )}
          >
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage src={notification.user.avatar} alt={notification.user.name} />
                <AvatarFallback>{notification.user.name[0]}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-card rounded-full p-1">
                {getIcon(notification.type)}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-foreground">
                <span className="font-semibold">{notification.user.name}</span>{' '}
                <span className="text-muted-foreground">{notification.message}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatTimeAgo(notification.createdAt)}
              </p>
            </div>
            {!notification.isRead && (
              <div className="w-2 h-2 bg-primary rounded-full mt-2" />
            )}
          </button>
        ))}
      </div>

      {notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
            <Heart className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground">No notifications yet</h3>
          <p className="text-sm text-muted-foreground text-center mt-1">
            When someone likes or comments on your trips, you'll see it here
          </p>
        </div>
      )}
    </div>
  );
};

export default Notifications;
