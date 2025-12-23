import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Route } from 'lucide-react';
import { TripWithDetails } from '@/hooks/useTrips';
import { formatDistanceToNow } from 'date-fns';

interface ProfileTripCardProps {
  trip: TripWithDetails;
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

const ProfileTripCard = ({ trip }: ProfileTripCardProps) => {
  const navigate = useNavigate();

  const imageUrl = trip.trip_photos?.[0]?.image_url || trip.map_image_url;
  const timeAgo = trip.created_at 
    ? formatDistanceToNow(new Date(trip.created_at), { addSuffix: true })
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl overflow-hidden border border-border cursor-pointer"
      onClick={() => navigate(`/comments/${trip.id}`)}
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
      </div>

      {/* Trip Info */}
      <div className="p-3 space-y-2">
        <h3 className="font-semibold text-foreground">{trip.title}</h3>
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

        {/* Timestamp */}
        <p className="text-xs text-muted-foreground">{timeAgo}</p>
      </div>
    </motion.div>
  );
};

export default ProfileTripCard;
