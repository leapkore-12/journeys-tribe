import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSmartBack } from '@/hooks/useSmartBack';
import { ArrowLeft, Send, MessageCircle, Trash2, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useComments, useCreateComment, useDeleteComment, CommentWithProfile } from '@/hooks/useComments';
import { cn } from '@/lib/utils';
import logoWhite from '@/assets/logo-white.svg';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
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

const Comments = () => {
  const navigate = useNavigate();
  const goBack = useSmartBack('/feed');
  const { postId } = useParams();
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ commentId: string; username: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { data: comments, isLoading } = useComments(postId || '');
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();

  const handleReplyClick = (comment: CommentWithProfile) => {
    const username = comment.profile?.username || comment.profile?.display_name || 'user';
    setReplyingTo({ commentId: comment.id, username });
    setNewComment(`@${username} `);
    inputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setNewComment('');
  };

  const handleDeleteClick = (commentId: string) => {
    setCommentToDelete(commentId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteComment = () => {
    if (!commentToDelete || !postId) return;
    deleteComment.mutate(
      { commentId: commentToDelete, tripId: postId },
      {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setCommentToDelete(null);
        }
      }
    );
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !postId) return;
    
    createComment.mutate(
      { 
        tripId: postId, 
        content: newComment.trim(),
        parentId: replyingTo?.commentId
      },
      {
        onSuccess: () => {
          setNewComment('');
          setReplyingTo(null);
        }
      }
    );
  };

  const renderComment = (comment: CommentWithProfile, isReply = false) => (
    <div key={comment.id} className={cn("flex gap-3 p-4", !isReply && "border-b border-border")}>
      <Avatar className={cn("flex-shrink-0", isReply ? "h-8 w-8" : "h-10 w-10")}>
        <AvatarImage 
          src={comment.profile?.avatar_url || undefined} 
          alt={comment.profile?.display_name || 'User'} 
        />
        <AvatarFallback className={isReply ? "text-xs" : ""}>
          {comment.profile?.display_name?.[0] || 'U'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn("font-semibold text-foreground", isReply ? "text-xs" : "text-sm")}>
            {comment.profile?.display_name || 'User'}
          </p>
          <span className="text-xs text-muted-foreground">
            {comment.created_at 
              ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })
              : ''}
          </span>
        </div>
        <p className={cn("text-foreground mt-1", isReply ? "text-xs" : "text-sm")}>{comment.content}</p>
        
        {/* Reply button - only for top-level comments */}
        {!isReply && (
          <button
            onClick={() => handleReplyClick(comment)}
            className="text-xs text-muted-foreground hover:text-foreground mt-2 transition-colors"
          >
            Reply
          </button>
        )}
      </div>
      
      {/* Delete button for own comments */}
      {comment.user_id === user?.id && (
        <button 
          onClick={() => handleDeleteClick(comment.id)}
          className="text-muted-foreground hover:text-destructive p-2 -mr-2 transition-colors"
        >
          <Trash2 className={cn(isReply ? "h-3 w-3" : "h-4 w-4")} />
        </button>
      )}
    </div>
  );

  const renderCommentWithReplies = (comment: CommentWithProfile) => (
    <div key={comment.id}>
      {renderComment(comment)}
      
      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-10 border-l border-border">
          {comment.replies.map(reply => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

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
      <div className="flex-1 overflow-y-auto pb-24">
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
          comments.map(comment => renderCommentWithReplies(comment))
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

      {/* Reply Indicator */}
      {replyingTo && (
        <div className="fixed bottom-[60px] left-0 right-0 flex items-center justify-between px-4 py-2 bg-secondary/80 backdrop-blur-sm border-t border-border safe-bottom-offset">
          <span className="text-sm text-muted-foreground">
            Replying to <span className="text-foreground font-medium">@{replyingTo.username}</span>
          </span>
          <button 
            onClick={cancelReply}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Comment Input */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 safe-bottom",
        replyingTo && "pb-4"
      )}>
        <form onSubmit={handleSubmitComment} className="flex items-center gap-3">
          <Input
            ref={inputRef}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : "Add a comment..."}
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

      {/* Delete Comment Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteComment}
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

export default Comments;
