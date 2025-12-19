import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { mockNotifications, formatTimeAgo, Notification } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import logoWhite from '@/assets/logo-white.svg';

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(mockNotifications);

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  const handleAccept = (id: string) => {
    console.log('Accepted convoy invite:', id);
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const handleDecline = (id: string) => {
    console.log('Declined convoy invite:', id);
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const getNotificationContent = (notification: Notification) => {
    if (notification.type === 'convoy_invite') {
      return (
        <div className="flex-1 min-w-0">
          <p className="text-foreground text-sm">
            <span className="font-semibold">{notification.user.name}</span>{' '}
            <span className="text-muted-foreground">{notification.message}</span>
          </p>
          {notification.tripName && (
            <p className="text-primary text-sm font-medium mt-0.5">
              "{notification.tripName}"
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {formatTimeAgo(notification.createdAt)}
          </p>
          {/* Accept/Decline Buttons */}
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 px-4"
              onClick={(e) => {
                e.stopPropagation();
                handleAccept(notification.id);
              }}
            >
              <Check className="h-4 w-4 mr-1" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-border text-foreground h-8 px-4"
              onClick={(e) => {
                e.stopPropagation();
                handleDecline(notification.id);
              }}
            >
              <X className="h-4 w-4 mr-1" />
              Decline
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 min-w-0">
        <p className="text-foreground text-sm">
          <span className="font-semibold">{notification.user.name}</span>{' '}
          <span className="text-muted-foreground">{notification.message}</span>
        </p>
        {notification.tripName && (
          <p className="text-primary text-sm font-medium mt-0.5">
            "{notification.tripName}"
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {formatTimeAgo(notification.createdAt)}
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background safe-top">
      {/* Header - Back Arrow + Centered Logo */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => navigate(-1)}
            className="text-foreground p-2 -ml-2"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <img src={logoWhite} alt="RoadTribe" className="h-6" />
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Notifications List */}
      <div className="divide-y divide-border">
        {notifications.map(notification => (
          <button
            key={notification.id}
            onClick={() => {
              markAsRead(notification.id);
              if (notification.type === 'follow') {
                navigate(`/user/${notification.user.id}`);
              }
            }}
            className={cn(
              "w-full flex items-start gap-3 p-4 hover:bg-secondary/50 transition-colors text-left",
              !notification.isRead && "bg-primary/5"
            )}
          >
            <Avatar className="h-12 w-12">
              <AvatarImage src={notification.user.avatar} alt={notification.user.name} />
              <AvatarFallback>{notification.user.name[0]}</AvatarFallback>
            </Avatar>
            {getNotificationContent(notification)}
            {!notification.isRead && (
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
            )}
          </button>
        ))}
      </div>

      {notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
            <Bell className="h-8 w-8 text-muted-foreground" />
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

// Need to import Bell for empty state
import { Bell } from 'lucide-react';

export default Notifications;
