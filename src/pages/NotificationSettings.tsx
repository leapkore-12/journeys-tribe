import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCurrentProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

const NotificationSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: profile } = useCurrentProfile();
  const queryClient = useQueryClient();

  const [notifyLikes, setNotifyLikes] = useState(true);
  const [notifyComments, setNotifyComments] = useState(true);
  const [notifyFollows, setNotifyFollows] = useState(true);
  const [notifyConvoyInvites, setNotifyConvoyInvites] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (profile) {
      setNotifyLikes((profile as any).notify_likes ?? true);
      setNotifyComments((profile as any).notify_comments ?? true);
      setNotifyFollows((profile as any).notify_follows ?? true);
      setNotifyConvoyInvites((profile as any).notify_convoy_invites ?? true);
    }
  }, [profile]);

  const handleToggle = async (
    field: string,
    value: boolean,
    setter: (v: boolean) => void,
    label: string
  ) => {
    if (!user?.id) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: value } as any)
        .eq('id', user.id);
      if (error) throw error;
      setter(value);
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      toast({
        title: value ? `${label} notifications enabled` : `${label} notifications disabled`,
      });
    } catch {
      toast({ title: 'Failed to update', variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/settings', { replace: true });
  };

  const items = [
    {
      label: 'Likes',
      description: 'Get notified when someone likes your trip',
      checked: notifyLikes,
      field: 'notify_likes',
      setter: setNotifyLikes,
    },
    {
      label: 'Comments',
      description: 'Get notified when someone comments on your trip',
      checked: notifyComments,
      field: 'notify_comments',
      setter: setNotifyComments,
    },
    {
      label: 'Follows',
      description: 'Get notified about follow requests',
      checked: notifyFollows,
      field: 'notify_follows',
      setter: setNotifyFollows,
    },
    {
      label: 'Convoy Invites',
      description: 'Get notified about convoy invitations',
      checked: notifyConvoyInvites,
      field: 'notify_convoy_invites',
      setter: setNotifyConvoyInvites,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="sticky top-0 z-40 bg-background">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={handleBack} className="text-foreground min-h-11 min-w-11 flex items-center justify-center active:opacity-70">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Manage Notifications</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="divide-y divide-border">
          {items.map((item) => (
            <div key={item.field} className="flex items-center justify-between py-4">
              <div className="flex-1 pr-4">
                <span className="text-foreground block font-medium">{item.label}</span>
                <span className="text-sm text-muted-foreground">{item.description}</span>
              </div>
              <Switch
                checked={item.checked}
                onCheckedChange={(v) => handleToggle(item.field, v, item.setter, item.label)}
                disabled={isUpdating}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
