import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Clock, Route } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TripPost, formatDistance, formatDuration, formatTimestamp } from '@/lib/mock-data';

interface ProfileTripCardProps {
  trip: TripPost;
}

const ProfileTripCard = ({ trip }: ProfileTripCardProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl overflow-hidden border border-border"
      onClick={() => navigate(`/trip/${trip.id}`)}
    >
      {/* Trip Image */}
      <div className="aspect-video bg-secondary relative">
        {trip.photos[0] ? (
          <img 
            src={trip.photos[0]} 
            alt={trip.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <img 
            src={trip.mapImage} 
            alt={trip.title}
            className="w-full h-full object-cover"
          />
        )}
        {/* Vehicle badge */}
        <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full text-xs text-foreground flex items-center gap-1">
          🚗 {trip.vehicle.make} {trip.vehicle.model}
        </div>
      </div>

      {/* Trip Info */}
      <div className="p-3 space-y-2">
        <h3 className="font-semibold text-foreground">{trip.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-1">{trip.description}</p>
        
        {/* Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Route className="h-4 w-4" />
            <span>{formatDistance(trip.distance)}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{formatDuration(trip.duration)}</span>
          </div>
        </div>

        {/* Convoy Members */}
        {trip.convoyMembers.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Convoy with</span>
            <div className="flex -space-x-2">
              {trip.convoyMembers.slice(0, 3).map((member) => (
                <Avatar key={member.id} className="h-5 w-5 border-2 border-card">
                  <AvatarImage src={member.avatar} alt={member.name} />
                  <AvatarFallback className="text-[8px]">{member.name[0]}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <p className="text-xs text-muted-foreground">
          {formatTimestamp(trip.createdAt, trip.country)}
        </p>
      </div>
    </motion.div>
  );
};

export default ProfileTripCard;
