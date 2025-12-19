import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, Heart, MessageCircle, Share2, Flag, MoreHorizontal, MapPin, Clock, Car, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { mockTripPosts, formatDistance, formatDuration, formatTimeAgo, TripPost } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const Feed = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState(mockTripPosts);

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isLiked: !post.isLiked,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1,
        };
      }
      return post;
    }));
  };

  return (
    <div className="min-h-screen bg-background safe-top">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="text-xl font-bold text-foreground">RoadTribe</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/search')}
              className="text-foreground"
            >
              <Search className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/notifications')}
              className="relative text-foreground"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            </Button>
          </div>
        </div>
      </header>

      {/* Feed */}
      <div className="divide-y divide-border">
        <AnimatePresence>
          {posts.map((post, index) => (
            <TripCard 
              key={post.id} 
              post={post} 
              index={index}
              onLike={() => handleLike(post.id)}
              onComment={() => navigate(`/post/${post.id}/comments`)}
              onShare={() => {}}
              onUserClick={() => navigate(`/user/${post.user.id}`)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

interface TripCardProps {
  post: TripPost;
  index: number;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onUserClick: () => void;
}

const TripCard = ({ post, index, onLike, onComment, onShare, onUserClick }: TripCardProps) => {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className="bg-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button 
          onClick={onUserClick}
          className="flex items-center gap-3"
        >
          <Avatar className="h-10 w-10 border-2 border-primary">
            <AvatarImage src={post.user.avatar} alt={post.user.name} />
            <AvatarFallback>{post.user.name[0]}</AvatarFallback>
          </Avatar>
          <div className="text-left">
            <p className="font-semibold text-foreground">{post.user.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatTimeAgo(post.createdAt)} · {post.startLocation}
            </p>
          </div>
        </button>
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </div>

      {/* Trip Info */}
      <div className="px-4 pb-3">
        <h2 className="font-bold text-lg text-foreground">{post.title}</h2>
        <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
          {post.description}
        </p>
      </div>

      {/* Trip Stats */}
      <div className="px-4 pb-3">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            <span>{post.startLocation} → {post.endLocation}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Navigation className="h-4 w-4 text-primary" />
            <span>{formatDistance(post.distance)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-4 w-4 text-primary" />
            <span>{formatDuration(post.duration)}</span>
          </div>
        </div>
      </div>

      {/* Vehicle & Convoy */}
      <div className="px-4 pb-3 flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Car className="h-4 w-4" />
          <span>{post.vehicle.year} {post.vehicle.make} {post.vehicle.model}</span>
        </div>
        {post.convoyMembers.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div className="flex -space-x-2">
              {post.convoyMembers.slice(0, 3).map((member) => (
                <Avatar key={member.id} className="h-6 w-6 border-2 border-card">
                  <AvatarImage src={member.avatar} alt={member.name} />
                  <AvatarFallback>{member.name[0]}</AvatarFallback>
                </Avatar>
              ))}
            </div>
            {post.convoyMembers.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{post.convoyMembers.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Map Preview */}
      <div className="relative aspect-video bg-secondary mx-4 rounded-lg overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <MapPin className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Route Map</p>
            <p className="text-xs">Mapbox token required</p>
          </div>
        </div>
      </div>

      {/* Photos */}
      {post.photos.length > 0 && (
        <div className="flex gap-2 px-4 mt-3 overflow-x-auto scrollbar-hide">
          {post.photos.map((photo, idx) => (
            <img
              key={idx}
              src={photo}
              alt={`Trip photo ${idx + 1}`}
              className="h-32 w-48 object-cover rounded-lg flex-shrink-0"
            />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-3 mt-2">
        <div className="flex items-center gap-6">
          <button
            onClick={onLike}
            className={cn(
              "flex items-center gap-1.5 transition-colors",
              post.isLiked ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Flag className={cn("h-5 w-5", post.isLiked && "fill-primary")} />
            <span className="text-sm font-medium">{post.likes}</span>
          </button>
          <button
            onClick={onComment}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-sm font-medium">{post.comments}</span>
          </button>
          <button
            onClick={onShare}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Share2 className="h-5 w-5" />
            <span className="text-sm font-medium">{post.shares}</span>
          </button>
        </div>
      </div>
    </motion.article>
  );
};

// Need to import Navigation icon
import { Navigation } from 'lucide-react';

export default Feed;
