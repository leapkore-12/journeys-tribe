import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, Flag, MessageCircle, Upload, ChevronDown, Send, Trash2 } from 'lucide-react';
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
import { useTripLikes } from '@/hooks/useTripLikes';
import { useComments, useCreateComment, useDeleteComment, CommentWithProfile } from '@/hooks/useComments';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
  const [likesExpanded, setLikesExpanded] = useState(false);
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [newComment, setNewComment] = useState('');
  const isOwnPost = trip.user_id === user?.id;

  // Fetch likes and comments when expanded
  const { data: likes } = useTripLikes(trip.id, likesExpanded);
  const { data: comments } = useComments(trip.id);
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();

  // Comment item component with reply support
  const CommentItem = ({ comment, depth = 0 }: { comment: CommentWithProfile; depth?: number }) => (
    <div className={cn("flex items-start gap-3", depth > 0 && "ml-6 border-l border-border pl-3 mt-2")}>
      <Avatar 
        className="h-8 w-8 cursor-pointer flex-shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/user/${comment.user_id}`);
        }}
      >
        <AvatarImage src={comment.profile?.avatar_url || undefined} />
        <AvatarFallback>{comment.profile?.display_name?.[0] || 'U'}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground text-sm">{comment.profile?.display_name || 'User'}</span>
            <span className="text-xs text-muted-foreground">
              {comment.created_at ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true }) : ''}
            </span>
          </div>
          
          {/* Delete button for own comments */}
          {user?.id === comment.user_id && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteComment.mutate({ commentId: comment.id, tripId: trip.id });
              }}
              disabled={deleteComment.isPending}
              className="text-muted-foreground hover:text-destructive p-1 rounded-md hover:bg-destructive/10 transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <p className="text-muted-foreground text-sm">{comment.content}</p>
        
        {/* Reply button */}
        {user && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setReplyingTo(replyingTo === comment.id ? null : comment.id);
              setReplyContent('');
            }}
            className="text-xs text-primary mt-1 hover:underline"
          >
            Reply
          </button>
        )}
        
        {/* Reply input */}
        {replyingTo === comment.id && (
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Write a reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 h-8 text-sm"
            />
            <Button 
              size="sm"
              className="h-8 px-2"
              onClick={(e) => {
                e.stopPropagation();
                if (replyContent.trim()) {
                  createComment.mutate({ tripId: trip.id, content: replyContent, parentId: comment.id });
                  setReplyContent('');
                  setReplyingTo(null);
                }
              }}
              disabled={!replyContent.trim() || createComment.isPending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {/* Nested replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 space-y-2">
            {comment.replies.map(reply => (
              <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const handleAddComment = () => {
    if (newComment.trim() && user) {
      createComment.mutate({ tripId: trip.id, content: newComment });
      setNewComment('');
    }
  };

  // Build slides array
  const slides = [
    ...(trip.map_image_url ? [{ type: 'map' as const, src: trip.map_image_url, label: 'Route map' }] : []),
    ...(trip.vehicle?.images?.[0] ? [{ type: 'vehicle' as const, src: trip.vehicle.images[0], label: trip.vehicle.name }] : []),
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
        <div className="flex items-start gap-6 text-sm">
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
              <div className="flex -space-x-1.5 items-center h-[21px]">
                {trip.convoy_members.slice(0, 4).map((member) => (
                  <Avatar 
                    key={member.user_id} 
                    className="h-5 w-5 border border-primary cursor-pointer hover:z-10 transition-transform hover:scale-110"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/user/${member.user_id}`);
                    }}
                  >
                    <AvatarImage src={member.profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-[8px] bg-secondary">{member.profile?.display_name?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                ))}
                {trip.convoy_members.length > 4 && (
                  <div className="h-5 w-5 rounded-full bg-secondary border border-primary flex items-center justify-center text-[8px] text-foreground">
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

      {/* Engagement Row - Clickable to expand */}
      <div className="px-4 pb-2 flex items-center justify-between">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setLikesExpanded(!likesExpanded);
            setCommentsExpanded(false);
          }}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          {/* Show avatars of first 3 likers */}
          {likes && likes.length > 0 && (
            <div className="flex -space-x-1.5">
              {likes.slice(0, 3).map((like) => (
                <Avatar key={like.id} className="h-5 w-5 border border-background">
                  <AvatarImage src={like.profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-[8px]">{like.profile?.display_name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          )}
          <span className="text-sm text-foreground">{trip.likes_count || 0} Likes</span>
          <Flag className={cn("h-4 w-4", trip.is_liked ? "text-primary fill-primary" : "text-muted-foreground")} />
          <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform", likesExpanded && "rotate-180")} />
        </button>
        
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setCommentsExpanded(!commentsExpanded);
            setLikesExpanded(false);
          }}
          className="flex items-center gap-1 hover:opacity-80 transition-opacity"
        >
          <span className="text-sm text-muted-foreground">{trip.comments_count || 0} Comments</span>
          <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform", commentsExpanded && "rotate-180")} />
        </button>
      </div>

      {/* Expanded Likes List */}
      <AnimatePresence>
        {likesExpanded && likes && likes.length > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 border-t border-border">
              <div className="pt-3 space-y-2 max-h-60 overflow-y-auto">
                {likes.map((like) => (
                  <div 
                    key={like.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/user/${like.user_id}`);
                    }}
                    className="flex items-center gap-3 cursor-pointer hover:bg-secondary/50 rounded-lg p-2 -mx-2 transition-colors"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={like.profile?.avatar_url || undefined} />
                      <AvatarFallback>{like.profile?.display_name?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground text-sm">{like.profile?.display_name || 'User'}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Comments List */}
      <AnimatePresence>
        {commentsExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 border-t border-border">
              <div className="pt-3 space-y-3 max-h-60 overflow-y-auto">
                {comments && comments.length > 0 ? (
                  comments.map((comment) => (
                    <CommentItem key={comment.id} comment={comment} />
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-2">No comments yet</p>
                )}
              </div>
              
              {/* Add new comment input */}
              {user && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                  <Input
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddComment();
                    }} 
                    disabled={!newComment.trim() || createComment.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-0.5 bg-primary/30 mx-4" />

      {/* Action Row */}
      <div className="flex items-center justify-around py-2">
        <button 
          onClick={onLike} 
          className={cn(
            "flex-1 flex items-center justify-center min-h-11 transition-colors active:opacity-70",
            trip.is_liked ? "text-primary" : "text-muted-foreground"
          )}
        >
          <Flag className={cn("h-6 w-6", trip.is_liked && "fill-primary")} />
        </button>
        <button 
          onClick={onComment} 
          className="flex-1 flex items-center justify-center min-h-11 text-muted-foreground transition-colors active:opacity-70"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
        <button 
          onClick={onShare} 
          className="flex-1 flex items-center justify-center min-h-11 text-muted-foreground transition-colors active:opacity-70"
        >
          <Upload className="h-6 w-6" />
        </button>
      </div>

      <div className="h-2 bg-primary/20" />
    </motion.article>
  );
};

export default TripCard;
