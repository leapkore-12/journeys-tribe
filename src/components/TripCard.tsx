import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MoreHorizontal, Flag, MessageCircle, Upload } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TripWithDetails } from '@/hooks/useTrips';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface TripCardProps {
  trip: TripWithDetails;
  index: number;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onUserClick: () => void;
  context?: 'feed' | 'profile' | 'detail';
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

const TripCard = ({ trip, index, onLike, onComment, onShare, onUserClick, context = 'feed' }: TripCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const isOwnPost = trip.user_id === user?.id;

  // Build slides array
  const slides = [
    ...(trip.map_image_url ? [{ type: 'map' as const, src: trip.map_image_url, label: 'Route map' }] : []),
    ...(trip.vehicle?.images?.[0] ? [{ type: 'vehicle' as const, src: trip.vehicle.images[0], label: `${trip.vehicle.make} ${trip.vehicle.model}` }] : []),
    ...(trip.trip_photos?.map((photo, idx) => ({ type: 'photo' as const, src: photo.image_url, label: `Trip photo ${idx + 1}` })) || []),
  ];

  const onCarouselSelect = useCallback(() => {
    if (!carouselApi) return;
    setCurrentSlide(carouselApi.selectedScrollSnap());
  }, [carouselApi]);

  useEffect(() => {
    if (!carouselApi) return;
    carouselApi.on('select', onCarouselSelect);
    return () => {
      carouselApi.off('select', onCarouselSelect);
    };
  }, [carouselApi, onCarouselSelect]);

  const handleEdit = () => {
    navigate(`/trip/${trip.id}/edit`);
    setMenuOpen(false);
  };

  const handleDelete = () => {
    console.log('Delete trip:', trip.id);
    setMenuOpen(false);
  };

  const handleReport = () => {
    console.log('Report trip:', trip.id);
    setMenuOpen(false);
  };

  const timeAgo = trip.created_at 
    ? formatDistanceToNow(new Date(trip.created_at), { addSuffix: true })
    : '';

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className="bg-card"
    >
      {/* User Row */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={onUserClick} className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={trip.profile?.avatar_url || undefined} alt={trip.profile?.display_name || 'User'} />
            <AvatarFallback>{trip.profile?.display_name?.[0] || 'U'}</AvatarFallback>
          </Avatar>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-foreground text-sm">{trip.profile?.display_name || 'User'}</p>
              {trip.vehicle && (
                <span className="text-muted-foreground text-xs">
                  🚗 {trip.vehicle.name}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
        </button>
        
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button className="text-muted-foreground p-2 hover:bg-secondary rounded-full transition-colors">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card border-border">
            {isOwnPost ? (
              <>
                <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">Edit trip</DropdownMenuItem>
                {context !== 'feed' && (
                  <DropdownMenuItem onClick={handleDelete} className="cursor-pointer text-destructive">Delete trip</DropdownMenuItem>
                )}
              </>
            ) : (
              <DropdownMenuItem onClick={handleReport} className="cursor-pointer text-destructive">Report trip</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Trip Title */}
      <div className="px-4 pb-2">
        <h2 className="font-bold text-lg text-foreground">{trip.title}</h2>
      </div>

      {/* Description */}
      {trip.description && (
        <div className="px-4 pb-3">
          <p className="text-muted-foreground text-sm">{trip.description}</p>
        </div>
      )}

      {/* Stats Row */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-6 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Distance</p>
            <p className="font-semibold text-foreground">{formatDistance(trip.distance_km)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Time on road</p>
            <p className="font-semibold text-foreground">{formatDuration(trip.duration_minutes)}</p>
          </div>
          
          {/* Convoy with section */}
          {trip.convoy_members && trip.convoy_members.length > 0 && (
            <div>
              <p className="text-muted-foreground text-xs">Convoy with</p>
              <div className="flex -space-x-2 mt-1">
                {trip.convoy_members.slice(0, 4).map((member) => (
                  <Avatar 
                    key={member.user_id} 
                    className="h-8 w-8 border-2 border-primary ring-2 ring-background cursor-pointer hover:z-10 transition-transform hover:scale-110"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/user/${member.user_id}`);
                    }}
                  >
                    <AvatarImage src={member.profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs bg-secondary">{member.profile?.display_name?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                ))}
                {trip.convoy_members.length > 4 && (
                  <div className="h-8 w-8 rounded-full bg-secondary border-2 border-primary ring-2 ring-background flex items-center justify-center text-xs text-foreground">
                    +{trip.convoy_members.length - 4}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Media Carousel */}
      {slides.length > 0 && (
        <div className="px-4 pb-3">
          <Carousel setApi={setCarouselApi} opts={{ loop: false }} className="w-full">
            <CarouselContent className="-ml-0">
              {slides.map((slide, idx) => (
                <CarouselItem key={idx} className="pl-0">
                  <div className="relative h-48 rounded-xl overflow-hidden bg-secondary">
                    <img src={slide.src} alt={slide.label} className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded text-xs text-foreground">
                      {slide.type === 'map' ? '🗺️ Route' : slide.type === 'vehicle' ? '🚗 Vehicle' : '📷 Photo'}
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          
          {slides.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-2">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => carouselApi?.scrollTo(idx)}
                  className={cn("w-1.5 h-1.5 rounded-full transition-colors", idx === currentSlide ? "bg-primary" : "bg-muted")}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Engagement Row */}
      <div className="px-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground">{trip.likes_count || 0} Likes</span>
          <Flag className={cn("h-4 w-4", trip.is_liked ? "text-primary fill-primary" : "text-muted-foreground")} />
        </div>
        <span className="text-sm text-muted-foreground">{trip.comments_count || 0} Comments</span>
      </div>

      <div className="h-0.5 bg-primary/30 mx-4" />

      {/* Action Row */}
      <div className="flex items-center justify-around py-3">
        <button onClick={onLike} className={cn("flex-1 flex items-center justify-center gap-2 py-2 transition-colors", trip.is_liked ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
          <Flag className={cn("h-5 w-5", trip.is_liked && "fill-primary")} />
        </button>
        <button onClick={onComment} className="flex-1 flex items-center justify-center gap-2 py-2 text-muted-foreground hover:text-foreground transition-colors">
          <MessageCircle className="h-5 w-5" />
        </button>
        <button onClick={onShare} className="flex-1 flex items-center justify-center gap-2 py-2 text-muted-foreground hover:text-foreground transition-colors">
          <Upload className="h-5 w-5" />
        </button>
      </div>

      <div className="h-2 bg-primary/20" />
    </motion.article>
  );
};

export default TripCard;
