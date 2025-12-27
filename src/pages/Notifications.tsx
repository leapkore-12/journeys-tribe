import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, Bell, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useNotifications, useMarkAsRead, useRealtimeNotifications, useDeleteNotification } from '@/hooks/useNotifications';
import { useAcceptFollowRequest, useDeclineFollowRequest } from '@/hooks/useFollows';
import { useConvoyInvites } from '@/hooks/useConvoyInvites';
import { cn } from '@/lib/utils';
import logoWhite from '@/assets/logo-white.svg';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

const Notifications = () => {
  const navigate = useNavigate();
  const { data: notifications, isLoading } = useNotifications();
  const markAsRead = useMarkAsRead();
  const deleteNotification = useDeleteNotification();
  const acceptRequest = useAcceptFollowRequest();
  const declineRequest = useDeclineFollowRequest();
  const { acceptConvoyInvite, declineConvoyInvite, useMyPendingConvoyInvites } = useConvoyInvites();
  const { data: pendingConvoyInvites = [] } = useMyPendingConvoyInvites();
  
  // Enable real-time updates
  useRealtimeNotifications();

  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id);
  };

  const handleAccept = (actorId: string) => {
    acceptRequest.mutate(actorId);
  };

  const handleDecline = (actorId: string) => {
    declineRequest.mutate(actorId);
  };

  // Find convoy invite by trip_id to get the invite id
  const findConvoyInvite = (tripId: string | null) => {
    if (!tripId) return null;
    return pendingConvoyInvites.find(invite => invite.trip_id === tripId);
  };

  const handleAcceptConvoyInvite = (tripId: string | null, notificationId: string) => {
    const invite = findConvoyInvite(tripId);
    if (invite) {
      acceptConvoyInvite.mutate(
        { inviteId: invite.id, tripId: invite.trip_id },
        {
          onSuccess: () => {
            deleteNotification.mutate(notificationId);
            // Navigate to the active trip page
            navigate('/trip/active');
          }
        }
      );
    }
  };

  const handleDeclineConvoyInvite = (tripId: string | null, notificationId: string) => {
    const invite = findConvoyInvite(tripId);
    if (invite) {
      declineConvoyInvite.mutate(
        { inviteId: invite.id },
        {
          onSuccess: () => {
            deleteNotification.mutate(notificationId);
          }
        }
      );
    }
  };

  const getNotificationContent = (notification: typeof notifications extends (infer T)[] | undefined ? T : never) => {
    if (!notification) return null;
    
    const actorName = notification.actor?.display_name || notification.actor?.username || 'Someone';
    const timeAgo = notification.created_at 
      ? formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })
      : '';

    // Follow request - show Accept/Decline buttons
    if (notification.type === 'follow_request') {
      return (
        <div className="flex-1 min-w-0">
          <p className="text-foreground text-sm">
            <span className="font-semibold">{actorName}</span>{' '}
            <span className="text-muted-foreground">wants to follow you</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
          {/* Accept/Decline Buttons */}
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 px-4"
              disabled={acceptRequest.isPending}
              onClick={(e) => {
                e.stopPropagation();
                if (notification.actor_id) handleAccept(notification.actor_id);
              }}
            >
              <Check className="h-4 w-4 mr-1" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-border text-foreground h-8 px-4"
              disabled={declineRequest.isPending}
              onClick={(e) => {
                e.stopPropagation();
                if (notification.actor_id) handleDecline(notification.actor_id);
              }}
            >
              <X className="h-4 w-4 mr-1" />
              Decline
            </Button>
          </div>
        </div>
      );
    }

    // Follow accepted notification
    if (notification.type === 'follow_accepted') {
      return (
        <div className="flex-1 min-w-0">
          <p className="text-foreground text-sm">
            <span className="font-semibold">{actorName}</span>{' '}
            <span className="text-muted-foreground">accepted your follow request</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
        </div>
      );
    }

    // Like notification
    if (notification.type === 'like') {
      return (
        <div className="flex-1 min-w-0">
          <p className="text-foreground text-sm">
            <span className="font-semibold">{actorName}</span>{' '}
            <span className="text-muted-foreground">liked your trip</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
        </div>
      );
    }

    // Comment notification
    if (notification.type === 'comment') {
      return (
        <div className="flex-1 min-w-0">
          <p className="text-foreground text-sm">
            <span className="font-semibold">{actorName}</span>{' '}
            <span className="text-muted-foreground">commented on your trip</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
        </div>
      );
    }

    // Convoy invite notification - show Join/Decline buttons
    if (notification.type === 'convoy_invite') {
      const invite = findConvoyInvite(notification.trip_id);
      const isExpired = invite ? new Date(invite.expires_at) < new Date() : false;
      const showButtons = invite && !isExpired;
      const isLoadingInvite = !invite && notification.trip_id;
      
      return (
        <div className="flex-1 min-w-0">
          <p className="text-foreground text-sm">
            <span className="font-semibold">{actorName}</span>{' '}
            <span className="text-muted-foreground">invited you to join a convoy</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
          {/* Join/Decline Buttons */}
          {showButtons ? (
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 px-4"
                disabled={acceptConvoyInvite.isPending}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAcceptConvoyInvite(notification.trip_id, notification.id);
                }}
              >
                <Users className="h-4 w-4 mr-1" />
                Join
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-border text-foreground h-8 px-4"
                disabled={declineConvoyInvite.isPending}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeclineConvoyInvite(notification.trip_id, notification.id);
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Decline
              </Button>
            </div>
          ) : isExpired ? (
            <p className="text-xs text-destructive mt-2">This invite has expired</p>
          ) : isLoadingInvite ? (
            <div className="flex gap-2 mt-3">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-20" />
            </div>
          ) : null}
        </div>
      );
    }

    // Default - follow and other types
    return (
      <div className="flex-1 min-w-0">
        <p className="text-foreground text-sm">
          <span className="font-semibold">{actorName}</span>{' '}
          <span className="text-muted-foreground">{notification.message}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
      </div>
    );
  };

  return (
    <div className="flex flex-col bg-background">
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
      {isLoading ? (
        <div className="divide-y divide-border">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications && notifications.length > 0 ? (
        <div className="divide-y divide-border">
          {notifications.map(notification => (
            <button
              key={notification.id}
              onClick={() => {
                handleMarkAsRead(notification.id);
                // Navigate based on notification type
                if (notification.type === 'follow' || notification.type === 'follow_accepted') {
                  if (notification.actor_id) navigate(`/user/${notification.actor_id}`);
                } else if (notification.type === 'like' && notification.trip_id) {
                  if (notification.actor_id) navigate(`/user/${notification.actor_id}`);
                } else if (notification.type === 'comment' && notification.trip_id) {
                  navigate(`/comments/${notification.trip_id}`);
                }
              }}
              className={cn(
                "w-full flex items-start gap-3 p-4 hover:bg-secondary/50 transition-colors text-left",
                !notification.is_read && "bg-primary/5"
              )}
            >
              <Avatar className="h-12 w-12">
                <AvatarImage 
                  src={notification.actor?.avatar_url || undefined} 
                  alt={notification.actor?.display_name || 'User'} 
                />
                <AvatarFallback>
                  {notification.actor?.display_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              {getNotificationContent(notification)}
              {!notification.is_read && (
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      ) : (
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

export default Notifications;
