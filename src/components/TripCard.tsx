import { useState } from 'react';
import { motion } from 'framer-motion';
import { MoreHorizontal, Flag, MessageCircle, Upload } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TripPost, formatDistance, formatDuration, formatTimestamp, getCurrentUser } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TripCardProps {
  post: TripPost;
  index: number;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onUserClick: () => void;
}

const TripCard = ({ post, index, onLike, onComment, onShare, onUserClick }: TripCardProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const currentUser = getCurrentUser();
  const isOwnPost = post.user.id === currentUser.id || post.user.id === 'current';

  const handleEdit = () => {
    console.log('Edit trip:', post.id);
    setMenuOpen(false);
  };

  const handleDelete = () => {
    console.log('Delete trip:', post.id);
    setMenuOpen(false);
  };

  const handleReport = () => {
    console.log('Report trip:', post.id);
    setMenuOpen(false);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className="bg-card"
    >
      {/* User Row */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button 
          onClick={onUserClick}
          className="flex items-center gap-3"
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.user.avatar} alt={post.user.name} />
            <AvatarFallback>{post.user.name[0]}</AvatarFallback>
          </Avatar>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-foreground text-sm">{post.user.name}</p>
              <span className="text-muted-foreground text-xs">
                🚗 {post.vehicle.make} {post.vehicle.model}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatTimestamp(post.createdAt, post.country)}
            </p>
          </div>
        </button>
        
        {/* Three Dots Menu */}
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button className="text-muted-foreground p-2 hover:bg-secondary rounded-full transition-colors">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card border-border">
            {isOwnPost ? (
              <>
                <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
                  Edit trip
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="cursor-pointer text-destructive">
                  Delete trip
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem onClick={handleReport} className="cursor-pointer text-destructive">
                Report trip
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Trip Title */}
      <div className="px-4 pb-2">
        <h2 className="font-bold text-lg text-foreground">{post.title}</h2>
      </div>

      {/* Description */}
      <div className="px-4 pb-3">
        <p className="text-muted-foreground text-sm">{post.description}</p>
      </div>

      {/* Stats Row */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-6 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Distance</p>
            <p className="font-semibold text-foreground">{formatDistance(post.distance)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Time on road</p>
            <p className="font-semibold text-foreground">{formatDuration(post.duration)}</p>
          </div>
          {post.convoyMembers.length > 0 && (
            <div>
              <p className="text-muted-foreground text-xs">Convoy with</p>
              <div className="flex -space-x-2 mt-0.5">
                {post.convoyMembers.slice(0, 3).map((member) => (
                  <Avatar key={member.id} className="h-6 w-6 border-2 border-card">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback className="text-xs">{member.name[0]}</AvatarFallback>
                  </Avatar>
                ))}
                {post.convoyMembers.length > 3 && (
                  <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs border-2 border-card">
                    +{post.convoyMembers.length - 3}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Side-by-Side Media */}
      <div className="px-4 pb-3">
        <div className="flex gap-2 h-40 rounded-xl overflow-hidden">
          {/* Map - larger portion */}
          <div className="flex-[3] bg-secondary rounded-lg overflow-hidden">
            <img
              src={post.mapImage}
              alt="Route map"
              className="w-full h-full object-cover"
            />
          </div>
          {/* Photo - smaller portion */}
          {post.photos.length > 0 && (
            <div className="flex-1 bg-secondary rounded-lg overflow-hidden">
              <img
                src={post.photos[0]}
                alt="Trip photo"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </div>

      {/* Engagement Row */}
      <div className="px-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Stacked avatars who liked */}
          <div className="flex -space-x-2">
            {[...post.convoyMembers.slice(0, 2), post.user].slice(0, 3).map((user, idx) => (
              <Avatar key={idx} className="h-5 w-5 border border-card">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="text-[8px]">{user.name[0]}</AvatarFallback>
              </Avatar>
            ))}
          </div>
          <span className="text-sm text-foreground">{post.likes} Likes</span>
          <Flag className={cn("h-4 w-4", post.isLiked ? "text-primary fill-primary" : "text-muted-foreground")} />
        </div>
        <span className="text-sm text-muted-foreground">{post.comments} Comments</span>
      </div>

      {/* Teal Divider Line */}
      <div className="h-0.5 bg-primary/30 mx-4" />

      {/* Action Row */}
      <div className="flex items-center justify-around py-3">
        <button
          onClick={onLike}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 transition-colors",
            post.isLiked ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Flag className={cn("h-5 w-5", post.isLiked && "fill-primary")} />
        </button>
        <button
          onClick={onComment}
          className="flex-1 flex items-center justify-center gap-2 py-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageCircle className="h-5 w-5" />
        </button>
        <button
          onClick={onShare}
          className="flex-1 flex items-center justify-center gap-2 py-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Upload className="h-5 w-5" />
        </button>
      </div>

      {/* Bottom Divider */}
      <div className="h-2 bg-primary/20" />
    </motion.article>
  );
};

export default TripCard;
