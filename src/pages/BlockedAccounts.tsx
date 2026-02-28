import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useBlockedUsers, useUnblockUser } from '@/hooks/useBlockedUsers';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const BlockedAccounts = () => {
  const navigate = useNavigate();
  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/settings', { replace: true });
  };
  const { data: blockedUsers, isLoading } = useBlockedUsers();
  const unblockUser = useUnblockUser();

  const handleUnblock = async (blockedId: string, displayName: string) => {
    try {
      await unblockUser.mutateAsync(blockedId);
      toast.success(`Unblocked ${displayName}`);
    } catch (error) {
      toast.error('Failed to unblock user');
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <button onClick={handleBack} className="text-foreground min-h-11 min-w-11 flex items-center justify-center active:opacity-70">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold">Blocked accounts</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-3 w-24 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : blockedUsers && blockedUsers.length > 0 ? (
          <div className="space-y-2">
            {blockedUsers.map((blocked) => {
              const profile = blocked.profile;
              const displayName = profile?.display_name || profile?.username || 'Unknown';
              const username = profile?.username;

              return (
                <div
                  key={blocked.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border"
                >
                  <div
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                    onClick={() => profile?.id && navigate(`/user/${profile.id}`)}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={profile?.avatar_url || ''} />
                      <AvatarFallback className="bg-muted text-muted-foreground">
                        {displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{displayName}</p>
                      {username && (
                        <p className="text-sm text-muted-foreground truncate">@{username}</p>
                      )}
                    </div>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        Unblock
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Unblock {displayName}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          They will be able to find your profile and trips, and follow you again.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleUnblock(blocked.blocked_id, displayName)}
                        >
                          Unblock
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <UserX className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-medium text-foreground mb-2">No blocked accounts</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              When you block someone, they won't be able to find your profile or trips.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockedAccounts;
