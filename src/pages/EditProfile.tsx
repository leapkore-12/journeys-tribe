import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useCurrentProfile, useUpdateProfile, useUploadAvatar } from '@/hooks/useProfile';
import { pickPhoto } from '@/lib/capacitor-utils';

const EditProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: profile, isLoading } = useCurrentProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();

  const [avatar, setAvatar] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Initialize form with profile data
  useEffect(() => {
    if (profile) {
      setAvatar(profile.avatar_url || '');
      setName(profile.display_name || '');
      setUsername(profile.username?.replace('@', '') || '');
      setBio(profile.bio || '');
      setIsPrivate(profile.is_private || false);
    }
  }, [profile]);

  const handleChangePhoto = async () => {
    const photoUrl = await pickPhoto();
    if (photoUrl) {
      setAvatar(photoUrl);
      // For web, we need to fetch the blob and create a file
      try {
        const response = await fetch(photoUrl);
        const blob = await response.blob();
        const file = new File([blob], `avatar-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setAvatarFile(file);
      } catch (error) {
        console.error('Error processing photo:', error);
      }
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

    try {
      // Upload avatar if changed
      if (avatarFile) {
        await uploadAvatar.mutateAsync(avatarFile);
      }

      // Update profile data
      await updateProfile.mutateAsync({
        display_name: name.trim(),
        username: username.trim(),
        bio: bio.trim() || null,
        is_private: isPrivate,
      });

      toast({
        title: 'Profile updated',
        description: 'Your profile has been saved successfully',
      });

      navigate(-1);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error saving profile',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const isSaving = updateProfile.isPending || uploadAvatar.isPending;

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background safe-top">
        <header className="sticky top-0 z-40 bg-background border-b border-border">
          <div className="flex items-center justify-between px-4 h-14">
            <button onClick={() => navigate(-1)} className="text-primary">
              <ArrowLeft className="h-6 w-6" />
            </button>
            <span className="text-foreground font-medium">Edit profile</span>
            <div className="w-12" />
          </div>
        </header>
        <div className="flex-1 px-4 py-6 space-y-6">
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="space-y-5">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

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
              <AvatarFallback>{name?.[0]?.toUpperCase() || '?'}</AvatarFallback>
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
