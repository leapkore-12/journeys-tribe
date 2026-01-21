import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Loader2, Download, MapPin, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCurrentProfile } from '@/hooks/useProfile';
import { useFollowing } from '@/hooks/useFollows';
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
import { useOfflineMaps } from '@/hooks/useOfflineMaps';

const Settings = () => {
  const navigate = useNavigate();
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/profile', { replace: true });
    }
  };
  const { toast } = useToast();
  const { signOut, user } = useAuth();
  const { data: profile } = useCurrentProfile();
  const { data: following } = useFollowing();
  const [isPrivate, setIsPrivate] = useState(false);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // GDPR consent states
  const [analyticsConsent, setAnalyticsConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [isUpdatingConsent, setIsUpdatingConsent] = useState(false);
  const [isExportingData, setIsExportingData] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);
  
  // Offline maps
  const { 
    isSupported: offlineMapsSupported, 
    isReady: offlineMapsReady,
    cacheSize, 
    getCacheSize, 
    clearCache 
  } = useOfflineMaps();

  // Sync privacy and consent states with profile
  useEffect(() => {
    if (profile) {
      setIsPrivate(profile.is_private || false);
      setAnalyticsConsent(profile.analytics_consent || false);
      setMarketingConsent(profile.marketing_consent || false);
    }
  }, [profile]);

  // Fetch cache size on mount
  useEffect(() => {
    if (offlineMapsReady) {
      getCacheSize();
    }
  }, [offlineMapsReady, getCacheSize]);

  const tribeCount = profile?.tribe_count || 0;

  const handleClearOfflineCache = async () => {
    setIsClearingCache(true);
    try {
      await clearCache();
      toast({
        title: 'Offline maps cleared',
        description: 'All cached map tiles have been removed.',
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast({
        title: 'Failed to clear cache',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsClearingCache(false);
    }
  };

  const formatCacheSize = () => {
    if (!cacheSize) return 'Unknown';
    if (cacheSize.estimatedSize) {
      const mb = cacheSize.estimatedSize / (1024 * 1024);
      return mb < 1 ? `${Math.round(cacheSize.estimatedSize / 1024)} KB` : `${mb.toFixed(1)} MB`;
    }
    if (cacheSize.tileCount !== undefined) {
      return `${cacheSize.tileCount} tiles`;
    }
    return 'Unknown';
  };

  const handleLogout = async () => {
    await signOut();
    toast({ title: "Logged out", description: "See you on the road!" });
  };

  const handlePrivateToggle = async (checked: boolean) => {
    if (!user?.id) return;
    
    setIsUpdatingPrivacy(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_private: checked })
        .eq('id', user.id);
      
      if (error) throw error;
      
      setIsPrivate(checked);
      toast({
        title: checked ? "Account is now private" : "Account is now public",
        description: checked 
          ? "Only approved followers can see your content" 
          : "Anyone can see your content",
      });
    } catch (error) {
      console.error('Error updating privacy:', error);
      toast({
        title: "Failed to update privacy",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  const handleAnalyticsConsentToggle = async (checked: boolean) => {
    if (!user?.id) return;
    
    setIsUpdatingConsent(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          analytics_consent: checked,
          consent_updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      setAnalyticsConsent(checked);
      toast({
        title: checked ? "Analytics enabled" : "Analytics disabled",
        description: checked 
          ? "You're helping us improve RoadTribe" 
          : "Analytics tracking has been disabled",
      });
    } catch (error) {
      console.error('Error updating analytics consent:', error);
      toast({
        title: "Failed to update preference",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingConsent(false);
    }
  };

  const handleMarketingConsentToggle = async (checked: boolean) => {
    if (!user?.id) return;
    
    setIsUpdatingConsent(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          marketing_consent: checked,
          consent_updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      setMarketingConsent(checked);
      toast({
        title: checked ? "Marketing emails enabled" : "Marketing emails disabled",
        description: checked 
          ? "You'll receive updates about new features" 
          : "You won't receive marketing communications",
      });
    } catch (error) {
      console.error('Error updating marketing consent:', error);
      toast({
        title: "Failed to update preference",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingConsent(false);
    }
  };

  const handleExportData = async () => {
    setIsExportingData(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      const response = await supabase.functions.invoke('export-user-data', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw response.error;
      }

      // Create and download the JSON file
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `roadtribe-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Data exported',
        description: 'Your data has been downloaded as a JSON file.',
      });
    } catch (error: any) {
      console.error('Error exporting data:', error);
      toast({
        title: 'Failed to export data',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsExportingData(false);
    }
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
      onClick: () => navigate('/manage-tribe'),
    },
    {
      label: 'Change email or password',
      onClick: () => navigate('/settings/credentials'),
    },
    {
      label: 'Subscription details',
      rightContent: <span className="text-primary font-medium capitalize">{profile?.plan_type || 'Free'}</span>,
      onClick: () => navigate('/subscription'),
    },
    {
      label: 'Manage notifications',
      onClick: () => navigate('/notifications'),
    },
    {
      label: 'Block accounts',
      onClick: () => navigate('/blocked-accounts'),
    },
    {
      label: 'Help',
      onClick: () => navigate('/help'),
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
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={handleBack} className="text-foreground min-h-11 min-w-11 flex items-center justify-center active:opacity-70">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Settings page</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        {/* Private Account Toggle */}
        <div className="flex items-center justify-between py-4 border-b border-border">
          <span className="text-foreground">Switch account to private</span>
          <Switch 
            checked={isPrivate} 
            onCheckedChange={handlePrivateToggle}
            disabled={isUpdatingPrivacy}
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

        {/* GDPR Section */}
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Privacy & Data
          </h2>
          
          {/* Analytics Consent */}
          <div className="flex items-center justify-between py-4 border-b border-border">
            <div className="flex-1 pr-4">
              <span className="text-foreground block">Analytics & Usage Data</span>
              <span className="text-sm text-muted-foreground">Help us improve RoadTribe</span>
            </div>
            <Switch 
              checked={analyticsConsent} 
              onCheckedChange={handleAnalyticsConsentToggle}
              disabled={isUpdatingConsent}
            />
          </div>

          {/* Marketing Consent */}
          <div className="flex items-center justify-between py-4 border-b border-border">
            <div className="flex-1 pr-4">
              <span className="text-foreground block">Marketing Communications</span>
              <span className="text-sm text-muted-foreground">Receive updates about new features</span>
            </div>
            <Switch 
              checked={marketingConsent} 
              onCheckedChange={handleMarketingConsentToggle}
              disabled={isUpdatingConsent}
            />
          </div>

          {/* Download My Data */}
          <Button
            variant="outline"
            onClick={handleExportData}
            disabled={isExportingData}
            className="w-full mt-4 h-12"
          >
            {isExportingData ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download my data
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Download a copy of all your RoadTribe data (GDPR)
          </p>
        </div>

        {/* Offline Maps Section */}
        {offlineMapsSupported && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              Offline Maps
            </h2>
            
            <div className="flex items-center justify-between py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <span className="text-foreground block">Cached Map Data</span>
                  <span className="text-sm text-muted-foreground">
                    {cacheSize ? formatCacheSize() : 'Loading...'}
                  </span>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleClearOfflineCache}
              disabled={isClearingCache || !offlineMapsReady}
              className="w-full mt-4 h-12 border-destructive/50 text-destructive hover:bg-destructive/10"
            >
              {isClearingCache ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear offline maps
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Free up storage by removing downloaded map tiles
            </p>
          </div>
        )}

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
