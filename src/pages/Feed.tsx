import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Search, Bell, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFeedTrips, useLikeTrip } from '@/hooks/useTrips';
import { useUnreadCount } from '@/hooks/useNotifications';
import TripCard from '@/components/TripCard';
import logoWhite from '@/assets/logo-white.svg';
import { Skeleton } from '@/components/ui/skeleton';

const Feed = () => {
  const navigate = useNavigate();
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeedTrips();
  const { data: unreadCount } = useUnreadCount();
  const likeMutation = useLikeTrip();

  const trips = data?.pages.flatMap(page => page.trips) || [];

  const handleLike = (tripId: string, isLiked: boolean) => {
    likeMutation.mutate({ tripId, isLiked });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header - Search Left, Logo Center, Bell Right */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Search Icon - Left */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/search')}
            className="text-foreground"
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Logo - Center */}
          <img src={logoWhite} alt="RoadTribe" className="h-6" />

          {/* Bell Icon - Right */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/notifications')}
            className="relative text-foreground"
          >
            <Bell className="h-5 w-5" />
            {(unreadCount ?? 0) > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            )}
          </Button>
        </div>
      </header>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-4 p-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-card rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : trips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
              <Flag className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground">No trips yet</h3>
            <p className="text-sm text-muted-foreground text-center mt-1">
              Be the first to share a road trip adventure!
            </p>
            <Button
              onClick={() => navigate('/trip')}
              className="mt-4 bg-primary"
            >
              Plan a Trip
            </Button>
          </div>
        ) : (
          <AnimatePresence>
            {trips.map((trip, index) => (
              <TripCard
                key={trip.id}
                trip={trip}
                index={index}
                context="feed"
                onLike={() => handleLike(trip.id, trip.is_liked || false)}
                onComment={() => navigate(`/comments/${trip.id}`)}
                onShare={() => navigate(`/share/${trip.id}`)}
                onUserClick={() => navigate(`/user/${trip.user_id}`)}
              />
            ))}
          </AnimatePresence>
        )}

        {hasNextPage && (
          <div className="p-4">
            <Button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              variant="outline"
              className="w-full"
            >
              {isFetchingNextPage ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Feed;
