import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/lib/mock-data';
import { pickPhoto } from '@/lib/capacitor-utils';

const EditProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentUser = getCurrentUser();

  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [name, setName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username.replace('@', ''));
  const [bio, setBio] = useState(currentUser.bio);
  const [isPrivate, setIsPrivate] = useState(currentUser.isPrivate || false);
  const [isSaving, setIsSaving] = useState(false);

  const handleChangePhoto = async () => {
    const photoUrl = await pickPhoto();
    if (photoUrl) {
      setAvatar(photoUrl);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter your name',
        variant: 'destructive',
      });
      return;
    }

    if (!username.trim()) {
      toast({
        title: 'Username required',
        description: 'Please enter a username',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    
    // Simulate save delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    toast({
      title: 'Profile updated',
      description: 'Your profile has been saved successfully',
    });
    
    setIsSaving(false);
    navigate(-1);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background safe-top">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => navigate(-1)} className="text-primary">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <span className="text-foreground font-medium">Edit profile</span>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="text-primary font-medium disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-4 py-6 space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <Avatar className="h-24 w-24 border-4 border-muted">
              <AvatarImage src={avatar} alt={name} />
              <AvatarFallback>{name[0]}</AvatarFallback>
            </Avatar>
            <button
              onClick={handleChangePhoto}
              className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={handleChangePhoto}
            className="text-primary font-medium text-sm"
          >
            Change photo
          </button>
        </div>

        {/* Form Fields */}
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-muted-foreground text-sm">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="bg-secondary border-border text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username" className="text-muted-foreground text-sm">
              Username
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                @
              </span>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                placeholder="username"
                className="bg-secondary border-border text-foreground pl-8"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio" className="text-muted-foreground text-sm">
              Bio
            </Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself"
              rows={3}
              maxLength={150}
              className="bg-secondary border-border text-foreground resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {bio.length}/150
            </p>
          </div>
        </div>

        {/* Private Account Toggle */}
        <div className="border-t border-border pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-foreground font-medium">Private account</Label>
              <p className="text-sm text-muted-foreground">
                Only approved followers can see your trips
              </p>
            </div>
            <Switch
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
