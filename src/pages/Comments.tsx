import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSmartBack } from '@/hooks/useSmartBack';
import { ArrowLeft, Flag, Send, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useComments, useCreateComment } from '@/hooks/useComments';
import { cn } from '@/lib/utils';
import logoWhite from '@/assets/logo-white.svg';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

const Comments = () => {
  const navigate = useNavigate();
  const goBack = useSmartBack('/feed');
  const { postId } = useParams();
  const [newComment, setNewComment] = useState('');
  
  const { data: comments, isLoading } = useComments(postId || '');
  const createComment = useCreateComment();

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !postId) return;
    
    createComment.mutate(
      { tripId: postId, content: newComment.trim() },
      {
        onSuccess: () => {
          setNewComment('');
        }
      }
    );
  };

  return (
    <div className="flex flex-col bg-background safe-top min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={goBack}
            className="text-foreground p-2 -ml-2"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <img src={logoWhite} alt="RoadTribe" className="h-6" />
          <div className="w-10" />
        </div>
      </header>

      {/* Comments Section Label */}
      <div className="px-4 py-3 border-b border-border">
        <h2 className="font-semibold text-foreground">
          Comments {comments ? `(${comments.length})` : ''}
        </h2>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto pb-20">
        {isLoading ? (
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
    </div>
  );
};

export default Comments;
