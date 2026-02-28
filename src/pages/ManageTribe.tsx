import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSmartBack } from '@/hooks/useSmartBack';
import { ArrowLeft, Plus, Star, Search, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useTribe, useAddToTribe, useRemoveFromTribe } from '@/hooks/useTribe';
import { useFollowing } from '@/hooks/useFollows';

const ManageTribe = () => {
  const navigate = useNavigate();
  const goBack = useSmartBack('/settings');
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: tribe = [], isLoading: tribeLoading } = useTribe();
  const { data: following = [], isLoading: followingLoading } = useFollowing();
  const addToTribe = useAddToTribe();
  const removeFromTribe = useRemoveFromTribe();

  // Get IDs of current tribe members
  const tribeMemberIds = new Set(tribe.map(m => m.member_id));

  // Filter following to exclude those already in tribe
  const availableToAdd = following.filter(f => !tribeMemberIds.has(f.following_id));
  const filteredAvailable = availableToAdd.filter(f => {
    const name = f.profile?.display_name || f.profile?.username || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleAddToTribe = async (memberId: string) => {
    try {
      await addToTribe.mutateAsync(memberId);
      toast({
        title: 'Added to Tribe',
        description: 'Friend added to your close circle',
      });
      setIsAddOpen(false);
      setSearchQuery('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add to tribe',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveFromTribe = async (memberId: string) => {
    try {
      await removeFromTribe.mutateAsync(memberId);
      toast({
        title: 'Removed from Tribe',
        description: 'Friend removed from your close circle',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove from tribe',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={goBack}
            className="text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Manage Tribe</h1>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-primary">
              <Plus className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-background border-border max-w-[90%] rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-foreground">Add to Tribe</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search following"
                  className="pl-10 bg-secondary border-0"
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {followingLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredAvailable.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    {availableToAdd.length === 0
                      ? 'All your following are already in your tribe'
                      : 'No matches found'}
                  </p>
                ) : (
                  filteredAvailable.map(f => (
                    <button
                      key={f.following_id}
                      onClick={() => handleAddToTribe(f.following_id)}
                      disabled={addToTribe.isPending}
                      className="w-full flex items-center gap-3 p-3 bg-secondary rounded-lg hover:bg-muted/50 transition-colors disabled:opacity-50"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={f.profile?.avatar_url || ''} />
                        <AvatarFallback>
                          {(f.profile?.display_name || f.profile?.username || '?')[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <p className="text-foreground font-medium">
                          {f.profile?.display_name || f.profile?.username}
                        </p>
                        {f.profile?.username && f.profile?.display_name && (
                          <p className="text-sm text-muted-foreground">@{f.profile.username}</p>
                        )}
                      </div>
                      <Plus className="h-5 w-5 text-primary" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Description */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2 text-primary">
          <Star className="h-4 w-4 fill-primary" />
          <span className="text-sm font-medium">Your close circle of friends</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Tribe members appear first when inviting friends to convoy
        </p>
      </div>

      {/* Tribe Members List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {tribeLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : tribe.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Star className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground mb-2">Your tribe is empty</p>
            <p className="text-sm text-muted-foreground/70 mb-4">
              Add friends from your following list
            </p>
            <Button
              variant="outline"
              onClick={() => setIsAddOpen(true)}
              className="gap-2 border-primary text-primary hover:bg-primary/10"
            >
              <Plus className="h-4 w-4" />
              Add Friends
            </Button>
          </div>
        ) : (
          tribe.map(member => (
            <div
              key={member.id}
              className="flex items-center gap-3 p-3 bg-secondary rounded-lg"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={member.profile?.avatar_url || ''} />
                <AvatarFallback>
                  {(member.profile?.display_name || member.profile?.username || '?')[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-foreground font-medium">
                    {member.profile?.display_name || member.profile?.username}
                  </p>
                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                </div>
                {member.profile?.username && member.profile?.display_name && (
                  <p className="text-sm text-muted-foreground">@{member.profile.username}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveFromTribe(member.member_id)}
                disabled={removeFromTribe.isPending}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ManageTribe;
