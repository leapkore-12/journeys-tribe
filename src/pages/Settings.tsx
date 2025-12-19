import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Bell, Shield, FileText, LogOut, Trash2, ChevronRight, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { hasMapboxToken, setMapboxToken, getMapboxToken } from '@/lib/mapbox';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mapboxToken, setMapboxTokenState] = useState(getMapboxToken());

  const handleLogout = () => {
    toast({ title: "Logged out", description: "See you on the road!" });
    navigate('/login');
  };

  const handleSaveMapbox = () => {
    setMapboxToken(mapboxToken);
    toast({ title: "Mapbox token saved", description: "Maps will now work!" });
  };

  return (
    <div className="flex flex-col bg-background safe-top">
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)} className="text-foreground">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Settings</h1>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Mapbox Setup */}
        <section className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3 mb-3">
            <Key className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground">Mapbox Token</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Get your token at mapbox.com to enable maps
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="pk.eyJ1..."
              value={mapboxToken}
              onChange={(e) => setMapboxTokenState(e.target.value)}
              className="bg-secondary"
            />
            <Button onClick={handleSaveMapbox} className="bg-primary">Save</Button>
          </div>
        </section>

        {/* Account */}
        <section className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="font-semibold text-foreground">Account</h2>
          </div>
          <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/50">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <span className="text-foreground">Edit Profile</span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        </section>

        {/* Notifications */}
        <section className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="font-semibold text-foreground">Notifications</h2>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="text-foreground">Push Notifications</span>
            </div>
            <Switch defaultChecked />
          </div>
        </section>

        {/* Legal */}
        <section className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="font-semibold text-foreground">Legal</h2>
          </div>
          <button onClick={() => navigate('/privacy')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/50 border-b border-border">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <span className="text-foreground">Privacy Policy</span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
          <button onClick={() => navigate('/terms')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/50">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="text-foreground">Terms & Conditions</span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        </section>

        {/* Danger Zone */}
        <section className="space-y-3">
          <Button variant="outline" onClick={handleLogout} className="w-full">
            <LogOut className="h-4 w-4 mr-2" /> Log Out
          </Button>
          <Button variant="outline" className="w-full text-destructive border-destructive hover:bg-destructive/10">
            <Trash2 className="h-4 w-4 mr-2" /> Delete Account
          </Button>
        </section>
      </div>
    </div>
  );
};

export default Settings;
