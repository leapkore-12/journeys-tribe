import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Route, Globe, Users, Star, Lock, MoreHorizontal, UserMinus } from 'lucide-react';
import { TripWithDetails } from '@/hooks/useTrips';
import { formatDistanceToNow } from 'date-fns';
import { useUntagFromTrip } from '@/hooks/useConvoyMembers';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ProfileTripCardProps {
  trip: TripWithDetails;
  showOwner?: boolean;
  isTagged?: boolean;
}

const formatDistance = (km: number | null) => {
  if (!km) return '0 km';
  if (km >= 1000) return `${(km / 1000).toFixed(1)}k km`;
  return `${Math.round(km)} km`;
};

const formatDuration = (minutes: number | null) => {
  if (!minutes) return '0 min';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  return `${hours}h ${mins}m`;
};

const getVisibilityIcon = (visibility: string) => {
  switch (visibility) {
    case 'public':
      return { icon: Globe, label: 'Public', color: 'text-green-500' };
    case 'followers':
      return { icon: Users, label: 'Followers', color: 'text-blue-500' };
    case 'tribe':
      return { icon: Star, label: 'Tribe', color: 'text-yellow-500' };
    case 'private':
      return { icon: Lock, label: 'Private', color: 'text-muted-foreground' };
    default:
      return { icon: Globe, label: 'Public', color: 'text-green-500' };
  }
};

const ProfileTripCard = ({ trip, showOwner = false, isTagged = false }: ProfileTripCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const untagMutation = useUntagFromTrip();
  const [showUntagDialog, setShowUntagDialog] = useState(false);

  const imageUrl = trip.trip_photos?.[0]?.image_url || trip.map_image_url;
  const timeAgo = trip.created_at 
    ? formatDistanceToNow(new Date(trip.created_at), { addSuffix: true })
    : '';
  const visibilityInfo = getVisibilityIcon(trip.visibility || 'public');
  const VisibilityIcon = visibilityInfo.icon;
  const ownerName = trip.profile?.display_name || trip.profile?.username || 'Unknown';

  const handleUntag = () => {
    untagMutation.mutate(trip.id, {
      onSuccess: () => {
        toast({
          title: "Untagged",
          description: "You have been removed from this trip",
        });
        setShowUntagDialog(false);
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to untag from trip",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl overflow-hidden border border-border cursor-pointer relative"
        onClick={() => navigate(`/trip/${trip.id}`)}
      >
        {/* Trip Image */}
        <div className="aspect-video bg-secondary relative">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={trip.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-muted-foreground">No image</span>
            </div>
          )}
          {/* Vehicle badge */}
          {trip.vehicle && (
            <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full text-xs text-foreground flex items-center gap-1">
              🚗 {trip.vehicle.make} {trip.vehicle.model}
            </div>
          )}
          {/* Tagged badge */}
          {isTagged && (
            <div className="absolute top-2 right-2 bg-primary/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs text-primary-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Tagged
            </div>
          )}
        </div>

        {/* Trip Info */}
        <div className="p-3 space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {showOwner && (
                <p className="text-xs text-primary font-medium">by @{ownerName}</p>
              )}
              <h3 className="font-semibold text-foreground">{trip.title}</h3>
            </div>
            {isTagged && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <button className="p-1 hover:bg-secondary rounded-full transition-colors">
                    <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border-border">
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowUntagDialog(true);
                    }}
                    className="cursor-pointer text-destructive"
                  >
                    <UserMinus className="h-4 w-4 mr-2" />
                    Untag me
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          {trip.description && (
            <p className="text-sm text-muted-foreground line-clamp-1">{trip.description}</p>
          )}
          
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Route className="h-4 w-4" />
              <span>{formatDistance(trip.distance_km)}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{formatDuration(trip.duration_minutes)}</span>
            </div>
          </div>

          {/* Timestamp & Visibility */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
            <div className={`flex items-center gap-1 text-xs ${visibilityInfo.color}`}>
              <VisibilityIcon className="h-3 w-3" />
              <span>{visibilityInfo.label}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Untag Confirmation Dialog */}
      <AlertDialog open={showUntagDialog} onOpenChange={setShowUntagDialog}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Untag yourself?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove you from this trip and update your trip statistics. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleUntag}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={untagMutation.isPending}
            >
              {untagMutation.isPending ? 'Removing...' : 'Untag me'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProfileTripCard;
