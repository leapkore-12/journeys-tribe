import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Flag, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { mockTripPosts, mockComments, formatTimeAgo, formatDistance, formatDuration, Comment } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import logoWhite from '@/assets/logo-white.svg';

const Comments = () => {
  const navigate = useNavigate();
  const { postId } = useParams();
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [newComment, setNewComment] = useState('');

  const post = mockTripPosts.find(p => p.id === postId) || mockTripPosts[0];

  const handleLikeComment = (commentId: string) => {
    setComments(comments.map(c => {
      if (c.id === commentId) {
        return {
          ...c,
          isLiked: !c.isLiked,
          likes: c.isLiked ? c.likes - 1 : c.likes + 1,
        };
      }
      return c;
    }));
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    // Add new comment logic here
    console.log('New comment:', newComment);
    setNewComment('');
  };

  return (
    <div className="flex flex-col bg-background safe-top">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => navigate(-1)}
            className="text-foreground p-2 -ml-2"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <img src={logoWhite} alt="RoadTribe" className="h-6" />
          <div className="w-10" />
        </div>
      </header>

      {/* Trip Summary Card */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.user.avatar} alt={post.user.name} />
            <AvatarFallback>{post.user.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-foreground text-sm">{post.user.name}</p>
            <p className="text-xs text-muted-foreground">{post.title}</p>
          </div>
        </div>
        
        {/* Trip Stats Row */}
        <div className="flex gap-4 text-sm">
          <div>
            <span className="text-muted-foreground text-xs">Distance</span>
            <p className="font-semibold text-foreground">{formatDistance(post.distance)}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Time</span>
            <p className="font-semibold text-foreground">{formatDuration(post.duration)}</p>
          </div>
          {post.convoyMembers.length > 0 && (
            <div>
              <span className="text-muted-foreground text-xs">Convoy</span>
              <div className="flex -space-x-2 mt-0.5">
                {post.convoyMembers.slice(0, 3).map((member) => (
                  <Avatar key={member.id} className="h-5 w-5 border border-card">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback className="text-[8px]">{member.name[0]}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Trip Image */}
        <div className="mt-3 rounded-lg overflow-hidden h-32">
          <img
            src={post.photos[0] || post.mapImage}
            alt="Trip"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Comments Section Label */}
      <div className="px-4 py-3 border-b border-border">
        <h2 className="font-semibold text-foreground">Comments ({comments.length})</h2>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto">
        {comments.map(comment => (
          <div key={comment.id} className="flex gap-3 p-4 border-b border-border">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={comment.user.avatar} alt={comment.user.name} />
              <AvatarFallback>{comment.user.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground text-sm">{comment.user.name}</p>
                <span className="text-xs text-muted-foreground">{formatTimeAgo(comment.createdAt)}</span>
              </div>
              <p className="text-foreground text-sm mt-1">{comment.text}</p>
              <div className="flex items-center gap-4 mt-2">
                <button
                  onClick={() => handleLikeComment(comment.id)}
                  className={cn(
                    "flex items-center gap-1 text-xs transition-colors",
                    comment.isLiked ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <Flag className={cn("h-3.5 w-3.5", comment.isLiked && "fill-primary")} />
                  <span>{comment.likes}</span>
                </button>
                <button className="text-xs text-muted-foreground">Reply</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comment Input */}
      <div className="sticky bottom-0 bg-background border-t border-border p-4 safe-bottom">
        <form onSubmit={handleSubmitComment} className="flex items-center gap-3">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 h-10 bg-secondary border-border"
          />
          <button
            type="submit"
            disabled={!newComment.trim()}
            className={cn(
              "p-2 rounded-full transition-colors",
              newComment.trim() ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            )}
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Comments;
