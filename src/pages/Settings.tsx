import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isPrivate, setIsPrivate] = useState(false);
  const tribeCount = 20; // Mock data

  const handleLogout = () => {
    toast({ title: "Logged out", description: "See you on the road!" });
    navigate('/login');
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

  const settingsItems = [
    {
      label: 'Edit your Tribe',
      rightContent: <span className="text-primary font-medium">{tribeCount}</span>,
      onClick: () => navigate('/manage-followers'),
    },
    {
      label: 'Change email or password',
      onClick: () => {},
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
      onClick: () => {},
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
    </div>
  );
};

export default Settings;
