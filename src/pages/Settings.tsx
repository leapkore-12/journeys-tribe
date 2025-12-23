import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
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
import { supabase } from '@/integrations/supabase/client';

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signOut } = useAuth();
  const [isPrivate, setIsPrivate] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const tribeCount = 20; // Mock data

  const handleLogout = async () => {
    await signOut();
    toast({ title: "Logged out", description: "See you on the road!" });
  };

  const handlePrivateToggle = (checked: boolean) => {
    setIsPrivate(checked);
    toast({
      title: checked ? "Account is now private" : "Account is now public",
      description: checked 
        ? "Only approved followers can see your content" 
        : "Anyone can see your content",
    });
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      const response = await supabase.functions.invoke('delete-account', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw response.error;
      }

      toast({
        title: 'Account deleted',
        description: 'Your account and all data have been permanently deleted.',
      });

      // Sign out and redirect to splash
      await signOut();
      navigate('/', { replace: true });
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({
        title: 'Failed to delete account',
        description: error.message || 'Please try again or contact support.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const settingsItems = [
    {
      label: 'Edit your Tribe',
      rightContent: <span className="text-primary font-medium">{tribeCount}</span>,
      onClick: () => navigate('/manage-followers'),
    },
    {
      label: 'Change email or password',
      onClick: () => navigate('/settings/credentials'),
    },
    {
      label: 'Subscription details',
      onClick: () => {},
    },
    {
      label: 'Manage notifications',
      onClick: () => navigate('/notifications'),
    },
    {
      label: 'Block accounts',
      onClick: () => {},
    },
    {
      label: 'Help',
      onClick: () => {},
    },
    {
      label: 'Terms of Service',
      onClick: () => navigate('/terms'),
    },
    {
      label: 'Privacy Policy',
      onClick: () => navigate('/privacy'),
    },
    {
      label: 'Delete account',
      onClick: () => setShowDeleteDialog(true),
      isDanger: true,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background safe-top pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)} className="text-foreground">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Settings page</h1>
        </div>
      </header>

      <div className="flex-1 px-4 py-4">
        {/* Private Account Toggle */}
        <div className="flex items-center justify-between py-4 border-b border-border">
          <span className="text-foreground">Switch account to private</span>
          <Switch 
            checked={isPrivate} 
            onCheckedChange={handlePrivateToggle}
          />
        </div>

        {/* Settings List */}
        <div className="divide-y divide-border">
          {settingsItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              className="w-full flex items-center justify-between py-4 text-left"
            >
              <span className={item.isDanger ? 'text-destructive' : 'text-foreground'}>
                {item.label}
              </span>
              {item.rightContent ? (
                item.rightContent
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
          ))}
        </div>

        {/* Logout Button */}
        <div className="mt-8">
          <Button
            variant="secondary"
            onClick={handleLogout}
            className="w-full h-12 bg-secondary text-muted-foreground font-medium"
          >
            Logout
          </Button>
        </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Delete Account</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action cannot be undone. This will permanently delete your account and remove all your data including:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Your profile and avatar</li>
                <li>All your trips and photos</li>
                <li>Your vehicles</li>
                <li>All comments and likes</li>
                <li>Follower connections</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Account'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;
