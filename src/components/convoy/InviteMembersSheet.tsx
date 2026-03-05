import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Loader2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useTribe } from '@/hooks/useTribe';
import { useFollowing } from '@/hooks/useFollows';
import { useConvoyInvites } from '@/hooks/useConvoyInvites';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface InviteMembersSheetProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  existingMemberIds: Set<string>;
}

interface UserRowProps {
  userId: string;
  displayName: string;
  avatar: string | null | undefined;
  status: 'invite' | 'invited' | 'joined';
  isLoading: boolean;
  onInvite: () => void;
}

const UserRow = ({ displayName, avatar, status, isLoading, onInvite }: UserRowProps) => (
  <div className="flex items-center gap-3 px-4 py-3">
    <Avatar className="h-10 w-10">
      {avatar && <AvatarImage src={avatar} alt={displayName} />}
      <AvatarFallback className="bg-muted text-muted-foreground text-sm">
        {displayName?.charAt(0)?.toUpperCase() || '?'}
      </AvatarFallback>
    </Avatar>
    <span className="flex-1 text-sm font-medium text-foreground truncate">{displayName}</span>
    {status === 'joined' ? (
      <span className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">Joined</span>
    ) : status === 'invited' ? (
      <span className="text-xs text-primary bg-primary/10 px-3 py-1.5 rounded-full flex items-center gap-1">
        <Check className="h-3 w-3" /> Invited
      </span>
    ) : (
      <Button
        size="sm"
        variant="outline"
        onClick={onInvite}
        disabled={isLoading}
        className="gap-1.5 h-8"
      >
        {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
        Invite
      </Button>
    )}
  </div>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center px-6">
    <UserPlus className="h-8 w-8 text-muted-foreground/50 mb-3" />
    <p className="text-sm text-muted-foreground">{message}</p>
  </div>
);

const InviteMembersSheet = ({ isOpen, onClose, tripId, existingMemberIds }: InviteMembersSheetProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: tribe = [], isLoading: tribeLoading } = useTribe();
  const { data: following = [], isLoading: followingLoading } = useFollowing();
  const { createBulkInvites, createInvite, copyInviteLink, getShareLink } = useConvoyInvites();
  
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  const handleInvite = async (userId: string) => {
    setLoadingIds(prev => new Set(prev).add(userId));
    try {
      await createBulkInvites.mutateAsync({ tripId, inviteeIds: [userId] });
      setInvitedIds(prev => new Set(prev).add(userId));
      toast({ title: 'Invite sent!', description: 'They will receive a notification.' });
    } catch (error: any) {
      console.error('Invite error:', error);
      toast({ title: 'Invite failed', description: error?.message || 'Could not send invite.', variant: 'destructive' });
    } finally {
      setLoadingIds(prev => { const n = new Set(prev); n.delete(userId); return n; });
    }
  };

  const handleShareLink = async () => {
    try {
      const result = await createInvite.mutateAsync({ tripId });
      if (navigator.share) {
        await navigator.share({
          title: 'Join my convoy!',
          text: 'Join my road trip convoy on RoadTribe',
          url: getShareLink(result.invite_code),
        });
      } else {
        await copyInviteLink(result.invite_code);
      }
    } catch (error: any) {
      console.error('Share link error:', error);
      toast({ title: 'Share failed', description: error?.message || 'Could not create share link.', variant: 'destructive' });
    }
  };

  const getStatus = (userId: string): 'invite' | 'invited' | 'joined' => {
    if (existingMemberIds.has(userId)) return 'joined';
    if (invitedIds.has(userId)) return 'invited';
    return 'invite';
  };

  // Filter out self from lists
  const tribeMembers = useMemo(() => 
    tribe.filter(m => m.member_id !== user?.id), [tribe, user?.id]);
  
  const followingUsers = useMemo(() => 
    following.filter(f => f.following_id !== user?.id), [following, user?.id]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="absolute bottom-0 left-0 right-0 max-h-[75vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-card rounded-t-2xl border-t border-border/50 flex flex-col overflow-hidden">
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 pb-3">
                <h2 className="text-lg font-semibold text-foreground">Invite to Convoy</h2>
                <button onClick={onClose} className="min-h-11 min-w-11 flex items-center justify-center">
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="tribe" className="flex-1 flex flex-col overflow-hidden">
                <div className="px-4">
                  <TabsList className="w-full">
                    <TabsTrigger value="tribe" className="flex-1">Tribe ({tribeMembers.length})</TabsTrigger>
                    <TabsTrigger value="following" className="flex-1">Following ({followingUsers.length})</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="tribe" className="flex-1 overflow-y-auto mt-0">
                  {tribeLoading ? (
                    <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                  ) : tribeMembers.length === 0 ? (
                    <EmptyState message="No tribe members yet. Add people to your tribe from their profile." />
                  ) : (
                    <div className="divide-y divide-border/50">
                      {tribeMembers.map(m => (
                        <UserRow
                          key={m.member_id}
                          userId={m.member_id}
                          displayName={m.profile?.display_name || m.profile?.username || 'Unknown'}
                          avatar={m.profile?.avatar_url}
                          status={getStatus(m.member_id)}
                          isLoading={loadingIds.has(m.member_id)}
                          onInvite={() => handleInvite(m.member_id)}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="following" className="flex-1 overflow-y-auto mt-0">
                  {followingLoading ? (
                    <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                  ) : followingUsers.length === 0 ? (
                    <EmptyState message="You're not following anyone yet." />
                  ) : (
                    <div className="divide-y divide-border/50">
                      {followingUsers.map(f => (
                        <UserRow
                          key={f.following_id}
                          userId={f.following_id}
                          displayName={f.profile?.display_name || f.profile?.username || 'Unknown'}
                          avatar={f.profile?.avatar_url}
                          status={getStatus(f.following_id)}
                          isLoading={loadingIds.has(f.following_id)}
                          onInvite={() => handleInvite(f.following_id)}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Share Link Footer */}
              <div className="p-4 border-t border-border/50 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleShareLink}
                  disabled={createInvite.isPending}
                >
                  {createInvite.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Share2 className="h-4 w-4" />
                  )}
                  Share Invite Link
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InviteMembersSheet;
