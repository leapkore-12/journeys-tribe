import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MoreHorizontal, Flag, MessageCircle, Upload, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useTripById, useLikeTrip, useDeleteTrip } from '@/hooks/useTrips';
import { useComments, useCreateComment } from '@/hooks/useComments';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import logoWhite from '@/assets/logo-white.svg';
import { useToast } from '@/hooks/use-toast';
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
import { formatDistanceToNow } from 'date-fns';

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

const TripDetail = () => {
  const navigate = useNavigate();
  const { tripId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);

  const { data: trip, isLoading: tripLoading } = useTripById(tripId);
  const { data: comments, isLoading: commentsLoading } = useComments(tripId || '');
  const createComment = useCreateComment();
  const likeTrip = useLikeTrip();
  const deleteTrip = useDeleteTrip();

  const isOwnPost = trip?.user_id === user?.id;

  // Build slides array
  const slides = trip ? [
    ...(trip.map_image_url ? [{ type: 'map' as const, src: trip.map_image_url, label: 'Route map' }] : []),
    ...(trip.vehicle?.images?.[0] ? [{ type: 'vehicle' as const, src: trip.vehicle.images[0], label: `${trip.vehicle.make} ${trip.vehicle.model}` }] : []),
    ...(trip.trip_photos?.map((photo, idx) => ({ type: 'photo' as const, src: photo.image_url, label: `Trip photo ${idx + 1}` })) || []),
  ] : [];

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

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !tripId) return;
    
    createComment.mutate(
      { tripId, content: newComment.trim() },
      { onSuccess: () => setNewComment('') }
    );
  };

  const handleLike = () => {
    if (!trip) return;
    likeTrip.mutate({ tripId: trip.id, isLiked: trip.is_liked || false });
  };

  const handleShare = () => {
    if (!trip) return;
    navigate(`/share/${trip.id}`);
  };

  const handleUserClick = () => {
    if (!trip) return;
    if (trip.user_id === user?.id) {
      navigate('/profile');
    } else {
      navigate(`/user/${trip.user_id}`);
    }
  };

  const handleEdit = () => {
    setMenuOpen(false);
    navigate(`/trip/${trip?.id}/edit`);
  };

  const handleDelete = () => {
    setMenuOpen(false);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!trip) return;
    try {
      await deleteTrip.mutateAsync(trip.id);
      toast({ title: "Trip deleted", description: "Your trip has been removed" });
      navigate('/profile');
    } catch (error) {
      toast({ title: "Failed to delete", description: "Please try again", variant: "destructive" });
    }
  };

  const handleReport = () => {
    console.log('Report trip:', trip?.id);
    setMenuOpen(false);
  };

  const timeAgo = trip?.created_at 
    ? formatDistanceToNow(new Date(trip.created_at), { addSuffix: true })
    : '';

  if (tripLoading) {
    return (
      <div className="flex flex-col bg-background safe-top min-h-screen">
        <header className="sticky top-0 z-40 bg-background border-b border-border">
          <div className="flex items-center justify-between px-4 h-14">
            <button onClick={() => navigate(-1)} className="text-foreground p-2 -ml-2">
              <ArrowLeft className="h-6 w-6" />
            </button>
            <img src={logoWhite} alt="RoadTribe" className="h-6" />
            <div className="w-10" />
          </div>
        </header>
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex flex-col bg-background safe-top min-h-screen">
        <header className="sticky top-0 z-40 bg-background border-b border-border">
          <div className="flex items-center justify-between px-4 h-14">
            <button onClick={() => navigate(-1)} className="text-foreground p-2 -ml-2">
              <ArrowLeft className="h-6 w-6" />
            </button>
            <img src={logoWhite} alt="RoadTribe" className="h-6" />
            <div className="w-10" />
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Trip not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-background safe-top min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => navigate(-1)} className="text-foreground p-2 -ml-2">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <img src={logoWhite} alt="RoadTribe" className="h-6" />
          <div className="w-10" />
        </div>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {/* Trip Card */}
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card"
        >
          {/* User Row */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <button onClick={handleUserClick} className="flex items-center gap-3">
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
                    <DropdownMenuItem onClick={handleDelete} className="cursor-pointer text-destructive">Delete trip</DropdownMenuItem>
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
            <button onClick={handleLike} className={cn("flex-1 flex items-center justify-center gap-2 py-2 transition-colors", trip.is_liked ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
              <Flag className={cn("h-5 w-5", trip.is_liked && "fill-primary")} />
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-2 text-primary">
              <MessageCircle className="h-5 w-5" />
            </button>
            <button onClick={handleShare} className="flex-1 flex items-center justify-center gap-2 py-2 text-muted-foreground hover:text-foreground transition-colors">
              <Upload className="h-5 w-5" />
            </button>
          </div>
        </motion.article>

        {/* Divider */}
        <div className="h-2 bg-primary/20" />

        {/* Comments Section */}
        <div className="px-4 py-3 border-b border-border">
          <h2 className="font-semibold text-foreground">
            Comments {comments ? `(${comments.length})` : ''}
          </h2>
        </div>

        {/* Comments List */}
        {commentsLoading ? (
          <div className="divide-y divide-border">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3 p-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : comments && comments.length > 0 ? (
          comments.map(comment => (
            <div key={comment.id} className="flex gap-3 p-4 border-b border-border">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage 
                  src={comment.profile?.avatar_url || undefined} 
                  alt={comment.profile?.display_name || 'User'} 
                />
                <AvatarFallback>{comment.profile?.display_name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground text-sm">
                    {comment.profile?.display_name || 'User'}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {comment.created_at 
                      ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })
                      : ''}
                  </span>
                </div>
                <p className="text-foreground text-sm mt-1">{comment.content}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground">No comments yet</h3>
            <p className="text-sm text-muted-foreground text-center mt-1">
              Be the first to comment on this trip!
            </p>
          </div>
        )}
      </div>

      {/* Comment Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 safe-bottom">
        <form onSubmit={handleSubmitComment} className="flex items-center gap-3">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 h-10 bg-secondary border-border"
          />
          <button
            type="submit"
            disabled={!newComment.trim() || createComment.isPending}
            className={cn(
              "p-2 rounded-full transition-colors",
              newComment.trim() ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            )}
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Trip?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your trip
              and all associated photos and comments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TripDetail;